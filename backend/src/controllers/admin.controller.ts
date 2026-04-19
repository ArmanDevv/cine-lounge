import { Request, Response } from 'express';
import * as s3Service from '../services/s3.service';
import Movie from '../models/Movie';

// Generate presigned upload URL for videos - only for admins
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

// Generate presigned upload URL for thumbnails - only for admins
export const generateThumbnailUploadUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: 'fileName and fileType are required' });
    }

    // Validate file type in service
    const result = await s3Service.generatePresignedThumbnailUploadUrl(fileName, fileType);

    return res.json(result);
  } catch (error: any) {
    if (error.message === 'Invalid image file type') {
      return res.status(400).json({ message: 'Invalid image file type. Allowed: JPEG, PNG, WebP, GIF' });
    }
    console.error('generateThumbnailUploadUrl error:', error);
    return res.status(500).json({ message: 'Could not generate thumbnail upload URL' });
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

// Update movie
export const updateMovie = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, genre, thumbnailUrl, videoUrl } = req.body;

    if (!title || !description || !genre || !thumbnailUrl || !videoUrl) {
      return res.status(400).json({ message: 'Missing required movie fields' });
    }

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // If video URL changed, delete the old video from S3
    if (movie.videoUrl !== videoUrl) {
      await s3Service.deleteFileFromS3(movie.videoUrl);
    }

    // Update the movie
    const updatedMovie = await Movie.findByIdAndUpdate(
      id,
      { title, description, genre, thumbnailUrl, videoUrl },
      { new: true }
    ).populate('uploadedBy', 'username email');

    return res.json(updatedMovie);
  } catch (error) {
    console.error('updateMovie error:', error);
    return res.status(500).json({ message: 'Could not update movie' });
  }
};

// Delete movie
export const deleteMovie = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findByIdAndDelete(id);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Delete the video from S3
    await s3Service.deleteFileFromS3(movie.videoUrl);

    return res.json({ message: 'Movie deleted successfully', movie });
  } catch (error) {
    console.error('deleteMovie error:', error);
    return res.status(500).json({ message: 'Could not delete movie' });
  }
};

// Generate fresh presigned playback URL for video playback (works even after original expires)
export const generatePlaybackUrl = async (req: Request, res: Response) => {
  try {
    const { fileKey } = req.body;

    if (!fileKey) {
      return res.status(400).json({ message: 'fileKey is required' });
    }

    const playbackUrl = await s3Service.generatePresignedReadUrl(fileKey);

    return res.json({ playbackUrl });
  } catch (error) {
    console.error('generatePlaybackUrl error:', error);
    return res.status(500).json({ message: 'Could not generate playback URL' });
  }
};

export default { generateUploadUrl, generateThumbnailUploadUrl, createMovie, getAllMovies, updateMovie, deleteMovie, generatePlaybackUrl };