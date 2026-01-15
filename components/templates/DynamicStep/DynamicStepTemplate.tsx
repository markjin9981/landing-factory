import React, { useState } from 'react';
import { LandingConfig, LeadData } from '../../../types';
import { trackConversion } from '../../../utils/pixelUtils';
import StepHero from './StepHero';
import StepForm from './StepForm';
import StepContent from './StepContent';
import StepOutro from './StepOutro';
import StepProgress from './StepProgress';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicStepTemplateProps {
    config: LandingConfig;
    onSubmit: (data: LeadData) => Promise<void>;
    utmParams?: Record<string, string | undefined>;
}

const DynamicStepTemplate: React.FC<DynamicStepTemplateProps> = ({ config, onSubmit, utmParams }) => {
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

    // Preview Mode Detection (to prevent auto-submit in editor)
    const isPreview = !config.id || config.id.startsWith('preview_');

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
            ...utmParams,
            ...formData
        };
        await onSubmit(leadData);
        trackConversion(config.pixelConfig);
        setViewState('success');
    };

    // --- HANDLERS (BUILDER) ---
    const handleBuilderNext = async (stepData: any = {}) => {
        const newData = { ...accumulatedData, ...stepData };
        setAccumulatedData(newData);

        if (config.steps && currentStepIdx < config.steps.length - 1) {
            // Not the last step - always allow navigation
            setCurrentStepIdx(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            // Final step - check preview mode
            if (isPreview) {
                alert('✅ 미리보기 모드\n\n실제 배포 시 여기서 폼이 제출됩니다.\n에디터로 돌아가서 계속 편집하세요.');
                return;
            }

            const leadData: LeadData = {
                timestamp: new Date().toISOString(),
                landing_id: config.id,
                name: newData.name || 'Anonymous',
                phone: newData.phone || '',
                user_agent: navigator.userAgent,
                referrer: document.referrer,
                ...utmParams,
                ...newData
            };
            await onSubmit(leadData);
            trackConversion(config.pixelConfig);
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
            <p className="text-gray-600 max-w-sm mb-8">
                담당자가 내용을 확인 후 빠르게 연락드리겠습니다.<br />
                감사합니다.
            </p>
            <button
                onClick={() => {
                    setBuilderFinished(false);
                    setCurrentStepIdx(0);
                    setAccumulatedData({});
                    window.scrollTo(0, 0);
                }}
                className="text-sm text-gray-500 underline hover:text-gray-800 transition-colors"
            >
                다시 입력 하기
            </button>
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

        // Resolve Background Content
        // 1. Check current step's specific background
        const currentBackground = step.contentId
            ? config.detailContent?.find(c => c.id === step.contentId)
            : undefined;

        // Resolve Background Styling (Inheritance from Intro)
        const introStep = config.steps.find(s => s.type === 'intro');
        const introBackgroundStyle = introStep ? {
            backgroundColor: introStep.backgroundColor,
            backgroundImage: introStep.backgroundImage,
            backgroundOverlay: introStep.backgroundOverlay,
            hideMobileBackground: introStep.hideMobileBackground // NEW: Extract hideMobileBackground
        } : undefined;

        const introTitleStyle = introStep?.titleStyle;
        const introSubtitleStyle = introStep?.subtitleStyle;
        const introButtonStyle = introStep?.buttonStyle;

        const introBackground = introStep?.contentId
            ? config.detailContent?.find(c => c.id === introStep.contentId)
            : undefined;

        // Resolve Layout Styling (Inheritance from Intro)
        const maxWidth = introStep?.maxWidth;

        // Resolve Embedded Fields
        const embeddedFields = (config.formConfig.fields || []).filter(f => (step.fieldIds || []).includes(f.id));

        // Resolve Inserted Content
        const insertedContent = (step.type === 'intro' || step.type === 'outro') && step.insertedContentId
            ? config.detailContent?.find(c => c.id === step.insertedContentId)
            : undefined;

        const commonProps = {
            formData: accumulatedData,
            onDataChange: (id: string, value: any) => setAccumulatedData((prev: any) => ({ ...prev, [id]: value })),
            formConfig: config.formConfig,
            primaryColor: config.theme.primaryColor,
            maxWidth: step.maxWidth || maxWidth, // Use specific or inherited
            buttonStyle: step.buttonStyle || introButtonStyle,
            titleStyle: step.titleStyle || introTitleStyle,
            subtitleStyle: step.subtitleStyle || introSubtitleStyle,
            formStyle: step.formStyle, // This includes questionColor, etc.
            mediaStyles: step.mediaStyles
        };

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
                                {...commonProps}
                                heroConfig={{
                                    ...config.hero,
                                    headline: step.title || config.hero.headline,
                                    ctaText: step.buttonText || config.hero.ctaText,
                                    features: step.features || config.hero.features // NEW: Override
                                }}
                                onStart={() => handleBuilderNext()}
                                backgroundContent={currentBackground}
                                insertedContent={insertedContent}
                                hideTitle={step.hideTitle}
                                backgroundColor={step.backgroundColor}
                                backgroundImage={step.backgroundImage}
                                backgroundOverlay={step.backgroundOverlay}
                                embeddedFields={embeddedFields}
                                hideMobileBackground={step.hideMobileBackground}
                                fieldOverrides={step.fieldOverrides}
                                questionContainerStyle={step.questionContainerStyle} // NEW
                            />
                        )}

                        {step.type === 'content' && (
                            <StepContent
                                {...commonProps}
                                content={config.detailContent?.find(c => c.id === step.contentId) || { id: 'fallback', type: 'image', content: '' }}
                                onNext={() => handleBuilderNext()}
                                nextButtonText={step.buttonText}
                                onPrev={handleBuilderPrev}
                                showPrevButton={step.showPrevButton}
                                prevButtonText={step.prevButtonText}
                                backgroundContent={introBackground}
                                backgroundColor={introBackgroundStyle?.backgroundColor}
                                backgroundImage={introBackgroundStyle?.backgroundImage}
                                backgroundOverlay={introBackgroundStyle?.backgroundOverlay}
                                embeddedFields={embeddedFields}
                                hideMobileBackground={introBackgroundStyle?.hideMobileBackground} // NEW: Pass inherited hideMobileBackground
                                fieldOverrides={step.fieldOverrides} // NEW
                            />
                        )}

                        {step.type === 'form' && (
                            <StepForm
                                {...commonProps}
                                formConfig={{
                                    ...config.formConfig,
                                    title: step.title || config.formConfig.title,
                                    fields: embeddedFields
                                }}
                                onSubmit={(data) => handleBuilderNext(data)}
                                onProgressUpdate={() => { }}
                                finalButtonText={step.buttonText}
                                onPrev={handleBuilderPrev}
                                showPrevButton={step.showPrevButton}
                                prevButtonText={step.prevButtonText}
                                backgroundContent={introBackground} // NEW: Pass intro background
                                backgroundColor={introBackgroundStyle?.backgroundColor} // NEW
                                backgroundImage={introBackgroundStyle?.backgroundImage} // NEW
                                backgroundOverlay={introBackgroundStyle?.backgroundOverlay} // NEW
                                hideMobileBackground={introBackgroundStyle?.hideMobileBackground} // NEW
                                fieldOverrides={step.fieldOverrides} // NEW
                                topContent={step.topContent} // NEW: Pass Top Content
                            />
                        )}

                        {step.type === 'outro' && (
                            <StepOutro
                                {...commonProps}
                                step={step}
                                onPrev={handleBuilderPrev}
                                onSubmit={handleBuilderNext}
                                backgroundContent={currentBackground || introBackground}
                                insertedContent={insertedContent}
                                backgroundColor={step.backgroundColor || introBackgroundStyle?.backgroundColor}
                                backgroundImage={step.backgroundImage || introBackgroundStyle?.backgroundImage}
                                backgroundOverlay={step.backgroundOverlay ?? introBackgroundStyle?.backgroundOverlay}
                                embeddedFields={embeddedFields}
                                hideMobileBackground={step.hideMobileBackground ?? introBackgroundStyle?.hideMobileBackground} // NEW: Inherit if not set
                                hideTitle={step.hideTitle} // NEW
                                fieldOverrides={step.fieldOverrides} // NEW
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
