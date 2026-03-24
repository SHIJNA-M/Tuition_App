const Board = require('../models/Board');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Concept = require('../models/Concept');
const logger = require('../utils/logger');

/**
 * Academic Structure Controller
 * Handles CRUD operations for Board, Subject, Chapter, and Concept
 */

// ==================== BOARD ENDPOINTS ====================

/**
 * Create a new board
 * POST /api/boards
 * Requirements: 11.1, 11.9
 */
async function createBoard(req, res, next) {
  try {
    const { name, description } = req.body;

    // Check for duplicate name
    const existingBoard = await Board.findOne({ name });
    if (existingBoard) {
      logger.warn(`Board creation attempt with duplicate name: ${name}`);
      return res.status(409).json({
        success: false,
        message: 'Board with this name already exists'
      });
    }

    // Create board
    const board = await Board.create({
      name,
      description
    });

    logger.info(`Board created: ${board._id}, name: ${name}`);

    res.status(201).json({
      success: true,
      board: {
        id: board._id.toString(),
        name: board.name,
        description: board.description,
        active: board.active,
        created_at: board.created_at,
        updated_at: board.updated_at
      }
    });
  } catch (error) {
    logger.error('Error in createBoard controller:', error);
    next(error);
  }
}

/**
 * Get all boards
 * GET /api/boards
 * Requirements: 11.1
 */
async function getAllBoards(req, res, next) {
  try {
    const boards = await Board.find({ active: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      boards: boards.map(board => ({
        id: board._id.toString(),
        name: board.name,
        description: board.description,
        active: board.active,
        created_at: board.created_at,
        updated_at: board.updated_at
      }))
    });
  } catch (error) {
    logger.error('Error in getAllBoards controller:', error);
    next(error);
  }
}

/**
 * Update a board
 * PUT /api/boards/:id
 * Requirements: 11.8
 */
async function updateBoard(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Find board
    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== board.name) {
      const existingBoard = await Board.findOne({ name });
      if (existingBoard) {
        logger.warn(`Board update attempt with duplicate name: ${name}`);
        return res.status(409).json({
          success: false,
          message: 'Board with this name already exists'
        });
      }
    }

    // Update board
    if (name) board.name = name;
    if (description !== undefined) board.description = description;
    board.updated_at = Date.now();

    await board.save();

    logger.info(`Board updated: ${board._id}`);

    res.status(200).json({
      success: true,
      board: {
        id: board._id.toString(),
        name: board.name,
        description: board.description,
        active: board.active,
        created_at: board.created_at,
        updated_at: board.updated_at
      }
    });
  } catch (error) {
    logger.error('Error in updateBoard controller:', error);
    next(error);
  }
}

/**
 * Delete a board
 * DELETE /api/boards/:id
 * Requirements: 11.9
 */
