'use strict';

const { KarmaTransaction, User, Session } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const { BADGES } = require('../constants/badges');
const { badgeProgress } = require('../services/badgeService');

const myKarma = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, parseInt(limit, 10) || 20);

  const [transactions, total, user] = await Promise.all([
    KarmaTransaction.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    KarmaTransaction.countDocuments({ user: req.userId }),
    User.findById(req.userId),
  ]);

  return sendSuccess(res, {
    data: {
      balance: user.karma,
      transactions,
    },
    meta: { page: pageNum, limit: limitNum, total },
  });
});

const leaderboard = asyncHandler(async (req, res) => {
  const { scope = 'all-time', limit = 20 } = req.query;
  const limitNum = Math.min(100, parseInt(limit, 10) || 20);

  if (scope === 'weekly') {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await KarmaTransaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$user', weeklyKarma: { $sum: '$points' } } },
      { $sort: { weeklyKarma: -1 } },
      { $limit: limitNum },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          karma: '$weeklyKarma',
          name: '$user.name',
          avatar: '$user.avatar',
          department: '$user.department',
          year: '$user.year',
          stats: '$user.stats',
        },
      },
    ]);
    return sendSuccess(res, { data: rows, meta: { scope } });
  }

  const users = await User.find({ karma: { $gt: 0 } })
    .sort({ karma: -1 })
    .limit(limitNum)
    .select('name avatar department year karma stats badges');

  const data = users.map((u, index) => ({
    rank: index + 1,
    userId: u._id,
    name: u.name,
    avatar: u.avatar,
    department: u.department,
    year: u.year,
    karma: u.karma,
    stats: u.stats,
  }));

  return sendSuccess(res, { data, meta: { scope } });
});

const myBadges = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  const distinctTaught = await Session.distinct('skill', { helper: user._id, status: 'completed' });
  const distinctLearned = await Session.distinct('skill', { seeker: user._id, status: 'completed' });
  const rating = user.stats.ratingCount ? user.stats.ratingSum / user.stats.ratingCount : 0;

  const metrics = {
    karma: user.karma || 0,
    completedSessions: user.stats.completedSessions || 0,
    verifiedSkills: (user.verifiedSkills || []).length,
    rating,
    distinctTaught: distinctTaught.length,
    distinctLearned: distinctLearned.length,
  };

  const earnedKeys = (user.badges || []).map((b) => b.key);

  const data = BADGES.map((badge) => ({
    ...badge,
    earned: earnedKeys.includes(badge.key),
    earnedAt: (user.badges || []).find((b) => b.key === badge.key)?.earnedAt || null,
    progress: badgeProgress(badge, metrics),
    current: metrics[badge.metric] || 0,
  }));

  return sendSuccess(res, { data, meta: { metrics } });
});

module.exports = { myKarma, leaderboard, myBadges };
