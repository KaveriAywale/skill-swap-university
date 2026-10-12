'use strict';

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 600 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ session: 1, author: 1 }, { unique: true });
reviewSchema.index({ subject: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
