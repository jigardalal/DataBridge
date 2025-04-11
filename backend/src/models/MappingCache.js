const mongoose = require('mongoose');

const mappingCacheSchema = new mongoose.Schema({
  dataCategory: {
    type: String,
    required: true,
    index: true
  },
  inputFields: {
    type: [String],
    required: true
  },
  mappings: [{
    input_field: String,
    output_field: String,
    confidence: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Cache expires after 7 days
  }
});

// Create a compound index for faster lookups
mappingCacheSchema.index({ dataCategory: 1, inputFields: 1 });

// Check if the model is already registered to prevent duplicate model errors
const MappingCache = mongoose.models.MappingCache || mongoose.model('MappingCache', mappingCacheSchema);

module.exports = MappingCache; 