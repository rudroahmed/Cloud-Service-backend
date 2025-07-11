const File = require('../models/file');

// Search Files
exports.searchFiles = async (req, res) => {
  const userID = req.userId; // Get the current user's ID from the request
  const { q, fileTypes, dateRange, sizeRange, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;

  const searchQuery = { owner: userID };  // Ensure we match files that belong to the current user

  // Adding search term filter (search by file name)
  if (q) {
    // Trim query and create regex for the beginning of the name
    searchQuery.name = { 
      $regex: `^${q.trim()}`,  // Ensure we match the start of the file name with the trimmed query
      $options: 'i'  // Case-insensitive search
    }; // Log the regex pattern used for the search
  }

  // Adding file types filter (e.g., image, document)
  if (fileTypes) {
    searchQuery.type = { $regex: fileTypes, $options: 'i' };  // File types matched in MIME type
  }

  // Adding date range filter (e.g., today, last week, last month)
  if (dateRange) {
    const dateFilter = getDateRangeFilter(dateRange);
    if (dateFilter) {
      searchQuery.createdAt = { $gte: dateFilter.start, $lte: dateFilter.end };
    }
  }

  // Adding size range filter
  if (sizeRange) {
    const sizeFilter = getSizeRangeFilter(sizeRange);
    if (sizeFilter) {
      searchQuery.size = { $gte: sizeFilter.min, $lte: sizeFilter.max };
    }
  }

  try {
    // Perform the search query on the File collection
    const files = await File.find(searchQuery)
      .skip((page - 1) * limit)  // Pagination
      .limit(parseInt(limit))  // Limit to the number of files per page
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });  // Sorting based on query parameters

    const totalFiles = await File.countDocuments(searchQuery);  // Get the total number of files for pagination

    res.json({
      files,
      total: totalFiles,
      page,
      limit,
    });
  } catch (err) {
    console.error('Error searching files:', err);  // Log error
    res.status(500).json({ message: 'Error searching files' });
  }
};


// Function to handle the date range filter
const getDateRangeFilter = (range) => {
  const today = new Date();
  let startDate = new Date();
  let endDate = today;

  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);  // Start of today
      break;
    case 'week':
      startDate.setDate(today.getDate() - 7);  // 7 days ago
      break;
    case 'month':
      startDate.setMonth(today.getMonth() - 1);  // 1 month ago
      break;
    case 'year':
      startDate.setFullYear(today.getFullYear() - 1);  // 1 year ago
      break;
    default:
      return null;  // If no valid range, return null
  }

  return { start: startDate, end: endDate };
};

// Function to handle the size range filter
const getSizeRangeFilter = (range) => {
  switch (range) {
    case 'small':
      return { min: 0, max: 1048576 };  // Less than 1MB (in bytes)
    case 'medium':
      return { min: 1048576, max: 10485760 };  // Between 1MB and 10MB (in bytes)
    case 'large':
      return { min: 10485760, max: 104857600 };  // Between 10MB and 100MB (in bytes)
    case 'xlarge':
      return { min: 104857600, max: Infinity };  // Greater than 100MB
    default:
      return null;  // If no valid range, return null
  }
};

// Get Filters (e.g., available file types, date ranges, etc.)
exports.getFilters = async (req, res) => {
  try {
    // Fetch distinct file types for filtering
    const fileTypes = await File.distinct('type');
    const dateRanges = ['today', 'week', 'month', 'year']; // Static ranges (can be dynamic if needed)
    const sizeRanges = [
      { label: 'Small (0-1MB)', value: '0,1048576' }, // 1MB
      { label: 'Medium (1-10MB)', value: '1048576,10485760' }, // 1MB to 10MB
      { label: 'Large (10MB-100MB)', value: '10485760,104857600' }, // 10MB to 100MB
      { label: 'X-Large (>100MB)', value: '104857600,' }, // Greater than 100MB
    ];

    res.json({
      fileTypes,
      dateRanges,
      sizeRanges,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching filters' });
  }
};