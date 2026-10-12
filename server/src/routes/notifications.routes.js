'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, ctrl.listNotifications);
router.post('/:id/read', requireAuth, ctrl.markRead);
router.post('/read-all', requireAuth, ctrl.markAllRead);

module.exports = router;