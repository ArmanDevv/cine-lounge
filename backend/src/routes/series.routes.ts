import express from 'express';
import * as seriesController from '../controllers/series.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Get all series (public)
router.get('/', seriesController.getAllSeries);

// Get single series by ID (public)
router.get('/:id', seriesController.getSeriesById);

// Create series (admin only)
router.post('/', authenticate, requireAdmin, seriesController.createSeries);

// Update series (admin only)
router.put('/:id', authenticate, requireAdmin, seriesController.updateSeries);

// Delete series (admin only)
router.delete('/:id', authenticate, requireAdmin, seriesController.deleteSeries);

export default router;
