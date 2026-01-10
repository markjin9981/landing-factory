import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormSection, FormField } from '../../../types';
import { ArrowRight, Check } from 'lucide-react';

interface StepFormProps {
    formConfig: FormSection;
    onSubmit: (data: any) => Promise<void>;
    onProgressUpdate: (current: number, total: number) => void;
}

const StepForm: React.FC<StepFormProps> = ({ formConfig, onSubmit, onProgressUpdate }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Group fields into steps (automagically)
    // Logic: 1 textarea = 1 page. 2 normal fields = 1 page.
    const steps = React.useMemo(() => {
        const pages: FormField[][] = [];
        let currentPage: FormField[] = [];

        formConfig.fields.forEach((field) => {
            const isBig = field.type === 'textarea' || field.type === 'address';

            // If current page is full or this is a big field and page not empty, push page
            if (currentPage.length >= 2 || (isBig && currentPage.length > 0)) {
                pages.push(currentPage);
                currentPage = [];
            }

            currentPage.push(field);

            // If big field, push immediately
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
        // Clear error
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
            // Add more validation like email/phone regex here if needed
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleNext = async () => {
        if (!validateStep()) return;

        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            // Last Step - Submit
            setIsSubmitting(true);
            await onSubmit(formData);
            setIsSubmitting(false);
        }
    };

    const currentFields = steps[currentStepIndex];

    return (
        <div className="flex flex-col flex-1 w-full max-w-md mx-auto px-6 pt-24 pb-10 min-h-screen">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStepIndex}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1"
                >
                    <h2 className="text-2xl font-bold mb-8 text-gray-800">
                        {currentStepIndex === steps.length - 1 ? "마지막 단계입니다" : `Step ${currentStepIndex + 1}`}
                    </h2>

                    <div className="space-y-6">
                        {currentFields.map(field => (
                            <div key={field.id} className="space-y-2">
                                <label className="block text-lg font-medium text-gray-700">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {renderInput(field, formData[field.id], (val) => handleInputChange(field.id, val))}

                                {errors[field.id] && (
                                    <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="mt-8">
                <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl text-lg font-bold shadow-lg hover:bg-gray-800 transform active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        "제출 중..."
                    ) : currentStepIndex === steps.length - 1 ? (
                        "결과 확인하기" // Last step text
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

// Input Renderer Helper
const renderInput = (
    field: FormField,
    value: any,
    onChange: (val: any) => void
) => {
    const commonClasses = "w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white";

    switch (field.type) {
        case 'select':
            return (
                <div className="grid grid-cols-1 gap-2">
                    {field.options?.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onChange(opt.value)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${value === opt.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <span>{opt.label}</span>
                                {value === opt.value && <Check className="w-5 h-5 text-blue-500" />}
                            </div>
                        </button>
                    ))}
                </div>
            ); // Custom select buttons for better mobile UX

        case 'radio':
            return (
                <div className="flex flex-col gap-3">
                    {field.options?.map((opt) => (
                        <label key={opt.value} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer ${value === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                            <input
                                type="radio"
                                name={field.id}
                                value={opt.value}
                                checked={value === opt.value}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-3 font-medium text-gray-700">{opt.label}</span>
                        </label>
                    ))}
                </div>
            );

        case 'textarea':
            return (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className={`${commonClasses} min-h-[150px]`}
                />
            );

        default: // text, tel, email, etc.
            return (
                <input
                    type={field.type}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className={commonClasses}
                />
            );
    }
};

export default StepForm;
