const mongoose = require('mongoose');

const rawFileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
  },
  storageUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
    trim: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  uploadStatus: {
    type: String,
    enum: ['pending', 'uploaded', 'failed'],
    default: 'pending',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('RawFile', rawFileSchema);