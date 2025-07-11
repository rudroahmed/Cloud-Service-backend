const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID, // Your AWS Access Key
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS Secret Key
    AWS_REGION: process.env.AWS_REGION || 'us-east-1', // AWS Region
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME, // S3 Bucket Name
};
