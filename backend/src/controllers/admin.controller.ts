import { Request, Response } from 'express';
import * as s3Service from '../services/s3.service';
import Movie from '../models/Movie';

// Generate presigned upload URL - only for admins
export const generateUploadUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: 'fileName and fileType are required' });
    }

    // Validate file type in service
    const result = await s3Service.generatePresignedUploadUrl(fileName, fileType);

    return res.json(result);
  } catch (error: any) {
    if (error.message === 'Invalid file type') {
      return res.status(400).json({ message: 'Invalid video file type' });
    }
    console.error('generateUploadUrl error:', error);
    return res.status(500).json({ message: 'Could not generate upload URL' });
  }
};

// Save movie metadata after upload
export const createMovie = async (req: Request, res: Response) => {
  try {
    const { title, description, genre, thumbnailUrl, videoUrl } = req.body;

    if (!title || !description || !genre || !thumbnailUrl || !videoUrl) {
      return res.status(400).json({ message: 'Missing required movie fields' });
    }

    const uploadedBy = (req as any).user?._id;

    const movie = new Movie({ title, description, genre, thumbnailUrl, videoUrl, uploadedBy });

    await movie.save();

    return res.status(201).json(movie);
  } catch (error) {
    console.error('createMovie error:', error);
    return res.status(500).json({ message: 'Could not save movie metadata' });
  }
};

// Get all movies
export const getAllMovies = async (req: Request, res: Response) => {
  try {
    const movies = await Movie.find().populate('uploadedBy', 'username email');
    return res.json(movies);
  } catch (error) {
    console.error('getAllMovies error:', error);
    return res.status(500).json({ message: 'Could not fetch movies' });
  }
};

export default { generateUploadUrl, createMovie, getAllMovies };