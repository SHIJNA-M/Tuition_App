const ParentStudentLink = require('../models/ParentStudentLink');
const TeacherAssignment = require('../models/TeacherAssignment');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Create parent-student link
 * POST /api/links/parent-student
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.6
 */
exports.createParentStudentLink = async (req, res, next) => {
  try {
    const { parentId, studentId } = req.body;

    // Validate parent has Parent role
    const parent = await User.findById(parentId);
    if (!parent) {
      return res.status(400).json({
        success: false,
        message: 'Parent not found'
      });
    }
    if (parent.role !== 'Parent') {
      return res.status(400).json({
        success: false,
        message: 'Invalid role: User must have Parent role'
      });
    }

    // Validate student has Student role
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Student not found'
      });
    }
    if (student.role !== 'Student') {
      return res.status(400).json({
        success: false,
        message: 'Invalid role: User must have Student role'
      });
    }

    // Check for duplicate link
    const existingLink = await ParentStudentLink.findOne({
      parent_id: parentId,
      student_id: studentId
    });

    if (existingLink) {
      return res.status(409).json({
        success: false,
        message: 'Parent-student link already exists'
      });
    }

    // Create link
    const link = new ParentStudentLink({
      parent_id: parentId,
      student_id: studentId
    });

    await link.save();

    logger.info(`Parent-student link created: Parent ${parentId} -> Student ${studentId}`);

    res.status(201).json({
      success: true,
      message: 'Parent-student link created successfully',
      link: {
        id: link._id,
        parentId: link.parent_id,
        studentId: link.student_id,
        createdAt: link.created_at
      }
    });
  } catch (error) {
    logger.error('Error creating parent-student link:', error);
    next(error);
  }
};

/**
 * Delete parent-student link
 * DELETE /api/links/parent-student/:id
 * Requirements: 10.5
 */
exports.deleteParentStudentLink = async (req, res, next) => {
  try {
    const { id } = req.params;

    const link = await ParentStudentLink.findById(id);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Parent-student link not found'
      });
    }

    await ParentStudentLink.findByIdAndDelete(id);

    logger.info(`Parent-student link deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Parent-student link deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting parent-student link:', error);
    next(error);
  }
};

/**
 * Get parent-student links
 * GET /api/links/parent-student
 * Requirements: 9.1
 */
exports.getParentStudentLinks = async (req, res, next) => {
  try {
    const { parentId, studentId } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Build query based on role
    let query = {};

    if (userRole === 'Admin') {
      // Admin can filter by parentId or studentId
      if (parentId) query.parent_id = parentId;
      if (studentId) query.student_id = studentId;
    } else if (userRole === 'Parent') {
      // Parent can only see their own links
      query.parent_id = userId;
    } else {
      // Other roles not allowed
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Admin and Parent roles can access this resource.'
      });
    }

    const links = await ParentStudentLink.find(query)
      .populate('parent_id', 'first_name last_name email mobile role')
      .populate('student_id', 'first_name last_name email mobile role')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      links: links.map(link => ({
        id: link._id,
        parent: {
          id: link.parent_id._id,
          first_name: link.parent_id.first_name,
          last_name: link.parent_id.last_name,
          email: link.parent_id.email,
          mobile: link.parent_id.mobile,
          role: link.parent_id.role
        },
        student: {
          id: link.student_id._id,
          first_name: link.student_id.first_name,
          last_name: link.student_id.last_name,
          email: link.student_id.email,
          mobile: link.student_id.mobile,
          role: link.student_id.role
        },
        createdAt: link.created_at
      }))
    });
  } catch (error) {
    logger.error('Error fetching parent-student links:', error);
    next(error);
  }
};

/**
 * Create teacher assignment
 * POST /api/links/teacher-student
 * Requirements: 24.1, 24.2, 24.3, 24.4, 24.6
 */
exports.createTeacherAssignment = async (req, res, next) => {
  try {
    const { teacherId, studentId } = req.body;

    // Validate teacher has Teacher role
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    if (teacher.role !== 'Teacher') {
      return res.status(400).json({
        success: false,
        message: 'Invalid role: User must have Teacher role'
      });
    }

    // Validate student has Student role
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Student not found'
      });
    }
    if (student.role !== 'Student') {
      return res.status(400).json({
        success: false,
        message: 'Invalid role: User must have Student role'
      });
    }

    // Check for duplicate assignment
    const existingAssignment = await TeacherAssignment.findOne({
      teacher_id: teacherId,
      student_id: studentId
    });

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message: 'Teacher assignment already exists'
      });
    }

    // Create assignment
    const assignment = new TeacherAssignment({
      teacher_id: teacherId,
      student_id: studentId
    });

    await assignment.save();

    logger.info(`Teacher assignment created: Teacher ${teacherId} -> Student ${studentId}`);

    res.status(201).json({
      success: true,
      message: 'Teacher assignment created successfully',
      assignment: {
        id: assignment._id,
        teacherId: assignment.teacher_id,
        studentId: assignment.student_id,
        createdAt: assignment.created_at
      }
    });
  } catch (error) {
    logger.error('Error creating teacher assignment:', error);
    next(error);
  }
};

/**
 * Delete teacher assignment
 * DELETE /api/links/teacher-student/:id
 * Requirements: 24.5
 */
exports.deleteTeacherAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await TeacherAssignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Teacher assignment not found'
      });
    }

    await TeacherAssignment.findByIdAndDelete(id);

    logger.info(`Teacher assignment deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Teacher assignment deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting teacher assignment:', error);
    next(error);
  }
};

/**
 * Get teacher assignments
 * GET /api/links/teacher-student
 * Requirements: 6.2, 7.1
 */
exports.getTeacherAssignments = async (req, res, next) => {
  try {
    const { teacherId, studentId } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Build query based on role
    let query = {};

    if (userRole === 'Admin') {
      // Admin can filter by teacherId or studentId
      if (teacherId) query.teacher_id = teacherId;
      if (studentId) query.student_id = studentId;
    } else if (userRole === 'Teacher') {
      // Teacher can only see their own assignments
      query.teacher_id = userId;
    } else {
      // Other roles not allowed
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Admin and Teacher roles can access this resource.'
      });
    }

    const assignments = await TeacherAssignment.find(query)
      .populate('teacher_id', 'first_name last_name email mobile role')
      .populate('student_id', 'first_name last_name email mobile role')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      assignments: assignments.map(assignment => ({
        id: assignment._id,
        teacher: {
          id: assignment.teacher_id._id,
          first_name: assignment.teacher_id.first_name,
          last_name: assignment.teacher_id.last_name,
          email: assignment.teacher_id.email,
          mobile: assignment.teacher_id.mobile,
          role: assignment.teacher_id.role
        },
        student: {
          id: assignment.student_id._id,
          first_name: assignment.student_id.first_name,
          last_name: assignment.student_id.last_name,
          email: assignment.student_id.email,
          mobile: assignment.student_id.mobile,
          role: assignment.student_id.role
        },
        createdAt: assignment.created_at
      }))
    });
  } catch (error) {
    logger.error('Error fetching teacher assignments:', error);
    next(error);
  }
};
