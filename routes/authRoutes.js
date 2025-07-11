const express = require('express');
const { login, register, getCurrentUser, refreshToken, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

module.exports = router;