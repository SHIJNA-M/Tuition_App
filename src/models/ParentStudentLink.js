const mongoose = require('mongoose');

const parentStudentLinkSchema = new mongoose.Schema({
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Parent ID is required']
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
parentStudentLinkSchema.index({ parent_id: 1 });
parentStudentLinkSchema.index({ student_id: 1 });
parentStudentLinkSchema.index({ parent_id: 1, student_id: 1 }, { unique: true });

const ParentStudentLink = mongoose.model('ParentStudentLink', parentStudentLinkSchema);

module.exports = ParentStudentLink;
