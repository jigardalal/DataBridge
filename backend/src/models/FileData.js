const mongoose = require('mongoose');

const fileDataSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['xlsx', 'xls', 'csv'],
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  data: {
    type: [mongoose.Schema.Types.Mixed],
    required: true
  },
  rowCount: {
    type: Number,
    required: true
  },
  columnHeaders: {
    type: [String],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('FileData', fileDataSchema); 