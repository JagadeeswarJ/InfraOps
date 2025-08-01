import { Request, Response } from 'express';
import multer from 'multer';

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

const convertToBase64 = (buffer: Buffer, mimeType: string): string => {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
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

    console.log(`[${uploadId}] 🔄 Converting to base64...`);
    const base64Data = convertToBase64(req.file.buffer, req.file.mimetype);
    
    const result = {
      base64: base64Data,
      originalName: req.file.originalname,
      size: req.file.size,
      contentType: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    console.log(`[${uploadId}] ✅ Base64 conversion completed`);
    console.log(`[${uploadId}] 📊 Result size: ${base64Data.length} characters`);
    console.log(`[${uploadId}] === SINGLE IMAGE UPLOAD SUCCESS ===`);

    return res.status(200).json({
      success: true,
      message: 'Image processed successfully',
      data: result
    });

  } catch (error) {
    console.error(`[${uploadId}] ❌ === SINGLE IMAGE UPLOAD ERROR ===`);
    console.error(`[${uploadId}] Error:`, error);
    console.error(`[${uploadId}] Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[${uploadId}] === UPLOAD ERROR END ===`);
    return res.status(500).json({
      success: false,
      error: 'Failed to process image'
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
    console.log(`[${uploadId}] 🔄 Converting all files to base64...`);
    
    const results = files.map((file, index) => {
      console.log(`[${uploadId}] Converting file ${index + 1}: ${file.originalname}`);
      const base64Data = convertToBase64(file.buffer, file.mimetype);
      
      return {
        base64: base64Data,
        originalName: file.originalname,
        size: file.size,
        contentType: file.mimetype,
        uploadedAt: new Date().toISOString()
      };
    });

    console.log(`[${uploadId}] ✅ All files converted to base64`);
    console.log(`[${uploadId}] === MULTIPLE IMAGES UPLOAD SUCCESS ===`);

    return res.status(200).json({
      success: true,
      message: `${results.length} images processed successfully`,
      data: results
    });

  } catch (error) {
    console.error(`[${uploadId}] ❌ === MULTIPLE IMAGES UPLOAD ERROR ===`);
    console.error(`[${uploadId}] Error:`, error);
    console.error(`[${uploadId}] Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[${uploadId}] === UPLOAD ERROR END ===`);
    return res.status(500).json({
      success: false,
      error: 'Failed to process images'
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
    console.log(`[${uploadId}] 🔄 Converting ticket images to base64...`);
    
    const results = files.map((file, index) => {
      console.log(`[${uploadId}] Converting ticket image ${index + 1}: ${file.originalname}`);
      const base64Data = convertToBase64(file.buffer, file.mimetype);
      
      return {
        base64: base64Data,
        originalName: file.originalname,
        size: file.size,
        contentType: file.mimetype,
        ticketId: ticketId,
        uploadedAt: new Date().toISOString()
      };
    });

    console.log(`[${uploadId}] ✅ Ticket images converted to base64`);
    console.log(`[${uploadId}] === TICKET IMAGES UPLOAD SUCCESS ===`);

    return res.status(200).json({
      success: true,
      message: `${results.length} images processed for ticket ${ticketId}`,
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