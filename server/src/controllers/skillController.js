'use strict';

const { Skill, Category, SkillOffer } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ order: 1 }).lean();
  return sendSuccess(res, { data: categories });
});

const listSkills = asyncHandler(async (req, res) => {
  const { category, q } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (q) filter.name = { $regex: q, $options: 'i' };

  const skills = await Skill.find(filter).sort({ name: 1 }).limit(200).lean();

  const counts = await SkillOffer.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$skill', count: { $sum: 1 } } },
  ]);
  const countMap = counts.reduce((acc, c) => ({ ...acc, [c._id.toString()]: c.count }), {});

  return sendSuccess(res, {
    data: skills.map((s) => ({ ...s, offerCount: countMap[s._id.toString()] || 0 })),
  });
});

const createSkill = asyncHandler(async (req, res) => {
  const { name, category, icon } = req.body;
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = await Skill.findOne({ slug });
  if (existing) throw ApiError.conflict('That skill already exists');
  const skill = await Skill.create({ name, category, icon, slug });
  return sendSuccess(res, { statusCode: 201, message: 'Skill added', data: skill });
});

module.exports = { listCategories, listSkills, createSkill };
