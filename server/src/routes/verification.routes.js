'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/verificationController');
const { validate } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

router.post(
  '/start',
  requireAuth,
  aiLimiter,
  [body('skill').isMongoId()],
  validate,
  ctrl.startAssessment
);

router.post('/:id/submit', requireAuth, aiLimiter, ctrl.submitAssessment);
router.get('/history', requireAuth, ctrl.myAssessments);
router.get('/:id', requireAuth, ctrl.getAssessment);

module.exports = router;