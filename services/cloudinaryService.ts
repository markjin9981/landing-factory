/**
 * Cloudinary Service
 * Provides upload, list, and delete functionality
 * 
 * Required settings in GlobalSettings:
 * - cloudinaryCloudName: Your cloud name
 * - cloudinaryApiKey: API Key
 * - cloudinaryUploadPreset: Unsigned upload preset name
 */

export interface CloudinaryImage {
    public_id: string;
    url: string;
    secure_url: string;
    format: string;
    width: number;
    height: number;
    created_at: string;
    bytes: number;
}

export interface CloudinaryConfig {
    cloudName: string;
    apiKey?: string;
    uploadPreset: string;
}

/**
 * Upload image to Cloudinary (unsigned upload)
 */
export const uploadToCloudinary = async (
    file: File,
    config: CloudinaryConfig
): Promise<{ success: boolean; url?: string; publicId?: string; message?: string }> => {
    if (!config.cloudName || !config.uploadPreset) {
        return { success: false, message: 'Cloudinary Cloud Name과 Upload Preset이 필요합니다.' };
    }

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', config.uploadPreset);
        formData.append('folder', 'landing-factory'); // Organize in folder

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        const json = await res.json();

        if (json.secure_url) {
            return {
                success: true,
                url: json.secure_url,
                publicId: json.public_id,
            };
        } else {
            return {
                success: false,
                message: json.error?.message || 'Cloudinary Upload Failed',
            };
        }
    } catch (error: any) {
        console.error('Cloudinary Upload Error:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Fetch images from Cloudinary (requires backend proxy for secure API)
 * For client-side, we'll use Admin API via Google Apps Script proxy
 * OR use the Search API with a preset folder
 * 
 * NOTE: Direct Admin API calls require api_secret which should NOT be exposed client-side.
 * For now, we'll store uploaded image URLs in Google Sheets as a simple image library.
 */
export const fetchCloudinaryImages = async (
    cloudName: string,
    folder: string = 'landing-factory'
): Promise<CloudinaryImage[]> => {
    // Client-side listing is not directly supported securely
    // We'll implement this via Google Sheets storage instead
    console.warn('Cloudinary image listing requires server-side proxy. Using local storage fallback.');

    try {
        const stored = localStorage.getItem('cloudinary_images');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading Cloudinary images from localStorage', e);
    }

    return [];
};

/**
 * Save uploaded image to local storage for gallery
 */
export const saveCloudinaryImageToLibrary = (image: CloudinaryImage): void => {
    try {
        const stored = localStorage.getItem('cloudinary_images');
        const images: CloudinaryImage[] = stored ? JSON.parse(stored) : [];

        // Prevent duplicates
        if (!images.find(img => img.public_id === image.public_id)) {
            images.unshift(image); // Add to beginning
            localStorage.setItem('cloudinary_images', JSON.stringify(images.slice(0, 100))); // Keep max 100
        }
    } catch (e) {
        console.error('Error saving Cloudinary image to library', e);
    }
};

/**
 * Remove image from local library (does not delete from Cloudinary)
 */
export const removeCloudinaryImageFromLibrary = (publicId: string): void => {
    try {
        const stored = localStorage.getItem('cloudinary_images');
        if (stored) {
            const images: CloudinaryImage[] = JSON.parse(stored);
            const filtered = images.filter(img => img.public_id !== publicId);
            localStorage.setItem('cloudinary_images', JSON.stringify(filtered));
        }
    } catch (e) {
        console.error('Error removing Cloudinary image from library', e);
    }
};

/**
 * Get all saved Cloudinary images from local library
 */
export const getCloudinaryLibrary = (): CloudinaryImage[] => {
    try {
        const stored = localStorage.getItem('cloudinary_images');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error getting Cloudinary library', e);
        return [];
    }
};
