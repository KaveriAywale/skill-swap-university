'use strict';

const { Conversation, Message, User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, buildPaginationMeta } = require('../utils/ApiResponse');

const listConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.userId })
    .populate('participants', 'name avatar department year lastActiveAt')
    .sort({ lastMessageAt: -1 })
    .lean();

  const data = conversations.map((c) => {
    const unreadMap = c.unread || {};
    const unread = unreadMap[req.userId] || 0;
    const other = (c.participants || []).find((p) => p._id.toString() !== req.userId) || null;
    return {
      id: c._id,
      other,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unread,
      session: c.session,
      request: c.request,
    };
  });

  return sendSuccess(res, { data });
});

const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw ApiError.badRequest('userId is required');
  if (userId === req.userId) throw ApiError.badRequest('You cannot message yourself');

  const other = await User.findById(userId).select('name avatar');
  if (!other) throw ApiError.notFound('Student not found');

  let conversation = await Conversation.findOne({
    participants: { $all: [req.userId, userId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({ participants: [req.userId, userId] });
  }

  await conversation.populate('participants', 'name avatar department year');
  return sendSuccess(res, { statusCode: 201, data: conversation });
});

async function assertMembership(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound('Conversation not found');
  if (!conversation.hasParticipant(userId)) {
    // Resource-level authorization: no leaking of existence to non-participants.
    throw ApiError.forbidden('You do not have access to this conversation');
  }
  return conversation;
}

const listMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, parseInt(limit, 10) || 50);

  await assertMembership(req.params.id, req.userId);

  const [total, messages] = await Promise.all([
    Message.countDocuments({ conversation: req.params.id }),
    Message.find({ conversation: req.params.id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
  ]);

  return sendSuccess(res, {
    data: messages.reverse(),
    meta: buildPaginationMeta({ page: pageNum, limit: limitNum, total }),
  });
});

const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await assertMembership(req.params.id, req.userId);
  const { body, type = 'text', sessionId } = req.body;
  if (!body || !String(body).trim()) throw ApiError.badRequest('Message body is required');

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.userId,
    body: String(body).trim().slice(0, 2000),
    type,
    session: sessionId || undefined,
  });

  conversation.lastMessage = message.body.slice(0, 120);
  conversation.lastMessageAt = message.createdAt;
  const other = conversation.participants.find((p) => p.toString() !== req.userId);
  if (other) {
    const current = (conversation.unread && conversation.unread.get(other.toString())) || 0;
    if (!conversation.unread) conversation.unread = new Map();
    conversation.unread.set(other.toString(), current + 1);
  }
  await conversation.save();

  const populated = await message.populate('sender', 'name avatar');

  try {
    const { emitToUser, conversationRoom, getIO } = require('../sockets');
    const io = getIO();
    if (io) {
      io.to(conversationRoom(conversation._id)).emit('message:new', populated.toObject());
      if (other) {
        emitToUser(other, 'conversation:updated', {
          conversationId: conversation._id.toString(),
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
        });
      }
    }
  } catch {
    /* socket layer optional */
  }

  return sendSuccess(res, { statusCode: 201, data: populated });
});

const markRead = asyncHandler(async (req, res) => {
  const conversation = await assertMembership(req.params.id, req.userId);
  if (!conversation.unread) conversation.unread = new Map();
  conversation.unread.set(req.userId, 0);
  await conversation.save();

  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: req.userId }, readAt: null },
    { readAt: new Date() }
  );

  return sendSuccess(res, { message: 'Marked as read' });
});

module.exports = {
  listConversations,
  getOrCreateConversation,
  listMessages,
  sendMessage,
  markRead,
};
