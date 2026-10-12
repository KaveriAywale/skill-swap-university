'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/sessionController');
const { validate } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

router.post(
  '/:requestId/accept',
  requireAuth,
  [
    body('scheduledAt').isISO8601().withMessage('A valid scheduled time is required'),
    body('format').optional().isIn(['in-person', 'online']),
    body('durationMins').optional().isInt({ min: 15, max: 240 }),
  ],
  validate,
  ctrl.acceptRequest
);

router.get('/', requireAuth, ctrl.listSessions);
router.get('/:id', requireAuth, ctrl.getSession);
router.post('/:id/start', requireAuth, ctrl.startSession);
router.post('/:id/complete', requireAuth, ctrl.confirmCompletion);
router.post('/:id/cancel', requireAuth, ctrl.cancelSession);
router.post(
  '/:id/review',
  requireAuth,
  [
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().trim().isLength({ max: 600 }),
  ],
  validate,
  ctrl.reviewSession
);

module.exports = router;