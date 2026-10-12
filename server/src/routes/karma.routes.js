'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/karmaController');
const { requireAuth } = require('../middleware/auth');

router.get('/me', requireAuth, ctrl.myKarma);
router.get('/leaderboard', requireAuth, ctrl.leaderboard);
router.get('/badges', requireAuth, ctrl.myBadges);

module.exports = router;