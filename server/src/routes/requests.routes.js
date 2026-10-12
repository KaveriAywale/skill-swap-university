'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/requestController');
const { validate } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

router.post(
  '/',
  requireAuth,
  [
    body('title').trim().isLength({ min: 4, max: 140 }),
    body('description').trim().isLength({ min: 10, max: 2000 }),
    body('skill').isMongoId(),
  ],
  validate,
  ctrl.createRequest
);

router.get('/', requireAuth, ctrl.listRequests);
router.get('/:id', requireAuth, ctrl.getRequest);
router.get('/:id/matches', requireAuth, ctrl.getMatchesForRequest);
router.patch('/:id', requireAuth, ctrl.updateRequest);
router.delete('/:id', requireAuth, ctrl.cancelRequest);

module.exports = router;