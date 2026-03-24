const mongoose = require('mongoose');

const teacherAssignmentSchema = new mongoose.Schema({
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
teacherAssignmentSchema.index({ teacher_id: 1 });
teacherAssignmentSchema.index({ student_id: 1 });
teacherAssignmentSchema.index({ teacher_id: 1, student_id: 1 }, { unique: true });

const TeacherAssignment = mongoose.model('TeacherAssignment', teacherAssignmentSchema);

module.exports = TeacherAssignment;
