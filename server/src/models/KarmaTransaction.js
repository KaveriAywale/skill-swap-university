'use strict';

const mongoose = require('mongoose');

/**
 * Karma ledger. A unique compound index on (user, reason, refId) guarantees
 * that the same completed activity can never award points twice, even under
 * concurrent requests.
 */
const karmaTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    points: { type: Number, required: true },
    reason: {
      type: String,
      enum: [
        'session-completed-teacher',
        'session-completed-learner',
        'session-completed-bonus',
        'first-session-bonus',
        'review-received',
        'verification-passed',
        'streak-bonus',
        'badge-unlocked',
        'manual-adjustment',
      ],
      required: true,
    },
    refId: { type: String, required: true, default: '' },
    description: { type: String, default: '', maxlength: 300 },
    balanceAfter: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

karmaTransactionSchema.index({ user: 1, reason: 1, refId: 1 }, { unique: true });
karmaTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('KarmaTransaction', karmaTransactionSchema);
