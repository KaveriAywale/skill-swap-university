'use strict';

const env = require('../config/env');
const { User, Skill } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const { signAccessToken } = require('../utils/token');
const { serializeSelf } = require('../utils/serializers');

function assertEmailAllowed(email) {
  if (env.allowAnyEmail || !env.allowedEmailDomains.length) return;
  const domain = String(email).split('@')[1] || '';
  if (!env.allowedEmailDomains.includes(domain)) {
    throw ApiError.badRequest(
      `Use your college email (${env.allowedEmailDomains.map((d) => `@${d}`).join(' or ')})`
    );
  }
}

function issueToken(user) {
  return signAccessToken({ sub: user._id.toString() });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, department, year, studentId } = req.body;
  assertEmailAllowed(email);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const hashed = await User.hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    department: department || 'Other',
    year: year || 1,
    studentId: studentId || '',
  });

  const token = issueToken(user);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created. Let\u2019s build your profile.',
    data: { token, user: serializeSelf(user) },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  user.lastActiveAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = issueToken(user);
  return sendSuccess(res, {
    message: 'Welcome back',
    data: { token, user: serializeSelf(user) },
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId)
    .populate('skillsWanted', 'name category icon');
  return sendSuccess(res, { data: serializeSelf(user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'bio', 'headline', 'department', 'year', 'studentId'];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  if (req.body.avatar !== undefined) updates.avatar = req.body.avatar;

  const user = await User.findByIdAndUpdate(req.userId, updates, {
    new: true,
    runValidators: true,
  });
  return sendSuccess(res, { message: 'Profile updated', data: serializeSelf(user) });
});

const updatePrivacy = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  const { locationEnabled, locationLabel, discoverable, emailNotifications, preferredMode } = req.body;

  if (locationEnabled !== undefined) {
    user.locationEnabled = Boolean(locationEnabled);
    if (!locationEnabled) {
      user.campusLocation = undefined;
    }
  }
  if (locationLabel !== undefined) user.locationLabel = locationLabel;
  if (discoverable !== undefined) user.commPrefs.discoverable = Boolean(discoverable);
  if (emailNotifications !== undefined) user.commPrefs.emailNotifications = Boolean(emailNotifications);
  if (preferredMode !== undefined) user.commPrefs.preferredMode = preferredMode;

  await user.save();
  return sendSuccess(res, { message: 'Privacy settings saved', data: serializeSelf(user) });
});

const setLocation = asyncHandler(async (req, res) => {
  const { lng, lat, locationLabel } = req.body;
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    throw ApiError.badRequest('lng and lat are required numbers');
  }
  const user = await User.findById(req.userId);
  user.campusLocation = { type: 'Point', coordinates: [lng, lat] };
  user.locationEnabled = true;
  if (locationLabel) user.locationLabel = locationLabel;
  await user.save();
  return sendSuccess(res, { message: 'Campus location saved', data: serializeSelf(user) });
});

const setAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;
  if (!Array.isArray(availability)) throw ApiError.badRequest('availability must be an array');
  const user = await User.findById(req.userId);
  user.availability = availability;
  await user.save();
  return sendSuccess(res, { message: 'Availability saved', data: serializeSelf(user) });
});

const setSkills = asyncHandler(async (req, res) => {
  const { skillsWanted } = req.body;
  if (!Array.isArray(skillsWanted)) throw ApiError.badRequest('skillsWanted must be an array');
  const valid = await Skill.find({ _id: { $in: skillsWanted } }).select('_id');
  const user = await User.findById(req.userId);
  user.skillsWanted = valid.map((s) => s._id);
  await user.save();
  return sendSuccess(res, { message: 'Learning interests saved', data: serializeSelf(user) });
});

const completeOnboarding = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  user.onboardingComplete = true;
  await user.save();
  return sendSuccess(res, { message: 'Onboarding complete', data: serializeSelf(user) });
});

const uploadAvatarHandler = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image uploaded');
  const { publicUrl } = require('../middleware/upload');
  const url = publicUrl(req.file, 'avatars');
  const user = await User.findByIdAndUpdate(req.userId, { avatar: url }, { new: true });
  return sendSuccess(res, { message: 'Profile photo updated', data: serializeSelf(user) });
});

module.exports = {
  register,
  login,
  me,
  updateProfile,
  updatePrivacy,
  setLocation,
  setAvailability,
  setSkills,
  completeOnboarding,
  uploadAvatarHandler,
};
