import express from 'express';
import Movie from '../models/Movie';
import * as s3Service from '../services/s3.service';

const router = express.Router();

// Get all movies - public endpoint
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const movies = await Movie.find()
      .populate('uploadedBy', 'username email')
      .skip(skip)
      .limit(limit);
    
    const total = await Movie.countDocuments();
    
    // Generate presigned URLs for each movie
    const moviesWithUrls = await Promise.all(
      movies.map(async (movie) => {
        const movieObj = movie.toObject();
        try {
          // Extract fileKey from videoUrl
          const urlParts = movie.videoUrl.split('/');
          const fileKey = urlParts.slice(-2).join('/');
          
          // Generate presigned URL (1 hour expiry)
          const presignedUrl = await s3Service.generatePresignedReadUrl(fileKey, 3600);
          movieObj.videoUrl = presignedUrl;
        } catch (error) {
          console.error(`Failed to generate presigned URL for ${movie._id}:`, error);
          // Keep original URL as fallback
        }
        return movieObj;
      })
    );
    
    return res.json({
      data: moviesWithUrls,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error('getMovies error:', error);
    return res.status(500).json({ message: 'Could not fetch movies' });
  }
});

// Get single movie by ID - public endpoint
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).populate('uploadedBy', 'username email');
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    const movieObj = movie.toObject();
    try {
      // Extract fileKey from videoUrl
      const urlParts = movie.videoUrl.split('/');
      const fileKey = urlParts.slice(-2).join('/');
      
      // Generate presigned URL (1 hour expiry)
      const presignedUrl = await s3Service.generatePresignedReadUrl(fileKey, 3600);
      movieObj.videoUrl = presignedUrl;
    } catch (error) {
      console.error(`Failed to generate presigned URL for ${movie._id}:`, error);
      // Keep original URL as fallback
    }
    
    return res.json(movieObj);
  } catch (error) {
    console.error('getMovie error:', error);
    return res.status(500).json({ message: 'Could not fetch movie' });
  }
});

export default router;
