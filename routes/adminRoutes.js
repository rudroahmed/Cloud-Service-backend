const express = require('express');
const { getStats, getUsers, getActivity, suspendUser, activateUser, deleteUser } = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin routes - protected with authentication and admin role check
router.get('/stats', authenticateToken, requireAdmin, getStats);
router.get('/users', authenticateToken, requireAdmin, getUsers);
router.get('/activity', authenticateToken, requireAdmin, getActivity);
router.post('/users/:userId/suspend', authenticateToken, requireAdmin, suspendUser);
router.post('/users/:userId/activate', authenticateToken, requireAdmin, activateUser);
router.delete('/users/:userId', authenticateToken, requireAdmin, deleteUser);

module.exports = router;