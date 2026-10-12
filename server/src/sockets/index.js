'use strict';

const { Server } = require('socket.io');
const env = require('../config/env');
const { verifyAccessToken } = require('../utils/token');
const { User, Conversation, Message } = require('../models');
const { createNotification } = require('../services/notificationService');

let io = null;

function userRoom(userId) {
  return `user:${userId.toString()}`;
}

function conversationRoom(conversationId) {
  return `conversation:${conversationId.toString()}`;
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
}

async function handleSendMessage(socket, payload, ack) {
  try {
    const { conversationId, body, type = 'text', sessionId } = payload || {};
    if (!conversationId || !body || !String(body).trim()) {
      if (typeof ack === 'function') ack({ ok: false, error: 'Message body is required' });
      return;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.hasParticipant(socket.userId)) {
      if (typeof ack === 'function') ack({ ok: false, error: 'Not a participant' });
      return;
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: socket.userId,
      body: String(body).trim().slice(0, 2000),
      type,
      session: sessionId || undefined,
    });

    conversation.lastMessage = message.body.slice(0, 120);
    conversation.lastMessageAt = message.createdAt;
    if (!conversation.unread) conversation.unread = new Map();
    const other = conversation.participants.find((p) => p.toString() !== socket.userId);
    if (other) {
      const current = conversation.unread.get(other.toString()) || 0;
      conversation.unread.set(other.toString(), current + 1);
    }
    await conversation.save();

    const populated = await message.populate('sender', 'name avatar');
    io.to(conversationRoom(conversation._id)).emit('message:new', populated.toObject());

    if (other) {
      emitToUser(other, 'conversation:updated', {
        conversationId: conversation._id.toString(),
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
      });
      await createNotification({
        userId: other,
        type: 'message',
        title: `New message from ${socket.user.name}`,
        body: message.body.slice(0, 80),
        link: `/messages/${conversation._id}`,
      });
    }

    if (typeof ack === 'function') ack({ ok: true, message: populated.toObject() });
  } catch (err) {
    if (typeof ack === 'function') ack({ ok: false, error: 'Failed to send message' });
  }
}

function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || '').replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.sub).select('name avatar');
      if (!user) return next(new Error('Account not found'));
      socket.userId = user._id.toString();
      socket.user = user;
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(userRoom(socket.userId));
    socket.emit('connection:ready', { userId: socket.userId });

    socket.on('conversation:join', async ({ conversationId } = {}) => {
      if (!conversationId) return;
      const conversation = await Conversation.findById(conversationId).select('participants');
      if (conversation && conversation.hasParticipant(socket.userId)) {
        socket.join(conversationRoom(conversationId));
      }
    });

    socket.on('conversation:leave', ({ conversationId } = {}) => {
      if (conversationId) socket.leave(conversationRoom(conversationId));
    });

    socket.on('message:send', (payload, ack) => handleSendMessage(socket, payload, ack));

    // WebRTC signaling relay (offer/answer/ice) for online sessions.
    socket.on('rtc:signal', ({ room, signal } = {}) => {
      if (!room || !signal) return;
      socket.to(`rtc:${room}`).emit('rtc:signal', { from: socket.userId, signal });
    });

    socket.on('rtc:join', ({ room } = {}) => {
      if (!room) return;
      socket.join(`rtc:${room}`);
      socket.to(`rtc:${room}`).emit('rtc:peer-joined', { from: socket.userId });
    });

    socket.on('rtc:leave', ({ room } = {}) => {
      if (!room) return;
      socket.to(`rtc:${room}`).emit('rtc:peer-left', { from: socket.userId });
      socket.leave(`rtc:${room}`);
    });

    socket.on('presence:ping', async () => {
      await User.updateOne({ _id: socket.userId }, { lastActiveAt: new Date() });
    });

    socket.on('disconnect', () => {
      /* no-op */
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSockets, getIO, emitToUser, userRoom, conversationRoom };
