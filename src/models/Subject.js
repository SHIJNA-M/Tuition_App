const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  board_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: [true, 'Board ID is required']
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    minlength: [2, 'Subject name must be at least 2 characters'],
    maxlength: [100, 'Subject name must not exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must not exceed 500 characters']
  },
  active: {
    type: Boolean,
    default: true
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
subjectSchema.index({ board_id: 1 });
subjectSchema.index({ board_id: 1, name: 1 }, { unique: true });

// Pre-save hook to update timestamps
subjectSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
