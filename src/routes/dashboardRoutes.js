const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

/**
 * @route   GET /api/dashboard/student
 * @desc    Get student dashboard with subjects, recent work, and stats
 * @access  Student
 */
router.get('/student', authenticate, authorize('Student'), dashboardController.getStudentDashboard);

/**
 * @route   GET /api/dashboard/teacher
 * @desc    Get teacher dashboard with assigned students, pending work, and weak concepts
 * @access  Teacher
 */
router.get('/teacher', authenticate, authorize('Teacher'), dashboardController.getTeacherDashboard);

/**
 * @route   GET /api/dashboard/parent
 * @desc    Get parent dashboard with linked students' progress and feedback
 * @access  Parent
 */
router.get('/parent', authenticate, authorize('Parent'), dashboardController.getParentDashboard);

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard with system-wide statistics
 * @access  Admin
 */
router.get('/admin', authenticate, authorize('Admin'), dashboardController.getAdminDashboard);

module.exports = router;
