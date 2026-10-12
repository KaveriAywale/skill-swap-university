'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/skillController');
const { validate } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');
const { CATEGORY_KEYS } = require('../constants/skillCatalog');

router.get('/categories', ctrl.listCategories);
router.get('/', ctrl.listSkills);
router.post(
  '/',
  requireAuth,
  [
    body('name').trim().isLength({ min: 2, max: 60 }),
    body('category').isIn(CATEGORY_KEYS),
  ],
  validate,
  ctrl.createSkill
);

module.exports = router;