'use strict';

const mongoose = require('mongoose');

const preferredSlotSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
  },
  { _id: false }
);

const helpRequestSchema = new mongoose.Schema(
  {
    seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, maxlength: 2000 },
    category: { type: String, required: true, index: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'exam-soon'],
      default: 'medium',
    },
    format: { type: String, enum: ['in-person', 'online', 'either'], default: 'either' },
    preferredSlots: { type: [preferredSlotSchema], default: [] },
    meetingArea: { type: String, default: '', maxlength: 120 },

    status: {
      type: String,
      enum: ['open', 'matched', 'accepted', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
      index: true,
    },
    matchedOffer: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillOffer' },
    helper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    expiresAt: { type: Date },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

helpRequestSchema.index({ status: 1, category: 1, createdAt: -1 });
helpRequestSchema.index({ skill: 1, status: 1 });
helpRequestSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('HelpRequest', helpRequestSchema);
