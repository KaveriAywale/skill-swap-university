'use strict';

const { User, SkillOffer, Skill } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, buildPaginationMeta } = require('../utils/ApiResponse');
const { serializePublicUser } = require('../utils/serializers');

/**
 * GET /users  -> campus skill discovery.
 * Filters: q, category, skill, day, availableNow, maxDistanceKm, sort.
 */
const listStudents = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    skill,
    day,
    availableNow,
    sort = 'karma',
    page = 1,
    limit = 12,
    lng,
    lat,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));

  const offerFilter = { status: 'active' };
  if (category) {
    const skills = await Skill.find({ category }).select('_id');
    offerFilter.skill = { $in: skills.map((s) => s._id) };
  }
  if (skill) offerFilter.skill = skill;

  let ownerIds = null;
  if (category || skill || availableNow) {
    const offers = await SkillOffer.find(offerFilter).select('owner');
    ownerIds = offers.map((o) => o.owner);
  }

  const userFilter = {
    _id: { $ne: req.userId },
    'commPrefs.discoverable': { $ne: false },
  };
  if (ownerIds) userFilter._id = { $ne: req.userId, $in: ownerIds };
  if (q) {
    userFilter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { headline: { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } },
    ];
  }
  if (day) userFilter['availability.day'] = day;

  const sortMap = {
    karma: { karma: -1 },
    rating: { 'stats.ratingSum': -1 },
    recent: { lastActiveAt: -1 },
    name: { name: 1 },
  };

  const [total, users] = await Promise.all([
    User.countDocuments(userFilter),
    User.find(userFilter)
      .sort(sortMap[sort] || sortMap.karma)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
  ]);

  const userIds = users.map((u) => u._id);
  const offers = await SkillOffer.find({ owner: { $in: userIds }, status: 'active' })
    .populate('skill', 'name category icon')
    .lean();

  const offersByOwner = offers.reduce((acc, offer) => {
    const key = offer.owner.toString();
    acc[key] = acc[key] || [];
    acc[key].push(offer);
    return acc;
  }, {});

  let seekerLocation = null;
  if (lng && lat) seekerLocation = [parseFloat(lng), parseFloat(lat)];
  else if (req.user?.locationEnabled && req.user.campusLocation?.coordinates) {
    seekerLocation = req.user.campusLocation.coordinates;
  }

  const data = users.map((user) => ({
    ...serializePublicUser(user, { seekerLocation }),
    offers: (offersByOwner[user._id.toString()] || []).map((o) => ({
      id: o._id,
      title: o.title,
      level: o.level,
      format: o.format,
      verified: o.verified,
      availability: o.availability,
      skill: o.skill,
    })),
  }));

  return sendSuccess(res, {
    data,
    meta: buildPaginationMeta({ page: pageNum, limit: limitNum, total }),
  });
});

const getStudent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('skillsWanted', 'name category icon');
  if (!user) throw ApiError.notFound('Student not found');

  const offers = await SkillOffer.find({ owner: user._id, status: { $ne: 'withdrawn' } })
    .populate('skill', 'name category icon')
    .lean();

  let seekerLocation = null;
  if (req.user?.locationEnabled && req.user.campusLocation?.coordinates) {
    seekerLocation = req.user.campusLocation.coordinates;
  }

  return sendSuccess(res, {
    data: {
      ...serializePublicUser(user, { seekerLocation }),
      offers,
    },
  });
});

/** GET /users/me/analytics -> personal insights (student-facing only). */
const myInsights = asyncHandler(async (req, res) => {
  const Session = require('../models/Session');
  const { KarmaTransaction, Review } = require('../models');

  const { range = '90d' } = req.query;
  const rangeDays = { '30d': 30, '90d': 90, '180d': 180, all: 3650 }[range] || 90;
  const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);

  const [taught, learned, cancelled, karmaTx, reviews, offersCount] = await Promise.all([
    Session.countDocuments({ helper: req.userId, status: 'completed', completedAt: { $gte: since } }),
    Session.countDocuments({ seeker: req.userId, status: 'completed', completedAt: { $gte: since } }),
    Session.countDocuments({
      $or: [{ helper: req.userId }, { seeker: req.userId }],
      status: 'cancelled',
      updatedAt: { $gte: since },
    }),
    KarmaTransaction.find({ user: req.userId, createdAt: { $gte: since } }).sort({ createdAt: 1 }),
    Review.find({ subject: req.userId }).populate('author', 'name avatar').sort({ createdAt: -1 }).limit(10),
    SkillOffer.countDocuments({ owner: req.userId, status: 'active' }),
  ]);

  const karmaByDay = karmaTx.reduce((acc, tx) => {
    const day = tx.createdAt.toISOString().slice(0, 10);
    acc[day] = (acc[day] || 0) + tx.points;
    return acc;
  }, {});
  const karmaSeries = Object.entries(karmaByDay).map(([date, points]) => ({ date, points }));

  const topSkills = await Session.aggregate([
    { $match: { helper: req.user._id, status: 'completed' } },
    { $group: { _id: '$skill', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
    { $lookup: { from: 'skills', localField: '_id', foreignField: '_id', as: 'skill' } },
    { $unwind: '$skill' },
    { $project: { _id: 0, name: '$skill.name', category: '$skill.category', count: 1 } },
  ]);

  const totalSessions = taught + learned + cancelled;
  const successRate = totalSessions ? Math.round((taught + learned) / totalSessions * 100) : 0;

  return sendSuccess(res, {
    data: {
      range,
      totals: {
        taught,
        learned,
        completed: taught + learned,
        cancelled,
        successRate,
        karmaEarned: karmaTx.reduce((s, t) => s + t.points, 0),
        activeOffers: offersCount,
      },
      karmaSeries,
      topSkills,
      reviews,
    },
  });
});

module.exports = { listStudents, getStudent, myInsights };
