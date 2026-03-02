import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IMovie } from './Movie';

export interface IGroupMember {
  userId: IUser['_id'];
  joinedAt: Date;
}

export interface IPlaylistItem {
  movieId: IMovie['_id'];
  addedBy: IUser['_id'];
  addedAt: Date;
}

export interface IChatMessage {
  senderId: IUser['_id'];
  message: string;
  createdAt: Date;
}

export interface IGroup extends Document {
  name: string;
  description?: string;
  createdBy: IUser['_id'];
  members: IGroupMember[];
  inviteCode: string;
  playlist: IPlaylistItem[];
  messages: IChatMessage[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new mongoose.Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    playlist: [
      {
        movieId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Movie',
          required: true,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    messages: [
      {
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IGroup>('Group', groupSchema);
