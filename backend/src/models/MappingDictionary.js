const mongoose = require('mongoose');

const mappingEntrySchema = new mongoose.Schema({
  inputField: { type: String, required: true },
  outputField: { type: String, required: true },
  confidenceScore: { type: Number, min: 0, max: 1 },
  isConfirmed: { type: Boolean, default: false },
  transformationLogic: { 
    type: String,
    default: null,
    description: 'Formula or transformation logic to apply to the input field'
  },
  transformationType: {
    type: String,
    enum: ['none', 'concatenate', 'substring', 'arithmetic', 'conditional', 'custom'],
    default: 'none'
  },
  _id: false
});

const mappingDictionarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  sourceSchemaSample: {
    type: mongoose.Schema.Types.Mixed,
  },
  targetSchemaDefinition: {
    type: mongoose.Schema.Types.Mixed,
  },
  mappings: [mappingEntrySchema],
  usageCount: {
    type: Number,
    default: 0,
  },
  lastUsedAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

mappingDictionarySchema.methods.incrementUsage = function() {
  this.usageCount++;
  this.lastUsedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('MappingDictionary', mappingDictionarySchema);
