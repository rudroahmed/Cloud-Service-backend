const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticateToken = (req, res, next) => {
    
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireAdmin = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (user && user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };