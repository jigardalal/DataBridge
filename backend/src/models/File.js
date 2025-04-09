const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  data: {
    type: Array,
    required: true
  },
  headers: {
    type: [String],
    required: true
  },
  rowCount: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['processed', 'error', 'pending'],
    default: 'processed'
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Add any instance methods here if needed
fileSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Static methods
fileSchema.statics.findByIdAndValidate = async function(id) {
  const file = await this.findById(id);
  if (!file) {
    const error = new Error('File not found');
    error.status = 404;
    throw error;
  }
  return file;
};

const File = mongoose.model('File', fileSchema);

module.exports = File; 