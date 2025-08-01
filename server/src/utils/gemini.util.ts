import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { env } from '../config/env.config.js';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);

/**
 * Convert image URL to base64
 */
async function imageUrlToBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const conversionId = `img_conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🖼️ [${conversionId}] === IMAGE URL TO BASE64 CONVERSION START ===`);
    console.log(`[${conversionId}] Image URL: ${imageUrl}`);
    console.log(`[${conversionId}] Fetching image data...`);
    
    const fetchStartTime = Date.now();
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 seconds timeout
    });
    const fetchDuration = Date.now() - fetchStartTime;
    
    console.log(`[${conversionId}] ✅ Image fetched in ${fetchDuration}ms`);
    console.log(`[${conversionId}] Response status: ${response.status}`);
    console.log(`[${conversionId}] Content length: ${response.data.byteLength} bytes`);
    console.log(`[${conversionId}] Content type: ${response.headers['content-type']}`);
    
    console.log(`[${conversionId}] Converting to base64...`);
    const conversionStartTime = Date.now();
    const base64 = Buffer.from(response.data).toString('base64');
    const conversionDuration = Date.now() - conversionStartTime;
    
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    
    console.log(`[${conversionId}] ✅ Base64 conversion completed in ${conversionDuration}ms`);
    console.log(`[${conversionId}] Base64 length: ${base64.length} characters`);
    console.log(`[${conversionId}] MIME type: ${mimeType}`);
    console.log(`[${conversionId}] === IMAGE CONVERSION SUCCESS ===`);
    
    return { base64, mimeType };
  } catch (error) {
    console.error(`[${conversionId}] ❌ === IMAGE CONVERSION ERROR ===`);
    console.error(`[${conversionId}] URL: ${imageUrl}`);
    console.error(`[${conversionId}] Error:`, error);
    console.error(`[${conversionId}] Error details:`, {
      message: (error as Error).message,
      code: (error as any).code,
      response: (error as any).response?.status
    });
    console.error(`[${conversionId}] === CONVERSION ERROR END ===`);
    throw new Error('Failed to process image from URL');
  }
}

/**
 * Process multiple image URLs to base64
 */
