const mongoose = require('mongoose');

const conceptSchema = new mongoose.Schema({
  chapter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: [true, 'Chapter ID is required']
  },
  name: {
    type: String,
    required: [true, 'Concept name is required'],
    trim: true,
    minlength: [2, 'Concept name must be at least 2 characters'],
    maxlength: [100, 'Concept name must not exceed 100 characters']
  },
  explanation: {
    type: String,
    required: [true, 'Explanation is required'],
    trim: true,
    maxlength: [5000, 'Explanation must not exceed 5000 characters']
  },
  practice_questions: {
    type: [String],
    default: []
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
conceptSchema.index({ chapter_id: 1 });
conceptSchema.index({ chapter_id: 1, name: 1 }, { unique: true });

// Pre-save hook to update timestamps
conceptSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Concept = mongoose.model('Concept', conceptSchema);

module.exports = Concept;
