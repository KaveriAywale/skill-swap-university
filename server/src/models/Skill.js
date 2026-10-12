'use strict';

const mongoose = require('mongoose');
const { CATEGORY_KEYS } = require('../constants/skillCatalog');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    category: { type: String, required: true, enum: CATEGORY_KEYS, index: true },
    icon: { type: String, default: 'Sparkles' },
    description: { type: String, default: '', maxlength: 300 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

skillSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Skill', skillSchema);
