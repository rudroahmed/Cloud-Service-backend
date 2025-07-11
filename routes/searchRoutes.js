const express = require('express');
const { searchFiles, getFilters } = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Search Route - Allows searching of files based on various filters
router.get('/user', authenticateToken, searchFiles);

// Filters Route - Retrieves the available filters for file search (e.g., file types, date ranges)
router.get('/filters', authenticateToken, getFilters);

module.exports = router;