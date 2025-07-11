const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role, suspended: user.suspended }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send the token and user info as response
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        suspended: user.suspended,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Register
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send the token and user info as response
    res.status(201).json({
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    // Fetch the user from the database using the userId from the token
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    

    // Send the user details as response
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Generate a new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// Logout
exports.logout = (req, res) => {
  try {
    // To log out, the client must simply delete the JWT token on the client-side (e.g., in localStorage or cookies).
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};