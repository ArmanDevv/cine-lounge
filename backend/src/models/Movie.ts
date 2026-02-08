import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IMovie extends Document {
  title: string;
  description: string;
  genre: string;
  thumbnailUrl: string;
  videoUrl: string;
  uploadedBy: IUser['_id'];
  createdAt: Date;
}

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  videoUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<IMovie>('Movie', movieSchema);