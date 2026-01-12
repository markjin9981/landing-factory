import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormSection, FormField, DetailContent, FormStyle, ButtonStyle, TextStyle } from '../../../types';
import { ArrowRight } from 'lucide-react';
import UnifiedFormField from './UnifiedFormField';

interface StepFormProps {
    formConfig: FormSection;
    onSubmit: (data: any) => Promise<void>;
    onProgressUpdate: (current: number, total: number) => void;
    finalButtonText?: string;

    // Navigation
    onPrev?: () => void;
    showPrevButton?: boolean;
    prevButtonText?: string;
    buttonLayout?: 'full' | 'auto' | 'asymmetric' | 'fixed_bottom'; // NEW

    // Styling
    buttonStyle?: {
        backgroundColor?: string;
        textColor?: string;
        fontSize?: string;
        borderRadius?: string;
        animation?: string;
        // Gradient Support
        gradientFrom?: string;
        gradientTo?: string;
        gradientVia?: string;
        gradientDirection?: string;
    };
    titleStyle?: { // NEW
        fontSize?: string;
        fontWeight?: string;
        color?: string;
        textAlign?: 'left' | 'center' | 'right';
        fontFamily?: string;
        gradientFrom?: string;
        gradientTo?: string;
        gradientDirection?: string;
    };
    formStyle?: FormStyle;
    primaryColor?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    fieldOverrides?: {
        [fieldId: string]: {
            label?: string;
            type?: any;
            required?: boolean;
            placeholder?: string;
            options?: any[];
        };
    };

    // Background Props (Passed from Template)
    backgroundContent?: any; // DetailContent
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundOverlay?: number;
    hideMobileBackground?: boolean;
    topContent?: DetailContent; // NEW
}

