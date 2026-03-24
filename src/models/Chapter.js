const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required']
  },
  name: {
    type: String,
    required: [true, 'Chapter name is required'],
    trim: true,
    minlength: [2, 'Chapter name must be at least 2 characters'],
    maxlength: [100, 'Chapter name must not exceed 100 characters']
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
chapterSchema.index({ subject_id: 1 });
chapterSchema.index({ subject_id: 1, name: 1 }, { unique: true });

// Pre-save hook to update timestamps
chapterSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Chapter = mongoose.model('Chapter', chapterSchema);

module.exports = Chapter;
