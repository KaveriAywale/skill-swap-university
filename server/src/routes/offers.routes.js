'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/offerController');
const { validate } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');
const { uploadEvidence } = require('../middleware/upload');

router.post(
  '/',
  requireAuth,
  [
    body('skill').isMongoId(),
    body('title').trim().isLength({ min: 3, max: 120 }),
    body('description').trim().isLength({ min: 10, max: 1200 }),
    body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
    body('format').optional().isIn(['in-person', 'online', 'both']),
  ],
  validate,
  ctrl.createOffer
);

router.get('/', requireAuth, ctrl.listOffers);
router.post('/evidence', requireAuth, uploadEvidence.single('file'), ctrl.uploadEvidenceHandler);
router.get('/:id', requireAuth, ctrl.getOffer);
router.patch('/:id', requireAuth, ctrl.updateOffer);
router.delete('/:id', requireAuth, ctrl.withdrawOffer);

module.exports = router;