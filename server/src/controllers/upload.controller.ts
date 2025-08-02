import { Request, Response } from 'express';
import multer from 'multer';
import { StorageUtil } from '../utils/storage.util.js';

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const validation = validateImageFile(file);
  if (validation.isValid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error || 'Invalid file'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10, // Maximum 10 files
  },
});

const validateImageFile = (
  file: Express.Multer.File,
  maxSize: number = 5 * 1024 * 1024 // 5MB default
): { isValid: boolean; error?: string } => {
  if (!file.mimetype.startsWith('image/')) {
    return {
      isValid: false,
      error: 'File must be an image'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSize / (1024 * 1024)}MB`
    };
  }

  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedFormats.includes(file.mimetype)) {
    return {
      isValid: false,
      error: 'Supported formats: JPEG, PNG, WebP'
    };
  }

  return { isValid: true };
};

export const uploadSingleImage = async (req: Request, res: Response): Promise<any> => {
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔄 [${uploadId}] === SINGLE IMAGE UPLOAD START ===`);
    console.log(`[${uploadId}] Timestamp: ${new Date().toISOString()}`);
    
    if (!req.file) {
      console.log(`[${uploadId}] ❌ ERROR: No file provided`);
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    console.log(`[${uploadId}] 📁 File Details:`);
    console.log(`[${uploadId}]   - Original Name: ${req.file.originalname}`);
    console.log(`[${uploadId}]   - MIME Type: ${req.file.mimetype}`);
    console.log(`[${uploadId}]   - Size: ${req.file.size} bytes (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

    console.log(`[${uploadId}] 🔍 Validating file...`);
    const validation = validateImageFile(req.file);
    if (!validation.isValid) {
      console.log(`[${uploadId}] ❌ VALIDATION FAILED: ${validation.error}`);
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
    console.log(`[${uploadId}] ✅ File validation passed`);

    console.log(`[${uploadId}] 🔄 Uploading to Firebase Storage...`);
    const storageResult = await StorageUtil.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'ticket-images'
    );

    console.log(`[${uploadId}] ✅ Firebase Storage upload completed`);
    console.log(`[${uploadId}] 📊 Public URL: ${storageResult.publicUrl}`);
    console.log(`[${uploadId}] === SINGLE IMAGE UPLOAD SUCCESS ===`);

    return res.status(200).json({
      success: true,
      message: 'Image uploaded to storage successfully',
      data: {
        url: storageResult.publicUrl,
        fileName: storageResult.fileName,
        originalName: storageResult.originalName,
        size: storageResult.size,
        contentType: storageResult.contentType,
        uploadedAt: storageResult.uploadedAt
      }
    });

  } catch (error) {
    console.error(`[${uploadId}] ❌ === SINGLE IMAGE UPLOAD ERROR ===`);
    console.error(`[${uploadId}] Error:`, error);
    console.error(`[${uploadId}] Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[${uploadId}] === UPLOAD ERROR END ===`);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload image to storage'
    });
  }
};

export const uploadMultipleImages = async (req: Request, res: Response): Promise<any> => {
  const uploadId = `multi_upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🔄 [${uploadId}] === MULTIPLE IMAGES UPLOAD START ===`);
    console.log(`[${uploadId}] Timestamp: ${new Date().toISOString()}`);
    
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.log(`[${uploadId}] ❌ ERROR: No files provided`);
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const files = req.files as Express.Multer.File[];
    console.log(`[${uploadId}] 📁 Processing ${files.length} files`);
    
    files.forEach((file, index) => {
      console.log(`[${uploadId}] File ${index + 1}:`);
      console.log(`[${uploadId}]   - Name: ${file.originalname}`);
      console.log(`[${uploadId}]   - MIME: ${file.mimetype}`);
      console.log(`[${uploadId}]   - Size: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    });

    console.log(`[${uploadId}] 🔍 Validating all files...`);
    const invalidFiles: string[] = [];

    files.forEach((file, index) => {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        const errorMsg = `File ${index + 1} (${file.originalname}): ${validation.error}`;
        invalidFiles.push(errorMsg);
        console.log(`[${uploadId}] ❌ VALIDATION FAILED: ${errorMsg}`);
      } else {
        console.log(`[${uploadId}] ✅ File ${index + 1} validation passed`);
      }
    });

    if (invalidFiles.length > 0) {
      console.log(`[${uploadId}] ❌ ${invalidFiles.length} files failed validation`);
      return res.status(400).json({
        success: false,
        error: 'Invalid files found',
        details: invalidFiles
      });
    }

    console.log(`[${uploadId}] ✅ All files validated successfully`);
    console.log(`[${uploadId}] 🔄 Uploading all files to Firebase Storage...`);
    
    // Prepare files for batch upload
    const filesToUpload = files.map(file => ({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype
    }));

    // Upload all files to Firebase Storage
    const storageResults = await StorageUtil.uploadFiles(filesToUpload, 'ticket-images');

    // Format response data
    const results = storageResults.map((result, index) => ({
      url: result.publicUrl,
      fileName: result.fileName,
      originalName: result.originalName,
      size: result.size,
      contentType: result.contentType,
      uploadedAt: result.uploadedAt
    }));

    console.log(`[${uploadId}] ✅ All files uploaded to Firebase Storage`);
    console.log(`[${uploadId}] 📊 Upload results:`, results.map(r => ({ url: r.url, originalName: r.originalName })));
    console.log(`[${uploadId}] === MULTIPLE IMAGES UPLOAD SUCCESS ===`);

    return res.status(200).json({
      success: true,
      message: `${results.length} images uploaded to storage successfully`,
      data: results
    });

  } catch (error) {
    console.error(`[${uploadId}] ❌ === MULTIPLE IMAGES UPLOAD ERROR ===`);
    console.error(`[${uploadId}] Error:`, error);
    console.error(`[${uploadId}] Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[${uploadId}] === UPLOAD ERROR END ===`);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload images to storage'
    });
  }
};

