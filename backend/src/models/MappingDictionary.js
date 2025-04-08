const mongoose = require('mongoose');

const mappingEntrySchema = new mongoose.Schema({
  inputField: { type: String, required: true },
  outputField: { type: String, required: true },
  confidenceScore: { type: Number, min: 0, max: 1 },
  isConfirmed: { type: Boolean, default: false },
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
