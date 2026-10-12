'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function toInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toList(value, fallback = []) {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isTest: (process.env.NODE_ENV || 'development') === 'test',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port: toInt(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  corsOrigins: toList(process.env.CORS_ORIGINS, ['http://localhost:5173']),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skill_swap_university',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 10),
  campusName: process.env.CAMPUS_NAME || 'Skill Swap University',
  allowedEmailDomains: toList(process.env.ALLOWED_EMAIL_DOMAINS, []),
  allowAnyEmail: toBool(process.env.ALLOW_ANY_EMAIL, true),
  aiProvider: (process.env.AI_PROVIDER || 'demo').toLowerCase(),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  aiPassThreshold: toInt(process.env.AI_PASS_THRESHOLD, 70),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxUploadMb: toInt(process.env.MAX_UPLOAD_MB, 5),
  rateLimitWindowMinutes: toInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 300),
  authRateLimitMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 30),
};

env.aiEnabled = env.aiProvider === 'openai' && Boolean(env.openaiApiKey);

module.exports = env;
