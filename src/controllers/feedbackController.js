const Feedback = require('../models/Feedback');
const StudentWork = require('../models/StudentWork');
const TeacherAssignment = require('../models/TeacherAssignment');
const ParentStudentLink = require('../models/ParentStudentLink');
const logger = require('../utils/logger');

/**
 * Create feedback for student work
 * POST /api/feedback
 * Auth: Teacher only
 */
exports.createFeedback = async (req, res, next) => {
  try {
    const { workId, comment } = req.body;
    const teacherId = req.user.id;

    // Fetch the student work
    const studentWork = await StudentWork.findById(workId);
    if (!studentWork) {
      return res.status(404).json({
        success: false,
        message: 'Student work not found'
      });
    }

    // Validate teacher is assigned to the student
    const assignment = await TeacherAssignment.findOne({
      teacher_id: teacherId,
      student_id: studentWork.student_id
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this student'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      work_id: workId,
      teacher_id: teacherId,
      comment
    });

    await feedback.save();

    // Update student work review status
    studentWork.review_status = 'reviewed';
    await studentWork.save();

    logger.info(`Feedback created by teacher ${teacherId} for work ${workId}`);

    res.status(201).json({
      success: true,
      feedback: {
        id: feedback._id,
        workId: feedback.work_id,
        teacherId: feedback.teacher_id,
        comment: feedback.comment,
        createdAt: feedback.created_at
      }
    });
  } catch (error) {
    logger.error('Error creating feedback:', error);
    next(error);
  }
};

/**
 * Update feedback
 * PUT /api/feedback/:id
 * Auth: Teacher (owner only)
 */
exports.updateFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const teacherId = req.user.id;

    // Find feedback
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Validate teacher owns the feedback
    if (feedback.teacher_id.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own feedback'
      });
    }

    // Update feedback
    feedback.comment = comment;
    feedback.updated_at = Date.now();
    await feedback.save();

    logger.info(`Feedback ${id} updated by teacher ${teacherId}`);

    res.status(200).json({
      success: true,
      feedback: {
        id: feedback._id,
        workId: feedback.work_id,
        teacherId: feedback.teacher_id,
        comment: feedback.comment,
        createdAt: feedback.created_at,
        updatedAt: feedback.updated_at
      }
    });
  } catch (error) {
    logger.error('Error updating feedback:', error);
    next(error);
  }
};

/**
 * Delete feedback
 * DELETE /api/feedback/:id
 * Auth: Teacher (owner only)
 */
exports.deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    if (feedback.teacher_id.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own feedback' });
    }

    await feedback.deleteOne();

    // Revert student work status back to pending if no other feedback exists
    const remainingFeedback = await Feedback.countDocuments({ work_id: feedback.work_id });
    if (remainingFeedback === 0) {
      await StudentWork.findByIdAndUpdate(feedback.work_id, { review_status: 'pending' });
    }

    logger.info(`Feedback ${id} deleted by teacher ${teacherId}`);

    res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    logger.error('Error deleting feedback:', error);
    next(error);
  }
};

/**
 * Get feedback with role-based filtering
 * GET /api/feedback
 * Auth: Teacher, Student, Parent
 */
exports.getFeedback = async (req, res, next) => {
  try {
    const { workId, studentId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};

    // Role-based filtering
    if (userRole === 'Teacher') {
      // Teachers see their own feedback
      query.teacher_id = userId;
      
      // Apply optional filters
      if (workId) query.work_id = workId;
      if (studentId) {
        // Validate teacher is assigned to this student
        const assignment = await TeacherAssignment.findOne({
          teacher_id: userId,
          student_id: studentId
        });
        if (!assignment) {
          return res.status(403).json({
            success: false,
            message: 'You are not assigned to this student'
          });
        }
        // Get all work IDs for this student
        const studentWorks = await StudentWork.find({ student_id: studentId }).select('_id');
        const workIds = studentWorks.map(work => work._id);
        query.work_id = { $in: workIds };
      }
    } else if (userRole === 'Student') {
      // Students see feedback on their own work
      if (workId) {
        // Validate student owns this work
        const work = await StudentWork.findById(workId);
        if (!work || work.student_id.toString() !== userId) {
          return res.status(403).json({
            success: false,
            message: 'You can only view feedback on your own work'
          });
        }
        query.work_id = workId;
      } else {
        // Get all work IDs for this student
        const studentWorks = await StudentWork.find({ student_id: userId }).select('_id');
        const workIds = studentWorks.map(work => work._id);
        query.work_id = { $in: workIds };
      }
    } else if (userRole === 'Parent') {
      // Parents see feedback on linked students' work
      const links = await ParentStudentLink.find({ parent_id: userId }).select('student_id');
      const linkedStudentIds = links.map(link => link.student_id);

      if (linkedStudentIds.length === 0) {
        return res.status(200).json({
          success: true,
          feedback: []
        });
      }

      if (studentId) {
        // Validate parent is linked to this student
        if (!linkedStudentIds.some(id => id.toString() === studentId)) {
          return res.status(403).json({
            success: false,
            message: 'You are not linked to this student'
          });
        }
        // Get work IDs for this specific student
        const studentWorks = await StudentWork.find({ student_id: studentId }).select('_id');
        const workIds = studentWorks.map(work => work._id);
        query.work_id = { $in: workIds };
      } else {
        // Get all work IDs for linked students
        const studentWorks = await StudentWork.find({ 
          student_id: { $in: linkedStudentIds } 
        }).select('_id');
        const workIds = studentWorks.map(work => work._id);
        query.work_id = { $in: workIds };
      }

      if (workId) {
        // Additional filter by specific work ID
        query.work_id = workId;
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Fetch feedback with populated fields
    const feedback = await Feedback.find(query)
      .populate('work_id', 'student_id subject_id concept_id file_url review_status uploaded_at')
      .populate('teacher_id', 'first_name last_name email')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      feedback
    });
  } catch (error) {
    logger.error('Error fetching feedback:', error);
    next(error);
  }
};
