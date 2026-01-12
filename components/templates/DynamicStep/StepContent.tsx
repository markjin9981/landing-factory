import React, { useState } from 'react';
import { DetailContent, FormField, FormSection } from '../../../types';
import KakaoMap from '../../KakaoMap';
import EmbeddedForm from './EmbeddedForm';

interface StepContentProps {
    content: DetailContent;
    onNext: (stepData?: any) => void;
    nextButtonText?: string;
    onPrev?: () => void;
    showPrevButton?: boolean;
    prevButtonText?: string;
    buttonStyle?: {
        backgroundColor?: string;
        textColor?: string;
        fontSize?: string;
        borderRadius?: string;
        fontFamily?: string;
        fontWeight?: string;
        animation?: string;
    };
    primaryColor?: string;
    backgroundContent?: DetailContent;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundOverlay?: number;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    titleStyle?: any;
    subtitleStyle?: any;
    // New props for embedded form and media styling
    formData?: any;
    onDataChange?: (id: string, value: any) => void;
    embeddedFields?: FormField[];
    formConfig?: FormSection;
    formStyle?: any;
    mediaStyles?: {
        pcWidth?: string;
        pcHeight?: string;
        mobileWidth?: string;
        mobileHeight?: string;
    };
    fieldOverrides?: {    // NEW
        [fieldId: string]: {
            label?: string;
            type?: any;
            required?: boolean;
            placeholder?: string;
            options?: any[];
        };
    };
    hideMobileBackground?: boolean; // NEW
}

