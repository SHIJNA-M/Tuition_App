const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Board name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Board name must be at least 2 characters'],
    maxlength: [100, 'Board name must not exceed 100 characters']
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
boardSchema.index({ name: 1 }, { unique: true });

// Pre-save hook to update timestamps
boardSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;
