import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar: string;
  bio?: string;
  role: 'user' | 'admin' | 'moderator';
  isOnline: boolean;
  watchHistory: Array<{
    movieId: mongoose.Types.ObjectId;
    progress: number;
    lastWatched: Date;
  }>;
  createdAt: Date;
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  },
  bio: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  watchHistory: [
    {
      movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
      },
      progress: {
        type: Number,
        default: 0, // percentage 0-100
      },
      lastWatched: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, {
  timestamps: true,
});

export default mongoose.model<IUser>('User', userSchema);