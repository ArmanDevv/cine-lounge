import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IEpisode {
  episodeNumber: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration?: number;
}

export interface ISeason {
  seasonNumber: number;
  title: string;
  description: string;
  episodes: IEpisode[];
}

export interface ISeries extends Document {
  title: string;
  description: string;
  genre: string;
  thumbnailUrl: string;
  seasons: ISeason[];
  uploadedBy: IUser['_id'];
  createdAt: Date;
  updatedAt: Date;
}

const episodeSchema = new mongoose.Schema({
  episodeNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  duration: { type: Number },
}, { _id: false });

const seasonSchema = new mongoose.Schema({
  seasonNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  episodes: [episodeSchema],
}, { _id: false });

const seriesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  seasons: [seasonSchema],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<ISeries>('Series', seriesSchema);
