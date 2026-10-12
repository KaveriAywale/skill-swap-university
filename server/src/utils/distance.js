'use strict';

/**
 * Haversine great-circle distance in kilometres between two [lng, lat] points.
 */
function haversineKm(a, b) {
  if (!a || !b) return null;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  if ([lng1, lat1, lng2, lat2].some((n) => typeof n !== 'number' || Number.isNaN(n))) {
    return null;
  }
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1r = (lat1 * Math.PI) / 180;
  const lat2r = (lat2 * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1r) * Math.cos(lat2r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Privacy-aware fuzzy distance label. Exact coordinates are never exposed.
 */
function distanceLabel(km) {
  if (km === null || km === undefined) return null;
  if (km < 0.25) return 'On campus';
  if (km < 1) return '< 1 km away';
  if (km < 2) return '~1 km away';
  if (km < 5) return `~${Math.round(km)} km away`;
  return '5+ km away';
}

module.exports = { haversineKm, distanceLabel };
