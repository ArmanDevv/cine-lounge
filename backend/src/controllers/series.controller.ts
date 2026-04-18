import { Request, Response } from 'express';
import * as s3Service from '../services/s3.service';
import Series from '../models/Series';

// Get all series
export const getAllSeries = async (req: Request, res: Response) => {
  try {
    const series = await Series.find().populate('uploadedBy', 'username email');
    return res.json(series);
  } catch (error) {
    console.error('getAllSeries error:', error);
    return res.status(500).json({ message: 'Could not fetch series' });
  }
};

// Get single series by ID
export const getSeriesById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const series = await Series.findById(id).populate('uploadedBy', 'username email');
    
    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }
    
    return res.json(series);
  } catch (error) {
    console.error('getSeriesById error:', error);
    return res.status(500).json({ message: 'Could not fetch series' });
  }
};

// Create series (admin only)
export const createSeries = async (req: Request, res: Response) => {
  try {
    const { title, description, genre, thumbnailUrl, seasons } = req.body;

    if (!title || !description || !genre || !thumbnailUrl) {
      return res.status(400).json({ message: 'Missing required series fields' });
    }

    if (!seasons || !Array.isArray(seasons) || seasons.length === 0) {
      return res.status(400).json({ message: 'At least one season is required' });
    }

    // Validate seasons structure
    for (const season of seasons) {
      if (!season.seasonNumber || !season.title || !season.episodes || !Array.isArray(season.episodes) || season.episodes.length === 0) {
        return res.status(400).json({ message: 'Each season must have a number, title, and at least one episode' });
      }

      // Validate episodes
      for (const episode of season.episodes) {
        if (!episode.episodeNumber || !episode.title || !episode.videoUrl || !episode.thumbnailUrl) {
          return res.status(400).json({ message: 'Each episode must have number, title, video URL, and thumbnail URL' });
        }
      }
    }

    const uploadedBy = (req as any).user?._id;

    const newSeries = new Series({
      title,
      description,
      genre,
      thumbnailUrl,
      seasons,
      uploadedBy,
    });

    await newSeries.save();

    return res.status(201).json(newSeries);
  } catch (error) {
    console.error('createSeries error:', error);
    return res.status(500).json({ message: 'Could not save series' });
  }
};

// Update series (admin only)
export const updateSeries = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, genre, thumbnailUrl, seasons } = req.body;

    const series = await Series.findById(id);

    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }

    // Update fields
    if (title) series.title = title;
    if (description) series.description = description;
    if (genre) series.genre = genre;
    if (thumbnailUrl) series.thumbnailUrl = thumbnailUrl;
    if (seasons) series.seasons = seasons;

    await series.save();

    return res.json(series);
  } catch (error) {
    console.error('updateSeries error:', error);
    return res.status(500).json({ message: 'Could not update series' });
  }
};

// Delete series (admin only)
export const deleteSeries = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const series = await Series.findByIdAndDelete(id);

    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }

    // Delete all videos and thumbnails from S3
    for (const season of series.seasons) {
      for (const episode of season.episodes) {
        await s3Service.deleteFileFromS3(episode.videoUrl);
        await s3Service.deleteFileFromS3(episode.thumbnailUrl);
      }
    }

    // Delete series thumbnail
    await s3Service.deleteFileFromS3(series.thumbnailUrl);

    return res.json({ message: 'Series deleted successfully', series });
  } catch (error) {
    console.error('deleteSeries error:', error);
    return res.status(500).json({ message: 'Could not delete series' });
  }
};

export default { getAllSeries, getSeriesById, createSeries, updateSeries, deleteSeries };
