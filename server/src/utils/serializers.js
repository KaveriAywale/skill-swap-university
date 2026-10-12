'use strict';

const { distanceLabel, haversineKm } = require('./distance');
const { getBadge } = require('../constants/badges');

/** Private view of the authenticated user (never includes password). */
function serializeSelf(user) {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return {
    ...obj,
    id: obj._id,
    avgRating: user.avgRating,
    badges: (obj.badges || []).map((b) => ({ ...b, definition: getBadge(b.key) })),
  };
}

/**
 * Public profile view. Deliberately omits email, studentId, password and exact
 * GPS coordinates. Distance is exposed only as an approximate label.
 */
function serializePublicUser(user, { seekerLocation = null } = {}) {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  let distance = null;
  if (seekerLocation && obj.locationEnabled && obj.campusLocation?.coordinates) {
    const km = haversineKm(seekerLocation, obj.campusLocation.coordinates);
    distance = { km, label: distanceLabel(km) };
  }

  return {
    id: obj._id,
    name: obj.name,
    avatar: obj.avatar,
    department: obj.department,
    year: obj.year,
    headline: obj.headline,
    bio: obj.bio,
    karma: obj.karma,
    availability: obj.availability,
    skillsWanted: obj.skillsWanted,
    verifiedSkills: obj.verifiedSkills,
    stats: obj.stats,
    avgRating: user.avgRating,
    badges: (obj.badges || []).map((b) => ({ ...b, definition: getBadge(b.key) })),
    locationLabel: obj.locationLabel,
    locationEnabled: obj.locationEnabled,
    distance,
    lastActiveAt: obj.lastActiveAt,
    createdAt: obj.createdAt,
    isDemo: obj.isDemo,
  };
}

module.exports = { serializeSelf, serializePublicUser };
