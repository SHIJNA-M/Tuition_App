const express = require('express');
const router = express.Router();
const multer = require('multer');
const studentWorkController = require('../controllers/studentWorkController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  uploadStudentWorkValidation,
  getStudentWorkValidation,
  getStudentWorkByIdValidation
} = require('../middleware/validators/studentWorkValidators');

/**
 * Student Work Routes
 * Base path: /api/student-work
 */

// Configure Multer for file uploads
// Use memory storage to keep files in memory for cloud upload
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// ==================== STUDENT WORK ROUTES ====================

/**
 * POST /api/student-work
 * Upload student work
 * Auth: Student only
 * Content-Type: multipart/form-data
 */
router.post('/',
  authenticate,
  authorize('Student'),
  upload.single('file'),
  uploadStudentWorkValidation,
  studentWorkController.uploadStudentWork
);

/**
 * GET /api/student-work
 * Get student work with role-based filtering
 * Auth: Student, Teacher, Parent, Admin
 * Students: see only their own work
 * Teachers: see work from assigned students
 * Parents: see work from linked students
 * Admin: see all work
 */
router.get('/',
  authenticate,
  authorize('Student', 'Teacher', 'Parent', 'Admin'),
  getStudentWorkValidation,
  studentWorkController.getStudentWork
);

/**
 * GET /api/student-work/:id
 * Get specific student work by ID with feedback
 * Auth: Student (own), Teacher (assigned), Parent (linked), Admin
 * Access control: 
 * - Student can only access their own work
 * - Teacher can access work from assigned students
 * - Parent can access work from linked students
 * - Admin can access all work
 */
router.get('/:id',
  authenticate,
  authorize('Student', 'Teacher', 'Parent', 'Admin'),
  getStudentWorkByIdValidation,
  studentWorkController.getStudentWorkById
);

module.exports = router;
