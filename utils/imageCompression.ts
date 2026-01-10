
import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file for web optimization.
 * - Max Width: 1920px (Full HD)
 * - Quality: 0.8 (Good balance)
 * - Max Size: Target ~1MB (Soft limit)
 */
export const compressImage = async (file: File): Promise<File> => {
    // Return original if not an image
    if (!file.type.startsWith('image/')) return file;

    // Skip compression for GIFs to preserve animation
    if (file.type === 'image/gif') {
        console.log("ℹ️ GIF detected, skipping compression to preserve animation.");
        return file;
    }

    // Options
    const options = {
        maxSizeMB: 1,          // Try to compress to 1MB
        maxWidthOrHeight: 1920, // Downscale to 1920px
        useWebWorker: true,     // Use separate thread for performance
        initialQuality: 0.8,    // 80% quality
        fileType: file.type as string // Maintain original format
    };

    try {
        console.log(`🖼️ Original Image: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        const compressedFile = await imageCompression(file, options);
        console.log(`✅ Compressed Image: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

        return compressedFile;
    } catch (error) {
        console.error("⚠️ Image compression failed, using original file:", error);
        return file; // Fallback to original
    }
};
