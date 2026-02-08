import express from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Generate presigned URL
router.post('/generate-upload-url', authenticate, requireAdmin, adminController.generateUploadUrl);

// Get all movies
router.get('/movies', adminController.getAllMovies);

// Save movie metadata
router.post('/movies', authenticate, requireAdmin, adminController.createMovie);

export default router;