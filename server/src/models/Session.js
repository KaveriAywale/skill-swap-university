'use strict';

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'HelpRequest', index: true },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillOffer' },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    helper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: { type: String, required: true, maxlength: 160 },
    format: { type: String, enum: ['in-person', 'online'], default: 'online' },
    meetingArea: { type: String, default: '', maxlength: 120 },
    scheduledAt: { type: Date, required: true, index: true },
    durationMins: { type: Number, default: 60, min: 15, max: 240 },

    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    confirmedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    completedAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String, default: '', maxlength: 300 },
    karmaAwarded: { type: Boolean, default: false },
    roomId: { type: String, default: '' },
    notes: { type: String, default: '', maxlength: 1000 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

sessionSchema.index({ seeker: 1, status: 1, scheduledAt: -1 });
sessionSchema.index({ helper: 1, status: 1, scheduledAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);
