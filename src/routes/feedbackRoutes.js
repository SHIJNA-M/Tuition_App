const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { validateCreateFeedback, validateUpdateFeedback, validateGetFeedback } = require('../middleware/validators/feedbackValidators');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

/**
 * @route   POST /api/feedback
 * @desc    Create feedback for student work
 * @access  Teacher only
 */
router.post(
  '/',
  authenticate,
  authorize('Teacher'),
  validateCreateFeedback,
  feedbackController.createFeedback
);

/**
 * @route   PUT /api/feedback/:id
 * @desc    Update feedback
 * @access  Teacher (owner only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('Teacher'),
  validateUpdateFeedback,
  feedbackController.updateFeedback
);

/**
 * @route   DELETE /api/feedback/:id
 * @desc    Delete feedback
 * @access  Teacher (owner only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('Teacher'),
  feedbackController.deleteFeedback
);

/**
 * @route   GET /api/feedback
 * @desc    Get feedback with role-based filtering
 * @access  Teacher, Student, Parent
 */
router.get(
  '/',
  authenticate,
  authorize('Teacher', 'Student', 'Parent'),
  validateGetFeedback,
  feedbackController.getFeedback
);

module.exports = router;