async function deleteBoard(req, res, next) {
  try {
    const { id } = req.params;

    // Find board
    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check for linked subjects
    const linkedSubjects = await Subject.countDocuments({ board_id: id });
    if (linkedSubjects > 0) {
      logger.warn(`Board deletion attempt with linked subjects: ${id}`);
      return res.status(409).json({
        success: false,
        message: 'Cannot delete board with linked subjects. Please delete all subjects first.'
      });
    }

    // Delete board
    await Board.findByIdAndDelete(id);

    logger.info(`Board deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Board deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteBoard controller:', error);
    next(error);
  }
}

// ==================== SUBJECT ENDPOINTS ====================

/**
 * Create a new subject under a board
 * POST /api/boards/:boardId/subjects
 * Requirements: 11.2, 11.5
 */
async function createSubject(req, res, next) {
  try {
    const { boardId } = req.params;
    const { name, description } = req.body;

    // Validate board exists
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check for duplicate name within the board
    const existingSubject = await Subject.findOne({ board_id: boardId, name });
    if (existingSubject) {
      logger.warn(`Subject creation attempt with duplicate name: ${name} in board: ${boardId}`);
      return res.status(409).json({
        success: false,
        message: 'Subject with this name already exists in this board'
      });
    }

    // Create subject
    const subject = await Subject.create({
      board_id: boardId,
      name,
      description
    });

    logger.info(`Subject created: ${subject._id}, name: ${name}, board: ${boardId}`);

    res.status(201).json({
      success: true,
      subject: {
        id: subject._id.toString(),
        board_id: subject.board_id.toString(),
        name: subject.name,
        description: subject.description,
        active: subject.active,
        created_at: subject.created_at,
        updated_at: subject.updated_at
      }
    });
  } catch (error) {
    logger.error('Error in createSubject controller:', error);
    next(error);
  }
}

/**
 * Get all subjects for a board
 * GET /api/boards/:boardId/subjects
 * Requirements: 11.2
 */
async function getSubjectsByBoard(req, res, next) {
  try {
    const { boardId } = req.params;

    // Validate board exists
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    const subjects = await Subject.find({ board_id: boardId, active: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      subjects: subjects.map(subject => ({
        id: subject._id.toString(),
        board_id: subject.board_id.toString(),
        name: subject.name,
        description: subject.description,
        active: subject.active,
        created_at: subject.created_at,
        updated_at: subject.updated_at
      }))
    });
  } catch (error) {
    logger.error('Error in getSubjectsByBoard controller:', error);
    next(error);
  }
}

/**
 * Update a subject
 * PUT /api/subjects/:id
 * Requirements: 11.8
 */
async function updateSubject(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Find subject
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== subject.name) {
      const existingSubject = await Subject.findOne({ 
        board_id: subject.board_id, 
        name 
      });
      if (existingSubject) {
        logger.warn(`Subject update attempt with duplicate name: ${name}`);
        return res.status(409).json({
          success: false,
          message: 'Subject with this name already exists in this board'
        });
      }
    }

    // Update subject
    if (name) subject.name = name;
    if (description !== undefined) subject.description = description;
    subject.updated_at = Date.now();

    await subject.save();

    logger.info(`Subject updated: ${subject._id}`);

    res.status(200).json({
      success: true,
      subject: {
        id: subject._id.toString(),
        board_id: subject.board_id.toString(),
        name: subject.name,
        description: subject.description,
        active: subject.active,
        created_at: subject.created_at,
        updated_at: subject.updated_at
      }
    });
  } catch (error) {
    logger.error('Error in updateSubject controller:', error);
    next(error);
  }
}

/**
 * Delete a subject
 * DELETE /api/subjects/:id
 * Requirements: 11.5
 */
async function deleteSubject(req, res, next) {
  try {
    const { id } = req.params;

    // Find subject
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check for linked chapters
    const linkedChapters = await Chapter.countDocuments({ subject_id: id });
    if (linkedChapters > 0) {
      logger.warn(`Subject deletion attempt with linked chapters: ${id}`);
      return res.status(409).json({
        success: false,
        message: 'Cannot delete subject with linked chapters. Please delete all chapters first.'
      });
    }

    // Delete subject
    await Subject.findByIdAndDelete(id);

    logger.info(`Subject deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteSubject controller:', error);
    next(error);
  }
}

// ==================== CHAPTER ENDPOINTS ====================

/**
 * Create a new chapter under a subject
 * POST /api/subjects/:subjectId/chapters
 * Requirements: 11.3, 11.5
 */
async function createChapter(req, res, next) {
  try {
    const { subjectId } = req.params;
    const { name, description } = req.body;

    // Validate subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check for duplicate name within the subject
    const existingChapter = await Chapter.findOne({ subject_id: subjectId, name });
    if (existingChapter) {
      logger.warn(`Chapter creation attempt with duplicate name: ${name} in subject: ${subjectId}`);
      return res.status(409).json({
        success: false,
        message: 'Chapter with this name already exists in this subject'
      });
    }

    // Create chapter
    const chapter = await Chapter.create({
      subject_id: subjectId,
      name,
      description
    });

    logger.info(`Chapter created: ${chapter._id}, name: ${name}, subject: ${subjectId}`);

    res.status(201).json({
      success: true,
      chapter: {
        id: chapter._id.toString(),
        subject_id: chapter.subject_id.toString(),
        name: chapter.name,
        description: chapter.description,
        active: chapter.active,
        created_at: chapter.created_at,
        updated_at: chapter.updated_at
      }
    });
  } catch (error) {
    logger.error('Error in createChapter controller:', error);
    next(error);
  }
}

/**
 * Get all chapters for a subject
 * GET /api/subjects/:subjectId/chapters
 * Requirements: 11.3
 */
async function getChaptersBySubject(req, res, next) {
  try {
    const { subjectId } = req.params;

    // Validate subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const chapters = await Chapter.find({ subject_id: subjectId, active: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      chapters: chapters.map(chapter => ({
        id: chapter._id.toString(),
        subject_id: chapter.subject_id.toString(),
        name: chapter.name,
        description: chapter.description,
        active: chapter.active,
        created_at: chapter.created_at,
        updated_at: chapter.updated_at
      }))
    });
  } catch (error) {
    logger.error('Error in getChaptersBySubject controller:', error);
    next(error);
  }
}

