'use strict';

const { Notification } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, buildPaginationMeta } = require('../utils/ApiResponse');

const listNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, parseInt(limit, 10) || 20);

  const filter = { user: req.userId };
  if (unreadOnly === 'true') filter.read = false;

  const [total, notifications, unreadCount] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Notification.countDocuments({ user: req.userId, read: false }),
  ]);

  return sendSuccess(res, {
    data: notifications,
    meta: { ...buildPaginationMeta({ page: pageNum, limit: limitNum, total }), unreadCount },
  });
});

const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.userId }, { read: true });
  return sendSuccess(res, { message: 'Notification read' });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.userId, read: false }, { read: true });
  return sendSuccess(res, { message: 'All notifications marked read' });
});

module.exports = { listNotifications, markRead, markAllRead };
