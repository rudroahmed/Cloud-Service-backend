const File = require('../models/file');
const User = require('../models/user');

// Storage Usage Analytics
exports.storageUsageForUser = async (req, res) => {
  try {
    // Calculate total storage used by the system (in bytes)
    const totalStorage = await File.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]);

    const storageUsed = totalStorage[0] ? totalStorage[0].totalSize : 0;

    // You can set a dynamic storage limit here, for example, from the system settings.
    const storageLimit = 1073741824; // 1 GB limit, change as needed

    res.json({
      storageUsed,
      storageLimit,
      remainingStorage: storageLimit - storageUsed,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching storage usage' });
  }
};

// File Type Analytics
exports.fileTypesForUser = async (req, res) => {
  try {
    const userID = req.userId;

    // Step 1: Fetch all files for the given user (with optional filters like file type, date, etc.)
    const files = await File.find({
      owner: userID,  // Ensure the `owner` field matches the user
      // You can add more filters here (e.g., date range, file type, etc.)
    });

    // Step 2: Perform in-memory aggregation (group by file type, count, sum size)
    const fileTypes = files.reduce((acc, file) => {
      const { type, size } = file;
      if (!acc[type]) {
        acc[type] = { count: 0, totalSize: 0 };
      }
      acc[type].count += 1;
      acc[type].totalSize += size;
      return acc;
    }, {});

    // Convert the result into an array of objects for easy response
    const result = Object.keys(fileTypes).map((type) => ({
      _id: type,
      count: fileTypes[type].count,
      totalSize: fileTypes[type].totalSize,
    }));

    // Step 3: Sort by the count of files (descending)
    result.sort((a, b) => b.count - a.count);

    // Send the aggregated file types data as a response
    res.json({ fileTypes: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching file type analytics' });
  }
};

// User Activity Analytics
exports.userActivityForUser = async (req, res) => {
  const { startDate, endDate } = req.query; // Optional date range
  const userID = req.userId; // Get user ID from request (assume it's authenticated)

  try {
    // Step 1: Fetch files for the user based on the date range
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      dateFilter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }; // Default to last 30 days
    }

    // Fetch files related to the user
    const userFiles = await File.find({
      owner: userID, // Match files for the specific user
      ...dateFilter, // Apply the date filter
    });

    // Step 2: Perform in-memory aggregation
    const activities = userFiles.map((file) => ({
      action: 'File Upload', // Assuming file uploads; you can customize this as needed
      user: file.owner.name, // You can use user details here if required
      fileName: file.name,
      timestamp: file.createdAt,
      fileSize: file.size,
    }));

    // Step 3: Send the result as JSON response
    res.json({ activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user activity analytics' });
  }
};