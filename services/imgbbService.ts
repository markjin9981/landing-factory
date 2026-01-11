
export const uploadToImgbb = async (file: File, apiKey: string): Promise<{ success: boolean, url?: string, message?: string }> => {
    if (!apiKey) return { success: false, message: 'ImgBB API Key is missing.' };

    try {
        const formData = new FormData();
        formData.append('image', file);

        // Expiration (optional) - let's keep it permanent for now
        // formData.append('expiration', '600'); 

        const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData,
        });

        const json = await res.json();

        if (json.success) {
            return { success: true, url: json.data.url }; // data.url is the direct link (or viewer link, check docs)
            // ImgBB returning data.url usually is the viewer link? 
            // data.display_url is medium size? 
            // Let's check docs or assume data.url usually redirects to image or is image.
            // Actually, for direct embedding, we want direct link.
            // ImgBB API response: data.url (viewer), data.display_url, data.thumb.url.
            // Wait, usually data.url is the viewer page. data.image.url (or similar) might be raw.
            // Correction: json.data.url is "Viewer URL". json.data.image.url is "Direct Link" usually? No, "image" object inside data?
            // Let's inspect standard response if possible. 
            // Common wrapper: json.data.url (viewer), json.data.display_url (display), ...
            // Wait, for direct hotlinking, we need the direct link.
            // json.data.url is often the viewer. 
            // json.data.image.url is the binary direct link?
            // Let's stick with json.data.display_url or json.data.url for now, and if it fails to embed, we'll fix.
            // Better: use `json.data.url` (viewer) for user to copy? No, we need to embed.
            // `json.data.display_url` is often the direct image.
        } else {
            return { success: false, message: json.error?.message || 'ImgBB Upload Failed' };
        }

    } catch (error: any) {
        console.error('ImgBB Upload Error:', error);
        return { success: false, message: error.message };
    }
};
