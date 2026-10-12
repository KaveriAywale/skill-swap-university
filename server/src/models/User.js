'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const availabilitySchema = new mongoose.Schema(
  {
    day: { type: String, enum: DAYS, required: true },
    from: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    to: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  },
  { _id: false }
);

const verifiedSkillSchema = new mongoose.Schema(
  {
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    score: { type: Number, min: 0, max: 100, required: true },
    assessedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const badgeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    studentId: { type: String, trim: true, maxlength: 40 },
    department: {
      type: String,
      enum: [
        'Computer Science',
        'Information Technology',
        'Electronics',
        'Electrical',
        'Mechanical',
        'Civil',
        'Mathematics',
        'Physics',
        'Design',
        'Management',
        'Other',
      ],
      default: 'Other',
    },
    year: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 600 },
    headline: { type: String, default: '', maxlength: 120 },

    skillsWanted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    verifiedSkills: { type: [verifiedSkillSchema], default: [] },
    availability: { type: [availabilitySchema], default: [] },

    campusLocation: {
      type: { type: String, enum: ['Point'], default: undefined },
      coordinates: {
        type: [Number],
        default: undefined,
        validate: {
          validator: (v) => v === undefined || (Array.isArray(v) && v.length === 2),
          message: 'Coordinates must be [lng, lat]',
        },
      },
    },
    locationEnabled: { type: Boolean, default: false },
    locationLabel: { type: String, default: '', maxlength: 80 },

    commPrefs: {
      preferredMode: { type: String, enum: ['chat', 'video', 'in-person'], default: 'chat' },
      emailNotifications: { type: Boolean, default: true },
      discoverable: { type: Boolean, default: true },
    },

    karma: { type: Number, default: 0, min: 0, index: true },

    stats: {
      completedSessions: { type: Number, default: 0 },
      taughtCount: { type: Number, default: 0 },
      learnedCount: { type: Number, default: 0 },
      ratingCount: { type: Number, default: 0 },
      ratingSum: { type: Number, default: 0 },
    },

    badges: { type: [badgeSchema], default: [] },

    isDemo: { type: Boolean, default: false },
    onboardingComplete: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ 'campusLocation': '2dsphere' });
userSchema.index({ department: 1, year: 1 });

userSchema.virtual('avgRating').get(function avgRating() {
  if (!this.stats || !this.stats.ratingCount) return 0;
  return Math.round((this.stats.ratingSum / this.stats.ratingCount) * 10) / 10;
});

userSchema.statics.hashPassword = async function hashPassword(plain) {
  return bcrypt.hash(plain, env.bcryptRounds);
};

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.addKarma = async function addKarma(points) {
  this.karma = Math.max(0, (this.karma || 0) + points);
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
module.exports.DAYS = DAYS;
