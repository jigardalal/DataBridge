const mongoose = require('mongoose');

const processedDataSchema = new mongoose.Schema({
  rawFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawFile',
    required: true,
  },
  processedContent: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  aiAnalysisResults: {
    type: mongoose.Schema.Types.Mixed,
  },
  schemaMappingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MappingDictionary',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ProcessedData', processedDataSchema);