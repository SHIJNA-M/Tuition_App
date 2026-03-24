const mongoose = require('mongoose');

const studentWorkSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required']
  },
  concept_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concept',
    required: [true, 'Concept ID is required']
  },
  file_url: {
    type: String,
    required: [true, 'File URL is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  file_name: {
    type: String,
    required: [true, 'File name is required']
  },
  file_size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size must be positive']
  },
  file_type: {
    type: String,
    required: [true, 'File type is required'],
    enum: {
      values: ['pdf', 'jpeg', 'png'],
      message: '{VALUE} is not a valid file type'
    }
  },
  review_status: {
    type: String,
    enum: {
      values: ['pending', 'reviewed'],
      message: '{VALUE} is not a valid review status'
    },
    default: 'pending'
  },
  uploaded_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
studentWorkSchema.index({ student_id: 1 });
studentWorkSchema.index({ subject_id: 1 });
studentWorkSchema.index({ concept_id: 1 });
studentWorkSchema.index({ review_status: 1 });
studentWorkSchema.index({ student_id: 1, uploaded_at: -1 }); // Compound index for recent work queries

const StudentWork = mongoose.model('StudentWork', studentWorkSchema);

module.exports = StudentWork;
