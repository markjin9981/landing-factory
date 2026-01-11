import React, { useState } from 'react';
import { DynamicStepItem, DetailContent, FormField, FormSection } from '../../../types';
import { Check } from 'lucide-react';
import EmbeddedForm from './EmbeddedForm';

interface StepOutroProps {
    step: DynamicStepItem;
    onPrev?: () => void;
    onSubmit: (stepData?: any) => void;
    primaryColor?: string;
    backgroundContent?: DetailContent;
    insertedContent?: DetailContent;
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

const StepOutro: React.FC<StepOutroProps> = ({
    step,
    onPrev,
    onSubmit,
    primaryColor = '#3b82f6',
    backgroundContent,
    insertedContent,
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
    const [agreements, setAgreements] = useState({
        privacy: false,
        terms: false,
        marketing: false,
        thirdParty: false
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [policyError, setPolicyError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmit = async () => {
        setPolicyError('');

        // 1. Embedded Fields Validation
        if (!validateFields()) return;

        // 2. Policy Validation
        if (step.policyConfig?.showPrivacy && !agreements.privacy) {
            setPolicyError('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }
        if (step.policyConfig?.showTerms && !agreements.terms) {
            setPolicyError('이용약관에 동의해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleAgreement = (key: keyof typeof agreements) => {
        setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
        if (policyError) setPolicyError('');
    };

    const handleAllAgree = () => {
        const allChecked = !Object.values(agreements).every(v => v);
        setAgreements({
            privacy: allChecked,
            terms: allChecked,
            marketing: allChecked,
            thirdParty: allChecked
        });
        if (policyError) setPolicyError('');
    };

    // Style Helper
    const btnStyle = step.buttonStyle || {};
    const finalBtnStyle = {
        backgroundColor: btnStyle.backgroundColor || primaryColor,
        color: btnStyle.textColor || '#ffffff',
        fontSize: btnStyle.fontSize || '1.125rem',
        borderRadius: btnStyle.borderRadius || '0.75rem',
    };

    const hasPolicies = step.policyConfig && Object.values(step.policyConfig).some(v => v);
    const hasCustomBackground = backgroundColor || backgroundImage;
    const overlayOpacity = (backgroundOverlay ?? 60) / 100;

    return (
        <div
            className={`flex flex-col flex-1 min-h-screen relative overflow-hidden ${hasCustomBackground || backgroundContent ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
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
                    className="absolute inset-0 z-0 bg-black"
                    style={{ opacity: overlayOpacity }}
                />
            )}

            {!hasCustomBackground && backgroundContent && (
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

            <div className={`flex-1 w-full ${maxWidth ? `max-w-${maxWidth}` : 'max-w-md'} mx-auto px-6 py-20 flex flex-col justify-center relative z-10`}>

                {/* Title */}
                <h2 className="text-2xl font-bold mb-8 text-center" style={titleStyle}>
                    {step.title || '마지막 단계입니다'}
                </h2>

                {/* Inline Media Content */}
                {insertedContent && (
                    <div className="w-full mb-8 rounded-xl overflow-hidden shadow-lg border border-white/10 relative bg-black/20">
                        <div
                            className="mx-auto overflow-y-auto"
                            style={{
                                width: mediaStyles?.pcWidth || '100%',
                                height: mediaStyles?.pcHeight || 'auto',
                                maxHeight: mediaStyles?.pcHeight && mediaStyles.pcHeight !== 'auto' ? mediaStyles.pcHeight : '400px',
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
                            ) : insertedContent.type === 'youtube' ? (
                                <div className="relative w-full pt-[56.25%]">
                                    <iframe
                                        className="absolute inset-0 w-full h-full"
                                        src={`https://www.youtube.com/embed/${insertedContent.content}?autoplay=0&controls=1&rel=0`}
                                        title="YouTube video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <img
                                    src={insertedContent.content}
                                    alt="Inserted Content"
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Embedded Form Fields */}
                {embeddedFields.length > 0 && (
                    <div className={`p-6 rounded-2xl border mb-8 ${hasCustomBackground || backgroundContent ? 'bg-white/5 border-white/10 backdrop-blur-md' : 'bg-gray-50 border-gray-100'}`}>
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

                {/* Policies */}
                {hasPolicies && (
                    <div className={`rounded-2xl p-6 mb-8 border shadow-sm ${hasCustomBackground || backgroundContent ? 'bg-white/5 border-white/10 backdrop-blur-md' : 'bg-gray-50 border-gray-100'}`}>
                        <div className={`flex items-center justify-between mb-4 pb-4 border-b ${hasCustomBackground || backgroundContent ? 'border-white/10' : 'border-gray-200'}`}>
                            <span className="font-bold">약관 전체 동의</span>
                            <button
                                onClick={handleAllAgree}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${Object.values(agreements).every(v => v)
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'border-gray-300'
                                    }`}
                            >
                                {Object.values(agreements).every(v => v) && <Check className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="space-y-4">
                            {step.policyConfig?.showPrivacy && (
                                <PolicyItem
                                    label="[필수] 개인정보 수집 및 이용 동의"
                                    checked={agreements.privacy}
                                    onChange={() => toggleAgreement('privacy')}
                                    hideBg={hasCustomBackground || backgroundContent}
                                />
                            )}
                            {step.policyConfig?.showTerms && (
                                <PolicyItem
                                    label="[필수] 이용약관 동의"
                                    checked={agreements.terms}
                                    onChange={() => toggleAgreement('terms')}
                                    hideBg={hasCustomBackground || backgroundContent}
                                />
                            )}
                            {step.policyConfig?.showMarketing && (
                                <PolicyItem
                                    label="[선택] 마케팅 정보 수신 동의"
                                    checked={agreements.marketing}
                                    onChange={() => toggleAgreement('marketing')}
                                    hideBg={hasCustomBackground || backgroundContent}
                                />
                            )}
                            {step.policyConfig?.showThirdParty && (
                                <PolicyItem
                                    label="[선택] 제3자 정보 제공 동의"
                                    checked={agreements.thirdParty}
                                    onChange={() => toggleAgreement('thirdParty')}
                                    hideBg={hasCustomBackground || backgroundContent}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Policy Error Message */}
                {policyError && (
                    <p className="text-red-500 text-center mb-4 text-sm font-medium animate-pulse">
                        {policyError}
                    </p>
                )}

            </div>

            {/* Bottom Buttons - Polished (Removed background box/gradient) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 z-50 safe-area-bottom">
                <div className={`max-w-md mx-auto flex gap-3 ${step.buttonStyle?.alignment === 'left' ? 'justify-start' :
                    (step.buttonStyle?.alignment === 'right' ? 'justify-end' : 'justify-center')
                    }`}>
                    {/* PREV BUTTON */}
                    {(step.showPrevButton !== false && onPrev) && (
                        <button
                            onClick={onPrev}
                            className={`px-6 py-4 rounded-xl font-bold transition-all shrink-0 ${hasCustomBackground || backgroundContent ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {step.prevButtonText || '이전'}
                        </button>
                    )}

                    {/* SUBMIT BUTTON */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{
                            ...finalBtnStyle,
                            fontFamily: btnStyle.fontFamily,
                            width: btnStyle.width === 'full' ? '100%' :
                                (btnStyle.width === 'xs' ? '128px' :
                                    (btnStyle.width === 'sm' ? '192px' :
                                        (btnStyle.width === 'md' ? '256px' :
                                            (btnStyle.width === 'lg' ? '320px' :
                                                (btnStyle.width === 'xl' ? '384px' :
                                                    (btnStyle.width === 'auto' ? 'auto' : undefined)))))),
                            flex: btnStyle.width === 'full' || !btnStyle.width ? '1' : 'none',
                        } as React.CSSProperties}
                        className={`py-4 font-bold shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 ${step.buttonStyle?.animation && step.buttonStyle.animation !== 'none'
                            ? `animate-btn-${step.buttonStyle.animation}`
                            : ''
                            }`}
                    >
                        {isSubmitting ? '처리중...' : (step.buttonText || '신청완료')}
                    </button>
                </div>
            </div>

            {/* Spacer */}
            <div className="h-24"></div>
        </div>
    );
};

const PolicyItem = ({ label, checked, onChange, hideBg }: { label: string, checked: boolean, onChange: () => void, hideBg?: any }) => (
    <div className="flex items-center justify-between cursor-pointer" onClick={onChange}>
        <span className={`text-sm ${hideBg ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-blue-500 border-blue-500 text-white' : (hideBg ? 'border-white/30' : 'border-gray-300')
            }`}>
            {checked && <Check className="w-3 h-3" />}
        </div>
    </div>
);

export default StepOutro;
