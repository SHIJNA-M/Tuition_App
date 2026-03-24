const { User, StudentWork, Feedback, TeacherAssignment, ParentStudentLink, Board, Subject, Chapter, Concept } = require('../models');
const logger = require('../utils/logger');

/**
 * Get student dashboard
 * @route GET /api/dashboard/student
 * @access Student
 */
exports.getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Fetch all enrolled subjects (subjects with student work)
    const enrolledSubjectsData = await StudentWork.find({ student_id: studentId })
      .distinct('subject_id');
    
    const subjects = await Subject.find({ _id: { $in: enrolledSubjectsData } })
      .select('name description')
      .lean();

    // Fetch 10 most recent StudentWork uploads
    const recentWork = await StudentWork.find({ student_id: studentId })
      .sort({ uploaded_at: -1 })
      .limit(10)
      .populate('subject_id', 'name')
      .populate('concept_id', 'name')
      .select('file_url file_name review_status uploaded_at')
      .lean();

    // Calculate stats
    const totalUploads = await StudentWork.countDocuments({ student_id: studentId });
    const pendingReviews = await StudentWork.countDocuments({ 
      student_id: studentId, 
      review_status: 'pending' 
    });
    const reviewedCount = await StudentWork.countDocuments({ 
      student_id: studentId, 
      review_status: 'reviewed' 
    });
    const reviewedPercentage = totalUploads > 0 
      ? Math.round((reviewedCount / totalUploads) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      dashboard: {
        subjects,
        recentWork,
        stats: {
          totalUploads,
          pendingReviews,
          reviewedCount,
          reviewedPercentage
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching student dashboard:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Get teacher dashboard
 * @route GET /api/dashboard/teacher
 * @access Teacher
 */
exports.getTeacherDashboard = async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    // Fetch assigned students via TeacherAssignments
    const assignments = await TeacherAssignment.find({ teacher_id: teacherId })
      .populate('student_id', 'first_name last_name email')
      .lean();

    const assignedStudentIds = assignments.map(a => a.student_id._id);
    const assignedStudents = assignments.map(a => a.student_id);

    // Fetch StudentWork with pending review status for assigned students
    const pendingWork = await StudentWork.find({
      student_id: { $in: assignedStudentIds },
      review_status: 'pending'
    })
      .populate('student_id', 'first_name last_name')
      .populate('subject_id', 'name')
      .populate('concept_id', 'name')
      .sort({ uploaded_at: -1 })
      .lean();

    // Calculate pending reviews count per student
    const pendingReviewsPerStudent = await StudentWork.aggregate([
      {
        $match: {
          student_id: { $in: assignedStudentIds },
          review_status: 'pending'
        }
      },
      {
        $group: {
          _id: '$student_id',
          count: { $sum: 1 }
        }
      }
    ]);

    const pendingReviewsMap = {};
    pendingReviewsPerStudent.forEach(item => {
      pendingReviewsMap[item._id.toString()] = item.count;
    });

    // Track weak concepts per student based on feedback patterns
    const weakConcepts = await Feedback.aggregate([
      {
        $match: { teacher_id: teacherId }
      },
      {
        $lookup: {
          from: 'studentworks',
          localField: 'work_id',
          foreignField: '_id',
          as: 'work'
        }
      },
      {
        $unwind: '$work'
      },
      {
        $match: {
          'work.student_id': { $in: assignedStudentIds }
        }
      },
      {
        $group: {
          _id: {
            student_id: '$work.student_id',
            concept_id: '$work.concept_id'
          },
          feedbackCount: { $sum: 1 }
        }
      },
      {
        $match: {
          feedbackCount: { $gte: 2 }
        }
      },
      {
        $lookup: {
          from: 'concepts',
          localField: '_id.concept_id',
          foreignField: '_id',
          as: 'concept'
        }
      },
      {
        $unwind: '$concept'
      },
      {
        $project: {
          studentId: '$_id.student_id',
          conceptId: '$_id.concept_id',
          conceptName: '$concept.name',
          feedbackCount: 1
        }
      },
      {
        $sort: { feedbackCount: -1 }
      }
    ]);

    // Calculate stats
    const totalStudents = assignedStudents.length;
    const pendingReviews = pendingWork.length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reviewedToday = await Feedback.countDocuments({
      teacher_id: teacherId,
      created_at: { $gte: today }
    });

    res.status(200).json({
      success: true,
      dashboard: {
        assignedStudents: assignedStudents.map(student => ({
          ...student,
          pendingReviews: pendingReviewsMap[student._id.toString()] || 0
        })),
        pendingWork,
        stats: {
          totalStudents,
          pendingReviews,
          reviewedToday
        },
        weakConcepts
      }
    });
  } catch (error) {
    logger.error('Error fetching teacher dashboard:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Get parent dashboard
 * @route GET /api/dashboard/parent
 * @access Parent
 */
exports.getParentDashboard = async (req, res, next) => {
  try {
    const parentId = req.user.id;

    // Fetch all linked students via ParentStudentLinks
    const links = await ParentStudentLink.find({ parent_id: parentId })
      .populate('student_id', 'first_name last_name email')
      .lean();

    const linkedStudentIds = links.map(link => link.student_id._id);

    // For each linked student, fetch StudentWork, Feedback, and progress stats
    const linkedStudentsData = await Promise.all(
      links.map(async (link) => {
        const studentId = link.student_id._id;

        // Calculate stats per student
        const totalUploads = await StudentWork.countDocuments({ student_id: studentId });
        const reviewedCount = await StudentWork.countDocuments({ 
          student_id: studentId, 
          review_status: 'reviewed' 
        });
        const pendingCount = await StudentWork.countDocuments({ 
          student_id: studentId, 
          review_status: 'pending' 
        });

        // Fetch recent work (last 5)
        const recentWork = await StudentWork.find({ student_id: studentId })
          .sort({ uploaded_at: -1 })
          .limit(5)
          .populate('subject_id', 'name')
          .populate('concept_id', 'name')
          .select('file_url file_name review_status uploaded_at')
          .lean();

        // Fetch recent feedback (last 5)
        const workIds = await StudentWork.find({ student_id: studentId })
          .select('_id')
          .lean();
        
        const recentFeedback = await Feedback.find({ 
          work_id: { $in: workIds.map(w => w._id) } 
        })
          .sort({ created_at: -1 })
          .limit(5)
          .populate('teacher_id', 'first_name last_name')
          .populate({
            path: 'work_id',
            select: 'concept_id',
            populate: {
              path: 'concept_id',
              select: 'name'
            }
          })
          .select('comment created_at')
          .lean();

        return {
          studentId,
          student: link.student_id,
          stats: {
            totalUploads,
            reviewedCount,
            pendingCount
          },
          recentWork,
          recentFeedback
        };
      })
    );

    res.status(200).json({
      success: true,
      dashboard: {
        linkedStudents: linkedStudentsData
      }
    });
  } catch (error) {
    logger.error('Error fetching parent dashboard:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Get admin dashboard
 * @route GET /api/dashboard/admin
 * @access Admin
 */
exports.getAdminDashboard = async (req, res, next) => {
  try {
    // Count users by role
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const userStatsMap = {
      admins: 0,
      teachers: 0,
      students: 0,
      parents: 0
    };

    userStats.forEach(stat => {
      switch (stat._id) {
        case 'Admin':
          userStatsMap.admins = stat.count;
          break;
        case 'Teacher':
          userStatsMap.teachers = stat.count;
          break;
        case 'Student':
          userStatsMap.students = stat.count;
          break;
        case 'Parent':
          userStatsMap.parents = stat.count;
          break;
      }
    });

    // Count academic entities
    const [boardsCount, subjectsCount, chaptersCount, conceptsCount] = await Promise.all([
      Board.countDocuments(),
      Subject.countDocuments(),
      Chapter.countDocuments(),
      Concept.countDocuments()
    ]);

    // Calculate work stats
    const totalUploads = await StudentWork.countDocuments();
    const pendingReviews = await StudentWork.countDocuments({ review_status: 'pending' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reviewedToday = await StudentWork.countDocuments({
      review_status: 'reviewed',
      updated_at: { $gte: today }
    });

    res.status(200).json({
      success: true,
      dashboard: {
        userStats: userStatsMap,
        academicStats: {
          boards: boardsCount,
          subjects: subjectsCount,
          chapters: chaptersCount,
          concepts: conceptsCount
        },
        workStats: {
          totalUploads,
          pendingReviews,
          reviewedToday
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching admin dashboard:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};
