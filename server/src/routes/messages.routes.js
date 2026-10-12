'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/messageController');
const { validate } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, ctrl.listConversations);
router.post(
  '/',
  requireAuth,
  [body('userId').isMongoId()],
  validate,
  ctrl.getOrCreateConversation
);

router.get('/:id/messages', requireAuth, ctrl.listMessages);
router.post(
  '/:id/messages',
  requireAuth,
  [body('body').trim().isLength({ min: 1, max: 2000 })],
  validate,
  ctrl.sendMessage
);
router.post('/:id/read', requireAuth, ctrl.markRead);

module.exports = router;