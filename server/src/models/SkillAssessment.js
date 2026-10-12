'use strict';

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    prompt: { type: String, required: true },
    hint: { type: String, default: '' },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    response: { type: String, default: '' },
    score: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
  },
  { _id: false }
);

const skillAssessmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillOffer' },
    mode: { type: String, enum: ['ai', 'demo'], default: 'demo' },
    provider: { type: String, default: 'demo' },
    questions: { type: [questionSchema], default: [] },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0, min: 0, max: 100 },
    passed: { type: Boolean, default: false },
    summary: { type: String, default: '' },
    criterion: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'evaluated', 'abandoned'],
      default: 'pending',
      index: true,
    },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

skillAssessmentSchema.index({ user: 1, skill: 1, createdAt: -1 });

module.exports = mongoose.model('SkillAssessment', skillAssessmentSchema);
