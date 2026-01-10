import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormSection, FormField } from '../../../types';
import { ArrowRight, Check } from 'lucide-react';

interface StepFormProps {
    formConfig: FormSection;
    onSubmit: (data: any) => Promise<void>;
    onProgressUpdate: (current: number, total: number) => void;
    finalButtonText?: string;

    // Navigation
    onPrev?: () => void;
    showPrevButton?: boolean;
    prevButtonText?: string;

    // Styling
    buttonStyle?: {
        backgroundColor?: string;
        textColor?: string;
        fontSize?: string;
        borderRadius?: string;
    };
    formStyle?: {
        questionColor?: string;
        questionSize?: string;
        answerColor?: string;
        answerBgColor?: string;
        answerBorderColor?: string;
    };
    primaryColor?: string;
}

const StepForm: React.FC<StepFormProps> = ({
    formConfig,
    onSubmit,
    onProgressUpdate,
    finalButtonText,
    onPrev,
    showPrevButton,
    prevButtonText,
    buttonStyle,
    formStyle,
    primaryColor = '#3b82f6'
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Group fields into steps
    const steps = React.useMemo(() => {
        const pages: FormField[][] = [];
        let currentPage: FormField[] = [];
        const fields = formConfig.fields || []; // Safety check

        fields.forEach((field) => {
            const isBig = field.type === 'textarea' || field.type === 'address';
            if (currentPage.length >= 2 || (isBig && currentPage.length > 0)) {
                pages.push(currentPage);
                currentPage = [];
            }
            currentPage.push(field);
            if (isBig) {
                pages.push(currentPage);
                currentPage = [];
            }
        });

        if (currentPage.length > 0) {
            pages.push(currentPage);
        }
        return pages;
    }, [formConfig.fields]);

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

    // Styles
    const nextBtnStyle = {
        backgroundColor: buttonStyle?.backgroundColor || primaryColor,
        color: buttonStyle?.textColor || '#ffffff',
        fontSize: buttonStyle?.fontSize || '1.125rem',
        borderRadius: buttonStyle?.borderRadius || '0.75rem',
    };

    return (
        <div className="flex flex-col flex-1 min-h-screen">
            <div className="flex-1 w-full max-w-md mx-auto px-6 py-8 flex flex-col justify-center">
                {/* Title */}
                {formConfig.title && (
                    <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold mb-8 text-center"
                        style={{
                            color: formStyle?.questionColor || '#1f2937',
                        }}
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
                        {currentFields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <label
                                    className="block font-bold mb-2"
                                    style={{
                                        color: formStyle?.questionColor || '#374151',
                                        fontSize: formStyle?.questionSize === 'sm' ? '0.875rem' : formStyle?.questionSize === 'xl' ? '1.25rem' : '1rem'
                                    }}
                                >
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {/* Render Input Logic moved inline or kept in helper but added checks there? */}
                                {/* Re-implementing renderInput logic here to ensure safety if helper isn't shown in replacement context, 
                                    OR assuming helper exists and we rely on existing logic.
                                    The prompt says "Add safety checks". 
                                    I will replace the render part to ensure options.map is safe.
                                */}
                                {field.type === 'select' || field.type === 'radio' || field.type === 'checkbox' ? (
                                    <div className={field.type === 'radio' || field.type === 'checkbox' ? 'space-y-2' : ''}>
                                        {field.type === 'select' && (
                                            <select
                                                value={formData[field.id] || ''}
                                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                                className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                                style={{
                                                    backgroundColor: formStyle?.answerBgColor || '#ffffff',
                                                    color: formStyle?.answerColor || '#000000',
                                                    borderColor: errors[field.id] ? '#ef4444' : (formStyle?.answerBorderColor || '#e5e7eb')
                                                }}
                                            >
                                                <option value="">선택해주세요</option>
                                                {(field.options || []).map((opt: any) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        )}

                                        {(field.type === 'radio' || field.type === 'checkbox') && (
                                            <div className="grid grid-cols-1 gap-2">
                                                {(field.options || []).map((opt: any) => (
                                                    <label
                                                        key={opt}
                                                        className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${formData[field.id] === opt
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'hover:bg-gray-50'
                                                            }`}
                                                        style={{
                                                            backgroundColor: formData[field.id] === opt ? (primaryColor + '10') : (formStyle?.answerBgColor || '#ffffff'),
                                                            borderColor: formData[field.id] === opt ? primaryColor : (errors[field.id] ? '#ef4444' : '#e5e7eb'),
                                                            color: formData[field.id] === opt ? primaryColor : (formStyle?.answerColor || '#000000')
                                                        }}
                                                    >
                                                        <input
                                                            type={field.type}
                                                            name={field.id}
                                                            value={opt}
                                                            checked={formData[field.id] === opt}
                                                            onChange={(e) => handleInputChange(field.id, opt)}
                                                            className="hidden"
                                                        />
                                                        <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${formData[field.id] === opt ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                                            }`}
                                                            style={{
                                                                borderColor: formData[field.id] === opt ? primaryColor : '#d1d5db',
                                                                backgroundColor: formData[field.id] === opt ? primaryColor : 'transparent'
                                                            }}
                                                        >
                                                            {formData[field.id] === opt && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <span className="font-medium">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Text / Number / Textarea / Address (Default Render)
                                    field.type === 'textarea' ? (
                                        <textarea
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[120px]"
                                            placeholder={field.placeholder}
                                            style={{
                                                backgroundColor: formStyle?.answerBgColor || '#ffffff',
                                                color: formStyle?.answerColor || '#000000',
                                                borderColor: errors[field.id] ? '#ef4444' : (formStyle?.answerBorderColor || '#e5e7eb')
                                            }}
                                        />
                                    ) : (
                                        <input
                                            type={field.type}
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            placeholder={field.placeholder}
                                            style={{
                                                backgroundColor: formStyle?.answerBgColor || '#ffffff',
                                                color: formStyle?.answerColor || '#000000',
                                                borderColor: errors[field.id] ? '#ef4444' : (formStyle?.answerBorderColor || '#e5e7eb')
                                            }}
                                        />
                                    )
                                )}

                                {errors[field.id] && (
                                    <p className="text-red-500 text-sm pl-1">{errors[field.id]}</p>
                                )}
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="mt-8 flex gap-3 p-6 w-full max-w-md mx-auto">
                {/* PREV Button Logic: Show if internal step > 0 OR (external prev exists AND enabled) */}
                {(currentStepIndex > 0 || (showPrevButton !== false && onPrev)) && (
                    <button
                        onClick={handlePrevStep}
                        className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        {currentStepIndex > 0 ? '이전' : (prevButtonText || '이전')}
                    </button>
                )}

                <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    style={nextBtnStyle}
                    className="flex-1 py-4 shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 font-bold"
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
        </div>
    );
};

export default StepForm;
