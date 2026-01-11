import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HeroSection, DetailContent, FormField, FormSection } from '../../../types';
import { ArrowRight } from 'lucide-react';
import EmbeddedForm from './EmbeddedForm';

interface StepHeroProps {
    heroConfig: HeroSection;
    onStart: (stepData?: any) => void;
    primaryColor: string;
    buttonStyle?: {
        backgroundColor?: string;
        textColor?: string;
        fontSize?: string;
        borderRadius?: string;
        fontFamily?: string;
        fontWeight?: string;
        animation?: string;
    };
    backgroundContent?: DetailContent;
    insertedContent?: DetailContent;
    hideTitle?: boolean;
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
}

const StepHero: React.FC<StepHeroProps> = ({
    heroConfig,
    onStart,
    primaryColor,
    buttonStyle,
    backgroundContent,
    insertedContent,
    hideTitle,
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
    mediaStyles
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

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

    const handleStart = () => {
        if (validateFields()) {
            onStart(formData);
        }
    };

    // Determine background styling
    const hasCustomBackground = backgroundColor || backgroundImage;
    const overlayOpacity = (backgroundOverlay ?? 60) / 100;

    const customBtnStyle = {
        background: buttonStyle?.backgroundColor || primaryColor,
        color: buttonStyle?.textColor || '#ffffff',
        fontSize: buttonStyle?.fontSize,
        borderRadius: buttonStyle?.borderRadius,
        fontFamily: buttonStyle?.fontFamily,
        fontWeight: buttonStyle?.fontWeight,
    };

    return (
        <div
            className="relative w-full min-h-screen overflow-hidden text-white flex flex-col justify-center items-center px-6 text-center"
            style={{
                backgroundColor: backgroundColor || undefined,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Background Layer */}
            {hasCustomBackground && (
                <div
                    className="absolute inset-0 bg-black z-0"
                    style={{ opacity: overlayOpacity }}
                />
            )}

            {!hasCustomBackground && backgroundContent && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={((backgroundContent.type as any) === 'image' || (backgroundContent.type as any) === 'banner')
                            ? backgroundContent.content
                            : ((backgroundContent.type as any) === 'youtube'
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

            {!hasCustomBackground && !backgroundContent && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0" />
            )}

            {/* Content Layer */}
            <div className={`relative z-10 w-full px-6 py-20 flex flex-col items-center justify-center min-h-screen`}>
                <div className={`w-full ${maxWidth ? `max-w-${maxWidth}` : 'max-w-lg'} flex flex-col items-center`}>
                    {!hideTitle && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block mb-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
                            style={subtitleStyle}
                        >
                            <span className="text-sm font-semibold tracking-wide">
                                {heroConfig.subHeadline || "무료 자가진단"}
                            </span>
                        </motion.div>
                    )}

                    {!hideTitle && (
                        <h1
                            className="text-4xl md:text-5xl font-bold leading-tight mb-8"
                            style={{
                                ...titleStyle,
                                textShadow: '0 0 40px rgba(59, 130, 246, 0.5)',
                                whiteSpace: 'pre-line'
                            }}
                        >
                            {heroConfig.headline}
                        </h1>
                    )}

                    {/* Inserted Media Content */}
                    {insertedContent && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="w-full mb-10 rounded-2xl overflow-hidden shadow-2xl relative bg-black/20 border border-white/10"
                        >
                            <div
                                className="mx-auto overflow-y-auto"
                                style={{
                                    width: mediaStyles?.pcWidth || '100%',
                                    height: mediaStyles?.pcHeight || 'auto',
                                    maxHeight: mediaStyles?.pcHeight && mediaStyles.pcHeight !== 'auto' ? mediaStyles.pcHeight : '60vh',
                                }}
                            >
                                {insertedContent.type === 'video' ? (
                                    <video
                                        src={insertedContent.content}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <img
                                        src={insertedContent.content}
                                        className="w-full h-full object-contain"
                                        alt="Hero Content"
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Embedded Form Fields */}
                    {embeddedFields.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="w-full text-left bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 mb-8"
                        >
                            <EmbeddedForm
                                fields={embeddedFields}
                                formData={formData}
                                onChange={onDataChange}
                                errors={errors}
                                formStyle={formStyle}
                                primaryColor={primaryColor}
                            />
                        </motion.div>
                    )}

                    {/* CTA Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStart}
                        style={customBtnStyle}
                        className={`group relative w-full max-w-xs mx-auto py-4 px-8 rounded-xl shadow-xl flex items-center justify-center gap-2 font-bold ${!buttonStyle?.backgroundColor ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-500/30' : ''} ${buttonStyle?.animation ? `animate-btn-${buttonStyle.animation}` : ''}`}
                    >
                        <span>{heroConfig.ctaText || "진단 시작하기"}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>

                    <p className="mt-6 text-gray-400 text-sm">
                        3분이면 충분합니다 • 100% 무료
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StepHero;
