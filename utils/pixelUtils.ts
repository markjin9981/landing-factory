import { PixelConfig } from '../types';

export const trackConversion = (config?: PixelConfig) => {
    if (!config) return;

    // 1. Facebook Lead
    if (config.facebookPixelId && (window as any).fbq) {
        (window as any).fbq('track', 'Lead');
    }

    // 2. Kakao Conversion
    if (config.kakaoPixelId && (window as any).kakaoPixel) {
        (window as any).kakaoPixel(config.kakaoPixelId).pageView(); // Example, or specific conversion event
        // Kakao often uses 'purchase' or custom events
        // (window as any).kakaoPixel(config.kakaoPixelId).completeRegistration(); 
        // We'll assume completeRegistration or purchase
        try {
            (window as any).kakaoPixel(config.kakaoPixelId).participation(); // Participation/Lead
        } catch (e) {
            console.error("Kakao pixel error", e);
        }
    }

    // 3. TikTok Submit
    if (config.tiktokPixelId && (window as any).ttq) {
        (window as any).ttq.track('SubmitForm');
    }

    // 4. Google Analytics Conversion
    // GA4 often tracks 'generate_lead' automatically if event is configured, but we can send explicit event
    if (config.googleAnalyticsId && (window as any).gtag) {
        (window as any).gtag('event', 'generate_lead', {
            'event_category': 'form',
            'event_label': 'submission'
        });
    }

    console.log("Conversion tracked for:", config);
};
