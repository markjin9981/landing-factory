import React, { useState } from 'react';
import { LandingConfig, LeadData } from '../../../types';
import StepHero from './StepHero';
import StepForm from './StepForm';
import StepContent from './StepContent';
import StepOutro from './StepOutro';
import StepProgress from './StepProgress';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicStepTemplateProps {
    config: LandingConfig;
    onSubmit: (data: LeadData) => Promise<void>;
}

const DynamicStepTemplate: React.FC<DynamicStepTemplateProps> = ({ config, onSubmit }) => {
    // 1. Check if we are in "Builder Mode" (Custom Steps)
    const isBuilderMode = config.steps && config.steps.length > 0;

    // --- LEGACY STATE ---
    const [viewState, setViewState] = useState<'hero' | 'form' | 'success'>('hero');
    const [legacyStep, setLegacyStep] = useState(0);
    const [legacyTotal, setLegacyTotal] = useState(0);

    // --- BUILDER STATE ---
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [accumulatedData, setAccumulatedData] = useState<any>({});
    const [builderFinished, setBuilderFinished] = useState(false);

    // --- HANDLERS (LEGACY) ---
    const handleLegacyStart = () => {
        setViewState('form');
    };

    const handleLegacySubmit = async (formData: any) => {
        const leadData: LeadData = {
            timestamp: new Date().toISOString(),
            landing_id: config.id,
            name: formData.name || 'Anonymous',
            phone: formData.phone || '',
            user_agent: navigator.userAgent,
            referrer: document.referrer,
            ...formData
        };
        await onSubmit(leadData);
        setViewState('success');
    };

    // --- HANDLERS (BUILDER) ---
    const handleBuilderNext = async (stepData: any = {}) => {
        const newData = { ...accumulatedData, ...stepData };
        setAccumulatedData(newData);

        if (config.steps && currentStepIdx < config.steps.length - 1) {
            // Check if next step is valid (e.g. not outro in middle? No, builder allows free order)
            setCurrentStepIdx(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            // Final Submit Logic is mainly triggered by Outro step, but if last step is Form/Content, handle it too.
            // If the last step is Outro, it calls handleBuilderNext usually without data? 
            // Actually Outro calls onSubmit which triggers handleBuilderNext? 
            // Refactored StepOutro calls passed onSubmit. 
            // Here we treat handleBuilderNext as the generic "Advance/Complete" handler.

            // If it's NOT outro, we might want to submit here.
            // But if users put Content as last step, it just finishes?
            // Usually flows end with Form or Outro.

            const leadData: LeadData = {
                timestamp: new Date().toISOString(),
                landing_id: config.id,
                name: newData.name || 'Anonymous',
                phone: newData.phone || '',
                user_agent: navigator.userAgent,
                referrer: document.referrer,
                ...newData
            };
            await onSubmit(leadData);
            setBuilderFinished(true);
        }
    };

    const handleBuilderPrev = () => {
        if (currentStepIdx > 0) {
            setCurrentStepIdx(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    // --- RENDERERS ---

    // Success View (Shared)
    const renderSuccess = () => (
        <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white"
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
    );

    // --- MAIN RENDER ---

    // 1. Success State (Global)
    if (viewState === 'success' || builderFinished) {
        return <div className="min-h-screen bg-white font-sans">{renderSuccess()}</div>;
    }

    // 2. Builder Mode Render
    if (isBuilderMode && config.steps) {
        const step = config.steps[currentStepIdx];
        const isIntro = step.type === 'intro';

        // Resolve Background Content for Intro/Outro if contentId is present
        const backgroundContent = (step.type === 'intro' || step.type === 'outro') && step.contentId
            ? config.detailContent?.find(c => c.id === step.contentId)
            : undefined;

        return (
            <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
                {!isIntro && (
                    <StepProgress currentStep={currentStepIdx} totalSteps={config.steps.length} />
                )}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="min-h-screen"
                    >
                        {step.type === 'intro' && (
                            <StepHero
                                heroConfig={{
                                    ...config.hero,
                                    headline: step.title || config.hero.headline,
                                    ctaText: step.buttonText || config.hero.ctaText
                                }}
                                onStart={() => handleBuilderNext()}
                                primaryColor={config.theme.primaryColor}
                                buttonStyle={step.buttonStyle}
                                backgroundContent={backgroundContent}
                            />
                        )}

                        {step.type === 'content' && (
                            <StepContent
                                content={config.detailContent?.find(c => c.id === step.contentId) || { id: 'fallback', type: 'image', content: '' }}
                                onNext={() => handleBuilderNext()}
                                nextButtonText={step.buttonText}
                                onPrev={handleBuilderPrev}
                                showPrevButton={step.showPrevButton}
                                prevButtonText={step.prevButtonText}
                                buttonStyle={step.buttonStyle}
                                primaryColor={config.theme.primaryColor}
                            />
                        )}

                        {step.type === 'form' && (
                            <StepForm
                                formConfig={{
                                    ...config.formConfig,
                                    title: step.title || config.formConfig.title,
                                    fields: (config.formConfig.fields || []).filter(f => (step.fieldIds || []).includes(f.id))
                                }}
                                onSubmit={(data) => handleBuilderNext(data)}
                                onProgressUpdate={() => { }}
                                finalButtonText={step.buttonText}
                                onPrev={handleBuilderPrev}
                                showPrevButton={step.showPrevButton}
                                prevButtonText={step.prevButtonText}
                                buttonStyle={step.buttonStyle}
                                formStyle={step.formStyle}
                                primaryColor={config.theme.primaryColor}
                            />
                        )}

                        {step.type === 'outro' && (
                            <StepOutro
                                step={step}
                                onPrev={handleBuilderPrev}
                                onSubmit={handleBuilderNext}
                                primaryColor={config.theme.primaryColor}
                                backgroundContent={backgroundContent}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    // 3. Legacy Mode Render
    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
            <AnimatePresence mode="wait">
                {viewState === 'hero' && (
                    <motion.div
                        key="hero"
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.5 }}
                    >
                        <StepHero
                            heroConfig={config.hero}
                            onStart={handleLegacyStart}
                            primaryColor={config.theme.primaryColor}
                        />
                    </motion.div>
                )}

                {viewState === 'form' && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-screen flex flex-col"
                    >
                        <StepProgress currentStep={legacyStep} totalSteps={legacyTotal} />
                        <StepForm
                            formConfig={config.formConfig}
                            onSubmit={handleLegacySubmit}
                            onProgressUpdate={(curr, total) => {
                                setLegacyStep(curr);
                                setLegacyTotal(total);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DynamicStepTemplate;
