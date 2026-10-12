'use strict';

const { User, KarmaTransaction, Session } = require('../models');
const { evaluateEligibleBadges } = require('./badgeService');
const { getBadge } = require('../constants/badges');
const { createNotification } = require('./notificationService');

/**
 * Award karma exactly once per (user, reason, refId).
 * The unique compound index on KarmaTransaction guarantees idempotency, so a
 * repeated "complete session" request can never double-award points.
 *
 * @returns {Promise<{awarded: boolean, points: number, balance: number}>}
 */
async function awardKarma({ userId, points, reason, refId, description = '', isDemo = false }) {
  if (!points) return { awarded: false, points: 0, balance: 0 };

  const user = await User.findById(userId);
  if (!user) return { awarded: false, points: 0, balance: 0 };

  let transaction;
  try {
    transaction = await KarmaTransaction.create({
      user: userId,
      points,
      reason,
      refId: String(refId),
      description,
      balanceAfter: (user.karma || 0) + points,
      isDemo,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Already awarded for this activity -> idempotent no-op.
      return { awarded: false, points: 0, balance: user.karma || 0 };
    }
    throw err;
  }

  user.karma = Math.max(0, (user.karma || 0) + points);
  await user.save();

  await createNotification({
    userId,
    type: 'karma',
    title: `+${points} karma`,
    body: description || 'You earned karma for a completed session.',
    link: '/leaderboard',
    meta: { points, reason },
  });

  return { awarded: true, points, balance: user.karma, transaction };
}

/** Recompute a user's metrics and unlock any newly eligible badges. */
async function refreshBadges(user) {
  const distinctTaught = await Session.distinct('skill', { helper: user._id, status: 'completed' });
  const distinctLearned = await Session.distinct('skill', { seeker: user._id, status: 'completed' });

  const rating = user.stats.ratingCount ? user.stats.ratingSum / user.stats.ratingCount : 0;

  const metrics = {
    karma: user.karma || 0,
    completedSessions: user.stats.completedSessions || 0,
    verifiedSkills: (user.verifiedSkills || []).length,
    rating,
    distinctTaught: distinctTaught.length,
    distinctLearned: distinctLearned.length,
  };

  const alreadyEarned = (user.badges || []).map((b) => b.key);
  const newlyEligible = evaluateEligibleBadges(metrics, alreadyEarned);

  if (newlyEligible.length) {
    newlyEligible.forEach((badge) => {
      user.badges.push({ key: badge.key, earnedAt: new Date() });
    });
    await user.save();

    await Promise.all(
      newlyEligible.map((badge) =>
        createNotification({
          userId: user._id,
          type: 'badge',
          title: `Badge unlocked: ${badge.name}`,
          body: badge.description,
          link: '/leaderboard',
          meta: { badge: badge.key },
        })
      )
    );
  }

  return newlyEligible.map((b) => getBadge(b.key) || b);
}

module.exports = { awardKarma, refreshBadges };
