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
      console.log('Missing required fields');
      return res.status(400).json({ 
        message: 'Username, email, and password are required' 
      });
    }

    if (username.length < 3) {
      console.log('Username too short:', username);
      return res.status(400).json({ 
        message: 'Username must be at least 3 characters' 
      });
    }

    if (password.length < 6) {
      console.log('Password too short');
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if user exists
    console.log('Checking for existing user with email:', email, 'or username:', username);
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('User already exists:', {
        id: existingUser._id,
        email: existingUser.email,
        username: existingUser.username,
        matchEmail: existingUser.email === email,
        matchUsername: existingUser.username === username,
      });
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken',
        field: existingUser.email === email ? 'email' : 'username'
      });
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    console.log('Creating user document...');
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();
    console.log('User saved successfully:', user._id);

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
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      console.error('Duplicate key error on field:', field);
      return res.status(400).json({ 
        message: `This ${field} is already registered`,
        field: field
      });
    }
    
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login endpoint hit. Email:', req.body.email);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user
    console.log('Finding user by email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    console.log('Verifying password for user:', user._id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', user._id);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    console.log('Generating JWT for user:', user._id);
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('Login successful for user:', user._id);
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
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
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