const User = require('../models/user');
const File = require('../models/file');

// Get Admin Stats (e.g., total users, total storage, etc.)
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFiles = await File.countDocuments();
    const totalStorage = await File.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ]);
    const activeUsers = await User.countDocuments({ suspended: false });

    res.json({
      totalUsers,
      totalFiles,
      totalStorage: totalStorage[0] ? totalStorage[0].totalSize : 0,
      activeUsers,
      storageUsed: totalStorage[0] ? totalStorage[0].totalSize : 0,
      storageLimit: 1073741824, // 1GB limit for example, can be dynamic
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

// Get Users (with pagination and filtering)
exports.getUsers = async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;

  try {
    const query = { name: { $regex: search, $options: 'i' } }; // Case-insensitive search

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.json({
      users,
      total: totalUsers,
      page,
      limit,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get Activity Logs (e.g., file uploads, user actions)
exports.getActivity = async (req, res) => {
  try {
    // Here, you would track activity logs in your system, possibly in a separate collection.
    // This is a placeholder for activity logs fetching (for simplicity, assuming File uploads).
    const activities = await File.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          action: 'File Upload',
          user: '$userDetails.name',
          fileName: '$name',
          timestamp: '$createdAt',
        },
      },
    ]);

    res.json({ activities });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching activity logs' });
  }
};

// Suspend User (Prevents a user from accessing their account)
exports.suspendUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set user suspended to true
    user.suspended = true;
    await user.save();

    res.json({ message: `User ${user.name} suspended successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Error suspending user' });
  }
};

// Activate User (Re-enables a user’s account)
exports.activateUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set user suspended to false
    user.suspended = false;
    await user.save();

    res.json({ message: `User ${user.name} activated successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Error activating user' });
  }
};

// Delete User (Permanently deletes a user and their files)
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all files associated with the user
    await File.deleteMany({ owner: userId });

    // Delete the user from the database
    await User.findByIdAndDelete(userId);

    res.json({ message: `User ${user.name} deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};