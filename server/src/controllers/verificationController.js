'use strict';

const { SkillAssessment, Skill, User, SkillOffer } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const { generateQuestions, evaluate } = require('../services/aiVerificationService');
const { awardKarma, refreshBadges } = require('../services/karmaService');
const { createNotification } = require('../services/notificationService');
const env = require('../config/env');

const startAssessment = asyncHandler(async (req, res) => {
  const { skill: skillId } = req.body;
  const skill = await Skill.findById(skillId);
  if (!skill) throw ApiError.badRequest('Unknown skill');

  const { questions, mode, provider } = await generateQuestions(skill.name);

  const assessment = await SkillAssessment.create({
    user: req.userId,
    skill: skill._id,
    mode,
    provider,
    questions,
    status: 'in-progress',
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: mode === 'demo' ? 'Demo assessment ready' : 'AI assessment ready',
    data: assessment,
  });
});

const submitAssessment = asyncHandler(async (req, res) => {
  const assessment = await SkillAssessment.findOne({ _id: req.params.id, user: req.userId });
  if (!assessment) throw ApiError.notFound('Assessment not found');
  if (assessment.status === 'evaluated') throw ApiError.badRequest('This assessment was already submitted');

  const skill = await Skill.findById(assessment.skill);
  const result = await evaluate(skill.name, assessment.questions, req.body.answers || []);

  assessment.answers = result.answers;
  assessment.score = result.score;
  assessment.passed = result.passed;
  assessment.summary = result.summary;
  assessment.mode = result.mode;
  assessment.provider = result.provider;
  assessment.criterion = `Pass mark: ${env.aiPassThreshold}/100`;
  assessment.status = 'evaluated';
  await assessment.save();

  if (result.passed) {
    const user = await User.findById(req.userId);
    const already = user.verifiedSkills.some((v) => v.skill.toString() === skill._id.toString());
    if (!already) user.verifiedSkills.push({ skill: skill._id, score: result.score });
    await user.save();

    await SkillOffer.updateMany(
      { owner: req.userId, skill: skill._id },
      { verified: true, verificationScore: result.score }
    );

    await awardKarma({
      userId: req.userId,
      points: 15,
      reason: 'verification-passed',
      refId: assessment._id.toString(),
      description: `Passed ${skill.name} skill assessment`,
    });

    await refreshBadges(user);
    await createNotification({
      userId: req.userId,
      type: 'verification',
      title: `${skill.name} assessment passed`,
      body: `You scored ${result.score}/100. A verified indicator was added to your skill.`,
      link: '/verification',
    });
  }

  return sendSuccess(res, {
    message: result.passed ? 'Assessment passed' : 'Assessment submitted',
    data: assessment,
  });
});

const myAssessments = asyncHandler(async (req, res) => {
  const assessments = await SkillAssessment.find({ user: req.userId })
    .populate('skill', 'name category icon')
    .sort({ createdAt: -1 })
    .limit(50);
  return sendSuccess(res, {
    data: assessments,
    meta: { aiEnabled: env.aiEnabled, passThreshold: env.aiPassThreshold, provider: env.aiProvider },
  });
});

const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await SkillAssessment.findOne({ _id: req.params.id, user: req.userId })
    .populate('skill', 'name category icon');
  if (!assessment) throw ApiError.notFound('Assessment not found');
  return sendSuccess(res, { data: assessment });
});

module.exports = { startAssessment, submitAssessment, myAssessments, getAssessment };
