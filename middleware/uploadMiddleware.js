const multer = require('multer');
const path = require('path');

// Setup storage configuration for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the folder where the files will be uploaded
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Use the original file name and add a timestamp for uniqueness
    cb(null, Date.now() + path.extname(file.originalname)); // Adds timestamp to filename
  }
});

const upload = multer({ storage });

module.exports = upload;