/**
 * Update a chapter
 * PUT /api/chapters/:id
 * Requirements: 11.8
 */
async function updateChapter(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Find chapter
    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== chapter.name) {
      const existingChapter = await Chapter.findOne({ 
        subject_id: chapter.subject_id, 
        name 
      });
      if (existingChapter) {
        logger.warn(`Chapter update attempt with duplicate name: ${name}`);
        return res.status(409).json({
          success: false,
          message: 'Chapter with this name already exists in this subject'
        });
      }
    }

    // Update chapter
    if (name) chapter.name = name;
    if (description !== undefined) chapter.description = description;
    chapter.updated_at = Date.now();

    await chapter.save();

    logger.info(`Chapter updated: ${chapter._id}`);

    res.status(200).json({
      success: true,
      chapter: {
        id: chapter._id.toString(),
        subject_id: chapter.subject_id.toString(),
        name: chapter.name,
        description: chapter.description,
        active: chapter.active,
        created_at: chapter.created_at,
        updated_at: chapter.updated_at
      }
    });
  } catch (error) {
    logger.error('Error in updateChapter controller:', error);
    next(error);
  }
}

/**
 * Delete a chapter
 * DELETE /api/chapters/:id
 * Requirements: 11.5
 */
async function deleteChapter(req, res, next) {
  try {
    const { id } = req.params;

    // Find chapter
    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check for linked concepts
    const linkedConcepts = await Concept.countDocuments({ chapter_id: id });
    if (linkedConcepts > 0) {
      logger.warn(`Chapter deletion attempt with linked concepts: ${id}`);
      return res.status(409).json({
        success: false,
        message: 'Cannot delete chapter with linked concepts. Please delete all concepts first.'
      });
    }

    // Delete chapter
    await Chapter.findByIdAndDelete(id);

    logger.info(`Chapter deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Chapter deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteChapter controller:', error);
    next(error);
  }
}

// ==================== CONCEPT ENDPOINTS ====================

/**
 * Create a new concept under a chapter
 * POST /api/chapters/:chapterId/concepts
 * Requirements: 11.4, 11.5, 11.6, 11.7, 11.8
 */
async function createConcept(req, res, next) {
  try {
    const { chapterId } = req.params;
    const { name, explanation, practice_questions } = req.body;

    // Validate chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check for duplicate name within the chapter
    const existingConcept = await Concept.findOne({ chapter_id: chapterId, name });
    if (existingConcept) {
      logger.warn(`Concept creation attempt with duplicate name: ${name} in chapter: ${chapterId}`);
      return res.status(409).json({
        success: false,
        message: 'Concept with this name already exists in this chapter'
      });
    }

    // Create concept
    const concept = await Concept.create({
      chapter_id: chapterId,
      name,
      explanation,
      practice_questions: practice_questions || []
    });

    logger.info(`Concept created: ${concept._id}, name: ${name}, chapter: ${chapterId}`);

    res.status(201).json({
      success: true,
      concept: {
        id: concept._id.toString(),
        chapter_id: concept.chapter_id.toString(),
        name: concept.name,
        explanation: concept.explanation,
        practice_questions: concept.practice_questions,
        active: concept.active,
        created_at: concept.created_at,
        updated_at: concept.updated_at
      }
    });
  } catch (error) {
    logger.error('Error in createConcept controller:', error);
    next(error);
  }
}

/**
 * Get all concepts for a chapter
 * GET /api/chapters/:chapterId/concepts
 * Requirements: 11.4
 */
async function getConceptsByChapter(req, res, next) {
  try {
    const { chapterId } = req.params;

    // Validate chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const concepts = await Concept.find({ chapter_id: chapterId, active: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      concepts: concepts.map(concept => ({
        id: concept._id.toString(),
        chapter_id: concept.chapter_id.toString(),
        name: concept.name,
        explanation: concept.explanation,
        practice_questions: concept.practice_questions,
        active: concept.active,
        created_at: concept.created_at,
        updated_at: concept.updated_at
      }))
    });
  } catch (error) {
    logger.error('Error in getConceptsByChapter controller:', error);
    next(error);
  }
}

/**
 * Update a concept
 * PUT /api/concepts/:id
 * Requirements: 11.8
 */
async function updateConcept(req, res, next) {
  try {
    const { id } = req.params;
    const { name, explanation, practice_questions } = req.body;

    // Find concept
    const concept = await Concept.findById(id);
    if (!concept) {
      return res.status(404).json({
        success: false,
        message: 'Concept not found'
      });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== concept.name) {
      const existingConcept = await Concept.findOne({ 
        chapter_id: concept.chapter_id, 
        name 
      });
      if (existingConcept) {
        logger.warn(`Concept update attempt with duplicate name: ${name}`);
        return res.status(409).json({
          success: false,
          message: 'Concept with this name already exists in this chapter'
        });
      }
    }

    // Update concept
    if (name) concept.name = name;
    if (explanation) concept.explanation = explanation;
    if (practice_questions !== undefined) concept.practice_questions = practice_questions;
    concept.updated_at = Date.now();

    await concept.save();

    logger.info(`Concept updated: ${concept._id}`);

    res.status(200).json({
      success: true,
      concept: {
        id: concept._id.toString(),
        chapter_id: concept.chapter_id.toString(),
        name: concept.name,
        explanation: concept.explanation,
        practice_questions: concept.practice_questions,
        active: concept.active,
        created_at: concept.created_at,
        updated_at: concept.updated_at
      }
    });
  } catch (error) {
    logger.error('Error in updateConcept controller:', error);
    next(error);
  }
}

/**
 * Delete a concept
 * DELETE /api/concepts/:id
 * Requirements: 11.4
 */
async function deleteConcept(req, res, next) {
  try {
    const { id } = req.params;

    // Find concept
    const concept = await Concept.findById(id);
    if (!concept) {
      return res.status(404).json({
        success: false,
        message: 'Concept not found'
      });
    }

    // Delete concept (no cascade check needed as concepts are leaf nodes)
    await Concept.findByIdAndDelete(id);

    logger.info(`Concept deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Concept deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteConcept controller:', error);
    next(error);
  }
}

// ==================== COMPLETE HIERARCHY ENDPOINT ====================

/**
 * Get complete academic structure hierarchy
 * GET /api/academic-structure
 * Requirements: 8.1
 */
async function getAcademicStructure(req, res, next) {
  try {
    // Fetch all boards with populated hierarchy
    const boards = await Board.find({ active: true }).sort({ name: 1 });

    const structure = await Promise.all(
      boards.map(async (board) => {
        const subjects = await Subject.find({ board_id: board._id, active: true }).sort({ name: 1 });

        const subjectsWithChapters = await Promise.all(
          subjects.map(async (subject) => {
            const chapters = await Chapter.find({ subject_id: subject._id, active: true }).sort({ name: 1 });

            const chaptersWithConcepts = await Promise.all(
              chapters.map(async (chapter) => {
                const concepts = await Concept.find({ chapter_id: chapter._id, active: true }).sort({ name: 1 });

                return {
                  chapter: {
                    id: chapter._id.toString(),
                    name: chapter.name,
                    description: chapter.description
                  },
                  concepts: concepts.map(concept => ({
                    id: concept._id.toString(),
                    name: concept.name,
                    explanation: concept.explanation,
                    practice_questions: concept.practice_questions
                  }))
                };
              })
            );

            return {
              subject: {
                id: subject._id.toString(),
                name: subject.name,
                description: subject.description
              },
              chapters: chaptersWithConcepts
            };
          })
        );

        return {
          board: {
            id: board._id.toString(),
            name: board.name,
            description: board.description
          },
          subjects: subjectsWithChapters
        };
      })
    );

    logger.info('Academic structure fetched successfully');

    res.status(200).json({
      success: true,
      structure
    });
  } catch (error) {
    logger.error('Error in getAcademicStructure controller:', error);
    next(error);
  }
}

module.exports = {
  // Board endpoints
  createBoard,
  getAllBoards,
  updateBoard,
  deleteBoard,
  // Subject endpoints
  createSubject,
  getSubjectsByBoard,
  updateSubject,
  deleteSubject,
  // Chapter endpoints
  createChapter,
  getChaptersBySubject,
  updateChapter,
  deleteChapter,
  // Concept endpoints
  createConcept,
  getConceptsByChapter,
  updateConcept,
  deleteConcept,
  // Complete hierarchy
  getAcademicStructure
};
