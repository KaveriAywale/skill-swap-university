'use strict';

const { HelpRequest, Skill } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, buildPaginationMeta } = require('../utils/ApiResponse');
const { findMatches } = require('../services/matchingService');
const { createNotification } = require('../services/notificationService');

const createRequest = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    skill,
    urgency,
    format,
    preferredSlots,
    meetingArea,
  } = req.body;

  const skillDoc = await Skill.findById(skill);
  if (!skillDoc) throw ApiError.badRequest('Unknown skill');

  const request = await HelpRequest.create({
    seeker: req.userId,
    title,
    description,
    category: category || skillDoc.category,
    skill,
    urgency: urgency || 'medium',
    format: format || 'either',
    preferredSlots: preferredSlots || [],
    meetingArea: meetingArea || '',
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  // Notify top matching helpers so the request can be discovered quickly.
  const matches = await findMatches(request, { limit: 5 });
  await Promise.all(
    matches.slice(0, 3).map((m) =>
      createNotification({
        userId: m.helper._id,
        type: 'match',
        title: 'A new request matches your skill',
        body: `"${request.title}" \u2014 ${m.reasons[0] || 'Good match'}`,
        link: `/requests/${request._id}`,
        meta: { requestId: request._id.toString(), score: m.score },
      })
    )
  );

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Help request created',
    data: { request, matchCount: matches.length },
  });
});

const listRequests = asyncHandler(async (req, res) => {
  const { mine, status, category, q, page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(48, parseInt(limit, 10) || 12);

  const filter = {};
  if (mine === 'true') {
    filter.$or = [{ seeker: req.userId }, { helper: req.userId }];
  } else {
    filter.status = status || 'open';
  }
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (q) filter.$or = [{ title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];

  const [total, requests] = await Promise.all([
    HelpRequest.countDocuments(filter),
    HelpRequest.find(filter)
      .populate('skill', 'name category icon')
      .populate('seeker', 'name avatar department year karma stats')
      .populate('helper', 'name avatar department year karma stats')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
  ]);

  return sendSuccess(res, {
    data: requests,
    meta: buildPaginationMeta({ page: pageNum, limit: limitNum, total }),
  });
});

const getRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id)
    .populate('skill', 'name category icon')
    .populate('seeker', 'name avatar department year karma stats verifiedSkills locationEnabled campusLocation locationLabel')
    .populate('helper', 'name avatar department year karma stats');
  if (!request) throw ApiError.notFound('Request not found');

  let matches = [];
  if (request.status === 'open' || request.status === 'matched') {
    let seekerLocation = null;
    if (req.user?.locationEnabled && req.user.campusLocation?.coordinates) {
      seekerLocation = req.user.campusLocation.coordinates;
    }
    matches = await findMatches({ ...request.toObject(), seekerLocation }, { limit: 8 });
  }

  return sendSuccess(res, { data: { request, matches } });
});

const updateRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Request not found');
  if (request.seeker.toString() !== req.userId) throw ApiError.forbidden('Not your request');
  if (['completed', 'cancelled'].includes(request.status)) {
    throw ApiError.badRequest('This request can no longer be edited');
  }

  const fields = ['title', 'description', 'urgency', 'format', 'preferredSlots', 'meetingArea', 'category', 'skill'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) request[f] = req.body[f];
  });
  await request.save();
  return sendSuccess(res, { message: 'Request updated', data: request });
});

const cancelRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Request not found');
  if (request.seeker.toString() !== req.userId) throw ApiError.forbidden('Not your request');
  if (request.status === 'completed') throw ApiError.badRequest('Completed requests cannot be cancelled');

  request.status = 'cancelled';
  await request.save();
  return sendSuccess(res, { message: 'Request cancelled', data: request });
});

const getMatchesForRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Request not found');

  let seekerLocation = null;
  if (req.user?.locationEnabled && req.user.campusLocation?.coordinates) {
    seekerLocation = req.user.campusLocation.coordinates;
  }

  const matches = await findMatches({ ...request.toObject(), seekerLocation }, { limit: 10 });
  const currentUserIsSeeker = request.seeker.toString() === req.userId;

  const data = matches.map((m) => ({
    helper: {
      id: m.helper._id,
      name: m.helper.name,
      avatar: m.helper.avatar,
      department: m.helper.department,
      year: m.helper.year,
      karma: m.helper.karma,
      avgRating: m.helper.stats?.ratingCount
        ? Math.round((m.helper.stats.ratingSum / m.helper.stats.ratingCount) * 10) / 10
        : 0,
      completedSessions: m.helper.stats?.completedSessions || 0,
      locationLabel: m.helper.locationLabel,
    },
    offerId: m.offer?._id,
    score: m.score,
    breakdown: m.breakdown,
    reasons: m.reasons,
    distanceLabel: m.distanceLabel,
    canInvite: currentUserIsSeeker,
  }));

  return sendSuccess(res, { data, meta: { count: data.length } });
});

module.exports = {
  createRequest,
  listRequests,
  getRequest,
  updateRequest,
  cancelRequest,
  getMatchesForRequest,
};
