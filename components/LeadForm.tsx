import React, { useState } from 'react';
import { FormSection, LeadData } from '../types';
import { submitLeadToSheet } from '../services/googleSheetService';
import { CheckCircle, AlertCircle, Loader2, Lock, FileText, X, ChevronDown } from 'lucide-react';

interface Props {
    config: FormSection;
    landingId: string;
    themeColor: string;
    pageTitle?: string; // Global Page Title
}

const LeadForm: React.FC<Props> = ({ config, landingId, themeColor, pageTitle }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    // Consent States
    const [consents, setConsents] = useState({
        privacy: true, // Default checked for better UX, usually requires explicit opt-in in KR
        thirdParty: false,
        marketing: false
    });

    const [modalContent, setModalContent] = useState<{ title: string, content: string } | null>(null);

    const formStyle = config.style || {};
    const containerBg = formStyle.backgroundColor || '#ffffff';
    const containerBorder = formStyle.borderColor ? `${formStyle.borderWidth || '1px'} solid ${formStyle.borderColor}` : '1px solid #e5e7eb';
    const containerRadius = formStyle.borderRadius || '16px';
    const textColor = formStyle.textColor || '#1f2937'; // Default gray-800

    const btnBg = formStyle.buttonBackgroundColor || themeColor;
    const btnText = formStyle.buttonTextColor || '#ffffff';
    const btnRadius = formStyle.buttonRadius || '12px';

    const isGridLayout = config.layout === 'grid';

    // Helper for Phone parsing
    const parsePhone = (val: string) => {
        if (!val) return { p1: '010', p2: '', p3: '' };
        const parts = val.split('-');
        return {
            p1: parts[0] || '010',
            p2: parts[1] || '',
            p3: parts[2] || ''
        };
    };

    const PHONE_PREFIXES = [
        '010', '011', '016', '017', '018', '019',
        '02', '031', '032', '033', '041', '042', '043', '044',
        '051', '052', '053', '054', '055', '061', '062', '063', '064'
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Enforce limits for text types
        if (e.target.getAttribute('type') === 'text' && value.length > 20) return;
        setFormData({ ...formData, [name]: value });
    };

    // Specific handler for Textarea to enforce limit
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length > 200) return;
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhonePartChange = (fieldId: string, part: 'p1' | 'p2' | 'p3', val: string) => {
        const currentVal = formData[fieldId] || '010--';
        const { p1, p2, p3 } = parsePhone(currentVal);

        // Only allow numbers for p2 and p3
        if ((part === 'p2' || part === 'p3') && !/^\d*$/.test(val)) return;

        let newP1 = p1;
        let newP2 = p2;
        let newP3 = p3;

        if (part === 'p1') newP1 = val;
        if (part === 'p2') newP2 = val;
        if (part === 'p3') newP3 = val;

        setFormData({ ...formData, [fieldId]: `${newP1}-${newP2}-${newP3}` });

        // Auto focus logic: when P2 is filled (4 digits), move to P3
        if (part === 'p2' && val.length >= 4) {
            const nextInput = document.getElementById(`${fieldId}_p3`);
            nextInput?.focus();
        }
    };

    const handleRadioChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
    };

    const toggleConsent = (key: keyof typeof consents) => {
        setConsents(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (config.showPrivacyPolicy && !consents.privacy) {
            alert('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }
        if (config.showThirdPartyConsent && !consents.thirdParty) {
            alert('개인정보 제3자 제공에 동의해주세요.');
            return;
        }

        // Validate Phone Fields
        const phoneFields = config.fields.filter(f => f.type === 'tel');
        for (const pf of phoneFields) {
            const { p2, p3 } = parsePhone(formData[pf.id]);
            if (p2.length < 3 || p3.length < 4) {
                alert(`${pf.label}를 올바르게 입력해주세요.`);
                return;
            }
        }

        setStatus('submitting');

        const payload: LeadData = {
            timestamp: new Date().toISOString(),
            landing_id: landingId,
            name: formData['name'] || '',
            phone: formData['phone'] || '',
            user_agent: navigator.userAgent,
            referrer: document.referrer || 'direct',
            page_title: pageTitle || config.title, // Use Global Title if available
            marketing_consent: consents.marketing ? 'Y' : 'N',
            third_party_consent: consents.thirdParty ? 'Y' : 'N',
            ...formData,
        };

        const success = await submitLeadToSheet(payload);

        if (success) {
            setStatus('success');
            setFormData({});
        } else {
            setStatus('error');
        }
    };

    const openPolicy = (type: 'privacy' | 'terms' | 'marketing' | 'thirdParty') => {
        let title = '';
        let content = '';

        switch (type) {
            case 'privacy':
                title = '개인정보 수집 및 이용 동의';
                content = config.privacyPolicyContent || '내용이 없습니다.';
                break;
            case 'terms':
                title = '이용약관';
                content = config.termsContent || '내용이 없습니다.';
                break;
            case 'marketing':
                title = '광고성 정보 수신 동의';
                content = config.marketingConsentContent || '내용이 없습니다.';
                break;
            case 'thirdParty':
                title = '개인정보 제3자 제공 동의';
                content = config.thirdPartyConsentContent || '내용이 없습니다.';
                break;
        }
        setModalContent({ title, content });
    };

    if (status === 'success') {
        return (
            <div
                className="p-8 shadow-xl text-center animate-fade-in-up"
                style={{ backgroundColor: containerBg, borderRadius: containerRadius, border: containerBorder }}
            >
                <div className="flex justify-center mb-4">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                    {config.submitSuccessTitle || "신청이 완료되었습니다!"}
                </h3>
                <p className="whitespace-pre-line opacity-80" style={{ color: textColor }}>
                    {config.submitSuccessMessage || "담당자가 내용을 확인 후 최대한 빠르게 연락드리겠습니다."}
                </p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-6 text-sm underline hover:opacity-80"
                    style={{ color: textColor }}
                >
                    다시 작성하기
                </button>
            </div>
        );
    }

    return (
        <>
            <div
                className="shadow-2xl overflow-hidden"
                style={{ backgroundColor: containerBg, borderRadius: containerRadius, border: containerBorder }}
            >
                <div className="p-6 md:p-8 text-center border-b border-black/5" style={{ backgroundColor: themeColor }}>
                    <h3
                        className="font-bold mb-2"
                        style={{
                            fontSize: formStyle.titleFontSize || '1.5rem',
                            color: formStyle.titleColor || 'white',
                            textAlign: (formStyle.titleAlign || 'center') as any
                        }}
                    >
                        {config.title}
                    </h3>
                    <p className="text-white/90 text-sm">{config.subTitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8">

                    {/* Fields Container */}
                    <div className={isGridLayout ? "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" : "space-y-5 mb-6"}>
                        {config.fields.map((field) => {
                            const isFullWidth = field.type === 'textarea' || field.type === 'radio';

                            return (
                                <div
                                    key={field.id}
                                    className={`${isGridLayout && isFullWidth ? 'md:col-span-2' : ''}`}
                                >
                                    <label className="block text-sm font-semibold mb-1" style={{ color: textColor }}>
                                        {field.label} {field.required && <span className="text-red-500 text-xs align-top">필수</span>}
                                    </label>

                                    {/* Field Type Rendering Switch */}
                                    {(() => {
                                        // 1. SELECT
                                        if (field.type === 'select' && field.options) {
                                            return (
                                                <div className="relative">
                                                    <select
                                                        name={field.id}
                                                        required={field.required}
                                                        value={formData[field.id] || ''}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all appearance-none bg-white pr-10 text-gray-900"
                                                        style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                                    >
                                                        <option value="" disabled>선택해주세요</option>
                                                        {field.options.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                                </div>
                                            );
                                        }

                                        // 2. RADIO
                                        if (field.type === 'radio' && field.options) {
                                            return (
                                                <div className="grid grid-cols-2 gap-2 mt-1">
                                                    {field.options.map((opt) => (
                                                        <label
                                                            key={opt.value}
                                                            className={`flex items-center justify-center px-3 py-3 rounded-lg border cursor-pointer transition-all ${formData[field.id] === opt.value
                                                                ? 'border-transparent bg-opacity-10 font-bold shadow-inner'
                                                                : 'border-gray-200 hover:bg-gray-50'
                                                                }`}
                                                            style={{
                                                                backgroundColor: formData[field.id] === opt.value ? themeColor : '#ffffff',
                                                                color: formData[field.id] === opt.value ? 'black' : '#374151',
                                                                borderColor: formData[field.id] === opt.value ? themeColor : '#e5e7eb'
                                                            }}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={field.id}
                                                                value={opt.value}
                                                                checked={formData[field.id] === opt.value}
                                                                onChange={() => handleRadioChange(field.id, opt.value)}
                                                                className="hidden"
                                                                required={field.required}
                                                            />
                                                            <span className="text-sm">{opt.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            );
                                        }

                                        // 3. TEL (3-Part Split)
                                        if (field.type === 'tel') {
                                            const { p1, p2, p3 } = parsePhone(formData[field.id]);
                                            return (
                                                <div className="flex gap-2 items-center">
                                                    <div className="relative w-24 shrink-0">
                                                        <select
                                                            value={p1}
                                                            onChange={(e) => handlePhonePartChange(field.id, 'p1', e.target.value)}
                                                            className="w-full px-2 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none bg-white text-center appearance-none text-gray-900"
                                                            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                                        >
                                                            {PHONE_PREFIXES.map(pre => (
                                                                <option key={pre} value={pre}>{pre}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                                                    </div>
                                                    <span className="text-gray-400 shrink-0">-</span>
                                                    <input
                                                        type="tel"
                                                        id={`${field.id}_p2`}
                                                        value={p2}
                                                        onChange={(e) => handlePhonePartChange(field.id, 'p2', e.target.value)}
                                                        maxLength={4}
                                                        placeholder="0000"
                                                        className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none text-center bg-white text-gray-900"
                                                        style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                                    />
                                                    <span className="text-gray-400 shrink-0">-</span>
                                                    <input
                                                        type="tel"
                                                        id={`${field.id}_p3`}
                                                        value={p3}
                                                        onChange={(e) => handlePhonePartChange(field.id, 'p3', e.target.value)}
                                                        maxLength={4}
                                                        placeholder="0000"
                                                        className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none text-center bg-white text-gray-900"
                                                        style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                                    />
                                                </div>
                                            );
                                        }

                                        // 4. TEXTAREA (Long Text)
                                        if (field.type === 'textarea') {
                                            const currentLen = (formData[field.id] || '').length;
                                            return (
                                                <div className="relative">
                                                    <textarea
                                                        name={field.id}
                                                        placeholder={field.placeholder || '내용을 입력해주세요 (최대 200자)'}
                                                        required={field.required}
                                                        value={formData[field.id] || ''}
                                                        onChange={handleTextareaChange}
                                                        maxLength={200}
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all resize-none h-32 bg-white text-gray-900"
                                                        style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                                    />
                                                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-mono">
                                                        {currentLen}/200
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // 5. TIME SELECT (06:00 ~ 24:00, 30min)
                                        if (field.type === 'time') {
                                            // Generate slots on the fly or use static
                                            const timeSlots = [];
                                            for (let h = 6; h <= 24; h++) {
                                                const hStr = h < 10 ? `0${h}` : `${h}`;
                                                timeSlots.push(`${hStr}:00`);
                                                if (h < 24) timeSlots.push(`${hStr}:30`);
                                            }

                                            return (
                                                <div className="relative">
                                                    <select
                                                        name={field.id}
                                                        required={field.required}
                                                        value={formData[field.id] || ''}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all appearance-none bg-white pr-10 text-gray-900"
                                                        style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                                    >
                                                        <option value="" disabled>시간을 선택해주세요</option>
                                                        {timeSlots.map(time => (
                                                            <option key={time} value={time}>{time}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                                </div>
                                            );
                                        }

                                        // 5. DEFAULT TEXT (Short Text)
                                        const currentLen = (formData[field.id] || '').length;
                                        return (
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name={field.id}
                                                    placeholder={field.placeholder || '최대 20자'}
                                                    required={field.required}
                                                    value={formData[field.id] || ''}
                                                    onChange={handleChange}
                                                    maxLength={20}
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all pr-12 bg-white text-gray-900"
                                                    style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                                />
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-mono">
                                                    {currentLen}/20
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )
                        })}
                    </div>

                    {/* --- Policy Agreements Section --- */}
                    <div
                        className="p-4 rounded-lg text-sm space-y-3 border mb-6"
                        style={{
                            backgroundColor: formStyle.backgroundColor === '#1e40af' ? 'rgba(255,255,255,0.1)' : '#f9fafb', // Adjust for dark theme
                            borderColor: formStyle.backgroundColor === '#1e40af' ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                            color: textColor
                        }}
                    >
                        {config.showPrivacyPolicy && (
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" checked={consents.privacy} onChange={() => toggleConsent('privacy')} className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="leading-snug flex-1 opacity-90">
                                    [필수] 개인정보 수집 및 이용 동의 <button type="button" onClick={(e) => { e.preventDefault(); openPolicy('privacy'); }} className="underline ml-1 hover:opacity-100 font-bold">전문보기</button>
                                </span>
                            </label>
                        )}
                        {config.showThirdPartyConsent && (
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" checked={consents.thirdParty} onChange={() => toggleConsent('thirdParty')} className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="leading-snug flex-1 opacity-90">
                                    [필수] 개인정보 제3자 제공 동의 <button type="button" onClick={(e) => { e.preventDefault(); openPolicy('thirdParty'); }} className="underline ml-1 hover:opacity-100 font-bold">전문보기</button>
                                </span>
                            </label>
                        )}
                        {config.showMarketingConsent && (
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" checked={consents.marketing} onChange={() => toggleConsent('marketing')} className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="leading-snug flex-1 opacity-90">
                                    [선택] 광고성 정보 수신 동의 <button type="button" onClick={(e) => { e.preventDefault(); openPolicy('marketing'); }} className="underline ml-1 hover:opacity-100 font-bold">전문보기</button>
                                </span>
                            </label>
                        )}
                        {config.showTerms && (
                            <div className="text-xs opacity-70 flex items-center gap-1 pt-1 border-t border-gray-200/20 mt-2">
                                <FileText className="w-3 h-3" />
                                <button type="button" onClick={(e) => { e.preventDefault(); openPolicy('terms'); }} className="underline hover:opacity-100">
                                    이용약관 확인하기
                                </button>
                            </div>
                        )}
                    </div>

                    {status === 'error' && (
                        <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: formStyle.buttonAlign === 'left' ? 'flex-start' : (formStyle.buttonAlign === 'right' ? 'flex-end' : 'center') }}>
                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="py-4 font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: btnBg,
                                color: btnText,
                                borderRadius: btnRadius,
                                fontSize: formStyle.buttonFontSize || '1.125rem',
                                width: formStyle.buttonWidth === 'full' ? '100%' : (formStyle.buttonWidth === 'auto' ? 'auto' : (formStyle.buttonWidth || '100%')),
                                minWidth: formStyle.buttonWidth === 'auto' ? '200px' : undefined, // Optional: ensure not too small if auto
                                paddingLeft: '2rem', paddingRight: '2rem'
                            }}
                        >
                            {status === 'submitting' ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    처리중...
                                </>
                            ) : (
                                config.submitButtonText
                            )}
                        </button>
                    </div>

                    <div className="flex justify-center items-center gap-4 text-xs mt-3 opacity-60" style={{ color: textColor }}>
                        <div className="flex items-center gap-1"><Lock className="w-3 h-3" /> SSL 보안 적용</div>
                        <div className="flex items-center gap-1">개인정보 암호화</div>
                    </div>
                </form>
            </div>

            {/* Policy Modal */}
            {modalContent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900">{modalContent.title}</h3>
                            <button onClick={() => setModalContent(null)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                            {modalContent.content}
                        </div>
                        <div className="p-4 border-t text-right">
                            <button onClick={() => setModalContent(null)} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold">
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LeadForm;