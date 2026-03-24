const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  createBoardValidation,
  updateBoardValidation,
  boardIdValidation,
  createSubjectValidation,
  updateSubjectValidation,
  subjectIdValidation,
  boardIdParamValidation,
  createChapterValidation,
  updateChapterValidation,
  chapterIdValidation,
  subjectIdParamValidation,
  createConceptValidation,
  updateConceptValidation,
  conceptIdValidation,
  chapterIdParamValidation
} = require('../middleware/validators/academicValidators');

/**
 * Academic Structure Routes
 * Base paths: /api/boards, /api/subjects, /api/chapters, /api/concepts, /api/academic-structure
 */

// ==================== BOARD ROUTES ====================

// POST /api/boards - Create board (Admin only)
router.post('/boards', 
  authenticate, 
  authorize('Admin'), 
  createBoardValidation, 
  academicController.createBoard
);

// GET /api/boards - Get all boards (Authenticated)
router.get('/boards', 
  authenticate, 
  academicController.getAllBoards
);

// PUT /api/boards/:id - Update board (Admin only)
router.put('/boards/:id', 
  authenticate, 
  authorize('Admin'), 
  updateBoardValidation, 
  academicController.updateBoard
);

// DELETE /api/boards/:id - Delete board (Admin only)
router.delete('/boards/:id', 
  authenticate, 
  authorize('Admin'), 
  boardIdValidation, 
  academicController.deleteBoard
);

// ==================== SUBJECT ROUTES ====================

// POST /api/boards/:boardId/subjects - Create subject under board (Admin only)
router.post('/boards/:boardId/subjects', 
  authenticate, 
  authorize('Admin'), 
  createSubjectValidation, 
  academicController.createSubject
);

// GET /api/boards/:boardId/subjects - Get subjects for board (Authenticated)
router.get('/boards/:boardId/subjects', 
  authenticate, 
  boardIdParamValidation, 
  academicController.getSubjectsByBoard
);

// PUT /api/subjects/:id - Update subject (Admin only)
router.put('/subjects/:id', 
  authenticate, 
  authorize('Admin'), 
  updateSubjectValidation, 
  academicController.updateSubject
);

// DELETE /api/subjects/:id - Delete subject (Admin only)
router.delete('/subjects/:id', 
  authenticate, 
  authorize('Admin'), 
  subjectIdValidation, 
  academicController.deleteSubject
);

// ==================== CHAPTER ROUTES ====================

// POST /api/subjects/:subjectId/chapters - Create chapter under subject (Admin only)
router.post('/subjects/:subjectId/chapters', 
  authenticate, 
  authorize('Admin'), 
  createChapterValidation, 
  academicController.createChapter
);

// GET /api/subjects/:subjectId/chapters - Get chapters for subject (Authenticated)
router.get('/subjects/:subjectId/chapters', 
  authenticate, 
  subjectIdParamValidation, 
  academicController.getChaptersBySubject
);

// PUT /api/chapters/:id - Update chapter (Admin only)
router.put('/chapters/:id', 
  authenticate, 
  authorize('Admin'), 
  updateChapterValidation, 
  academicController.updateChapter
);

// DELETE /api/chapters/:id - Delete chapter (Admin only)
router.delete('/chapters/:id', 
  authenticate, 
  authorize('Admin'), 
  chapterIdValidation, 
  academicController.deleteChapter
);

// ==================== CONCEPT ROUTES ====================

// POST /api/chapters/:chapterId/concepts - Create concept under chapter (Admin only)
router.post('/chapters/:chapterId/concepts', 
  authenticate, 
  authorize('Admin'), 
  createConceptValidation, 
  academicController.createConcept
);

// GET /api/chapters/:chapterId/concepts - Get concepts for chapter (Authenticated)
router.get('/chapters/:chapterId/concepts', 
  authenticate, 
  chapterIdParamValidation, 
  academicController.getConceptsByChapter
);

// PUT /api/concepts/:id - Update concept (Admin only)
router.put('/concepts/:id', 
  authenticate, 
  authorize('Admin'), 
  updateConceptValidation, 
  academicController.updateConcept
);

// DELETE /api/concepts/:id - Delete concept (Admin only)
router.delete('/concepts/:id', 
  authenticate, 
  authorize('Admin'), 
  conceptIdValidation, 
  academicController.deleteConcept
);

// ==================== COMPLETE HIERARCHY ROUTE ====================

// GET /api/academic-structure - Get complete academic hierarchy (Authenticated)
router.get('/academic-structure', 
  authenticate, 
  academicController.getAcademicStructure
);

module.exports = router;
