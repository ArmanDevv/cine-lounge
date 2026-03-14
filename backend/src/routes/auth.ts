import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Register endpoint hit. Body:', req.body);
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Username, email, and password are required' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        message: 'Username must be at least 3 characters' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isOnline: user.isOnline,
        createdAt: user.createdAt,
        subscription: user.subscription,
      },
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error', stack: error.stack });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isOnline: user.isOnline,
        createdAt: user.createdAt,
        subscription: user.subscription,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    // For JWT, logout is handled client-side by removing the token
    // In a more complex setup, you might want to blacklist tokens
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user (protected route)
router.get('/me', async (req, res) => {
  try {
    // This will be protected by middleware later
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isOnline: user.isOnline,
      createdAt: user.createdAt,
      subscription: user.subscription,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Get all users (admin only)
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (admin only)
router.patch('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Save watch progress
router.post('/watch-history', authenticate, async (req, res) => {
  try {
    const { movieId, progress } = req.body;
    const userId = (req as any).userId;

    if (!movieId || progress === undefined) {
      return res.status(400).json({ message: 'movieId and progress are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find or create watch history entry
    const existingEntry = user.watchHistory.find(
      h => h.movieId.toString() === movieId
    );

    if (existingEntry) {
      existingEntry.progress = progress;
      existingEntry.lastWatched = new Date();
    } else {
      user.watchHistory.push({
        movieId,
        progress,
        lastWatched: new Date(),
      });
    }

    await user.save();

    res.json({
      message: 'Watch progress saved',
      watchHistory: user.watchHistory,
    });
  } catch (error: any) {
    console.error('Watch history save error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get user's watch history
router.get('/watch-history', authenticate, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const user = await User.findById(userId).populate({
      path: 'watchHistory.movieId',
      select: '_id title description genre thumbnailUrl videoUrl',
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform response to match frontend expectations
    const watchHistory = user.watchHistory.map(h => ({
      movieId: h.movieId._id,
      movie: h.movieId,
      progress: h.progress,
      lastWatched: h.lastWatched,
    }));

    res.json(watchHistory);
  } catch (error: any) {
    console.error('Watch history fetch error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

export default router;