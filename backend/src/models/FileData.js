const mongoose = require('mongoose');

const fileDataSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['xlsx', 'xls', 'csv']
  },
  data: {
    type: Array,
    required: true
  },
  columnHeaders: {
    type: Array,
    required: true
  },
  rowCount: {
    type: Number,
    required: true
  },
  totalRowsBeforeFiltering: {
    type: Number,
    required: true
  },
  blankRowsRemoved: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
fileDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if the model is already registered to prevent duplicate model errors
const FileData = mongoose.models.FileData || mongoose.model('FileData', fileDataSchema);

module.exports = FileData; 