export const uploadTicketImages = async (req: Request, res: Response): Promise<any> => {
  const { ticketId } = req.params;
  const uploadId = `ticket_upload_${ticketId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🎫 [${uploadId}] === TICKET IMAGES UPLOAD START ===`);
    console.log(`[${uploadId}] Ticket ID: ${ticketId}`);
    console.log(`[${uploadId}] Timestamp: ${new Date().toISOString()}`);

    if (!ticketId) {
      console.log(`[${uploadId}] ❌ ERROR: Ticket ID is required`);
      return res.status(400).json({
        success: false,
        error: 'Ticket ID is required'
      });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.log(`[${uploadId}] ❌ ERROR: No files provided for ticket ${ticketId}`);
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const files = req.files as Express.Multer.File[];
    console.log(`[${uploadId}] 📁 Processing ${files.length} images for ticket ${ticketId}`);
    
    files.forEach((file, index) => {
      console.log(`[${uploadId}] Image ${index + 1}:`);
      console.log(`[${uploadId}]   - Name: ${file.originalname}`);
      console.log(`[${uploadId}]   - MIME: ${file.mimetype}`);
      console.log(`[${uploadId}]   - Size: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    });

    console.log(`[${uploadId}] 🔍 Validating all images...`);
    for (const [index, file] of files.entries()) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        console.log(`[${uploadId}] ❌ VALIDATION FAILED for image ${index + 1} (${file.originalname}): ${validation.error}`);
        return res.status(400).json({
          success: false,
          error: `Invalid file: ${file.originalname} - ${validation.error}`
        });
      }
      console.log(`[${uploadId}] ✅ Image ${index + 1} validation passed`);
    }

    console.log(`[${uploadId}] ✅ All images validated successfully`);
    console.log(`[${uploadId}] 🔄 Uploading ticket images to Firebase Storage...`);
    
    // Prepare files for batch upload
    const filesToUpload = files.map(file => ({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype
    }));

    // Upload all files to Firebase Storage with ticket-specific folder
    const storageResults = await StorageUtil.uploadFiles(filesToUpload, `ticket-images/${ticketId}`);

    // Format response data
    const results = storageResults.map((result, index) => ({
      url: result.publicUrl,
      fileName: result.fileName,
      originalName: result.originalName,
      size: result.size,
      contentType: result.contentType,
      ticketId: ticketId,
      uploadedAt: result.uploadedAt
    }));

    console.log(`[${uploadId}] ✅ Ticket images uploaded to Firebase Storage`);
    console.log(`[${uploadId}] === TICKET IMAGES UPLOAD SUCCESS ===`);

    return res.status(200).json({
      success: true,
      message: `${results.length} images uploaded to storage for ticket ${ticketId}`,
      ticketId,
      images: results
    });

  } catch (error) {
    console.error(`[${uploadId}] ❌ === TICKET IMAGES UPLOAD ERROR ===`);
    console.error(`[${uploadId}] Ticket ID: ${ticketId}`);
    console.error(`[${uploadId}] Error:`, error);
    console.error(`[${uploadId}] Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[${uploadId}] === UPLOAD ERROR END ===`);
    return res.status(500).json({
      success: false,
      error: 'Failed to process ticket images'
    });
  }
};

export const getUploadInfo = async (req: Request, res: Response): Promise<any> => {
  return res.status(200).json({
    success: true,
    data: {
      maxFileSize: '5MB',
      maxFiles: 10,
      supportedFormats: ['JPEG', 'PNG', 'WebP'],
      mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      storageType: 'base64',
      note: 'Images are converted to base64 and stored directly in database'
    }
  });
};

export default {
  upload,
  uploadSingleImage,
  uploadMultipleImages,
  uploadTicketImages,
  getUploadInfo
};