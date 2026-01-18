
import React, { useState } from 'react';
import { FormSection, LeadData, PixelConfig, LandingConfig } from '../types';
import { trackConversion } from '../utils/pixelUtils';
import { submitLeadToSheet } from '../services/googleSheetService';
import { CheckCircle, AlertCircle, Loader2, Lock, FileText, X, ChevronDown } from 'lucide-react';
import SecurityFooter from './SecurityFooter';
import AnimatedHeadline from './AnimatedHeadline';

interface Props {
    config: FormSection;
    landingId: string;
    themeColor: string;
    pageTitle?: string; // Global Page Title
    isMobileView?: boolean; // New: For Grid layout control
    pixelConfig?: PixelConfig;
    utmParams?: Record<string, string | undefined>;
    landingConfig?: LandingConfig; // NEW: For additional sheet config
}

const LeadForm: React.FC<Props> = ({ config, landingId, themeColor, pageTitle, isMobileView, pixelConfig, utmParams, landingConfig }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    // Security: Honeypot field (bots fill this, humans don't)
    const [honeypot, setHoneypot] = useState('');

    // Consent States
    const [consents, setConsents] = useState({
        privacy: true, // Default checked for better UX, usually requires explicit opt-in in KR
        thirdParty: false,
        marketing: false
    });

    const [modalContent, setModalContent] = useState<{ title: string, content: string } | null>(null);

    const formStyle = config.style || {};
    const containerBg = formStyle.backgroundColor || '#ffffff';
    const containerBorder = formStyle.borderColor ? `${formStyle.borderWidth || '1px'} solid ${formStyle.borderColor} ` : '1px solid #e5e7eb';
    const containerRadius = formStyle.borderRadius || '16px';
    const textColor = formStyle.textColor || '#1f2937'; // Default gray-800

    const btnBg = formStyle.buttonBackgroundColor || themeColor;
    const btnText = formStyle.buttonTextColor || '#ffffff';
    const btnRadius = formStyle.buttonRadius || '12px';

    // FORCE Vertical layout if mobile view, even if grid is selected
    const isGridLayout = config.layout === 'grid' && !isMobileView;

    // Mobile Template Styles - ULTRA COMPACT OPTIMIZATION
    const MOBILE_TEMPLATES = {
        default: {
            inputHeight: '44px',
            labelMargin: '8px',
            formPadding: '24px',
            fieldGap: '16px',
            fontSize: '14px',
            useInlinePhone: false,
            useInlineDate: false,
            useGrid: false,
            headerPadding: '2rem', // default p-8
            headerScale: 1,
            forceSinglePhone: false,
        },
        minimal: {
            inputHeight: '36px',
            labelMargin: '2px', // Reduced
            formPadding: '12px', // Drastically reduced
            fieldGap: '8px', // Reduced
            fontSize: '13px',
            useInlinePhone: false,
            useInlineDate: false,
            useGrid: false,
            headerPadding: '12px',
            headerScale: 0.8,
            forceSinglePhone: true,
        },
        inline: {
            inputHeight: '40px',
            labelMargin: '4px',
            formPadding: '16px',
            fieldGap: '10px',
            fontSize: '14px',
            useInlinePhone: true,
            useInlineDate: true,
            useGrid: false,
            headerPadding: '16px',
            headerScale: 0.9,
            forceSinglePhone: false,
        },
        'compact-grid': {
            inputHeight: '34px', // Ultra slim
            labelMargin: '2px',
            formPadding: '10px', // Minimal padding
            fieldGap: '6px', // Tight gap
            fontSize: '13px',
            useInlinePhone: false,
            useInlineDate: false,
            useGrid: true,
            headerPadding: '12px',
            headerScale: 0.75,
            forceSinglePhone: true, // New: Force single-line phone input
        }
    };

    // Select template based on mobile view and configuration
    const templateKey = isMobileView ? (config.mobileTemplate || 'default') : 'default';
    const template = MOBILE_TEMPLATES[templateKey];

    // ... (rest of the component)


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
            website: honeypot, // Security: Honeypot field
            ...formData,
        };

        // NEW: Generate formatted fields for Email
        // This ensures the email respects the ORDER of fields in the editor
        // and uses the correct LABEL instead of internal IDs.
        const formattedFields = (config.fields || []).map(field => {
            let val = formData[field.id] || '';
            return { label: field.label, value: val };
        });
        (payload as any).formatted_fields = JSON.stringify(formattedFields);

        // NEW: Additional sheet configuration
        if (landingConfig?.additionalSheetConfig) {
            (payload as any).additional_sheet_config = JSON.stringify(landingConfig.additionalSheetConfig);
        }

        // NEW: 리드마스터 연동 설정 (백엔드에서 시트 직접 쓰기)
        if (landingConfig?.leadMasterConfig?.isEnabled && landingConfig.leadMasterConfig.spreadsheetUrl) {
            (payload as any).leadmaster_config = JSON.stringify({
                spreadsheetUrl: landingConfig.leadMasterConfig.spreadsheetUrl,
                sheetName: landingConfig.leadMasterConfig.sheetName || 'Leads',
                managerName: landingConfig.leadMasterConfig.managerName || '',
                landingId: landingConfig.leadMasterConfig.landingId || 'landing-factory'
            });
        }

        // NEW: Notification Email
        if (config.notificationEmail) {
            (payload as any).notification_email = config.notificationEmail;
        }

        console.log("Submitting Payload:", payload); // Debug log for robust tracking

        const success = await submitLeadToSheet(payload);

        if (success) {
            trackConversion(pixelConfig);
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

    // Handle redirect after submission success
    const redirectUrl = config.redirectUrl;
    const redirectDelay = (config.redirectDelay ?? 2) * 1000;

    React.useEffect(() => {
        if (status === 'success' && redirectUrl) {
            const timer = setTimeout(() => {
                window.location.href = redirectUrl;
            }, redirectDelay);
            return () => clearTimeout(timer);
        }
    }, [status, redirectUrl, redirectDelay]);

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
                {redirectUrl && (
                    <p className="mt-4 text-sm opacity-60" style={{ color: textColor }}>
                        잠시 후 페이지가 이동됩니다...
                    </p>
                )}
                {!redirectUrl && (
                    <button
                        onClick={() => setStatus('idle')}
                        className="mt-6 text-sm underline hover:opacity-80"
                        style={{ color: textColor }}
                    >
                        다시 작성하기
                    </button>
                )}
            </div>
        );
    }

    return (
        <>
            <div
                className="shadow-2xl overflow-hidden"
                style={{ backgroundColor: containerBg, borderRadius: containerRadius, border: containerBorder }}
            >
                <div
                    className="text-center border-b border-black/5"
                    style={{
                        backgroundColor: themeColor,
                        padding: isMobileView ? (template.headerPadding || '2rem') : '2rem'
                    }}
                >
                    <h3
                        className="font-bold mb-2"
                        style={{
                            fontSize: isMobileView
                                ? `calc(${formStyle.titleFontSize || '1.5rem'} * ${template.headerScale || 1})`
                                : (formStyle.titleFontSize || '1.5rem'),
                            color: formStyle.titleColor || 'white',
                            textAlign: (formStyle.titleAlign || 'center') as any,
                            fontFamily: formStyle.titleFontFamily
                        }}
                    >
                        {config.title}
                    </h3>
                    <p className="text-white/90 text-sm" style={{ fontSize: isMobileView ? '0.75rem' : '0.875rem' }}>{config.subTitle}</p>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: isMobileView ? template.formPadding : '2rem' }}>

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

                    {/* Fields Container */}
                    <div
                        className={isGridLayout ? "grid grid-cols-1 md:grid-cols-2 mb-6" : "mb-6"}
                        style={{
                            gap: isMobileView ? template.fieldGap : '1.25rem',
                            display: isGridLayout ? 'grid' : (template.useGrid && isMobileView ? 'grid' : 'flex'),
                            gridTemplateColumns: template.useGrid && isMobileView ? 'repeat(2, 1fr)' : undefined,
                            flexDirection: (!isGridLayout && !template.useGrid) ? 'column' : undefined
                        }}
                    >
                        {config.fields.map((field) => {
                            // Smart Grid Logic: Force full width for Textarea, Radio, Phone, Email, and Address (in compact mode)
                            const isFullWidth = field.type === 'textarea' || field.type === 'radio' || field.type === 'email' || field.type === 'address' || (field.type === 'tel' && template.forceSinglePhone);

                            return (
                                <div
                                    key={field.id}
                                    className={`${isGridLayout && isFullWidth ? 'md:col-span-2' : ''} ${template.useGrid && isMobileView && isFullWidth ? 'col-span-2' : ''} `}
                                >
                                    <label
                                        className="block text-sm font-semibold truncate"
                                        style={{
                                            color: textColor,
                                            fontFamily: formStyle.inputFontFamily,
                                            marginBottom: isMobileView ? template.labelMargin : '0.25rem',
                                            fontSize: isMobileView ? template.fontSize : '0.875rem',
                                            whiteSpace: 'nowrap', // Prevent wrapping
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {field.label} {field.required && <span className="text-red-500 text-[10px] align-top ml-0.5">필수</span>}
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
                                                        className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all appearance-none bg-white pr-8 text-gray-900"
                                                        style={{
                                                            '--tw-ring-color': themeColor,
                                                            fontFamily: formStyle.inputFontFamily,
                                                            height: isMobileView ? template.inputHeight : '44px',
                                                            fontSize: isMobileView ? template.fontSize : '14px',
                                                            paddingLeft: '1rem',
                                                            paddingRight: '1rem'
                                                        } as React.CSSProperties}
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
                                                            className={`flex items - center justify - center px - 3 rounded - lg border cursor - pointer transition - all ${formData[field.id] === opt.value
                                                                ? 'border-transparent bg-opacity-10 font-bold shadow-inner'
                                                                : 'border-gray-200 hover:bg-gray-50'
                                                                } `}
                                                            style={{
                                                                backgroundColor: formData[field.id] === opt.value ? themeColor : '#ffffff',
                                                                color: formData[field.id] === opt.value ? 'black' : '#374151',
                                                                borderColor: formData[field.id] === opt.value ? themeColor : '#e5e7eb',
                                                                height: isMobileView ? template.inputHeight : '44px',
                                                                fontSize: isMobileView ? template.fontSize : '14px'
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

                                        // 3. TEL (Split or Single based on template)
                                        if (field.type === 'tel') {
                                            if (isMobileView && template.forceSinglePhone) {
                                                // Single Line Phone Input for Ultra Compact Mobile
                                                return (
                                                    <div className="relative">
                                                        <input
                                                            type="tel"
                                                            value={formData[field.id] || ''}
                                                            onChange={(e) => {
                                                                let val = e.target.value.replace(/[^0-9]/g, '');
                                                                if (val.length > 11) val = val.slice(0, 11);

                                                                let formatted = val;
                                                                if (val.length > 3 && val.length <= 7) {
                                                                    formatted = `${val.slice(0, 3)} -${val.slice(3)} `;
                                                                } else if (val.length > 7) {
                                                                    formatted = `${val.slice(0, 3)} -${val.slice(3, 7)} -${val.slice(7)} `;
                                                                }
                                                                // If starts with 02 (Seoul), logic differs slightly but for now 010 standard
                                                                if (val.startsWith('02') && val.length > 2) {
                                                                    if (val.length <= 5) formatted = `${val.slice(0, 2)} -${val.slice(2)} `;
                                                                    else if (val.length <= 9) formatted = `${val.slice(0, 2)} -${val.slice(2, 5)} -${val.slice(5)} `;
                                                                    else formatted = `${val.slice(0, 2)} -${val.slice(2, 6)} -${val.slice(6)} `;
                                                                }

                                                                setFormData({ ...formData, [field.id]: formatted });
                                                            }}
                                                            placeholder="010-0000-0000"
                                                            className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all bg-white text-gray-900"
                                                            style={{
                                                                '--tw-ring-color': themeColor,
                                                                fontFamily: formStyle.inputFontFamily,
                                                                height: isMobileView ? template.inputHeight : '44px',
                                                                fontSize: isMobileView ? template.fontSize : '14px',
                                                                paddingLeft: '1rem',
                                                                paddingRight: '1rem'
                                                            } as React.CSSProperties}
                                                        />
                                                    </div>
                                                );
                                            }

                                            // Desktop: 3-Part Split
                                            const { p1, p2, p3 } = parsePhone(formData[field.id]);
                                            return (
                                                <div className="flex gap-2 items-center">
                                                    <div className="relative w-24 shrink-0">
                                                        <select
                                                            value={p1}
                                                            onChange={(e) => handlePhonePartChange(field.id, 'p1', e.target.value)}
                                                            className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none bg-white text-center appearance-none text-gray-900"
                                                            style={{
                                                                '--tw-ring-color': themeColor,
                                                                fontFamily: formStyle.inputFontFamily,
                                                                height: isMobileView ? template.inputHeight : '44px',
                                                                fontSize: isMobileView ? template.fontSize : '14px'
                                                            } as React.CSSProperties}
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
                                                        id={`${field.id} _p2`}
                                                        value={p2}
                                                        onChange={(e) => handlePhonePartChange(field.id, 'p2', e.target.value)}
                                                        maxLength={4}
                                                        placeholder="0000"
                                                        className="flex-1 min-w-0 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none text-left bg-white text-gray-900"
                                                        style={{
                                                            '--tw-ring-color': themeColor,
                                                            fontFamily: formStyle.inputFontFamily,
                                                            height: isMobileView ? template.inputHeight : '44px',
                                                            fontSize: isMobileView ? template.fontSize : '14px',
                                                            paddingLeft: '1rem',
                                                            paddingRight: '1rem'
                                                        } as React.CSSProperties}
                                                    />
                                                    <span className="text-gray-400 shrink-0">-</span>
                                                    <input
                                                        type="tel"
                                                        id={`${field.id} _p3`}
                                                        value={p3}
                                                        onChange={(e) => handlePhonePartChange(field.id, 'p3', e.target.value)}
                                                        maxLength={4}
                                                        placeholder="0000"
                                                        className="flex-1 min-w-0 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none text-left bg-white text-gray-900"
                                                        style={{
                                                            '--tw-ring-color': themeColor,
                                                            fontFamily: formStyle.inputFontFamily,
                                                            height: isMobileView ? template.inputHeight : '44px',
                                                            fontSize: isMobileView ? template.fontSize : '14px',
                                                            paddingLeft: '1rem',
                                                            paddingRight: '1rem'
                                                        } as React.CSSProperties}
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
                                                        className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all resize-none h-32 bg-white text-gray-900"
                                                        style={{
                                                            '--tw-ring-color': themeColor,
                                                            fontFamily: formStyle.inputFontFamily,
                                                            padding: isMobileView ? '0.75rem' : '1rem', // Reduced padding for mobile
                                                            fontSize: isMobileView ? template.fontSize : '14px'
                                                        } as React.CSSProperties}
                                                    />
                                                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-mono">
                                                        {currentLen}/200
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // 5. TIME SELECT (Enhanced: Single Select with Config)
                                        if (field.type === 'time') {
                                            const startTime = field.timeConfig?.startTime || '09:00';
                                            const endTime = field.timeConfig?.endTime || '18:00';
                                            const interval = field.timeConfig?.interval || 30;

                                            const generateTimeSlots = () => {
                                                const slots = [];
                                                // Create date objects for comparison (fixed date)
                                                let current = new Date(`2000-01-01T${startTime} `);
                                                const end = new Date(`2000-01-01T${endTime} `);

                                                // Safety check
                                                if (current > end) return ['오전 09:00'];

                                                while (current <= end) {
                                                    const hours = current.getHours();
                                                    const minutes = current.getMinutes();
                                                    const ampm = hours >= 12 ? '오후' : '오전';
                                                    let displayHour = hours % 12;
                                                    displayHour = displayHour === 0 ? 12 : displayHour;
                                                    const displayMinute = minutes < 10 ? `0${minutes} ` : minutes;

                                                    const value = `${ampm} ${displayHour < 10 ? `0${displayHour}` : displayHour}:${displayMinute} `;
                                                    slots.push(value);

                                                    // Increment
                                                    current = new Date(current.getTime() + interval * 60000);
                                                }
                                                return slots;
                                            };

                                            const timeSlots = generateTimeSlots();

                                            return (
                                                <div className="relative">
                                                    <select
                                                        name={field.id}
                                                        value={formData[field.id] || ''}
                                                        onChange={handleChange}
                                                        className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none appearance-none bg-white text-gray-900"
                                                        style={{
                                                            '--tw-ring-color': themeColor,
                                                            fontFamily: formStyle.inputFontFamily,
                                                            height: isMobileView ? template.inputHeight : '44px',
                                                            fontSize: isMobileView ? template.fontSize : '14px',
                                                            paddingLeft: '1rem',
                                                            paddingRight: '1rem'
                                                        } as React.CSSProperties}
                                                    >
                                                        <option value="">시간을 선택해주세요</option>
                                                        {timeSlots.map((slot, idx) => (
                                                            <option key={idx} value={slot}>{slot}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                                </div>
                                            );
                                        }

                                        // 6. DATE INPUT
                                        if (field.type === 'date') {
                                            return (
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        name={field.id}
                                                        required={field.required}
                                                        value={formData[field.id] || ''}
                                                        onChange={handleChange}
                                                        className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all bg-white text-gray-900"
                                                        style={{
                                                            '--tw-ring-color': themeColor,
                                                            fontFamily: formStyle.inputFontFamily,
                                                            height: isMobileView ? template.inputHeight : '44px',
                                                            fontSize: isMobileView ? template.fontSize : '14px',
                                                            paddingLeft: '1rem',
                                                            paddingRight: '1rem'
                                                        } as React.CSSProperties}
                                                    />
                                                </div>
                                            );
                                        }

                                        // 7. EMAIL INPUT (Split ID @ Domain)
                                        if (field.type === 'email') {
                                            const DOMAINS = ['naver.com', 'hanmail.net', 'gmail.com', 'nate.com', 'daum.net', 'kakao.com', 'direct'];

                                            // Helper to parse "id@domain"
                                            const parseEmail = (val: string) => {
                                                if (!val) return { id: '', domain: 'naver.com', direct: '' };
                                                const parts = val.split('@');
                                                if (parts.length < 2) return { id: val, domain: 'naver.com', direct: '' };

                                                const d = parts[1];
                                                const isKnown = DOMAINS.includes(d);
                                                return {
                                                    id: parts[0],
                                                    domain: isKnown ? d : 'direct',
                                                    direct: isKnown ? '' : d
                                                };
                                            };

                                            const { id, domain, direct } = parseEmail(formData[field.id]);

                                            const updateEmail = (type: 'id' | 'domain' | 'direct', val: string) => {
                                                let newId = id;
                                                let newDomain = domain;
                                                let newDirect = direct;

                                                if (type === 'id') newId = val;
                                                if (type === 'domain') {
                                                    newDomain = val;
                                                    if (val !== 'direct') newDirect = '';
                                                }
                                                if (type === 'direct') {
                                                    newDirect = val;
                                                    newDomain = 'direct';
                                                }

                                                const finalDomain = newDomain === 'direct' ? newDirect : newDomain;
                                                setFormData({ ...formData, [field.id]: `${newId} @${finalDomain} ` });
                                            };

                                            return (
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="이메일 아이디"
                                                        value={id}
                                                        onChange={(e) => updateEmail('id', e.target.value)}
                                                        className="flex-1 min-w-[120px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none bg-white text-gray-900"
                                                        style={{
                                                            '--tw-ring-color': themeColor,
                                                            fontFamily: formStyle.inputFontFamily,
                                                            height: isMobileView ? template.inputHeight : '44px',
                                                            fontSize: isMobileView ? template.fontSize : '14px',
                                                            paddingLeft: '1rem',
                                                            paddingRight: '1rem'
                                                        } as React.CSSProperties}
                                                    />
                                                    <span className="text-gray-400">@</span>
                                                    <div className="relative flex-1 min-w-[140px]">
                                                        <select
                                                            value={domain}
                                                            onChange={(e) => updateEmail('domain', e.target.value)}
                                                            className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none appearance-none bg-white pr-10 text-gray-900"
                                                            style={{
                                                                '--tw-ring-color': themeColor,
                                                                fontFamily: formStyle.inputFontFamily,
                                                                height: isMobileView ? template.inputHeight : '44px',
                                                                fontSize: isMobileView ? template.fontSize : '14px',
                                                                paddingLeft: '1rem',
                                                                paddingRight: '1rem'
                                                            } as React.CSSProperties}
                                                        >
                                                            <option value="naver.com">naver.com</option>
                                                            <option value="hanmail.net">hanmail.net</option>
                                                            <option value="daum.net">daum.net</option>
                                                            <option value="gmail.com">gmail.com</option>
                                                            <option value="nate.com">nate.com</option>
                                                            <option value="kakao.com">kakao.com</option>
                                                            <option value="direct">직접입력</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                                    </div>
                                                    {domain === 'direct' && (
                                                        <input
                                                            type="text"
                                                            placeholder="도메인 입력"
                                                            value={direct}
                                                            onChange={(e) => updateEmail('direct', e.target.value)}
                                                            className="w-full md:w-auto md:flex-1 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none bg-white text-gray-900"
                                                            style={{
                                                                '--tw-ring-color': themeColor,
                                                                fontFamily: formStyle.inputFontFamily,
                                                                height: isMobileView ? template.inputHeight : '44px',
                                                                fontSize: isMobileView ? template.fontSize : '14px',
                                                                paddingLeft: '1rem',
                                                                paddingRight: '1rem'
                                                            } as React.CSSProperties}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        }

                                        // 8. ADDRESS INPUT (Daum Postcode)
                                        if (field.type === 'address') {
                                            const loadDaumPostcode = () => {
                                                return new Promise((resolve) => {
                                                    if ((window as any).daum && (window as any).daum.Postcode) {
                                                        resolve((window as any).daum.Postcode);
                                                        return;
                                                    }
                                                    const script = document.createElement("script");
                                                    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
                                                    script.onload = () => resolve((window as any).daum.Postcode);
                                                    document.head.appendChild(script);
                                                });
                                            };

                                            const handleAddressSearch = async () => {
                                                await loadDaumPostcode();
                                                new (window as any).daum.Postcode({
                                                    oncomplete: function (data: any) {
                                                        const fullAddr = data.roadAddress || data.jibunAddress;
                                                        const extraAddr = data.bname ? ` (${data.bname})` : '';
                                                        const finalAddr = `[${data.zonecode}] ${fullAddr}${extraAddr} `;

                                                        setFormData(prev => ({
                                                            ...prev,
                                                            [field.id]: finalAddr
                                                        }));

                                                        // Auto focus detailed address input
                                                        setTimeout(() => {
                                                            document.getElementById(`${field.id} _detail`)?.focus();
                                                        }, 100);
                                                    }
                                                }).open();
                                            };

                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            placeholder="주소를 검색해주세요"
                                                            value={formData[field.id] || ''}
                                                            onClick={handleAddressSearch}
                                                            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none cursor-pointer text-gray-900"
                                                            style={{
                                                                height: isMobileView ? template.inputHeight : '44px',
                                                                fontSize: isMobileView ? template.fontSize : '14px',
                                                                paddingLeft: '1rem',
                                                                paddingRight: '1rem'
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleAddressSearch}
                                                            className="bg-gray-800 text-white rounded-lg whitespace-nowrap font-bold hover:bg-gray-700"
                                                            style={{
                                                                height: isMobileView ? template.inputHeight : '44px',
                                                                fontSize: isMobileView ? '12px' : '14px', // Smaller font for button on mobile
                                                                paddingLeft: isMobileView ? '0.75rem' : '1rem',
                                                                paddingRight: isMobileView ? '0.75rem' : '1rem'
                                                            }}
                                                        >
                                                            주소 검색
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        id={`${field.id} _detail`}
                                                        name={`${field.id} _detail`}
                                                        placeholder="상세주소를 입력해주세요"
                                                        value={formData[`${field.id} _detail`] || ''}
                                                        onChange={(e) => setFormData({ ...formData, [`${field.id} _detail`]: e.target.value })}
                                                        className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none bg-white text-gray-900"
                                                        style={{
                                                            '--tw-ring-color': themeColor,
                                                            fontFamily: formStyle.inputFontFamily,
                                                            height: isMobileView ? template.inputHeight : '44px',
                                                            fontSize: isMobileView ? template.fontSize : '14px',
                                                            paddingLeft: '1rem',
                                                            paddingRight: '1rem'
                                                        } as React.CSSProperties}
                                                    />
                                                </div>
                                            );
                                        }

                                        // 9. DEFAULT TEXT (Short Text)
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
                                                    className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-50 focus:border-transparent outline-none transition-all pr-12 bg-white text-gray-900"
                                                    style={{
                                                        '--tw-ring-color': themeColor,
                                                        fontFamily: formStyle.inputFontFamily,
                                                        height: isMobileView ? template.inputHeight : '44px',
                                                        fontSize: isMobileView ? template.fontSize : '14px',
                                                        paddingLeft: '1rem',
                                                        paddingRight: '3rem' // Extra padding for character count
                                                    } as React.CSSProperties}
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
                        className={`rounded - lg space - y - 3 border ${isMobileView ? 'p-3 text-xs mb-4' : 'p-4 text-sm mb-6'} `}
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
                            className={`py-4 font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed ${formStyle.buttonAnimation ? `animate-btn-${formStyle.buttonAnimation}` : ''}`}
                            style={{
                                backgroundColor: btnBg,
                                color: btnText,
                                borderRadius: btnRadius,
                                fontSize: formStyle.buttonFontSize || '1.125rem',
                                width: formStyle.buttonWidth === 'full' ? '100%' :
                                    (formStyle.buttonWidth === 'xs' ? '128px' :
                                        (formStyle.buttonWidth === 'sm' ? '192px' :
                                            (formStyle.buttonWidth === 'md' ? '256px' :
                                                (formStyle.buttonWidth === 'lg' ? '320px' :
                                                    (formStyle.buttonWidth === 'xl' ? '384px' :
                                                        (formStyle.buttonWidth === 'auto' ? 'auto' : '100%')))))),
                                minWidth: formStyle.buttonWidth === 'auto' ? '200px' : undefined, // Optional: ensure not too small if auto
                                paddingLeft: '2rem', paddingRight: '2rem',
                                fontFamily: formStyle.buttonFontFamily,
                                ...(formStyle.buttonBackgroundImage ? {
                                    backgroundImage: `url(${formStyle.buttonBackgroundImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    border: 'none'
                                } : (formStyle.buttonAnimation === 'shimmer' ? {
                                    '--btn-bg': btnBg,
                                    '--btn-shine': 'rgba(255,255,255,0.4)'
                                } : {}))
                            }}
                        >
                            {status === 'submitting' ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    처리중...
                                </>
                            ) : (
                                formStyle.buttonTextEffect && formStyle.buttonTextEffect !== 'none' ? (
                                    <AnimatedHeadline
                                        text={config.submitButtonText || '신청하기'}
                                        effect={formStyle.buttonTextEffect}
                                        duration={formStyle.buttonTextAnimationDuration}
                                        isLoop={formStyle.buttonTextAnimationLoop}
                                        className="w-full h-full flex flex-col items-center justify-center text-center leading-normal"
                                        style={{}}
                                    />
                                ) : (
                                    config.submitButtonText || '신청하기'
                                )
                            )}
                        </button>
                    </div>

                    <SecurityFooter presetId={config.style?.securityBadgeId} />
                </form>
            </div >

            {/* Policy Modal */}
            {
                modalContent && (
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
                )
            }
        </>
    );
};

export default LeadForm;