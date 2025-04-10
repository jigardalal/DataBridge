const mongoose = require('mongoose');

const mappingOptionsSchema = new mongoose.Schema({
  dataCategory: {
    type: String,
    required: true,
    unique: true
  },
  fields: {
    type: [String],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MappingOptions', mappingOptionsSchema);
