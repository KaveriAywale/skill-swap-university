'use strict';

const router = require('express').Router();
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const skillsRoutes = require('./skills.routes');
const offersRoutes = require('./offers.routes');
const requestsRoutes = require('./requests.routes');
const sessionsRoutes = require('./sessions.routes');
const messagesRoutes = require('./messages.routes');
const notificationsRoutes = require('./notifications.routes');
const karmaRoutes = require('./karma.routes');
const verificationRoutes = require('./verification.routes');

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'Skill Swap University API is running' })
);

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/skills', skillsRoutes);
router.use('/offers', offersRoutes);
router.use('/requests', requestsRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/conversations', messagesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/karma', karmaRoutes);
router.use('/verification', verificationRoutes);

module.exports = router;