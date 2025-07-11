const express = require('express');
const { uploadFile, getFiles, getFileDetails, deleteFile, downloadFile, updateFile, shareFile } = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const searchRoutes = require('./searchRoutes');

const router = express.Router();

router.use('/search', authenticateToken, searchRoutes);

// Protected routes - Only authenticated users can access these
router.post('/upload', authenticateToken, upload.single('file'), uploadFile);  // Upload a new file
router.get('/', authenticateToken, getFiles);  // Get all files for the authenticated user
router.get('/:id', authenticateToken, getFileDetails);  // Get a specific file's details
router.delete('/:id', authenticateToken, deleteFile);  // Delete a specific file
router.get('/:id/download', authenticateToken, downloadFile);  // Download a specific file
router.put('/:id', authenticateToken, updateFile);  // Update metadata of a specific file
router.post('/:id/share', authenticateToken, shareFile);

module.exports = router;