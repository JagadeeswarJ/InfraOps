import { storage } from "../config/db.config.js";

export interface UploadResult {
  publicUrl: string;
  fileName: string;
  originalName: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

export class StorageUtil {
  private static bucket = storage.bucket();

  /**
   * Upload a single file to Firebase Storage
   */
  static async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'images'
  ): Promise<UploadResult> {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`📤 [${uploadId}] === STORAGE UPLOAD START ===`);
      console.log(`[${uploadId}] Original Name: ${originalName}`);
      console.log(`[${uploadId}] MIME Type: ${mimeType}`);
      console.log(`[${uploadId}] Size: ${buffer.length} bytes`);
      console.log(`[${uploadId}] Folder: ${folder}`);

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = originalName.split('.').pop() || 'jpg';
      const fileName = `${folder}/${timestamp}-${randomString}.${extension}`;

      console.log(`[${uploadId}] Generated filename: ${fileName}`);

      // Get file reference
      const file = this.bucket.file(fileName);

      console.log(`[${uploadId}] Creating write stream...`);
      const uploadStartTime = Date.now();

      // Create write stream with metadata
      const stream = file.createWriteStream({
        metadata: {
          contentType: mimeType,
          metadata: {
            uploadedBy: 'bitnap-server',
            uploadedAt: new Date().toISOString(),
            originalName: originalName,
            uploadId: uploadId
          }
        }
      });

      // Upload the file
      const uploadPromise = new Promise<void>((resolve, reject) => {
        stream.on('error', (error) => {
          console.error(`[${uploadId}] ❌ Upload error:`, error);
          reject(error);
        });

        stream.on('finish', () => {
          const uploadDuration = Date.now() - uploadStartTime;
          console.log(`[${uploadId}] ✅ File uploaded successfully in ${uploadDuration}ms`);
          resolve();
        });
      });

      // Write buffer to stream
      stream.end(buffer);
      await uploadPromise;

      console.log(`[${uploadId}] 🔄 Making file publicly accessible...`);
      // Make file publicly accessible
      await file.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
      console.log(`[${uploadId}] 🔗 Public URL: ${publicUrl}`);

      const result: UploadResult = {
        publicUrl,
        fileName,
        originalName,
        size: buffer.length,
        contentType: mimeType,
        uploadedAt: new Date().toISOString()
      };

      console.log(`[${uploadId}] === STORAGE UPLOAD SUCCESS ===`);
      return result;

    } catch (error) {
      console.error(`[${uploadId}] ❌ === STORAGE UPLOAD ERROR ===`);
      console.error(`[${uploadId}] Error:`, error);
      console.error(`[${uploadId}] === UPLOAD ERROR END ===`);
      throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple files to Firebase Storage
   */
  static async uploadFiles(
    files: Array<{ buffer: Buffer; originalName: string; mimeType: string }>,
    folder: string = 'images'
  ): Promise<UploadResult[]> {
    const batchId = `batch_upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`📤 [${batchId}] === BATCH STORAGE UPLOAD START ===`);
      console.log(`[${batchId}] Number of files: ${files.length}`);
      console.log(`[${batchId}] Folder: ${folder}`);

      const uploadPromises = files.map((file, index) => {
        console.log(`[${batchId}] Queuing upload ${index + 1}: ${file.originalName}`);
        return this.uploadFile(file.buffer, file.originalName, file.mimeType, folder);
      });

      console.log(`[${batchId}] 🔄 Starting parallel uploads...`);
      const batchStartTime = Date.now();
      
      const results = await Promise.all(uploadPromises);
      
      const batchDuration = Date.now() - batchStartTime;
      console.log(`[${batchId}] ✅ All uploads completed in ${batchDuration}ms`);
      console.log(`[${batchId}] Successfully uploaded ${results.length}/${files.length} files`);
      console.log(`[${batchId}] === BATCH STORAGE UPLOAD SUCCESS ===`);

      return results;

    } catch (error) {
      console.error(`[${batchId}] ❌ === BATCH STORAGE UPLOAD ERROR ===`);
      console.error(`[${batchId}] Error:`, error);
      console.error(`[${batchId}] === BATCH UPLOAD ERROR END ===`);
      throw new Error(`Batch storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  static async deleteFile(fileName: string): Promise<void> {
    const deleteId = `delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🗑️ [${deleteId}] === STORAGE DELETE START ===`);
      console.log(`[${deleteId}] Filename: ${fileName}`);

      const file = this.bucket.file(fileName);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`[${deleteId}] ⚠️ File not found: ${fileName}`);
        return;
      }

      // Delete the file
      await file.delete();
      console.log(`[${deleteId}] ✅ File deleted successfully: ${fileName}`);
      console.log(`[${deleteId}] === STORAGE DELETE SUCCESS ===`);

    } catch (error) {
      console.error(`[${deleteId}] ❌ === STORAGE DELETE ERROR ===`);
      console.error(`[${deleteId}] Error:`, error);
      console.error(`[${deleteId}] === DELETE ERROR END ===`);
      throw new Error(`Storage delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file metadata from Firebase Storage
   */
  static async getFileMetadata(fileName: string) {
    try {
      const file = this.bucket.file(fileName);
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate signed URL for private file access
   */
  static async getSignedUrl(fileName: string, expirationMinutes: number = 60): Promise<string> {
    try {
      const file = this.bucket.file(fileName);
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expirationMinutes * 60 * 1000,
      });
      return signedUrl;
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default StorageUtil;