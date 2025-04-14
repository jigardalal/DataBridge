const mongoose = require('mongoose');

const mappingSchema = new mongoose.Schema({
  input_field: { type: String, required: true },
  output_field: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1, required: true },
  transformation_type: {
    type: String,
    enum: ['none', 'concatenate', 'substring', 'arithmetic', 'conditional', 'custom'],
    default: 'none'
  },
  transformation_logic: { type: String, default: null }
}, { _id: false });

const userMappingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dataCategory: {
    type: String,
    required: true,
    trim: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileData',
    required: true
  },
  mappings: [mappingSchema],
  targetFields: [{
    name: { type: String, required: true },
    type: { type: String },
    required: { type: Boolean, default: false },
    description: { type: String }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserMapping', userMappingSchema);
