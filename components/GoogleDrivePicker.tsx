import React, { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const GOOGLE_API_KEY = (import.meta as any).env.VITE_GOOGLE_API_KEY;

// Define types for global Google API objects
declare global {
    interface Window {
        google?: any;
        gapi?: any;
    }
}

// Declare google variable to avoid 'Cannot find name' error
declare const google: any;

interface GoogleDrivePickerProps {
    onSelect: (url: string) => void;
    buttonText?: string;
    className?: string; // For custom styling
}

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onSelect, buttonText = "구글 드라이브에서 선택", className }) => {
    const [pickerApiLoaded, setPickerApiLoaded] = useState(false);

    useEffect(() => {
        // Load the Google Picker API script dynamically
        if (window.google && window.google.picker) {
            setPickerApiLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => {
            // @ts-ignore
            window.gapi.load('picker', { callback: () => setPickerApiLoaded(true) });
        };
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); }
    }, []);


    // Login to get OAuth Token
    const login = useGoogleLogin({
        onSuccess: (codeResponse) => {
            if (codeResponse.access_token) {
                createPicker(codeResponse.access_token);
            }
        },
        onError: (error) => console.log('Login Failed:', error),
        scope: 'https://www.googleapis.com/auth/drive.readonly', // Read-only access to Drive
    });

    const createPicker = (accessToken: string) => {
        if (!pickerApiLoaded || !GOOGLE_API_KEY) {
            console.error("Picker API not loaded or API Key missing");
            return;
        }

        // @ts-ignore
        const view = new google.picker.View(google.picker.ViewId.DOCS_IMAGES); // Show Images only
        view.setMimeTypes("image/png,image/jpeg,image/jpg,image/webp"); // Filter images

        // @ts-ignore
        const picker = new google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(accessToken)
            .setDeveloperKey(GOOGLE_API_KEY)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    }

    const pickerCallback = (data: any) => {
        // @ts-ignore
        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
            // @ts-ignore
            const doc = data[google.picker.Response.DOCUMENTS][0];

            // Use 'webContentLink' for full download link, or 'thumbnailLink' for thumbnails.
            // Note: webContentLink sometimes forces download. 
            // Often 'thumbnailLink' with modified size parameter is better for display, 
            // OR we can use the file ID to construct a specific View URL.
            // Let's try 'thumbnailLink' but replace the size (e.g. =s220) with a larger one (=s1600)
            // Or 'webContentLink'. 

            // For now, let's use a known reliable trick:
            // https://drive.google.com/uc?export=view&id={FILE_ID} 
            // This is the "direct link" format often used.
            const fileId = doc[google.picker.Document.ID];
            const directLink = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
            // Note: 'thumbnail?id=...&sz=w1000' provides a high-res image and avoids the "virus scan" warning page of export=view for large files.

            onSelect(directLink);
        }
    }

    return (
        <button
            onClick={() => login()}
            className={className || "px-3 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-2"}
            type="button"
        >
            {/* Drive Icon */}
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-4 h-4" />
            {buttonText}
        </button>
    );
};

export default GoogleDrivePicker;
