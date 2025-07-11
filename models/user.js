const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  suspended: { type: Boolean, default: false },
  settings: {
    darkMode: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    autoBackup: { type: Boolean, default: true },
  },
});

module.exports = mongoose.model('User', userSchema);