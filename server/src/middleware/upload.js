'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const uploadRoot = path.resolve(__dirname, '../../', env.uploadDir);
const avatarDir = path.join(uploadRoot, 'avatars');
const evidenceDir = path.join(uploadRoot, 'evidence');

[uploadRoot, avatarDir, evidenceDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const EVIDENCE_TYPES = [
  ...IMAGE_TYPES,
  'application/pdf',
  'text/plain',
  'application/zip',
];

function makeStorage(destination) {
  return multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, destination);
    },
    filename(_req, file, cb) {
      const safeExt = path.extname(file.originalname).toLowerCase().slice(0, 10);
      const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
      cb(null, name);
    },
  });
}

function makeFilter(allowed) {
  return (_req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
  };
}

const maxBytes = env.maxUploadMb * 1024 * 1024;

const uploadAvatar = multer({
  storage: makeStorage(avatarDir),
  fileFilter: makeFilter(IMAGE_TYPES),
  limits: { fileSize: maxBytes, files: 1 },
});

const uploadEvidence = multer({
  storage: makeStorage(evidenceDir),
  fileFilter: makeFilter(EVIDENCE_TYPES),
  limits: { fileSize: maxBytes, files: 1 },
});

function publicUrl(file, folder) {
  return `/${env.uploadDir}/${folder}/${file.filename}`;
}

module.exports = { uploadAvatar, uploadEvidence, publicUrl, uploadRoot };
