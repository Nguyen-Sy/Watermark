// src/watermark.ts
import { ImageData } from 'canvas';
import { binaryToString, createSeededRandom, stringToBinary } from './utils';

// Type definitions
export interface WatermarkOptions {
  strength?: number;      // Controls how much the watermark affects the image (0-1)
  message?: string;       // Custom message to embed
  randomSeed?: number;    // Seed for deterministic watermark placement
}

/**
 * Applies an invisible watermark to an image
 * @param imageData The original image data
 * @param options Watermarking options
 * @returns The watermarked image data
 */
export function applyInvisibleWatermark(
  imageData: ImageData,
  options: WatermarkOptions = {}
): ImageData {
  // Default options
  const defaults: Required<WatermarkOptions> = {
    strength: 0.3,
    message: JSON.stringify({
      address: "Token address",
      nft_id: "Test nft_id"
    }),
    randomSeed: Math.round(Math.random() * 1000 + 1)
  };
  
  const config = { ...defaults, ...options };
  
  // Create a copy of the image data to avoid modifying the original
  const watermarkedData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
  
  // Convert the message to binary representation
  const binaryMessage = stringToBinary(config.message);
  
  // Initialize pseudo-random number generator with the seed
  const random = createSeededRandom(config.randomSeed);
  
  // Determine how many bits we can modify based on strength
  const totalPixels = imageData.width * imageData.height;
  
  // Track which pixels have been modified
  const modifiedPixels = new Set<number>();
  
  // Embed each bit of the binary message
  for (let i = 0; i < binaryMessage.length; i++) {
    // Find a suitable pixel that hasn't been modified yet
    let pixelIndex: number;
    do {
      pixelIndex = Math.floor(random() * totalPixels);
    } while (modifiedPixels.has(pixelIndex));
    
    modifiedPixels.add(pixelIndex);
    
    // Calculate the position in the data array (each pixel has 4 values: R,G,B,A)
    const dataIndex = pixelIndex * 4;
    
    // Modify the least significant bit of the blue channel to store our bit
    // This is less noticeable to the human eye than changing red or green
    if (binaryMessage[i] === '1') {
      watermarkedData.data[dataIndex + 2] |= 1;  // Set LSB to 1
    } else {
      watermarkedData.data[dataIndex + 2] &= ~1; // Set LSB to 0
    }
  }
  
  // Add a signature to indicate this image has been watermarked
  // Embed a special pattern in the first few pixels
  const signature = stringToBinary("WATERMARK");
  for (let i = 0; i < Math.min(signature.length, 64); i++) {
    const byteIndex = i + totalPixels - 64; // Add at the end to avoid overwriting the message
    const dataIndex = byteIndex * 4;
    
    if (signature[i] === '1') {
      watermarkedData.data[dataIndex + 3] |= 1;  // Set alpha channel LSB to 1
    } else {
      watermarkedData.data[dataIndex + 3] &= ~1; // Set alpha channel LSB to 0
    }
  }
  
  return watermarkedData;
}

/**
 * Extracts the invisible watermark from an image
 * @param imageData The image data to check for a watermark
 * @param options The same options used when applying the watermark
 * @returns The extracted watermark message or null if none was found
 */
export function extractWatermark(
  imageData: ImageData,
  options: WatermarkOptions = {}
): string | null {
  // Default options
  const defaults: Required<WatermarkOptions> = {
    strength: 0.3,
    message: JSON.stringify({
      address: "Token address",
      nft_id: "Test nft_id"
    }),
    randomSeed: Math.round(Math.random() * 10000 + 1)
  };
  
  const config = { ...defaults, ...options };
  
  // First check the signature to confirm this image has our watermark
  const totalPixels = imageData.width * imageData.height;
  const signature = stringToBinary("WATERMARK");
  let signatureMatch = true;
  
  for (let i = 0; i < Math.min(signature.length, 64); i++) {
    const byteIndex = i + totalPixels - 64;
    const dataIndex = byteIndex * 4;
    const extractedBit = (imageData.data[dataIndex + 3] & 1) === 1 ? '1' : '0';
    
    if (extractedBit !== signature[i]) {
      signatureMatch = false;
      break;
    }
  }
  
  if (!signatureMatch) {
    return null; // No watermark found
  }
  
  // Initialize the pseudo-random generator with the same seed
  const random = createSeededRandom(config.randomSeed);
  
  // Calculate expected message length in bits
  const expectedMessageLength = stringToBinary(config.message).length;
  
  // Extract the embedded message
  let extractedBinary = '';
  const modifiedPixels = new Set<number>();
  
  for (let i = 0; i < expectedMessageLength; i++) {
    // Find the same pixel that was modified during watermarking
    let pixelIndex: number;
    do {
      pixelIndex = Math.floor(random() * totalPixels);
    } while (modifiedPixels.has(pixelIndex));
    
    modifiedPixels.add(pixelIndex);
    
    // Calculate the position in the data array
    const dataIndex = pixelIndex * 4;
    
    // Extract the LSB from the blue channel
    const bit = (imageData.data[dataIndex + 2] & 1) === 1 ? '1' : '0';
    extractedBinary += bit;
  }
  
  // Convert binary back to text
  return binaryToString(extractedBinary);
}