const express = require('express');
const { getCurrentUser, updateUser, changePassword, updateSettings, deleteAccount } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const searchRoutes = require('./searchRoutes');

const router = express.Router();

// Protected routes - user must be authenticated
router.get('/me', authenticateToken, getCurrentUser);
router.put('/me', authenticateToken, updateUser);
router.post('/change-password', authenticateToken, changePassword);
router.put('/settings', authenticateToken, updateSettings);
router.delete('/me', authenticateToken, deleteAccount);
router.use('/search', searchRoutes);

module.exports = router;