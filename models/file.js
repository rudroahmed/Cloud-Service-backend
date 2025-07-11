const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },   // File name
  path: { type: String, required: true },   // File path on the server
  size: { type: Number, required: true },   // File size in bytes
  type: { type: String, required: true },   // MIME type (e.g., image/png, application/pdf)
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to the user who uploaded the file
  downloadCount: { type: Number, default: 0 },  // Track the number of downloads
}, { timestamps: true }); // Automatically add createdAt and updatedAt fields

module.exports = mongoose.model('File', fileSchema);