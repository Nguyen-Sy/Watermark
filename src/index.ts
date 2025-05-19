// src/improved-index.ts
import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { applyInvisibleWatermark, extractWatermark } from './watermark';

async function main() {
  // Path to the image you want to watermark
  const inputImagePath = path.join(__dirname, '..', 'assets', 'images.jpeg');
  // Path where the watermarked image will be saved
  const outputImagePath = path.join(__dirname, '..', 'assets', 'watermarked.jpeg');
  
  // Create the output directory if it doesn't exist
  const outputDir = path.dirname(outputImagePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Set watermark message and options
  const watermarkOptions = {
    strength: 0.3,
    message: JSON.stringify({
      address: "Token address",
      nft_id: "Test nft_id"
    }),
    randomSeed: Math.round(Math.random() * 10000 + 1)
  }

  try {
    console.log("Starting watermarking process...");
    console.log(`Input image: ${inputImagePath}`);
    console.log(`Watermark message: "${watermarkOptions.message}"`);
    
    // Check if input file exists
    if (!fs.existsSync(inputImagePath)) {
      console.error(`Error: Input file does not exist at ${inputImagePath}`);
      console.log("Please place an image at this location or update the path in the script.");
      return;
    }

    // Load the image
    console.log("Loading image...");
    const image = await loadImage(inputImagePath);
    
    // Create a canvas with the same dimensions as the image
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the image onto the canvas
    ctx.drawImage(image, 0, 0);
    
    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    console.log(`Image dimensions: ${image.width}x${image.height} pixels`);
    console.log('Applying watermark...');
    console.time('Watermarking completed in');
    
    // Apply the watermark
    const watermarkedData = applyInvisibleWatermark(imageData, watermarkOptions);
    
    console.timeEnd('Watermarking completed in');
    
    // Put the watermarked data back onto the canvas
    ctx.putImageData(watermarkedData, 0, 0);
    
    // Save the watermarked image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputImagePath, buffer);
    
    console.log(`Watermarked image saved to: ${outputImagePath}`);
    
    // Verify the watermark immediately on the watermarked data
    console.log("\nVerifying watermark on the pixel data before saving...");
    const immediatelyExtracted = extractWatermark(watermarkedData, watermarkOptions);
    
    if (immediatelyExtracted) {
      console.log(`✅ Watermark verified in memory: "${immediatelyExtracted}"`);
      
      if (immediatelyExtracted === watermarkOptions.message) {
        console.log("✅ Message matches perfectly!");
      } else {
        console.log(`⚠️ Warning: Message mismatch!`);
        console.log(`  - Original: "${watermarkOptions.message}"`);
        console.log(`  - Extracted: "${immediatelyExtracted}"`);
      }
    } else {
      console.log("❌ Failed to verify watermark in memory");
    }
    
    // Also verify by loading the saved image
    console.log("\nVerifying watermark by loading the saved image...");
    await verifyWatermark(outputImagePath, watermarkOptions);
    
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

async function verifyWatermark(imagePath: string, options: any) {
  try {
    // Load the watermarked image
    const image = await loadImage(imagePath);
    
    // Create a canvas with the same dimensions as the image
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the image onto the canvas
    ctx.drawImage(image, 0, 0);
    
    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Extract the watermark
    const extractedMessage = extractWatermark(imageData, options);
    
    console.log('Verification result:');
    if (extractedMessage) {
      console.log(`✅ Watermark found: "${extractedMessage}"`);
      
      if (extractedMessage === options.message) {
        console.log("✅ Message matches perfectly!");
      } else {
        console.log(`⚠️ Warning: Message mismatch!`);
        console.log(`  - Original: "${options.message}"`);
        console.log(`  - Extracted: "${extractedMessage}"`);
        
        // Count matching characters
        let matchingChars = 0;
        const minLength = Math.min(options.message.length, extractedMessage.length);
        
        for (let i = 0; i < minLength; i++) {
          if (options.message[i] === extractedMessage[i]) {
            matchingChars++;
          }
        }
        
        console.log(`  - ${matchingChars}/${options.message.length} characters match (${Math.round(matchingChars/options.message.length*100)}%)`);
      }
    } else {
      console.log('❌ No watermark detected');
    }
    
  } catch (error) {
    console.error('Error verifying watermark:', error);
  }
}

// Execute the main function
main().catch(console.error);