const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  work_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentWork',
    required: [true, 'Work ID is required']
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [2000, 'Comment must not exceed 2000 characters']
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
feedbackSchema.index({ work_id: 1 });
feedbackSchema.index({ teacher_id: 1 });
feedbackSchema.index({ work_id: 1, created_at: -1 }); // Compound index for chronological feedback

// Pre-save hook to update timestamps
feedbackSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
