const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  validateCreateParentStudentLink,
  validateDeleteParentStudentLink,
  validateGetParentStudentLinks,
  validateCreateTeacherAssignment,
  validateDeleteTeacherAssignment,
  validateGetTeacherAssignments
} = require('../middleware/validators/linkValidators');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/links/parent-student
 * Create parent-student link (Admin only)
 */
router.post(
  '/parent-student',
  authorize('Admin'),
  validateCreateParentStudentLink,
  linkController.createParentStudentLink
);

/**
 * DELETE /api/links/parent-student/:id
 * Delete parent-student link (Admin only)
 */
router.delete(
  '/parent-student/:id',
  authorize('Admin'),
  validateDeleteParentStudentLink,
  linkController.deleteParentStudentLink
);

/**
 * GET /api/links/parent-student
 * Get parent-student links (Admin and Parent)
 */
router.get(
  '/parent-student',
  authorize('Admin', 'Parent'),
  validateGetParentStudentLinks,
  linkController.getParentStudentLinks
);

/**
 * POST /api/links/teacher-student
 * Create teacher assignment (Admin only)
 */
router.post(
  '/teacher-student',
  authorize('Admin'),
  validateCreateTeacherAssignment,
  linkController.createTeacherAssignment
);

/**
 * DELETE /api/links/teacher-student/:id
 * Delete teacher assignment (Admin only)
 */
router.delete(
  '/teacher-student/:id',
  authorize('Admin'),
  validateDeleteTeacherAssignment,
  linkController.deleteTeacherAssignment
);

/**
 * GET /api/links/teacher-student
 * Get teacher assignments (Admin and Teacher)
 */
router.get(
  '/teacher-student',
  authorize('Admin', 'Teacher'),
  validateGetTeacherAssignments,
  linkController.getTeacherAssignments
);

module.exports = router;