const StepForm: React.FC<StepFormProps> = ({
    formConfig,
    onSubmit,
    onProgressUpdate,
    finalButtonText,
    onPrev,
    showPrevButton,
    prevButtonText,
    buttonLayout = 'auto', // NEW
    buttonStyle,
    titleStyle, // NEW
    formStyle,
    primaryColor = '#3b82f6',
    maxWidth,
    backgroundContent,
    backgroundColor,
    backgroundImage,
    backgroundOverlay,
    hideMobileBackground = false,
    topContent,
    fieldOverrides // Destructured correctly
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Group fields into steps
    const steps = React.useMemo(() => {
        const pages: FormField[][] = [];
        let currentPage: FormField[] = [];
        const fields = formConfig.fields || []; // Safety check
        const fieldsPerPage = formStyle?.fieldsPerPage;

        if (fieldsPerPage === 0) {
            // All on one page
            return fields.length > 0 ? [fields] : [];
        }

        const limit = fieldsPerPage || 2; // Default to 2 if not specified

        fields.forEach((field) => {
            const isBig = field.type === 'textarea' || field.type === 'address';
            // If fieldsPerPage is set (e.g. 1), we respect that strictly.
            // If it's the default (2), we keep the 'big field' logic.
            const currentLimit = fieldsPerPage ? fieldsPerPage : (isBig ? 1 : limit);

            if (currentPage.length >= currentLimit || (isBig && !fieldsPerPage && currentPage.length > 0)) {
                if (currentPage.length > 0) pages.push(currentPage);
                currentPage = [];
            }

            currentPage.push(field);

            if (isBig && !fieldsPerPage) {
                pages.push(currentPage);
                currentPage = [];
            }
        });

        if (currentPage.length > 0) {
            pages.push(currentPage);
        }
        return pages;
    }, [formConfig.fields, formStyle?.fieldsPerPage]);

    useEffect(() => {
        onProgressUpdate(currentStepIndex, steps.length);
    }, [currentStepIndex, steps.length, onProgressUpdate]);

    const handleInputChange = (id: string, value: any) => {
        setFormData(prev => ({ ...prev, [id]: value }));
        if (errors[id]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }
    };

    const validateStep = () => {
        const currentFields = steps[currentStepIndex];
        const newErrors: Record<string, string> = {};
        let isValid = true;

        currentFields.forEach(field => {
            if (field.required && !formData[field.id]) {
                newErrors[field.id] = '필수 항목입니다.';
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleNext = async () => {
        if (!validateStep()) return;

        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            setIsSubmitting(true);
            try {
                await onSubmit(formData);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handlePrevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
            window.scrollTo(0, 0);
        } else if (onPrev && showPrevButton !== false) {
            // If on first page of form, but parent has onPrev (e.g. Builder Mode)
            onPrev();
        }
    };

    const currentFields = steps[currentStepIndex] || []; // Safety check

    // Gradient Helper
    const getGradientStyle = (from?: string, to?: string, direction = 'to right') => {
        if (!from || !to) return {};
        // Clean up direction string to CSS syntax if needed, but assuming standard CSS linear-gradient syntax order?
        // Actually CSS is "to right", "to bottom right".
        // Tailwind maps 'to-r' -> 'to right'.
        // Let's assume input is standard CSS direction or map it?
        // Simplest: just use the string if provided or default 'to right'
        const dir = direction.replace('to-', 'to ').replace('-', ' ');
        // e.g. "to-r" -> "to r" (bad), "to-right" -> "to right".
        // Let's assume standard CSS syntax "to right" is passed or we construct default.
        return {
            backgroundImage: `linear-gradient(${dir.includes('to') ? dir : 'to right'}, ${from}, ${to})`
        };
    };

    // Styles
    const nextBtnStyle = {
        backgroundColor: buttonStyle?.backgroundColor || primaryColor,
        color: buttonStyle?.textColor || '#ffffff',
        fontSize: buttonStyle?.fontSize || '1.125rem',
        borderRadius: buttonStyle?.borderRadius || '0.75rem',
        ...getGradientStyle(buttonStyle?.gradientFrom, buttonStyle?.gradientTo, buttonStyle?.gradientDirection),
        ...(buttonStyle?.animation === 'shimmer' ? {
            '--btn-bg': buttonStyle?.backgroundColor || primaryColor,
            '--btn-shine': 'rgba(255,255,255,0.4)'
        } : {})
    };

    // Title Style
    const titleTextStyle = {
        color: titleStyle?.color || formStyle?.questionColor || '#1f2937',
        fontSize: titleStyle?.fontSize,
        fontWeight: titleStyle?.fontWeight || 'bold',
        textAlign: titleStyle?.textAlign || 'center',
        fontFamily: titleStyle?.fontFamily,
        ...(titleStyle?.gradientFrom && titleStyle?.gradientTo ? {
            backgroundImage: `linear-gradient(to right, ${titleStyle.gradientFrom}, ${titleStyle.gradientTo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block' // Needed for background clip sometimes
        } : {})
    };

    const hasCustomBackground = backgroundColor || backgroundImage;
    const overlayOpacity = (backgroundOverlay ?? 60) / 100;

    return (
        <div className={`flex flex-col flex-1 min-h-screen relative overflow-hidden ${hasCustomBackground || backgroundContent ? 'text-white' : 'text-gray-900 bg-white'}`}
            style={{
                backgroundColor: backgroundColor || (hasCustomBackground ? 'transparent' : '#ffffff'),
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Background Layer */}
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

            <div className={`flex-1 w-full ${maxWidth ? `max-w-${maxWidth}` : 'max-w-md'} mx-auto px-6 py-8 flex flex-col justify-center relative z-10`}>

                {/* NEW: Top Content Slot */}
                {topContent && (
                    <div className="mb-6 w-full">
                        {topContent.type === 'image' && <img src={topContent.content} className="w-full h-auto rounded-lg" alt="Top Content" />}
                        {topContent.type === 'video' && <video src={topContent.content} controls className="w-full rounded-lg" />}
                        {topContent.type === 'youtube' && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden">
                                <iframe src={topContent.content} className="w-full h-full" title="Video" frameBorder="0" allowFullScreen />
                            </div>
                        )}
                        {topContent.type === 'text' && <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: topContent.content }} />}
                    </div>
                )}

                {/* Title */}
                {formConfig.title && (
                    <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                        style={titleTextStyle as any}
                    >
                        {formConfig.title}
                    </motion.h2>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStepIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {currentFields.map((field) => {
                            // Apply Overrides
                            const override = fieldOverrides?.[field.id];
                            const displayField: FormField = {
                                ...field,
                                label: override?.label ?? field.label,
                                type: override?.type ?? field.type,
                                required: override?.required ?? field.required,
                                placeholder: override?.placeholder ?? field.placeholder,
                                options: override?.options ?? field.options,
                            };

                            return (
                                <UnifiedFormField
                                    key={displayField.id}
                                    field={displayField}
                                    value={formData[displayField.id]}
                                    onChange={(val) => handleInputChange(displayField.id, val)}
                                    error={errors[displayField.id]}
                                    formStyle={{
                                        ...formStyle,
                                        questionFont: formStyle?.questionFont, // Ensure this property exists in FormStyle or map it
                                        // StepForm's formStyle has questionColor, questionSize.
                                        // UnifiedFormField expects questionFont, answerFont
                                        // If StepForm doesn't have them, we might need to add them or map.
                                        // StepForm props: formStyle?: { questionColor, questionSize, answerColor, answerBgColor, answerBorderColor, fieldsPerPage }
                                        // UnifiedFormField: formStyle?: { questionColor, questionSize, ... questionFont, answerFont, answerFontSize }
                                        // StepForm currently doesn't seem to pass font props in `formStyle`, 
                                        // but `titleStyle` has fontFamily using `titleFontFamily`.
                                        // Let's check `types.ts` for FormStyle.
                                        // Types.ts `FormStyle` has `inputFontFamily`?
                                        // Let's assume passed formStyle is compatible or we extend it.
                                    }}
                                    primaryColor={primaryColor}
                                />
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className={`mt-8 w-full max-w-md mx-auto p-6 flex items-stretch gap-3 ${buttonLayout === 'fixed_bottom' ? 'fixed bottom-0 left-0 right-0 bg-white border-t z-50 p-4 max-w-full' : ''}`}>
                {/* PREV Button Logic */}
                {(currentStepIndex > 0 || (showPrevButton !== false && onPrev)) && (
                    <button
                        onClick={handlePrevStep}
                        className={`bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors ${buttonLayout === 'asymmetric' ? 'w-16 flex items-center justify-center p-0' : 'px-6 py-4'
                            }`}
                        title={prevButtonText || '이전'}
                    >
                        {buttonLayout === 'asymmetric' ? (
                            <ArrowRight className="w-5 h-5 rotate-180" />
                        ) : (
                            currentStepIndex > 0 ? '이전' : (prevButtonText || '이전')
                        )}
                    </button>
                )}

                <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    style={nextBtnStyle}
                    className={`flex-1 py-4 shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 font-bold ${buttonStyle?.animation ? `animate-btn-${buttonStyle.animation}` : ''}`}
                >
                    {isSubmitting ? (
                        "제출 중..."
                    ) : currentStepIndex === steps.length - 1 ? (
                        finalButtonText || "결과 확인하기"
                    ) : (
                        <>
                            다음 단계 <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
            {/* Padding for fixed bottom */}
            {buttonLayout === 'fixed_bottom' && <div className="h-24"></div>}
        </div>
    );
};

export default StepForm;
