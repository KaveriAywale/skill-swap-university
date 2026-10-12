'use strict';

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Returns true when two "HH:mm" ranges overlap on the same day. */
function slotsOverlap(a, b) {
  return a.day === b.day && toMinutes(a.from) < toMinutes(b.to) && toMinutes(b.from) < toMinutes(a.to);
}

/**
 * Fraction (0..1) of the request's preferred slots that at least one of the
 * candidate's availability slots overlaps.
 */
function availabilityMatch(preferredSlots = [], candidateSlots = []) {
  if (!candidateSlots.length) return 0;
  if (!preferredSlots.length) return 0.6; // no preference expressed -> neutral
  let matched = 0;
  preferredSlots.forEach((pref) => {
    if (candidateSlots.some((slot) => slotsOverlap(pref, slot))) matched += 1;
  });
  return matched / preferredSlots.length;
}

function daysOffered(candidateSlots = []) {
  return new Set(candidateSlots.map((s) => s.day)).size;
}

module.exports = { toMinutes, slotsOverlap, availabilityMatch, daysOffered };
