import React, { useState } from 'react';
import { FormSection, StickyBottomFormConfig, LeadData, PixelConfig, LandingConfig } from '../types';
import { trackConversion } from '../utils/pixelUtils';
import { submitLeadToSheet } from '../services/googleSheetService';
import { Check, Loader2 } from 'lucide-react';
import UnifiedFormField from './templates/DynamicStep/UnifiedFormField';
import AnimatedHeadline from './AnimatedHeadline';

interface Props {
    config: StickyBottomFormConfig;
    formConfig: FormSection;
    landingId: string;
    themeColor?: string;
    isMobileView?: boolean;
    pixelConfig?: PixelConfig;
    utmParams?: Record<string, string | undefined>;
    landingConfig?: LandingConfig; // NEW: For additional sheet config
}

const StickyBottomForm: React.FC<Props> = ({
    config,
    formConfig,
    landingId,
    themeColor = '#3b82f6',
    isMobileView = false,
    pixelConfig,
    utmParams,
    landingConfig // NEW
}) => {
    // Mobile Detection Logic
    const [isMobileScreen, setIsMobileScreen] = useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobileScreen(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const effectiveIsMobile = isMobileView || isMobileScreen;

    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [agreed, setAgreed] = useState(false);

    // Security: Honeypot field (bots fill this, humans don't)
    const [honeypot, setHoneypot] = useState('');

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
                website: honeypot, // Security: Honeypot field
                ...utmParams,
                ...formData
            };

            // NEW: Additional sheet configuration
            if (landingConfig?.additionalSheetConfig) {
                (leadData as any).additional_sheet_config = JSON.stringify(landingConfig.additionalSheetConfig);
            }
            await submitLeadToSheet(leadData);
            trackConversion(pixelConfig);
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
    if (effectiveIsMobile && config.showOnMobile === false) return null;
    if (!effectiveIsMobile && config.showOnPC === false) return null;

    const bgColor = config.backgroundColor || '#1f2937';
    const textColor = config.textColor || '#ffffff';
    const buttonColor = config.buttonColor || themeColor;
    const buttonTextColor = config.buttonTextColor || '#ffffff';
    const buttonTextFont = config.buttonTextFont || formConfig.style?.buttonFontFamily;
    const buttonTextSize = config.buttonTextSize;
    const buttonAnimation = config.buttonAnimation || 'none';

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
    const isMultiRowMobile = effectiveIsMobile && fieldsToShow.length >= 4;

    return (
        <form
            onSubmit={handleSubmit}
            className="fixed bottom-0 left-0 right-0 z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-white/10"
            style={{
                backgroundColor: bgColor,
                color: textColor,
                backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Security: Honeypot field - hidden from users, visible to bots */}
            <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{
                    position: 'absolute',
                    left: '-9999px',
                    width: '1px',
                    height: '1px',
                    opacity: 0
                }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
            />
            <div className={`mx-auto transition-all duration-300 ${effectiveIsMobile
                ? 'px-3 py-2' // Mobile: Compact Padding
                : 'px-6 py-5 max-w-7xl' // PC: Broad
                }`}>

                {/* --- Mobile View Layout --- */}
                {effectiveIsMobile ? (
                    <div className="flex flex-col gap-2">
                        {/* Logic: Use Manual Config if available, else Auto logic */}
                        {(() => {
                            const { mobileRowConfig } = config;
                            const hasManualConfig = mobileRowConfig && (mobileRowConfig.row1Fields?.length > 0 || mobileRowConfig.row2Fields?.length > 0);

                            // Helper for rendering a row of fields
                            const renderRow = (fields: typeof fieldsToShow, isGrid: boolean) => (
                                <div className={`${isGrid ? 'grid grid-cols-2 gap-2' : 'flex gap-2'}`}>
                                    {fields.map(field => (
                                        <div
                                            key={field.id}
                                            className={`${isGrid ? 'w-full' : (field.id === 'name' ? 'flex-shrink-0 w-20' : 'flex-1 min-w-0')}`}
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
                                                    inputBorderRadius: config.inputBorderRadius,
                                                }}
                                                layout="stickyMobile"
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
                                    <div className={`${isMultiRowMobile ? 'grid grid-cols-2 gap-2' : 'flex gap-2'}`}>
                                        {fieldsToShow.map(field => (
                                            <div
                                                key={field.id}
                                                className={`${isMultiRowMobile ? 'w-full' : (field.id === 'name' ? 'flex-shrink-0 w-20' : 'flex-1 min-w-0')}`}
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
                                                        inputBorderRadius: config.inputBorderRadius,
                                                    }}
                                                    layout="stickyMobile"
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
                                className={`flex-1 h-9 flex items-center justify-center gap-1.5 font-bold rounded text-xs shadow-md active:scale-95 transition-transform ${buttonAnimation !== 'none' ? `animate-${buttonAnimation}` : ''
                                    }`}
                                style={{
                                    backgroundColor: buttonColor,
                                    color: buttonTextColor,
                                    backgroundImage: config.buttonImage ? `url(${config.buttonImage})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    fontFamily: buttonTextFont,
                                    fontSize: buttonTextSize,
                                }}
                            >
                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                                    formConfig.style?.buttonTextEffect && formConfig.style.buttonTextEffect !== 'none' ? (
                                        <AnimatedHeadline
                                            text={formConfig.submitButtonText || '신청하기'}
                                            effect={formConfig.style.buttonTextEffect}
                                            duration={formConfig.style.buttonTextAnimationDuration}
                                            isLoop={formConfig.style.buttonTextAnimationLoop}
                                            className="w-full h-full flex items-center justify-center"
                                            style={{}}
                                        />
                                    ) : (formConfig.submitButtonText || '신청하기')
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* --- PC View Layout --- */
                    (() => {
                        const { mobileRowConfig, pcLayout = 'stacked' } = config;
                        const hasManualConfig = mobileRowConfig && (mobileRowConfig.row1Fields?.length > 0 || mobileRowConfig.row2Fields?.length > 0);


                        // Helper to render a field for PC (always use 'inline' layout for uniform height)
                        const renderPcField = (field: typeof fieldsToShow[0], isWide: boolean = false) => (
                            <div key={field.id} className={isWide ? 'flex-1 min-w-[120px]' : 'min-w-[200px] flex-1'}>
                                <UnifiedFormField
                                    field={field}
                                    value={formData[field.id]}
                                    onChange={(val) => handleChange(field.id, val)}
                                    formStyle={{
                                        questionColor: textColor,
                                        answerBgColor: 'rgba(255,255,255,0.98)',
                                        answerColor: '#111827',
                                        inputBorderRadius: config.inputBorderRadius,
                                    }}
                                    layout="inline"
                                />
                            </div>
                        );

                        // Helper to render a row of fields for PC (stacked layout)
                        const renderPcRow = (fields: typeof fieldsToShow) => (
                            <div className="flex flex-wrap justify-center gap-12 w-full items-end">
                                {fields.map(field => renderPcField(field, false))}
                            </div>
                        );

                        // WIDE LAYOUT: Fields on left, Button section on right (separated)
                        if (pcLayout === 'wide') {
                            return (
                                <div className="flex items-stretch w-full">
                                    {/* Fields Section - Left (larger area) */}
                                    <div className="flex-1 flex flex-col justify-center gap-2 pr-4">
                                        {hasManualConfig ? (
                                            <>
                                                {mobileRowConfig!.row1Fields?.length > 0 && (
                                                    <div className="flex gap-3 items-end">
                                                        {fieldsToShow
                                                            .filter(f => mobileRowConfig!.row1Fields.includes(f.id))
                                                            .map(field => renderPcField(field, true))}
                                                    </div>
                                                )}
                                                {mobileRowConfig!.row2Fields?.length > 0 && (
                                                    <div className="flex gap-3 items-end">
                                                        {fieldsToShow
                                                            .filter(f => mobileRowConfig!.row2Fields.includes(f.id))
                                                            .map(field => renderPcField(field, true))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex gap-3 items-end flex-wrap">
                                                {fieldsToShow.map(field => renderPcField(field, true))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Button + Agreement Section - Right (no background) */}
                                    <div className="shrink-0 flex flex-col items-center justify-center gap-2 px-4 min-w-[270px]">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`w-full px-12 py-4 text-lg font-bold rounded-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap ${buttonAnimation !== 'none' ? `animate-${buttonAnimation}` : ''
                                                }`}
                                            style={{
                                                backgroundColor: buttonColor,
                                                color: buttonTextColor,
                                                backgroundImage: config.buttonImage ? `url(${config.buttonImage})` : undefined,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                fontFamily: buttonTextFont,
                                                fontSize: buttonTextSize,
                                            }}
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                <>
                                                    {formConfig.style?.buttonTextEffect && formConfig.style.buttonTextEffect !== 'none' ? (
                                                        <AnimatedHeadline
                                                            text={formConfig.submitButtonText || '무료상담 신청하기'}
                                                            effect={formConfig.style.buttonTextEffect}
                                                            duration={formConfig.style.buttonTextAnimationDuration}
                                                            isLoop={formConfig.style.buttonTextAnimationLoop}
                                                            className="flex items-center justify-center"
                                                            style={{}}
                                                        />
                                                    ) : (formConfig.submitButtonText || '무료상담 신청하기')}
                                                    <Check className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                        <label className="flex items-center gap-1.5 cursor-pointer opacity-90 hover:opacity-100 transition-opacity text-xs">
                                            <input
                                                type="checkbox"
                                                checked={agreed}
                                                onChange={(e) => setAgreed(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                            />
                                            <span>개인정보 수집 및 이용 동의</span>
                                        </label>
                                    </div>
                                </div>
                            );
                        }

                        // STACKED LAYOUT (default): Fields on top, button below
                        return (
                            <div className="flex flex-col gap-4 items-center">
                                {/* PC Fields: 2-row or single-row layout */}
                                {hasManualConfig ? (
                                    <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto">
                                        {mobileRowConfig!.row1Fields?.length > 0 && renderPcRow(
                                            fieldsToShow.filter(f => mobileRowConfig!.row1Fields.includes(f.id))
                                        )}
                                        {mobileRowConfig!.row2Fields?.length > 0 && renderPcRow(
                                            fieldsToShow.filter(f => mobileRowConfig!.row2Fields.includes(f.id))
                                        )}
                                    </div>
                                ) : (
                                    renderPcRow(fieldsToShow)
                                )}

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
                                        className={`px-24 py-3 text-lg font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${buttonAnimation !== 'none' ? `animate-${buttonAnimation}` : ''
                                            }`}
                                        style={{
                                            backgroundColor: buttonColor,
                                            color: buttonTextColor,
                                            backgroundImage: config.buttonImage ? `url(${config.buttonImage})` : undefined,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            fontFamily: buttonTextFont,
                                            fontSize: buttonTextSize,
                                        }}
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                {formConfig.style?.buttonTextEffect && formConfig.style.buttonTextEffect !== 'none' ? (
                                                    <AnimatedHeadline
                                                        text={formConfig.submitButtonText || '무료 상담 신청하기'}
                                                        effect={formConfig.style.buttonTextEffect}
                                                        duration={formConfig.style.buttonTextAnimationDuration}
                                                        isLoop={formConfig.style.buttonTextAnimationLoop}
                                                        className="flex items-center justify-center"
                                                        style={{}}
                                                    />
                                                ) : (formConfig.submitButtonText || '무료 상담 신청하기')}
                                                <Check className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })()
                )}
            </div>
        </form>
    );
};

export default StickyBottomForm;
