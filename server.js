const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const systemRoutes = require('./routes/systemRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { authenticateToken, requireAdmin } = require('./middleware/authMiddleware');

dotenv.config();

const app = express();
app.use(express.json()); // For parsing application/json
app.use(cors()); // Enabling CORS for all routes

const PORT = process.env.PORT || 3000;

// Rate Limiter (to prevent abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', authenticateToken, fileRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/admin', authenticateToken, requireAdmin, adminRoutes);
app.use('/api/system', authenticateToken, requireAdmin, systemRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
