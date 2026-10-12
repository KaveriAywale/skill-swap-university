'use strict';

const mongoose = require('mongoose');

const matchRecommendationSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HelpRequest',
      required: true,
      index: true,
    },
    seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    helper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillOffer' },
    score: { type: Number, required: true, min: 0, max: 100 },
    breakdown: {
      skillRelevance: { type: Number, default: 0 },
      availability: { type: Number, default: 0 },
      distance: { type: Number, default: 0 },
      trust: { type: Number, default: 0 },
      verifiedBonus: { type: Number, default: 0 },
    },
    reasons: { type: [String], default: [] },
    distanceKm: { type: Number, default: null },
    status: {
      type: String,
      enum: ['suggested', 'contacted', 'accepted', 'dismissed'],
      default: 'suggested',
    },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

matchRecommendationSchema.index({ request: 1, helper: 1 }, { unique: true });
matchRecommendationSchema.index({ request: 1, score: -1 });

module.exports = mongoose.model('MatchRecommendation', matchRecommendationSchema);
