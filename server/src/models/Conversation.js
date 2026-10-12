'use strict';

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      index: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: 'A conversation must have exactly two participants',
      },
    },
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'HelpRequest' },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    unread: {
      type: Map,
      of: Number,
      default: {},
    },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.methods.hasParticipant = function hasParticipant(userId) {
  return this.participants.some((p) => p.toString() === userId.toString());
};

module.exports = mongoose.model('Conversation', conversationSchema);
