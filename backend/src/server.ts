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
import subscriptionsRoutes from './routes/subscriptions';
import Group from './models/Group';

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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
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
app.use('/api/subscriptions', subscriptionsRoutes);

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
  socket.on('join_group', (groupId: string, userId: string) => {
    socket.join(`group:${groupId}`);
    socket.data.userId = userId;
    socket.data.groupId = groupId;
    console.log(`User ${userId} (socket: ${socket.id}) joined group ${groupId}`);
    io.to(`group:${groupId}`).emit('user_joined', { userId });
  });

  // Leave group room
  socket.on('leave_group', (groupId: string) => {
    socket.leave(`group:${groupId}`);
    console.log(`User ${socket.data.userId} (socket: ${socket.id}) left group ${groupId}`);
    io.to(`group:${groupId}`).emit('user_left', { userId: socket.data.userId });
  });

  // Chat event
  socket.on('send_message', async (data: { groupId: string; message: string; userId: string; username: string; avatar: string }) => {
    try {
      // Validate required fields
      if (!data.groupId || !data.message || !data.userId || !data.username) {
        console.error('Invalid message data:', data);
        return;
      }

      // Save message to database
      const group = await Group.findById(data.groupId);
      if (!group) {
        console.error('Group not found:', data.groupId);
        return;
      }

      // Add message to group
      group.messages.push({
        senderId: data.userId as any,
        message: data.message.trim(),
        createdAt: new Date(),
      });

      await group.save();

      // Get the populated message to send back
      const updatedGroup = await Group.findById(data.groupId)
        .select('messages')
        .populate('messages.senderId', 'username avatar');

      if (!updatedGroup || updatedGroup.messages.length === 0) {
        console.error('Failed to retrieve saved message');
        return;
      }

      // Get the last message (the one we just added)
      const savedMessage = updatedGroup.messages[updatedGroup.messages.length - 1];

      // Broadcast to all users in the group
      io.to(`group:${data.groupId}`).emit('receive_message', {
        userId: data.userId,
        username: data.username,
        avatar: data.avatar,
        message: data.message,
        timestamp: new Date().toISOString(),
      });

      console.log(`Message saved in group ${data.groupId} from user ${data.username}`);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Video sync events
  socket.on('video_play', (data: { groupId: string; timestamp: number }) => {
    io.to(`group:${data.groupId}`).emit('video_play', {
      timestamp: data.timestamp,
      userId: socket.data.userId,
    });
  });

  socket.on('video_pause', (data: { groupId: string; timestamp: number }) => {
    io.to(`group:${data.groupId}`).emit('video_pause', {
      timestamp: data.timestamp,
      userId: socket.data.userId,
    });
  });

  socket.on('video_seek', (data: { groupId: string; timestamp: number }) => {
    io.to(`group:${data.groupId}`).emit('video_seek', {
      timestamp: data.timestamp,
      userId: socket.data.userId,
    });
  });

  // Watch Party events
  socket.on('start_watch_party', (data: any) => {
    try {
      const { groupId, movie, hostId, hostUsername, hostAvatar } = data;

      if (!groupId || !movie || !hostId) {
        console.error('Invalid watch party data:', data);
        return;
      }

      socket.join(`watch_party:${groupId}`);
      console.log(`Watch party started in group ${groupId} by ${hostUsername}`);

      // Broadcast to BOTH group members (so non-watchers get notified) 
      // AND watch_party room (for synchronization)
      io.to(`group:${groupId}`).emit('watch_party_started', {
        movie,
        hostId,
        hostUsername,
        hostAvatar,
        timestamp: new Date().toISOString(),
      });

      io.to(`watch_party:${groupId}`).emit('watch_party_started', {
        movie,
        hostId,
        hostUsername,
        hostAvatar,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error starting watch party:', error);
    }
  });

  socket.on('join_watch_party', (data: any) => {
    try {
      const { groupId, userId, username, avatar, movie, hostId, hostUsername, hostAvatar } = data;

      if (!groupId || !userId) {
        console.error('Invalid watch party join data:', data);
        return;
      }

      socket.join(`watch_party:${groupId}`);
      
      // Store user info in socket data
      socket.data.userId = userId;
      socket.data.username = username;
      socket.data.avatar = avatar;
      
      console.log(`User ${username} (${userId}) joined watch party in group ${groupId}`);

      io.to(`watch_party:${groupId}`).emit('watch_party_member_joined', {
        userId,
        username,
        avatar,
        movie, // Include movie data so non-host can initialize store
        hostId, // Include host info
        hostUsername,
        hostAvatar,
      });
    } catch (error) {
      console.error('Error joining watch party:', error);
    }
  });

  socket.on('leave_watch_party', (data: any) => {
    try {
      const { groupId } = data;

      if (!groupId) {
        console.error('Invalid watch party leave data:', data);
        return;
      }

      console.log(`User ${socket.data.userId} left watch party in group ${groupId}`);

      io.to(`watch_party:${groupId}`).emit('watch_party_member_left', {
        userId: socket.data.userId,
      });

      socket.leave(`watch_party:${groupId}`);
    } catch (error) {
      console.error('Error leaving watch party:', error);
    }
  });

  socket.on('watch_party_play', (data: any) => {
    try {
      const { groupId, timestamp } = data;

      if (!groupId) {
        console.error('Invalid watch party play data:', data);
        return;
      }

      io.to(`watch_party:${groupId}`).emit('watch_party_play', {
        timestamp,
        userId: socket.data.userId,
      });
    } catch (error) {
      console.error('Error emitting watch party play:', error);
    }
  });

  socket.on('watch_party_pause', (data: any) => {
    try {
      const { groupId, timestamp } = data;

      if (!groupId) {
        console.error('Invalid watch party pause data:', data);
        return;
      }

      io.to(`watch_party:${groupId}`).emit('watch_party_pause', {
        timestamp,
        userId: socket.data.userId,
      });
    } catch (error) {
      console.error('Error emitting watch party pause:', error);
    }
  });

  socket.on('watch_party_seek', (data: any) => {
    try {
      const { groupId, timestamp } = data;

      if (!groupId) {
        console.error('Invalid watch party seek data:', data);
        return;
      }

      io.to(`watch_party:${groupId}`).emit('watch_party_seek', {
        timestamp,
        userId: socket.data.userId,
      });
    } catch (error) {
      console.error('Error emitting watch party seek:', error);
    }
  });

  socket.on('end_watch_party', (data: any) => {
    try {
      const { groupId } = data;

      if (!groupId) {
        console.error('Invalid watch party end data:', data);
        return;
      }

      console.log(`Watch party ended in group ${groupId}`);

      io.to(`watch_party:${groupId}`).emit('watch_party_ended');
      io.of('/').in(`watch_party:${groupId}`).socketsLeave(`watch_party:${groupId}`);
    } catch (error) {
      console.error('Error ending watch party:', error);
    }
  });

  socket.on('request_playback_sync', (data: any) => {
    try {
      const { groupId, userId } = data;

      if (!groupId || !userId) {
        console.error('Invalid playback sync request:', data);
        return;
      }

      console.log(`Playback sync requested by ${userId} in group ${groupId}`);

      // Broadcast the sync request so host can respond
      io.to(`watch_party:${groupId}`).emit('request_playback_sync', {
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error handling playback sync request:', error);
    }
  });

  socket.on('playback_sync_response', (data: any) => {
    try {
      const { groupId, currentTime, isPlaying } = data;

      if (!groupId) {
        console.error('Invalid playback sync response:', data);
        return;
      }

      console.log(`Host sending playback sync: ${currentTime}s, playing: ${isPlaying}`);

      io.to(`watch_party:${groupId}`).emit('playback_sync_response', {
        currentTime,
        isPlaying,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error handling playback sync response:', error);
    }
  });

  // Playlist updated event
  socket.on('playlist_updated', (data: { groupId: string }) => {
    io.to(`group:${data.groupId}`).emit('playlist_updated', data);
  });

  // Video call events
  socket.on('video_call_started', (data: any) => {
    try {
      const { groupId, initiatedBy } = data;

      if (!groupId) {
        console.error('Invalid video call started data:', data);
        return;
      }

      console.log(`Video call started in group ${groupId} by ${initiatedBy}`);

      // Broadcast to all members in the watch party room
      io.to(`watch_party:${groupId}`).emit('video_call_started', {
        initiatedBy,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error starting video call:', error);
    }
  });

  socket.on('video_call_ended', (data: any) => {
    try {
      const { groupId, initiatedBy } = data;

      if (!groupId) {
        console.error('Invalid video call ended data:', data);
        return;
      }

      console.log(`Video call ended in group ${groupId}`);

      // Broadcast to all members in the watch party room
      io.to(`watch_party:${groupId}`).emit('video_call_ended', {
        initiatedBy,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error ending video call:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});