async function processImageUrls(imageUrls: string[]): Promise<Array<{ base64: string; mimeType: string }>> {
  const processId = `img_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (!imageUrls || imageUrls.length === 0) {
    console.log(`[${processId}] No image URLs provided`);
    return [];
  }
  
  try {
    console.log(`🖼️ [${processId}] === BATCH IMAGE PROCESSING START ===`);
    console.log(`[${processId}] Processing ${imageUrls.length} image URLs`);
    
    imageUrls.forEach((url, index) => {
      console.log(`[${processId}] Image ${index + 1}: ${url}`);
    });
    
    const batchStartTime = Date.now();
    console.log(`[${processId}] Starting parallel image processing...`);
    
    const imageDataPromises = imageUrls.map((url, index) => {
      console.log(`[${processId}] Initiating processing for image ${index + 1}`);
      return imageUrlToBase64(url);
    });
    
    const results = await Promise.all(imageDataPromises);
    const batchDuration = Date.now() - batchStartTime;
    
    console.log(`[${processId}] ✅ All images processed in ${batchDuration}ms`);
    console.log(`[${processId}] Successfully processed ${results.length}/${imageUrls.length} images`);
    
    results.forEach((result, index) => {
      console.log(`[${processId}] Result ${index + 1}: ${result.base64.length} chars, ${result.mimeType}`);
    });
    
    console.log(`[${processId}] === BATCH IMAGE PROCESSING SUCCESS ===`);
    return results;
  } catch (error) {
    console.error(`[${processId}] ❌ BATCH IMAGE PROCESSING ERROR:`, error);
    console.error(`[${processId}] Error details:`, {
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
}

export async function callGemini({
  messages,
  context,
  imageBase64,
  imageUrls,
  imageBase64Array,
  mimeType = "image/jpeg",
}: {
  messages: { role: "user" | "model"; parts: any[] }[];
  context?: string;
  imageBase64?: string;
  imageUrls?: string[];
  imageBase64Array?: string[];
  mimeType?: string;
}) {
  const aiId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`\n🤖 [${aiId}] === GEMINI AI PROCESSING START ===`);
    console.log(`[${aiId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`[${aiId}] Messages count: ${messages.length}`);
    console.log(`[${aiId}] Has context: ${!!context}`);
    console.log(`[${aiId}] Has direct base64 image: ${!!imageBase64}`);
    console.log(`[${aiId}] Image URLs count: ${imageUrls?.length || 0}`);
    console.log(`[${aiId}] Base64 images array count: ${imageBase64Array?.length || 0}`);
    
    if (context) {
      console.log(`[${aiId}] Context length: ${context.length} characters`);
    }
    
    const hasImages = imageBase64 || (imageUrls && imageUrls.length > 0) || (imageBase64Array && imageBase64Array.length > 0);
    const modelName = hasImages ? "gemini-2.5-flash-lite" : "gemini-2.5-flash-lite";
    console.log(`[${aiId}] Using model: ${modelName} (hasImages: ${hasImages})`);
    
    const model = genAI.getGenerativeModel({
      model: modelName,
    });

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
    console.log(`[${aiId}] Safety settings configured (${safetySettings.length} categories)`);

    const parts = messages.map((m) => ({
      role: m.role,
      parts: m.parts,
    }));
    console.log(`[${aiId}] Prepared ${parts.length} message parts`);

    // Process images from URLs if provided
    let processedImages: Array<{ base64: string; mimeType: string }> = [];
    if (imageUrls && imageUrls.length > 0) {
      try {
        console.log(`[${aiId}] Processing ${imageUrls.length} image URLs...`);
        const imageProcessStartTime = Date.now();
        processedImages = await processImageUrls(imageUrls);
        const imageProcessDuration = Date.now() - imageProcessStartTime;
        console.log(`[${aiId}] ✅ Image URLs processed in ${imageProcessDuration}ms`);
      } catch (error) {
        console.warn(`[${aiId}] ⚠️ Failed to process some images from URLs:`, error);
        // Continue without images rather than failing completely
      }
    }

    // If direct base64 image is provided
    if (imageBase64) {
      console.log(`[${aiId}] Adding direct base64 image (${imageBase64.length} chars, ${mimeType})`);
      processedImages.push({ base64: imageBase64, mimeType });
    }

    // If base64 array is provided
    if (imageBase64Array && imageBase64Array.length > 0) {
      console.log(`[${aiId}] Adding ${imageBase64Array.length} base64 images from array`);
      imageBase64Array.forEach((base64Data, index) => {
        // Extract MIME type from data URL if present, otherwise use default
        let extractedMimeType = mimeType;
        let base64Only = base64Data;
        
        if (base64Data.startsWith('data:')) {
          const mimeMatch = base64Data.match(/data:([^;]+);base64,/);
          if (mimeMatch) {
            extractedMimeType = mimeMatch[1];
            base64Only = base64Data.split(',')[1];
          }
        }
        
        console.log(`[${aiId}] Base64 image ${index + 1}: ${base64Only.length} chars, ${extractedMimeType}`);
        processedImages.push({ base64: base64Only, mimeType: extractedMimeType });
      });
    }

    // Add images to parts if any were processed
    if (processedImages.length > 0) {
      console.log(`[${aiId}] Adding ${processedImages.length} processed images to AI prompt`);
      const imageParts = processedImages.map((img, index) => {
        console.log(`[${aiId}] Image ${index + 1}: ${img.base64.length} chars, ${img.mimeType}`);
        return {
          inlineData: {
            data: img.base64,
            mimeType: img.mimeType,
          },
        };
      });

      parts.push({
        role: "user",
        parts: [
          ...imageParts,
          { text: `Please analyze ${processedImages.length > 1 ? 'these images' : 'this image'} in relation to the maintenance issue described.` },
        ],
      });
      console.log(`[${aiId}] Image analysis prompt added`);
    } else {
      console.log(`[${aiId}] No images to process`);
    }

    console.log(`[${aiId}] Preparing AI request content...`);
    const requestContent = {
      contents: [
        ...(context
          ? [
              {
                role: "user",
                parts: [{ text: context }],
              },
            ]
          : []),
        ...parts,
      ],
      safetySettings,
    };
    
    console.log(`[${aiId}] Total content parts: ${requestContent.contents.length}`);
    console.log(`[${aiId}] Sending request to Gemini AI...`);
    const aiStartTime = Date.now();
    
    const result = await model.generateContent(requestContent);
    const aiDuration = Date.now() - aiStartTime;
    
    console.log(`[${aiId}] ✅ AI response received in ${aiDuration}ms`);
    
    const response = await result.response;
    const responseText = response.text();
    
    console.log(`[${aiId}] Response length: ${responseText.length} characters`);
    console.log(`[${aiId}] 🔮 AI Response Content:`);
    console.log(`[${aiId}] ${responseText}`);
    console.log(`[${aiId}] === GEMINI AI PROCESSING SUCCESS ===\n`);
    
    return responseText;
  } catch (error) {
    console.error(`[${aiId}] ❌ === GEMINI AI PROCESSING ERROR ===`);
    console.error(`[${aiId}] Error:`, error);
    console.error(`[${aiId}] Error details:`, {
      message: (error as Error).message,
      stack: (error as Error).stack,
      code: (error as any).code
    });
    console.error(`[${aiId}] === AI ERROR END ===\n`);
    throw error;
  }
}

export default {
  callGemini,
  imageUrlToBase64,
  processImageUrls
};