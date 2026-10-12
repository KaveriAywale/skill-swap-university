'use strict';

const { SkillOffer, Skill } = require('../models');
const { availabilityMatch } = require('./availabilityService');
const { haversineKm, distanceLabel } = require('../utils/distance');

/**
 * Transparent, weighted matching engine.
 *
 *   skill relevance   40
 *   availability      25
 *   distance          20
 *   trust (rating)    15
 *   verified bonus    +10 (clamped at 100)
 *
 * Skill relevance and availability always outweigh distance. When location
 * permission is unavailable the distance term degrades to a neutral score so
 * matching keeps working on skill + availability alone.
 */
const WEIGHTS = {
  skill: 40,
  availability: 25,
  distance: 20,
  trust: 15,
  verifiedBonus: 10,
};

async function findMatches(request, options = {}) {
  const { limit = 10 } = options;

  const offers = await SkillOffer.find({
    skill: request.skill,
    status: 'active',
    owner: { $ne: request.seeker },
  })
    .populate('owner', 'name avatar department year stats karma verifiedSkills campusLocation locationEnabled locationLabel department')
    .populate('skill', 'name category icon')
    .lean();

  // Fallback: same category but different skill -> partial relevance.
  let categoryOffers = [];
  if (offers.length < limit) {
    const skill = await Skill.findById(request.skill).lean();
    if (skill) {
      categoryOffers = await SkillOffer.find({
        status: 'active',
        owner: { $ne: request.seeker },
        skill: { $ne: request.skill },
      })
        .populate('owner', 'name avatar department year stats karma verifiedSkills campusLocation locationEnabled locationLabel')
        .populate('skill', 'name category icon')
        .lean();
      categoryOffers = categoryOffers.filter((o) => o.skill && o.skill.category === skill.category);
    }
  }

  const seekerLoc = request.seekerLocation || null;
  const candidates = new Map();

  const addCandidate = (offer, exact) => {
    const owner = offer.owner;
    if (!owner) return;
    const key = owner._id.toString();
    if (candidates.has(key) && !exact) return;
    candidates.set(key, { offer, owner, exact });
  };

  offers.forEach((offer) => addCandidate(offer, true));
  categoryOffers.forEach((offer) => addCandidate(offer, false));

  const results = [];

  for (const { offer, owner, exact } of candidates.values()) {
    const breakdown = { skillRelevance: 0, availability: 0, distance: 0, trust: 0, verifiedBonus: 0 };
    const reasons = [];

    // 1) Skill relevance
    if (exact) {
      breakdown.skillRelevance = WEIGHTS.skill;
      reasons.push('Matches your requested skill');
    } else {
      breakdown.skillRelevance = Math.round(WEIGHTS.skill * 0.4);
      reasons.push(`Same subject area (${offer.skill?.name || 'related skill'})`);
    }

    // 2) Availability
    const avail = availabilityMatch(request.preferredSlots || [], offer.availability || []);
    breakdown.availability = Math.round(WEIGHTS.availability * avail);
    if (avail >= 0.99 && (request.preferredSlots || []).length) {
      reasons.push('Available at your preferred time');
    } else if (avail > 0) {
      reasons.push('Some availability overlap');
    }

    // 3) Distance (privacy-aware)
    let distanceKm = null;
    let distLabel = null;
    const ownerLoc = owner.locationEnabled && owner.campusLocation?.coordinates
      ? owner.campusLocation.coordinates
      : null;
    if (seekerLoc && ownerLoc) {
      distanceKm = haversineKm(seekerLoc, ownerLoc);
      distLabel = distanceLabel(distanceKm);
      const decay = Math.max(0, 1 - distanceKm / 6); // 0 km -> full, 6 km+ -> 0
      breakdown.distance = Math.round(WEIGHTS.distance * decay);
      if (distanceKm < 2) reasons.push('Nearby on campus');
    } else {
      breakdown.distance = Math.round(WEIGHTS.distance * 0.5); // neutral
    }

    // 4) Trust: rating + experience
    const rating = owner.stats?.ratingCount
      ? owner.stats.ratingSum / owner.stats.ratingCount
      : 0;
    const ratingScore = rating / 5; // 0..1
    const experienceScore = Math.min((owner.stats?.completedSessions || 0) / 20, 1);
    const trust = Math.round(WEIGHTS.trust * (ratingScore * 0.7 + experienceScore * 0.3));
    breakdown.trust = trust;
    if (rating >= 4.5) reasons.push(`Highly rated (${rating.toFixed(1)}\u2605)`);
    else if ((owner.stats?.completedSessions || 0) >= 5) reasons.push('Experienced helper');

    // 5) Verified bonus
    const isVerified = (owner.verifiedSkills || []).some(
      (v) => v.skill && v.skill.toString() === request.skill.toString()
    );
    if (isVerified) {
      breakdown.verifiedBonus = WEIGHTS.verifiedBonus;
      reasons.push('Assessment-verified skill');
    }

    let score = breakdown.skillRelevance + breakdown.availability + breakdown.distance + breakdown.trust + breakdown.verifiedBonus;
    score = Math.max(0, Math.min(100, score));

    results.push({
      helper: owner,
      offer,
      score,
      breakdown,
      reasons,
      distanceKm,
      distanceLabel: distLabel,
      skillName: offer.skill?.name,
      skillId: offer.skill?._id || offer.skill,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

module.exports = { findMatches, WEIGHTS };
