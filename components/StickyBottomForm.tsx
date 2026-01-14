import React, { useState } from 'react';
import { FormSection, StickyBottomFormConfig, LeadData } from '../types';
import { submitLeadToSheet } from '../services/googleSheetService';
import { Check, Loader2 } from 'lucide-react';

interface Props {
    config: StickyBottomFormConfig;
    formConfig: FormSection;
    landingId: string;
    themeColor?: string;
    isMobileView?: boolean;
}

const StickyBottomForm: React.FC<Props> = ({
    config,
    formConfig,
    landingId,
    themeColor = '#3b82f6',
    isMobileView = false
}) => {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [agreed, setAgreed] = useState(false);

    // Determine which fields to show (default: name + phone)
    const displayFieldIds = config.fieldIds?.length
        ? config.fieldIds
        : ['name', 'phone'];

    const fieldsToShow = formConfig.fields.filter(f =>
        displayFieldIds.includes(f.id)
    ).slice(0, 3); // Max 3 fields for slim design

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            alert('개인정보 수집에 동의해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const leadData: LeadData = {
                timestamp: new Date().toISOString(),
                landing_id: landingId,
                name: formData['name'] || '',
                phone: formData['phone'] || '',
                user_agent: navigator.userAgent,
                referrer: document.referrer || 'direct',
                ...formData
            };
            await submitLeadToSheet(leadData);
            setIsSubmitted(true);
            setFormData({});
        } catch (error) {
            console.error('Submit error:', error);
            alert('제출 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // Hide based on device settings
    if (isMobileView && config.showOnMobile === false) return null;
    if (!isMobileView && config.showOnPC === false) return null;

    const bgColor = config.backgroundColor || '#1f2937';
    const textColor = config.textColor || '#ffffff';
    const buttonColor = config.buttonColor || themeColor;
    const buttonTextColor = config.buttonTextColor || '#ffffff';

    if (isSubmitted) {
        return (
            <div
                className="fixed bottom-0 left-0 right-0 z-[100] py-3 px-4 text-center"
                style={{ backgroundColor: bgColor, color: textColor }}
            >
                <div className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="font-bold">{formConfig.submitSuccessTitle || '신청 완료!'}</span>
                    <span className="text-sm opacity-80">{formConfig.submitSuccessMessage || '곧 연락드리겠습니다.'}</span>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="fixed bottom-0 left-0 right-0 z-[100] shadow-2xl"
            style={{ backgroundColor: bgColor, color: textColor }}
        >
            <div className={`max-w-5xl mx-auto px-3 py-2 ${isMobileView ? 'space-y-2' : ''}`}>
                {/* PC: Single row layout, Mobile: Stacked */}
                <div className={`flex ${isMobileView ? 'flex-col gap-2' : 'items-center gap-3'}`}>
                    {/* Input Fields */}
                    <div className={`flex ${isMobileView ? 'flex-wrap gap-2' : 'flex-1 gap-2'}`}>
                        {fieldsToShow.map(field => (
                            <input
                                key={field.id}
                                type={field.type === 'tel' ? 'tel' : 'text'}
                                placeholder={field.placeholder || field.label}
                                value={formData[field.id] || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                required={field.required}
                                className={`border-0 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 outline-none ${isMobileView ? 'flex-1 min-w-[100px]' : 'w-32 flex-shrink-0'
                                    }`}
                                style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
                            />
                        ))}
                    </div>

                    {/* Agreement + Button Row */}
                    <div className={`flex items-center ${isMobileView ? 'gap-2' : 'gap-3 flex-shrink-0'}`}>
                        {/* Privacy Agreement */}
                        <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-[10px] opacity-80 whitespace-nowrap">
                                개인정보 수집 동의
                            </span>
                        </label>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`font-bold px-4 py-2 rounded text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap ${isMobileView ? 'flex-1 justify-center' : ''
                                }`}
                            style={{
                                backgroundColor: buttonColor,
                                color: buttonTextColor
                            }}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                formConfig.submitButtonText || '신청하기'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default StickyBottomForm;
