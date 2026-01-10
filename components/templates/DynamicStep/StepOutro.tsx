import React, { useState } from 'react';
import { DynamicStepItem, DetailContent } from '../../../types';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface StepOutroProps {
    step: DynamicStepItem;
    onPrev?: () => void;
    onSubmit: () => void;
    primaryColor?: string;
    backgroundContent?: DetailContent;
}

const StepOutro: React.FC<StepOutroProps> = ({ step, onPrev, onSubmit, primaryColor = '#3b82f6', backgroundContent }) => {
    const [agreements, setAgreements] = useState({
        privacy: false,
        terms: false,
        marketing: false,
        thirdParty: false
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setError('');

        // Validation
        if (step.policyConfig?.showPrivacy && !agreements.privacy) {
            setError('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }
        if (step.policyConfig?.showTerms && !agreements.terms) {
            setError('이용약관에 동의해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit();
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleAgreement = (key: keyof typeof agreements) => {
        setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
        if (error) setError('');
    };

    const handleAllAgree = () => {
        const allChecked = !Object.values(agreements).every(v => v);
        setAgreements({
            privacy: allChecked,
            terms: allChecked,
            marketing: allChecked,
            thirdParty: allChecked
        });
    };

    // Style Helper
    const btnStyle = step.buttonStyle || {};
    const finalBtnStyle = {
        backgroundColor: btnStyle.backgroundColor || primaryColor,
        color: btnStyle.textColor || '#ffffff',
        fontSize: btnStyle.fontSize || '1.125rem', // text-lg
        borderRadius: btnStyle.borderRadius || '0.75rem', // rounded-xl
    };

    const hasPolicies = step.policyConfig && Object.values(step.policyConfig).some(v => v);

    return (
        <div className="flex flex-col flex-1 min-h-screen relative bg-white overflow-hidden">
            {/* --- BACKGROUND CONTENT LAYER --- */}
            {backgroundContent && (
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
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
                </div>
            )}

            <div className="flex-1 w-full max-w-md mx-auto px-6 py-12 flex flex-col justify-center relative z-10">

                {/* Title */}
                <h2 className="text-2xl font-bold mb-8 text-gray-900 text-center">
                    {step.title || '마지막 단계입니다'}
                </h2>

                {/* Policies */}
                {hasPolicies && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                            <span className="font-bold text-gray-900">약관 전체 동의</span>
                            <button
                                onClick={handleAllAgree}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${Object.values(agreements).every(v => v)
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'border-gray-300 bg-white'
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
                                />
                            )}
                            {step.policyConfig?.showTerms && (
                                <PolicyItem
                                    label="[필수] 이용약관 동의"
                                    checked={agreements.terms}
                                    onChange={() => toggleAgreement('terms')}
                                />
                            )}
                            {step.policyConfig?.showMarketing && (
                                <PolicyItem
                                    label="[선택] 마케팅 정보 수신 동의"
                                    checked={agreements.marketing}
                                    onChange={() => toggleAgreement('marketing')}
                                />
                            )}
                            {step.policyConfig?.showThirdParty && (
                                <PolicyItem
                                    label="[선택] 제3자 정보 제공 동의"
                                    checked={agreements.thirdParty}
                                    onChange={() => toggleAgreement('thirdParty')}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <p className="text-red-500 text-center mb-4 text-sm font-medium animate-pulse">
                        {error}
                    </p>
                )}

            </div>

            {/* Bottom Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t z-50 safe-area-bottom">
                <div className="max-w-md mx-auto flex gap-3">
                    {/* PREV BUTTON */}
                    {(step.showPrevButton !== false && onPrev) && (
                        <button
                            onClick={onPrev}
                            className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            {step.prevButtonText || '이전'}
                        </button>
                    )}

                    {/* SUBMIT BUTTON */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={finalBtnStyle}
                        className="flex-1 py-4 font-bold shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2"
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

const PolicyItem = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
    <div className="flex items-center justify-between cursor-pointer" onClick={onChange}>
        <span className="text-sm text-gray-600">{label}</span>
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'
            }`}>
            {checked && <Check className="w-3 h-3" />}
        </div>
    </div>
);

export default StepOutro;
