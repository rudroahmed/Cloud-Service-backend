const express = require('express');
const { systemInfo, systemHealth, backup, logs } = require('../controllers/systemController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// System routes - protected with authentication and admin role check
router.get('/info', authenticateToken, requireAdmin, systemInfo);
router.get('/health', authenticateToken, requireAdmin, systemHealth);
router.post('/backup', authenticateToken, requireAdmin, backup);
router.get('/logs', authenticateToken, requireAdmin, logs);

module.exports = router;