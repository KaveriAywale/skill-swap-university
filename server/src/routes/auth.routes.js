'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { validate } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
    body('email').isEmail().withMessage('A valid college email is required').toLowerCase(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('department').optional().isString(),
    body('year').optional().isInt({ min: 1, max: 5 }),
    body('studentId').optional().trim().isLength({ max: 40 }),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required').toLowerCase(),
    body('password').isString().withMessage('Password is required'),
  ],
  validate,
  ctrl.login
);

router.get('/me', requireAuth, ctrl.me);
router.patch(
  '/profile',
  requireAuth,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    body('bio').optional().trim().isLength({ max: 600 }),
    body('headline').optional().trim().isLength({ max: 120 }),
    body('department').optional().isIn([
      'Computer Science',
      'Information Technology',
      'Electronics',
      'Electrical',
      'Mechanical',
      'Civil',
      'Mathematics',
      'Physics',
      'Design',
      'Management',
      'Other',
    ]),
    body('year').optional().isInt({ min: 1, max: 5 }),
  ],
  validate,
  ctrl.updateProfile
);

router.patch('/privacy', requireAuth, ctrl.updatePrivacy);

router.post(
  '/location',
  requireAuth,
  [
    body('lng').isFloat({ min: -180, max: 180 }),
    body('lat').isFloat({ min: -90, max: 90 }),
    body('locationLabel').optional().trim().isLength({ max: 80 }),
  ],
  validate,
  ctrl.setLocation
);

router.patch('/availability', requireAuth, ctrl.setAvailability);
router.patch('/skills', requireAuth, ctrl.setSkills);
router.post('/onboarding/complete', requireAuth, ctrl.completeOnboarding);
router.post('/avatar', requireAuth, uploadAvatar.single('image'), ctrl.uploadAvatarHandler);

module.exports = router;