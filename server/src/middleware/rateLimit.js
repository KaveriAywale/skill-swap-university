'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const windowMs = env.rateLimitWindowMinutes * 60 * 1000;

const apiLimiter = rateLimit({
  windowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' },
});

const authLimiter = rateLimit({
  windowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many assessment requests, please wait a moment.' },
});

module.exports = { apiLimiter, authLimiter, aiLimiter };
