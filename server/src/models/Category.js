'use strict';

const mongoose = require('mongoose');
const { CATEGORY_KEYS } = require('../constants/skillCatalog');

const categorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, enum: CATEGORY_KEYS, index: true },
    name: { type: String, required: true },
    icon: { type: String, default: 'Sparkles' },
    color: { type: String, default: '#A78BFA' },
    accent: { type: String, default: 'lavender' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
