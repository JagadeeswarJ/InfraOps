import { Router } from 'express';
import {
  upload,
  uploadSingleImage,
  uploadMultipleImages,
  uploadTicketImages,
  getUploadInfo
} from '../controllers/upload.controller.js';

const router = Router();

// GET /api/upload/info - Get upload configuration info
router.get('/info', getUploadInfo);

// POST /api/upload/single - Upload single image
router.post('/single', upload.single('image'), uploadSingleImage);

// POST /api/upload/multiple - Upload multiple images
router.post('/multiple', upload.array('images', 10), uploadMultipleImages);

// POST /api/upload/ticket/:ticketId - Upload images for specific ticket
router.post('/ticket/:ticketId', upload.array('images', 10), uploadTicketImages);

// Handle multer errors
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof Error) {
    if (error.message === 'File too large') {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 5MB limit'
      });
    }
    
    if (error.message === 'Too many files') {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 files allowed'
      });
    }

    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});

export default router;