const express = require('express');
const { storageUsageForAdmin, storageUsageForUser, fileTypesForAdmin, fileTypesForUser, userActivityForAdmin, userActivityForUser } = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// For users:
router.get('/user/storage-usage', authenticateToken, storageUsageForUser); // User-specific storage usage
router.get('/user/file-types', authenticateToken, fileTypesForUser); // User-specific file type analytics
router.get('/user/user-activity', authenticateToken, userActivityForUser); // User-specific activity analytics

// // For admin (existing, unchanged):
// router.get('/admin/storage-usage', authenticateToken, requireAdmin, storageUsageForAdmin); // Admin storage usage
// router.get('/admin/file-types', authenticateToken, requireAdmin, fileTypesForAdmin); // Admin file type analytics
// router.get('/admin/user-activity', authenticateToken, requireAdmin, userActivityForAdmin); // Admin activity analytics

module.exports = router;