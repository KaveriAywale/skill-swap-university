'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, ctrl.listStudents);
router.get('/me/insights', requireAuth, ctrl.myInsights);
router.get('/:id', requireAuth, ctrl.getStudent);

module.exports = router;