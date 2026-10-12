'use strict';

const { BADGES } = require('../constants/badges');

/**
 * Pure function: given a user's current metrics, return badges that should be
 * unlocked. Keeps badge logic testable and deterministic.
 */
function evaluateEligibleBadges(metrics, alreadyEarnedKeys = []) {
  const earned = new Set(alreadyEarnedKeys);
  return BADGES.filter((badge) => {
    if (earned.has(badge.key)) return false;
    const value = metrics[badge.metric];
    if (value === undefined || value === null) return false;
    return Number(value) >= badge.threshold;
  });
}

/** Progress (0..1) toward a badge, used by the UI progress rings. */
function badgeProgress(badge, metrics) {
  const value = Number(metrics[badge.metric] || 0);
  return Math.max(0, Math.min(1, value / badge.threshold));
}

module.exports = { evaluateEligibleBadges, badgeProgress };
