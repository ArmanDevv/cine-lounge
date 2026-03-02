import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin.routes';
import moviesRoutes from './routes/movies.routes';
import groupRoutes from './routes/group.routes';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/groups', groupRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cine-lounge')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join group room
  socket.on('join_group', (groupId: string) => {
    socket.join(`group:${groupId}`);
    console.log(`User ${socket.id} joined group ${groupId}`);
    io.to(`group:${groupId}`).emit('user_joined', { userId: socket.handshake.query.userId });
  });

  // Leave group room
  socket.on('leave_group', (groupId: string) => {
    socket.leave(`group:${groupId}`);
    console.log(`User ${socket.id} left group ${groupId}`);
    io.to(`group:${groupId}`).emit('user_left', { userId: socket.handshake.query.userId });
  });

  // Chat event
  socket.on('send_message', (data: { groupId: string; message: string; userId: string; username: string; avatar: string }) => {
    io.to(`group:${data.groupId}`).emit('receive_message', {
      userId: data.userId,
      username: data.username,
      avatar: data.avatar,
      message: data.message,
      timestamp: new Date(),
    });
  });

  // Video sync events
  socket.on('video_play', (data: { groupId: string; timestamp: number }) => {
    io.to(`group:${data.groupId}`).emit('video_play', {
      timestamp: data.timestamp,
      userId: socket.handshake.query.userId,
    });
  });

  socket.on('video_pause', (data: { groupId: string; timestamp: number }) => {
    io.to(`group:${data.groupId}`).emit('video_pause', {
      timestamp: data.timestamp,
      userId: socket.handshake.query.userId,
    });
  });

  socket.on('video_seek', (data: { groupId: string; timestamp: number }) => {
    io.to(`group:${data.groupId}`).emit('video_seek', {
      timestamp: data.timestamp,
      userId: socket.handshake.query.userId,
    });
  });

  // Playlist updated event
  socket.on('playlist_updated', (data: { groupId: string }) => {
    io.to(`group:${data.groupId}`).emit('playlist_updated', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});