const StudentWork = require('../models/StudentWork');
const Subject = require('../models/Subject');
const Concept = require('../models/Concept');
const TeacherAssignment = require('../models/TeacherAssignment');
const ParentStudentLink = require('../models/ParentStudentLink');
const fileUploadService = require('../services/fileUploadService');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Student Work Controller
 * Handles student work upload, retrieval, and management
 */

/**
 * Upload student work
 * POST /api/student-work
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8
 */
const uploadStudentWork = async (req, res) => {
  let createdWork = null;

  try {
    const { subjectId, conceptId } = req.body;
    const file = req.file;
    const studentId = req.user.id;

    // Validate file exists
    if (!file) {
      logger.warn('Student work upload failed: No file provided', { studentId });
      return res.status(400).json({
        success: false,
        message: 'No file provided. Please upload a file.'
      });
    }

    // Validate required fields
    if (!subjectId || !conceptId) {
      logger.warn('Student work upload failed: Missing required fields', { studentId, subjectId, conceptId });
      return res.status(400).json({
        success: false,
        message: 'Subject ID and Concept ID are required'
      });
    }

    // Validate subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      logger.warn('Student work upload failed: Subject not found', { studentId, subjectId });
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Validate concept exists
    const concept = await Concept.findById(conceptId);
    if (!concept) {
      logger.warn('Student work upload failed: Concept not found', { studentId, conceptId });
      return res.status(404).json({
        success: false,
        message: 'Concept not found'
      });
    }

    // Upload file to cloud storage with retry logic
    let uploadResult;
    try {
      uploadResult = await fileUploadService.uploadFile(file, {
        studentId,
        subjectId,
        conceptId
      });
    } catch (uploadError) {
      logger.error('Cloud storage upload failed', {
        studentId,
        filename: file.originalname,
        error: uploadError.message
      });

      // Return appropriate error based on validation or upload failure
      if (uploadError.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: 'File validation failed',
          errors: uploadError.validationErrors
        });
      }

      return res.status(500).json({
        success: false,
        message: 'File upload to cloud storage failed. Please try again.'
      });
    }

    // Determine file type from mimetype
    let fileType = 'pdf';
    if (file.mimetype.includes('jpeg') || file.mimetype.includes('jpg')) {
      fileType = 'jpeg';
    } else if (file.mimetype.includes('png')) {
      fileType = 'png';
    }

    // Create StudentWork record
    try {
      createdWork = await StudentWork.create({
        student_id: studentId,
        subject_id: subjectId,
        concept_id: conceptId,
        file_url: uploadResult.url,
        file_name: file.originalname,
        file_size: file.size,
        file_type: fileType,
        review_status: 'pending'
      });

      logger.info('Student work created successfully', {
        workId: createdWork._id,
        studentId,
        subjectId,
        conceptId,
        fileUrl: uploadResult.url
      });

      return res.status(201).json({
        success: true,
        message: 'Student work uploaded successfully',
        work: {
          id: createdWork._id,
          studentId: createdWork.student_id,
          subjectId: createdWork.subject_id,
          conceptId: createdWork.concept_id,
          fileUrl: createdWork.file_url,
          fileName: createdWork.file_name,
          fileSize: createdWork.file_size,
          fileType: createdWork.file_type,
          reviewStatus: createdWork.review_status,
          uploadedAt: createdWork.uploaded_at
        }
      });
    } catch (dbError) {
      // Rollback: Delete uploaded file from cloud storage
      logger.error('Database error after file upload, attempting rollback', {
        studentId,
        fileUrl: uploadResult.url,
        error: dbError.message
      });

      // Attempt to delete the uploaded file
      if (uploadResult.publicId || uploadResult.key) {
        try {
          await fileUploadService.deleteFile(uploadResult.publicId || uploadResult.key);
          logger.info('Successfully rolled back file upload', {
            identifier: uploadResult.publicId || uploadResult.key
          });
        } catch (deleteError) {
          logger.error('Failed to rollback file upload', {
            identifier: uploadResult.publicId || uploadResult.key,
            error: deleteError.message
          });
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create student work record. Upload has been rolled back.'
      });
    }
  } catch (error) {
    logger.error('Student work upload error', {
      error: error.message,
      stack: error.stack,
      studentId: req.user?.id
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during student work upload'
    });
  }
};

/**
 * Get student work with role-based filtering
 * GET /api/student-work
 * Requirements: 7.2, 8.5, 9.2
 */
