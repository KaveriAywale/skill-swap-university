'use strict';

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');
const asyncHandler = require('../utils/asyncHandler');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication token missing');

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Session expired, please log in again');
  }

  const user = await User.findById(decoded.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  req.user = user;
  req.userId = user._id.toString();
  return next();
});

const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub);
    if (user) {
      req.user = user;
      req.userId = user._id.toString();
    }
  } catch {
    /* ignore invalid token for optional auth */
  }
  return next();
});

function requireCompleteProfile(req, _res, next) {
  if (!req.user.onboardingComplete) {
    return next(ApiError.forbidden('Please complete your profile onboarding first'));
  }
  return next();
}

module.exports = { requireAuth, optionalAuth, requireCompleteProfile };
