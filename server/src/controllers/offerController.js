'use strict';

const { SkillOffer, Skill } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, buildPaginationMeta } = require('../utils/ApiResponse');
const { publicUrl } = require('../middleware/upload');

const createOffer = asyncHandler(async (req, res) => {
  const { skill, title, description, level, format, availability, evidenceUrl, evidenceName } = req.body;

  const skillDoc = await Skill.findById(skill);
  if (!skillDoc) throw ApiError.badRequest('Unknown skill');

  const offer = await SkillOffer.create({
    owner: req.userId,
    skill,
    title,
    description,
    level: level || 'Intermediate',
    format: format || 'both',
    availability: availability || [],
    evidenceUrl: evidenceUrl || '',
    evidenceName: evidenceName || '',
  });

  const populated = await offer.populate('skill', 'name category icon');
  return sendSuccess(res, { statusCode: 201, message: 'Skill offer published', data: populated });
});

const listOffers = asyncHandler(async (req, res) => {
  const { mine, skill, category, page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(48, parseInt(limit, 10) || 12);

  const filter = { status: { $ne: 'withdrawn' } };
  if (mine === 'true') filter.owner = req.userId;
  if (skill) filter.skill = skill;
  if (category) {
    const skills = await Skill.find({ category }).select('_id');
    filter.skill = { $in: skills.map((s) => s._id) };
  }

  const [total, offers] = await Promise.all([
    SkillOffer.countDocuments(filter),
    SkillOffer.find(filter)
      .populate('skill', 'name category icon')
      .populate('owner', 'name avatar department year karma stats verifiedSkills locationEnabled campusLocation locationLabel')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
  ]);

  return sendSuccess(res, {
    data: offers,
    meta: buildPaginationMeta({ page: pageNum, limit: limitNum, total }),
  });
});

const getOffer = asyncHandler(async (req, res) => {
  const offer = await SkillOffer.findById(req.params.id)
    .populate('skill', 'name category icon')
    .populate('owner', 'name avatar department year karma stats verifiedSkills');
  if (!offer) throw ApiError.notFound('Skill offer not found');
  return sendSuccess(res, { data: offer });
});

const updateOffer = asyncHandler(async (req, res) => {
  const offer = await SkillOffer.findById(req.params.id);
  if (!offer) throw ApiError.notFound('Skill offer not found');
  if (offer.owner.toString() !== req.userId) throw ApiError.forbidden('Not your offer');

  const fields = ['title', 'description', 'level', 'format', 'availability', 'status'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) offer[f] = req.body[f];
  });
  await offer.save();
  const populated = await offer.populate('skill', 'name category icon');
  return sendSuccess(res, { message: 'Offer updated', data: populated });
});

const withdrawOffer = asyncHandler(async (req, res) => {
  const offer = await SkillOffer.findById(req.params.id);
  if (!offer) throw ApiError.notFound('Skill offer not found');
  if (offer.owner.toString() !== req.userId) throw ApiError.forbidden('Not your offer');
  offer.status = 'withdrawn';
  await offer.save();
  return sendSuccess(res, { message: 'Offer withdrawn', data: offer });
});

const uploadEvidenceHandler = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const url = publicUrl(req.file, 'evidence');
  return sendSuccess(res, {
    message: 'Evidence uploaded',
    data: { url, name: req.file.originalname },
  });
});

module.exports = {
  createOffer,
  listOffers,
  getOffer,
  updateOffer,
  withdrawOffer,
  uploadEvidenceHandler,
};
