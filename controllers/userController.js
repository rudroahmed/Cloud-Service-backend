const User = require('../models/user');
const bcrypt = require('bcryptjs');

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    // Fetch the current user using the userId from the JWT token
    const user = await User.findById(req.userId).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      suspended: user.suspended,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user' });
  }
};

// Update User Profile
exports.updateUser = async (req, res) => {
  const { name, email } = req.body;

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user profile with the provided data
    user.name = name || user.name;
    user.email = email || user.email;

    // Save the updated user information
    await user.save();

    res.json({
      message: 'User profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user profile' });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash the new password and save it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error changing password' });
  }
};

// Update User Settings (e.g., preferences, notifications, etc.)
exports.updateSettings = async (req, res) => {
  const { darkMode, emailNotifications, autoBackup } = req.body;

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user settings
    user.settings = {
      darkMode: darkMode || user.settings.darkMode,
      emailNotifications: emailNotifications || user.settings.emailNotifications,
      autoBackup: autoBackup || user.settings.autoBackup,
    };

    // Save the updated settings
    await user.save();

    res.json({
      message: 'Settings updated successfully',
      settings: user.settings,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating settings' });
  }
};

// Delete Account
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user account
    await User.findByIdAndDelete(req.userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting account' });
  }
};