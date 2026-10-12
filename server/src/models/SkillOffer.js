'use strict';

const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
  },
  { _id: false }
);

const skillOfferSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 1200 },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate',
    },
    format: {
      type: String,
      enum: ['in-person', 'online', 'both'],
      default: 'both',
    },
    availability: { type: [slotSchema], default: [] },
    evidenceUrl: { type: String, default: '' },
    evidenceName: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    verificationScore: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'paused', 'withdrawn'], default: 'active', index: true },
    isDemo: { type: Boolean, default: false },
    sessionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

skillOfferSchema.index({ skill: 1, status: 1 });
skillOfferSchema.index({ owner: 1, status: 1 });
skillOfferSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('SkillOffer', skillOfferSchema);
