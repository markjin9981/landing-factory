import React from 'react';
import { DetailContent } from '../../../types';
import KakaoMap from '../../KakaoMap';

interface StepContentProps {
    content: DetailContent;
    onNext: () => void;
    nextButtonText?: string;

    // New Props
    onPrev?: () => void;
    showPrevButton?: boolean;
    prevButtonText?: string;
    buttonStyle?: {
        backgroundColor?: string;
        textColor?: string;
        fontSize?: string;
        borderRadius?: string;
    };
    primaryColor?: string;
}

const StepContent: React.FC<StepContentProps> = ({
    content,
    onNext,
    nextButtonText,
    onPrev,
    showPrevButton,
    prevButtonText,
    buttonStyle,
    primaryColor = '#3b82f6'
}) => {

    const renderInner = () => {
        // ... (Keep existing simple switch case if possible, but I'm rewriting the file mostly to wrap it)
        switch (content.type) {
            case 'image':
                return (
                    <img
                        src={content.content}
                        className="w-full h-auto rounded-lg shadow-sm"
                        alt="Content"
                    />
                );

            case 'youtube':
                // Simple ID extraction if full URL is pasted
                let videoId = content.content;
                if (videoId.includes('v=')) videoId = videoId.split('v=')[1].split('&')[0];
                else if (videoId.includes('youtu.be/')) videoId = videoId.split('youtu.be/')[1];

                return (
                    <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden bg-black shadow-lg">
                        <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=${content.autoPlay ? 1 : 0}&modestbranding=1&rel=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                );

            case 'map':
                return (
                    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg border border-gray-100">
                        <KakaoMap address={content.content} placeName={content.mapPlaceName} />
                        <div className="bg-white p-3 text-sm text-gray-600 text-center border-t">
                            {content.mapPlaceName || '위치 정보'}
                        </div>
                    </div>
                );

            case 'banner':
                return (
                    <div
                        style={{
                            height: content.bannerStyle?.height || '300px',
                            backgroundColor: content.bannerStyle?.backgroundColor || '#f3f4f6',
                            backgroundImage: content.bannerStyle?.backgroundImage ? `url(${content.bannerStyle.backgroundImage})` : undefined,
                        }}
                        className="w-full flex items-center justify-center relative bg-cover bg-center rounded-lg overflow-hidden shadow-sm"
                    >
                        {/* Overlay */}
                        <div
                            className="absolute inset-0 bg-black"
                            style={{ opacity: content.bannerStyle?.overlayOpacity || 0 }}
                        />
                        {/* Content */}
                        <div
                            className="relative z-10 p-6 whitespace-pre-wrap"
                            style={{
                                color: content.bannerStyle?.textColor || '#000',
                                textAlign: (content.bannerStyle?.textAlign as any) || 'center',
                                fontSize: content.bannerStyle?.fontSize || '1.5rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {content.content}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Style Helper
    const customButtonStyle = {
        backgroundColor: buttonStyle?.backgroundColor || primaryColor,
        color: buttonStyle?.textColor || '#ffffff',
        fontSize: buttonStyle?.fontSize || '1.125rem', // text-lg
        borderRadius: buttonStyle?.borderRadius || '0.75rem', // rounded-xl
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Main Scrollable Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 pb-28">
                <div className="w-full max-w-screen-md">
                    {renderInner()}
                </div>
            </div>

            {/* Fixed Bottom Button Area */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 safe-area-bottom">
                <div className="max-w-md mx-auto flex gap-3">
                    {/* Prev Button */}
                    {(showPrevButton && onPrev) && (
                        <button
                            onClick={onPrev}
                            className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            {prevButtonText || '이전'}
                        </button>
                    )}

                    {/* Next Button */}
                    <button
                        onClick={onNext}
                        style={customButtonStyle}
                        className="flex-1 py-4 font-bold shadow-lg transform active:scale-95 transition-all"
                    >
                        {nextButtonText || '다음으로'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepContent;
