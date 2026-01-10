import React, { useState } from 'react';
import { LandingConfig, LeadData } from '../../../types';
import StepHero from './StepHero';
import StepForm from './StepForm';
import StepProgress from './StepProgress';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicStepTemplateProps {
    config: LandingConfig;
    onSubmit: (data: LeadData) => Promise<void>;
}

const DynamicStepTemplate: React.FC<DynamicStepTemplateProps> = ({ config, onSubmit }) => {
    const [viewState, setViewState] = useState<'hero' | 'form' | 'success'>('hero');
    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(0);

    const handleStart = () => {
        setViewState('form');
    };

    const handleFormSubmit = async (formData: any) => {
        // Transform flat form data to LeadData structure if needed
        // For now, we pass it through, but we might need to add timestamp, etc here if the parent doesn't handle it.
        // However, the parent LandingPage usually constructs the LeadData. 
        // Let's assume the parent 'onSubmit' expects the raw data or we construct a partial LeadData.
        // The LandingPage.tsx `handleLeadSubmit` expects `LeadData`.

        // We should construct a proper LeadData object
        const leadData: LeadData = {
            timestamp: new Date().toISOString(),
            landing_id: config.id,
            name: formData.name || 'Anonymous', // Fallback
            phone: formData.phone || '',
            user_agent: navigator.userAgent,
            referrer: document.referrer,
            ...formData // Spread other dynamic fields
        };

        await onSubmit(leadData);
        setViewState('success');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
            <AnimatePresence mode="wait">

                {/* HERO VIEW */}
                {viewState === 'hero' && (
                    <motion.div
                        key="hero"
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.5 }}
                    >
                        <StepHero
                            heroConfig={config.hero}
                            onStart={handleStart}
                            primaryColor={config.theme.primaryColor}
                        />
                    </motion.div>
                )}

                {/* FORM VIEW */}
                {viewState === 'form' && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-screen flex flex-col"
                    >
                        <StepProgress currentStep={currentStep} totalSteps={totalSteps} />
                        <StepForm
                            formConfig={config.formConfig}
                            onSubmit={handleFormSubmit}
                            onProgressUpdate={(curr, total) => {
                                setCurrentStep(curr);
                                setTotalSteps(total);
                            }}
                        />
                    </motion.div>
                )}

                {/* SUCCESS VIEW */}
                {viewState === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <motion.div
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1 }}
                            >
                                <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.div>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">제출이 완료되었습니다!</h2>
                        <p className="text-gray-600 max-w-sm">
                            담당자가 내용을 확인 후 빠르게 연락드리겠습니다.<br />
                            감사합니다.
                        </p>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};

export default DynamicStepTemplate;
