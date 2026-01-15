import React, { useState } from 'react';
import { FormSection, StickyBottomFormConfig, LeadData } from '../types';
import { submitLeadToSheet } from '../services/googleSheetService';
import { Check, Loader2 } from 'lucide-react';
import UnifiedFormField from './templates/DynamicStep/UnifiedFormField';

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
    ).slice(0, 5); // Max 5 fields

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

    const handleChange = (id: string, value: any) => { // Changed value type to any
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
                className="fixed bottom-0 left-0 right-0 z-[100] py-4 px-4 text-center shadow-lg border-t border-white/10"
                style={{ backgroundColor: bgColor, color: textColor }}
            >
                <div className="flex items-center justify-center gap-2 animate-fade-in-up">
                    <div className="bg-green-500 rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-lg">{formConfig.submitSuccessTitle || '신청 완료!'}</span>
                    <span className="text-sm opacity-80">{formConfig.submitSuccessMessage || '담당자가 확인 후 곧 연락드리겠습니다.'}</span>
                </div>
            </div>
        );
    }

    // New: Mobile Layout Selection
    const isMultiRowMobile = isMobileView && fieldsToShow.length >= 4;

    return (
        <form
            onSubmit={handleSubmit}
            className="fixed bottom-0 left-0 right-0 z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-white/10"
            style={{ backgroundColor: bgColor, color: textColor }}
        >
            <div className={`mx-auto transition-all duration-300 ${isMobileView
                ? 'px-3 py-2' // Mobile: Compact Padding
                : 'px-6 py-5 max-w-7xl' // PC: Broad
                }`}>

                {/* --- Mobile View Layout --- */}
                {isMobileView ? (
                    <div className="flex flex-col gap-2">
                        {/* Logic: Use Manual Config if available, else Auto logic */}
                        {(() => {
                            const { mobileRowConfig } = config;
                            const hasManualConfig = mobileRowConfig && (mobileRowConfig.row1Fields?.length > 0 || mobileRowConfig.row2Fields?.length > 0);

                            // Helper for rendering a row of fields
                            const renderRow = (fields: typeof fieldsToShow, isGrid: boolean) => (
                                <div className={`${isGrid ? 'grid grid-cols-2 gap-2' : 'flex gap-2 overflow-x-auto'}`}>
                                    {fields.map(field => (
                                        <div
                                            key={field.id}
                                            className={`${isGrid ? 'w-full' : (field.id === 'name' ? 'w-[30%] shrink-0' : field.id === 'phone' ? 'w-[70%] shrink-0' : 'flex-1 min-w-[30%]')} `}
                                        >
                                            <UnifiedFormField
                                                field={field}
                                                value={formData[field.id]}
                                                onChange={(val) => handleChange(field.id, val)}
                                                formStyle={{
                                                    answerBgColor: 'rgba(255,255,255,0.95)',
                                                    answerColor: '#111827',
                                                    answerFontSize: '12px',
                                                    questionSize: 'sm',
                                                }}
                                                layout="minimal"
                                            />
                                        </div>
                                    ))}
                                </div>
                            );

                            if (hasManualConfig) {
                                const row1 = fieldsToShow.filter(f => mobileRowConfig?.row1Fields.includes(f.id));
                                const row2 = fieldsToShow.filter(f => mobileRowConfig?.row2Fields.includes(f.id));
                                return (
                                    <>
                                        {row1.length > 0 && renderRow(row1, false)}
                                        {row2.length > 0 && renderRow(row2, row2.length >= 2)}
                                    </>
                                );
                            } else {
                                // Auto Logic
                                return (
                                    <div className={`${isMultiRowMobile ? 'grid grid-cols-2 gap-2' : 'flex gap-2 overflow-x-auto'}`}>
                                        {fieldsToShow.map(field => (
                                            <div
                                                key={field.id}
                                                className={`${isMultiRowMobile ? 'w-full' : (field.id === 'name' ? 'w-[30%] shrink-0' : field.id === 'phone' ? 'w-[70%] shrink-0' : 'flex-1 min-w-[30%]')} `}
                                            >
                                                <UnifiedFormField
                                                    field={field}
                                                    value={formData[field.id]}
                                                    onChange={(val) => handleChange(field.id, val)}
                                                    formStyle={{
                                                        answerBgColor: 'rgba(255,255,255,0.95)',
                                                        answerColor: '#111827',
                                                        answerFontSize: '12px',
                                                        questionSize: 'sm'
                                                    }}
                                                    layout="minimal"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                );
                            }
                        })()}

                        {/* Mobile Bottom Row: Agreement + Button */}
                        <div className="flex items-center gap-2 justify-between">
                            <label className="flex items-center gap-1.5 cursor-pointer opacity-90 hover:opacity-100">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-[10px] whitespace-nowrap">개인정보 동의</span>
                            </label>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 h-9 flex items-center justify-center gap-1.5 font-bold rounded text-xs shadow-md active:scale-95 transition-transform"
                                style={{
                                    backgroundColor: buttonColor,
                                    color: buttonTextColor
                                }}
                            >
                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (formConfig.submitButtonText || '신청하기')}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* --- PC View Layout --- */
                    <div className="flex flex-col gap-4 items-center">
                        {/* PC Row 1: Rich Inputs with UnifiedFormField */}
                        <div className="flex flex-wrap justify-center gap-4 w-full items-end">
                            {fieldsToShow.map(field => (
                                <div key={field.id} className="min-w-[200px] flex-1 max-w-xs">
                                    <UnifiedFormField
                                        field={field}
                                        value={formData[field.id]}
                                        onChange={(val) => handleChange(field.id, val)}
                                        formStyle={{
                                            questionColor: textColor, // Adapt label color to background
                                            answerBgColor: 'rgba(255,255,255,0.98)',
                                            answerColor: '#111827',
                                        }}
                                        layout="standard"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* PC Row 2: Agreement & Large Button */}
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium">개인정보 수집 및 이용에 동의합니다</span>
                            </label>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-10 py-3 text-lg font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                style={{
                                    backgroundColor: buttonColor,
                                    color: buttonTextColor
                                }}
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (formConfig.submitButtonText || '무료 상담 신청하기')}
                                {!isSubmitting && <Check className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </form>
    );
};

export default StickyBottomForm;