const getStudentWork = async (req, res) => {
  try {
    const { studentId, status, subjectId } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Build query based on role
    let query = {};

    // Role-based filtering
    if (userRole === 'Student') {
      // Students can only see their own work
      query.student_id = userId;
    } else if (userRole === 'Teacher') {
      // Teachers can only see work from assigned students
      const assignments = await TeacherAssignment.find({ teacher_id: userId });
      const assignedStudentIds = assignments.map(a => a.student_id);
      
      if (assignedStudentIds.length === 0) {
        // Teacher has no assigned students
        return res.status(200).json({
          success: true,
          works: [],
          message: 'No assigned students found'
        });
      }
      
      query.student_id = { $in: assignedStudentIds };
    } else if (userRole === 'Parent') {
      // Parents can only see work from linked students
      const links = await ParentStudentLink.find({ parent_id: userId });
      const linkedStudentIds = links.map(l => l.student_id);
      
      if (linkedStudentIds.length === 0) {
        // Parent has no linked students
        return res.status(200).json({
          success: true,
          works: [],
          message: 'No linked students found'
        });
      }
      
      query.student_id = { $in: linkedStudentIds };
    }
    // Admin can see all work (no additional filtering)

    // Apply query filters
    if (studentId) {
      // For Admin, Teacher, Parent - allow filtering by specific student
      // For Student, this will be ignored as they can only see their own work
      if (userRole !== 'Student') {
        query.student_id = studentId;
      }
    }

    if (status) {
      query.review_status = status;
    }

    if (subjectId) {
      query.subject_id = subjectId;
    }

    // Fetch student work with populated references
    const works = await StudentWork.find(query)
      .populate('student_id', 'first_name last_name email')
      .populate('subject_id', 'name description')
      .populate('concept_id', 'name explanation')
      .sort({ uploaded_at: -1 })
      .lean();

    logger.info('Student work retrieved', {
      userId,
      userRole,
      count: works.length,
      filters: { studentId, status, subjectId }
    });

    // Format response
    const formattedWorks = works.map(work => ({
      id: work._id,
      studentId: work.student_id._id,
      student: {
        first_name: work.student_id.first_name,
        last_name: work.student_id.last_name,
        email: work.student_id.email
      },
      subjectId: work.subject_id._id,
      subject: {
        name: work.subject_id.name,
        description: work.subject_id.description
      },
      conceptId: work.concept_id._id,
      concept: {
        name: work.concept_id.name,
        explanation: work.concept_id.explanation
      },
      fileUrl: work.file_url,
      fileName: work.file_name,
      fileSize: work.file_size,
      fileType: work.file_type,
      reviewStatus: work.review_status,
      uploadedAt: work.uploaded_at
    }));

    return res.status(200).json({
      success: true,
      works: formattedWorks
    });
  } catch (error) {
    logger.error('Get student work error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      userRole: req.user?.role
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving student work'
    });
  }
};

/**
 * Get student work by ID with role-based access control
 * GET /api/student-work/:id
 * Requirements: 13.1, 13.7
 */
const getStudentWorkById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Fetch student work with populated references including feedback
    const work = await StudentWork.findById(id)
      .populate('student_id', 'first_name last_name email mobile')
      .populate('subject_id', 'name description')
      .populate('concept_id', 'name explanation practice_questions')
      .lean();

    if (!work) {
      logger.warn('Student work not found', { workId: id, userId, userRole });
      return res.status(404).json({
        success: false,
        message: 'Student work not found'
      });
    }

    // Role-based access control
    let hasAccess = false;

    if (userRole === 'Admin') {
      // Admin can access all work
      hasAccess = true;
    } else if (userRole === 'Student') {
      // Student can only access their own work
      hasAccess = work.student_id._id.toString() === userId.toString();
    } else if (userRole === 'Teacher') {
      // Teacher can access work from assigned students
      const assignment = await TeacherAssignment.findOne({
        teacher_id: userId,
        student_id: work.student_id._id
      });
      hasAccess = !!assignment;
    } else if (userRole === 'Parent') {
      // Parent can access work from linked students
      const link = await ParentStudentLink.findOne({
        parent_id: userId,
        student_id: work.student_id._id
      });
      hasAccess = !!link;
    }

    if (!hasAccess) {
      logger.warn('Unauthorized access attempt to student work', {
        workId: id,
        userId,
        userRole,
        studentId: work.student_id._id
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this student work.'
      });
    }

    // Fetch feedback for this work
    const Feedback = require('../models/Feedback');
    const feedback = await Feedback.find({ work_id: id })
      .populate('teacher_id', 'first_name last_name email')
      .sort({ created_at: -1 })
      .lean();

    logger.info('Student work retrieved by ID', {
      workId: id,
      userId,
      userRole,
      feedbackCount: feedback.length
    });

    // Format response
    const formattedWork = {
      id: work._id,
      studentId: work.student_id._id,
      student: {
        first_name: work.student_id.first_name,
        last_name: work.student_id.last_name,
        email: work.student_id.email,
        mobile: work.student_id.mobile
      },
      subjectId: work.subject_id._id,
      subject: {
        name: work.subject_id.name,
        description: work.subject_id.description
      },
      conceptId: work.concept_id._id,
      concept: {
        name: work.concept_id.name,
        explanation: work.concept_id.explanation,
        practice_questions: work.concept_id.practice_questions
      },
      fileUrl: work.file_url,
      fileName: work.file_name,
      fileSize: work.file_size,
      fileType: work.file_type,
      reviewStatus: work.review_status,
      uploadedAt: work.uploaded_at,
      feedback: feedback.map(fb => ({
        id: fb._id,
        teacherId: fb.teacher_id._id,
        teacher: {
          first_name: fb.teacher_id.first_name,
          last_name: fb.teacher_id.last_name,
          email: fb.teacher_id.email
        },
        comment: fb.comment,
        createdAt: fb.created_at,
        updatedAt: fb.updated_at
      }))
    };

    return res.status(200).json({
      success: true,
      work: formattedWork
    });
  } catch (error) {
    logger.error('Get student work by ID error', {
      error: error.message,
      stack: error.stack,
      workId: req.params.id,
      userId: req.user?.id,
      userRole: req.user?.role
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving student work'
    });
  }
};


module.exports = {
  uploadStudentWork,
  getStudentWork,
  getStudentWorkById
};
