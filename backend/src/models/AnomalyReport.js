const mongoose = require('mongoose');

const anomalyReportSchema = new mongoose.Schema({
  processedDataId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcessedData',
    required: true,
  },
  rawFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawFile',
    required: true,
  },
  anomalyType: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  fieldName: {
    type: String,
  },
  rowNumber: {
    type: Number,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['reported', 'acknowledged', 'resolved', 'ignored'],
    default: 'reported',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AnomalyReport', anomalyReportSchema);