const StepContent: React.FC<StepContentProps> = ({
    content,
    onNext,
    nextButtonText,
    onPrev,
    showPrevButton,
    prevButtonText,
    buttonStyle,
    primaryColor = '#3b82f6',
    backgroundContent,
    backgroundColor,
    backgroundImage,
    backgroundOverlay,
    maxWidth,
    titleStyle,
    subtitleStyle,
    formData = {},
    onDataChange = () => { },
    embeddedFields = [],
    formStyle,
    mediaStyles,
    hideMobileBackground = false // NEW
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isMobile, setIsMobile] = useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const validateFields = () => {
        const newErrors: Record<string, string> = {};
        embeddedFields.forEach(field => {
            if (field.required && !formData[field.id]) {
                newErrors[field.id] = `필수 항목을 입력해주세요.`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateFields()) {
            onNext(formData);
        }
    };

    const renderInner = () => {
        const mediaContainerStyle = {
            width: isMobile
                ? (hideMobileBackground ? '100vw' : (mediaStyles?.mobileWidth || '100%'))
                : (mediaStyles?.pcWidth || '100%'),
            height: isMobile
                ? (hideMobileBackground ? 'auto' : (mediaStyles?.mobileHeight || 'auto'))
                : (mediaStyles?.pcHeight || 'auto'),
            maxHeight: isMobile
                ? (hideMobileBackground ? '80vh' : (mediaStyles?.mobileHeight && mediaStyles.mobileHeight !== 'auto' ? 'none' : '70vh'))
                : (mediaStyles?.pcHeight && mediaStyles.pcHeight !== 'auto' ? 'none' : '70vh'),
            overflowY: 'auto' as const
        };

        switch (content.type) {
            case 'image':
                return (
                    <div className="mx-auto" style={mediaContainerStyle}>
                        <img src={content.content} className="w-full h-auto rounded-lg shadow-sm" alt="Content" />
                    </div>
                );
            case 'video':
                return (
                    <div className="mx-auto" style={mediaContainerStyle}>
                        <video
                            src={content.content}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-auto rounded-lg shadow-sm"
                        />
                    </div>
                );
            case 'youtube':
                let videoId = content.content;
                if (videoId.includes('v=')) videoId = videoId.split('v=')[1].split('&')[0];
                else if (videoId.includes('youtu.be/')) videoId = videoId.split('youtu.be/')[1];
                return (
                    <div className="mx-auto" style={mediaContainerStyle}>
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
                    </div>
                );
            case 'map':
                return (
                    <div className="mx-auto" style={mediaContainerStyle}>
                        <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg border border-gray-100">
                            <KakaoMap address={content.content} placeName={content.mapPlaceName} />
                            <div className="bg-white p-3 text-sm text-gray-600 text-center border-t">
                                {content.mapPlaceName || '위치 정보'}
                            </div>
                        </div>
                    </div>
                );
            case 'banner':
                return (
                    <div className="mx-auto" style={mediaContainerStyle}>
                        <div
                            style={{
                                height: content.bannerStyle?.height || '300px',
                                backgroundColor: content.bannerStyle?.backgroundColor || '#f3f4f6',
                                backgroundImage: content.bannerStyle?.backgroundImage ? `url(${content.bannerStyle.backgroundImage})` : undefined,
                            }}
                            className="w-full flex items-center justify-center relative bg-cover bg-center rounded-lg overflow-hidden shadow-sm"
                        >
                            <div className="absolute inset-0 bg-black" style={{ opacity: content.bannerStyle?.overlayOpacity || 0 }} />
                            <div className="relative z-10 p-6 whitespace-pre-wrap" style={{ color: content.bannerStyle?.textColor || '#000', textAlign: (content.bannerStyle?.textAlign as any) || 'center', fontSize: content.bannerStyle?.fontSize || '1.5rem', fontWeight: 'bold' }}>
                                {content.content}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const customButtonStyle = {
        backgroundColor: buttonStyle?.backgroundColor || primaryColor,
        color: buttonStyle?.textColor || '#ffffff',
        fontSize: buttonStyle?.fontSize || '1.125rem',
        borderRadius: buttonStyle?.borderRadius || '0.75rem',
    };

    const hasCustomBackground = backgroundColor || backgroundImage;
    const overlayOpacity = (backgroundOverlay ?? 60) / 100;

    return (
        <div
            className={`relative w-full min-h-screen flex flex-col overflow-x-hidden ${hasCustomBackground || backgroundContent ? 'bg-gray-900' : 'bg-gray-50'}`}
            style={{
                backgroundColor: backgroundColor || undefined,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Background Layer -- Mobile conditional */}
            {hasCustomBackground && (!isMobile || !hideMobileBackground) && (
                <div
                    className="absolute inset-0 z-0 bg-black"
                    style={{ opacity: overlayOpacity }}
                />
            )}

            {!hasCustomBackground && backgroundContent && (!isMobile || !hideMobileBackground) && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={(backgroundContent.type === 'image' || backgroundContent.type === 'banner')
                            ? backgroundContent.content
                            : (backgroundContent.type === 'youtube'
                                ? `https://img.youtube.com/vi/${backgroundContent.content}/maxresdefault.jpg`
                                : '')
                        }
                        alt="Background"
                        className="w-full h-full object-cover opacity-60"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                </div>
            )}

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col items-center justify-center p-4 pb-28 relative z-10 ${(isMobile && hideMobileBackground) ? '!p-0' : ''}`}>
                <div className={`w-full ${maxWidth ? `max-w-${maxWidth}` : 'max-w-screen-md'} space-y-8 ${(isMobile && hideMobileBackground) ? '!w-full' : ''}`}>
                    {renderInner()}

                    {embeddedFields.length > 0 && (
                        <div className={`p-6 rounded-2xl border mb-8 ${(isMobile && hideMobileBackground) ? 'mx-4' : ''} ${(hasCustomBackground || backgroundContent) ? 'bg-white/5 border-white/10 backdrop-blur-md' : 'bg-gray-50 border-gray-100'}`}>
                            <EmbeddedForm
                                fields={embeddedFields}
                                formData={formData}
                                onChange={onDataChange}
                                errors={errors}
                                formStyle={formStyle}
                                primaryColor={primaryColor}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Button Area */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 z-50 safe-area-bottom ${(hasCustomBackground || backgroundContent) ? 'bg-gradient-to-t from-black/80 to-transparent' : 'bg-white border-t'}`}>
                <div className="max-w-md mx-auto flex gap-3">
                    {(showPrevButton !== false && onPrev) && (
                        <button
                            onClick={onPrev}
                            className={`px-6 py-4 rounded-xl font-bold transition-all ${(hasCustomBackground || backgroundContent) ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {prevButtonText || '이전'}
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        style={customButtonStyle}
                        className={`flex-1 py-4 font-bold shadow-lg transform active:scale-95 transition-all ${buttonStyle?.animation ? `animate-btn-${buttonStyle.animation}` : ''}`}
                    >
                        {nextButtonText || '다음으로'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepContent;
