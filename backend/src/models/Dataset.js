const mongoose = require('mongoose');

// Define the mapping schema
const mappingSchema = new mongoose.Schema({
  input_field: { type: String, required: true },
  output_field: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1, required: true },
  transformation_type: {
    type: String,
    enum: ['none', 'concatenate', 'substring', 'arithmetic', 'conditional', 'custom', 'ai'],
    default: 'none'
  },
  transformation_logic: { type: String },
  ai_prompt: { type: String }
}, { _id: false });

// Define the target field schema
const targetFieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String },
  required: { type: Boolean, default: false },
  description: { type: String }
}, { _id: false });

const datasetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileId: {
    type: String,
    get: function() {
      // If fileId is not set, use fileUrl as a fallback
      return this._fileId || this.fileUrl;
    },
    set: function(val) {
      this._fileId = val;
    }
  },
  fileName: {
    type: String
  },
  dataCategory: {
    type: String
  },
  // Support both legacy object format and new array format
  mappings: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  // Add explicit targetFields array
  targetFields: {
    type: [targetFieldSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
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

module.exports = mongoose.model('Dataset', datasetSchema);
