const File = require('../models/file');
const upload = require('../middleware/uploadMiddleware');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const config = require('../config');

AWS.config.update({
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  region: config.AWS_REGION,
});

const s3 = new AWS.S3();

// Upload File
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const fileStream = fs.createReadStream(file.path);

    // Upload parameters for S3
    const uploadParams = {
      Bucket: config.S3_BUCKET_NAME, // Your S3 bucket name
      Key: `${req.userId}/${file.originalname}`, // File path in the bucket
      Body: fileStream,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    console.log("Uploading to S3 Bucket:", config.S3_BUCKET_NAME);

    // Upload the file to S3
    const s3UploadResponse = await s3.upload(uploadParams).promise();

    // Create a new file record in the database with S3 URL
    const newFile = new File({
      name: file.originalname,
      path: s3UploadResponse.Location, // S3 file URL
      size: file.size,
      type: file.mimetype,
      owner: req.userId, // The user ID who owns this file
    });

    await newFile.save(); // Save file metadata in the DB

    // Optionally delete the local file after uploading it to S3
    fs.unlinkSync(file.path);

    // Return the file details in the response
    res.status(201).json({
      _id: newFile._id,
      name: newFile.name,
      size: newFile.size,
      type: newFile.type,
      url: s3UploadResponse.Location, // Return S3 URL
      message: 'File uploaded successfully',
    });

  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ message: 'File upload failed', error: err });
  }
};

// Get Files
exports.getFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.userId }).exec(); // Get files for the authenticated user

    if (!files.length) {
      return res.status(404).json({ message: 'No files found' });
    }

    res.json({
      files: files,
      total: files.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching files' });
  }
};

// Get File Details
exports.getFileDetails = async (req, res) => {
  try {
    // Fetch the file by its ID
    const file = await File.findById(req.params.id)
      .populate('owner', 'id name email') // Populate owner details (id, name, email)
      .exec();

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if the file belongs to the authenticated user
    if (file.owner._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not have permission to view this file' });
    }

    // Build the file details response
    const fileDetails = {
      _id: file._id.toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      createdAt: file.createdAt.toISOString(), // Convert date to string format
      updatedAt: file.updatedAt.toISOString(), // Convert date to string format
      owner: {
        id: file.owner._id.toString(),  // Ensure owner ID is returned as a string
        name: file.owner.name,
        email: file.owner.email,
      },
      checksum: file.checksum || undefined, // Optional field
      downloadCount: file.downloadCount || undefined, // Optional field
    };

    // Send the file details as JSON
    res.json(fileDetails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching file details' });
  }
};

// Delete File
exports.deleteFile = async (req, res) => {
  try {
    // Find the file record in the database
    const file = await File.findById(req.params.id).exec();

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if the file belongs to the authenticated user
    if (file.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this file' });
    }

    // Extract the S3 key from the file path (strip out the URL prefix)
    const fileKey = file.path.replace(`https://cloud-vault-bubt.s3.ap-south-1.amazonaws.com/`, '');

    // Delete the file from S3
    const deleteParams = {
      Bucket: config.S3_BUCKET_NAME,  // The name of your S3 bucket
      Key: fileKey,  // The key (file path) in your S3 bucket
    };

    // Log the params to make sure they are correct
    console.log("Deleting from S3 with params:", deleteParams);

    const result = await s3.deleteObject(deleteParams).promise(); // Deletes the file from S3

    // Check the result of the deletion
    if (result.DeleteMarker) {
      console.log(`Successfully deleted file from S3: ${deleteParams.Key}`);
    } else {
      console.error(`Failed to delete file from S3: ${deleteParams.Key}`);
    }

    // Delete the file record from the database
    await File.findByIdAndDelete(req.params.id);

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Error deleting file:', err);  // Log the full error
    res.status(500).json({ message: 'Error deleting file' });
  }
};

// Download File
// Download File
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).exec();

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if the file belongs to the authenticated user
    if (file.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not have permission to download this file' });
    }

    // Increment download count
    file.downloadCount += 1;
    await file.save();

    // Generate a pre-signed URL to download the file from S3
    const s3Params = {
      Bucket: config.S3_BUCKET_NAME,
      Key: file.path.split("/").slice(-1)[0], // Extracting the file name from the S3 URL
      Expires: 60 * 5, // URL expiration time (e.g., 5 minutes)
    };

    const signedUrl = s3.getSignedUrl('getObject', s3Params);

    // Return the pre-signed URL to the client
    res.json({
      downloadUrl: signedUrl,
    });

  } catch (err) {
    console.error("Error downloading file:", err);
    res.status(500).json({ message: 'Error downloading file' });
  }
};

// Update File Metadata
exports.updateFile = async (req, res) => {
  try {
    const { name } = req.body;
    const file = await File.findById(req.params.id).exec();

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if the file belongs to the authenticated user
    if (file.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not have permission to update this file' });
    }

    file.name = name || file.name;
    await file.save();

    res.json({ message: 'File metadata updated successfully', file });
  } catch (err) {
    res.status(500).json({ message: 'Error updating file metadata' });
  }
};

// Share File (Optional: For simplicity, this just generates a shareable link)
exports.shareFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).exec();

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if the file belongs to the authenticated user
    if (file.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'You do not have permission to share this file' });
    }

    // Generate a shareable link (this can be adjusted to your needs, like adding expiration or permissions)
    const fileLink = `${process.env.APP_URL}/api/files/${file._id}/download`;

    res.json({
      message: 'File shared successfully',
      link: fileLink,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error sharing file' });
  }
};