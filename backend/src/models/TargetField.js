const mongoose = require('mongoose');

const targetFieldSchema = new mongoose.Schema({
  dataCategory: {
    type: String,
    required: true,
    trim: true
  },
  fields: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['string', 'number', 'boolean', 'date']
    },
    required: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      default: ''
    },
    validation: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  }]
}, {
  timestamps: true
});

// Remove any existing indexes that might cause conflicts
targetFieldSchema.indexes = [];

const TargetField = mongoose.model('TargetField', targetFieldSchema);

module.exports = TargetField; 