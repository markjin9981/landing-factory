import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { FormField } from '../../../types';

interface UnifiedFormFieldProps {
    field: FormField;
    value: any;
    onChange: (value: any) => void;
    error?: string;
    formStyle?: {
        questionColor?: string;
        questionSize?: string;
        answerColor?: string;
        answerBgColor?: string;
        answerBorderColor?: string;
        questionFont?: string;
        answerFont?: string;
        answerFontSize?: string;
        inputBorderRadius?: string; // New: Custom border radius
    };
    primaryColor?: string;
    layout?: 'standard' | 'inline' | 'compact' | 'minimal' | 'card' | 'stickyMobile'; // NEW: Added stickyMobile for sticky bottom form mobile view
}

const PHONE_PREFIXES = [
    '010', '011', '016', '017', '018', '019',
    '02', '031', '032', '033', '041', '042', '043', '044',
    '051', '052', '053', '054', '055', '061', '062', '063', '064'
];

const EMAIL_DOMAINS = ['naver.com', 'hanmail.net', 'gmail.com', 'nate.com', 'daum.net', 'kakao.com', 'direct'];

const UnifiedFormField: React.FC<UnifiedFormFieldProps> = ({
    field,
    value,
    onChange,
    error,
    formStyle,
    primaryColor = '#3b82f6',
    layout = 'standard' // NEW: Default to standard
}) => {
    // Helper Functions
    const parsePhone = (val: string) => {
        if (!val) return { p1: '010', p2: '', p3: '' };
        const parts = val.split('-');
        return { p1: parts[0] || '010', p2: parts[1] || '', p3: parts[2] || '' };
    };

    const handlePhoneChange = (part: 'p1' | 'p2' | 'p3', val: string) => {
        if ((part === 'p2' || part === 'p3') && !/^\d*$/.test(val)) return;
        const { p1, p2, p3 } = parsePhone(value);
        let newP1 = p1, newP2 = p2, newP3 = p3;
        if (part === 'p1') newP1 = val;
        if (part === 'p2') newP2 = val;
        if (part === 'p3') newP3 = val;
        onChange(`${newP1}-${newP2}-${newP3}`);
        if (part === 'p2' && val.length >= 4) {
            document.getElementById(`${field.id}_p3`)?.focus();
        }
    };

    const parseEmail = (val: string) => {
        if (!val) return { id: '', domain: 'naver.com' };
        const parts = val.split('@');
        if (parts.length < 2) return { id: val, domain: 'naver.com' };
        return { id: parts[0], domain: parts[1] };
    };

    const handleEmailChange = (type: 'id' | 'domain' | 'direct', val: string) => {
        const { id, domain } = parseEmail(value);
        let newId = id, newDomain = domain;

        if (type === 'id') newId = val;
        if (type === 'domain') {
            if (val === 'direct') {
                newDomain = ''; // Reset domain for direct input
                onChange(`${newId}@`);
            } else {
                newDomain = val;
                onChange(`${newId}@${newDomain}`);
            }
        }
        if (type === 'direct') {
            onChange(`${newId}@${val}`);
        }
    };

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
                const finalAddr = `[${data.zonecode}] ${fullAddr}${extraAddr}`;
                onChange(finalAddr);
                setTimeout(() => {
                    document.getElementById(`${field.id}_detail`)?.focus();
                }, 100);
            }
        }).open();
    };

    const generateTimeSlots = () => {
        const startTime = field.timeConfig?.startTime || '09:00';
        const endTime = field.timeConfig?.endTime || '18:00';
        const interval = field.timeConfig?.interval || 30;
        const slots = [];
        let current = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        if (current > end) return ['오전 09:00'];
        while (current <= end) {
            const hours = current.getHours();
            const minutes = current.getMinutes();
            const ampm = hours >= 12 ? '오후' : '오전';
            let displayHour = hours % 12;
            displayHour = displayHour === 0 ? 12 : displayHour;
            const displayMinute = minutes < 10 ? `0${minutes}` : minutes;
            slots.push(`${ampm} ${displayHour < 10 ? `0${displayHour}` : displayHour}:${displayMinute}`);
            current = new Date(current.getTime() + interval * 60000);
        }
        return slots;
    };

    // Style Helpers
    const getLabelStyle = () => ({
        color: formStyle?.questionColor || '#374151',
        fontSize: formStyle?.questionSize === 'sm' ? '0.875rem' : formStyle?.questionSize === 'xl' ? '1.25rem' : '1rem',
        fontFamily: formStyle?.questionFont
    });

    const getInputStyle = () => ({
        backgroundColor: formStyle?.answerBgColor || '#ffffff',
        color: formStyle?.answerColor || '#000000',
        borderColor: error ? '#ef4444' : (formStyle?.answerBorderColor || '#e5e7eb'),
        fontFamily: formStyle?.answerFont,
        fontSize: formStyle?.answerFontSize || '1rem',
        borderRadius: formStyle?.inputBorderRadius || '0.75rem', // Default: rounded-xl (12px)
        '--placeholder-color': '#9ca3af' // Gray placeholder color
    } as React.CSSProperties);

    // Adjusted: Smaller padding for compact/minimal/stickyMobile layouts
    const isStickyMobile = layout === 'stickyMobile';
    const isCompact = layout === 'compact' || layout === 'minimal' || isStickyMobile;
    // Remove rounded-xl from class since we apply it via style
    const inputBaseClass = `w-full ${isCompact ? 'px-3 py-2 text-sm' : 'p-4'} border focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder-gray-400`;

    // Helper: Format phone number with auto-hyphen (for stickyMobile)
    const formatPhoneNumber = (input: string): string => {
        const numbers = input.replace(/\D/g, '').slice(0, 11);
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    };

    // Helper: Get placeholder with label (for stickyMobile)
    const getStickyPlaceholder = (defaultPlaceholder?: string): string => {
        if (!isStickyMobile) return defaultPlaceholder || '';
        const prefix = field.required ? '*' : '';
        return `${prefix}${field.label}`;
    };

    // NEW: Determine container classes based on layout
    const isInline = layout === 'inline';
    const containerClasses = isInline
        ? 'flex items-center gap-3 flex-1 min-w-[200px]'
        : 'space-y-2 text-left';

    return (
        <div className={containerClasses}>
            {/* Label: Hidden for stickyMobile */}
            {!isStickyMobile && (
                <label className="block font-bold mb-2 break-keep" style={getLabelStyle()}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* TEL */}
            {field.type === 'tel' && (() => {
                // stickyMobile: Single input with auto-hyphen
                if (isStickyMobile) {
                    return (
                        <input
                            type="tel"
                            value={value || ''}
                            onChange={(e) => onChange(formatPhoneNumber(e.target.value))}
                            placeholder={getStickyPlaceholder('010-0000-0000')}
                            className={inputBaseClass}
                            style={getInputStyle()}
                        />
                    );
                }

                // Standard: 3-part phone input
                const { p1, p2, p3 } = parsePhone(value);
                return (
                    <div className="flex gap-2 items-center">
                        <div className="relative w-24 shrink-0">
                            <select
                                value={p1}
                                onChange={(e) => handlePhoneChange('p1', e.target.value)}
                                className={`w-full ${isCompact ? 'px-1 py-2 text-sm' : 'px-2 py-3'} rounded-lg border focus:ring-2 outline-none bg-white text-center appearance-none`}
                                style={getInputStyle()}
                            >
                                {PHONE_PREFIXES.map(pre => <option key={pre} value={pre}>{pre}</option>)}
                            </select>
                            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                        </div>
                        <span className="text-gray-400 shrink-0">-</span>
                        <input
                            type="tel"
                            id={`${field.id}_p2`}
                            value={p2}
                            onChange={(e) => handlePhoneChange('p2', e.target.value)}
                            maxLength={4}
                            placeholder="0000"
                            className="flex-1 min-w-0 px-4 py-3 rounded-lg border focus:ring-2 outline-none"
                            style={getInputStyle()}
                        />
                        <span className="text-gray-400 shrink-0">-</span>
                        <input
                            type="tel"
                            id={`${field.id}_p3`}
                            value={p3}
                            onChange={(e) => handlePhoneChange('p3', e.target.value)}
                            maxLength={4}
                            placeholder="0000"
                            className="flex-1 min-w-0 px-4 py-3 rounded-lg border focus:ring-2 outline-none"
                            style={getInputStyle()}
                        />
                    </div>
                );
            })()}

            {/* EMAIL */}
            {field.type === 'email' && (() => {
                // stickyMobile: Single email input
                if (isStickyMobile) {
                    return (
                        <input
                            type="email"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={getStickyPlaceholder('example@email.com')}
                            className={inputBaseClass}
                            style={getInputStyle()}
                        />
                    );
                }

                // Standard: Split email input
                const { id, domain } = parseEmail(value);
                const isDirect = !EMAIL_DOMAINS.includes(domain) && domain !== '';
                const currentDomain = isDirect ? 'direct' : domain;

                return (
                    <div className="flex flex-wrap gap-2 items-center">
                        <input
                            type="text"
                            placeholder="이메일 아이디"
                            value={id}
                            onChange={(e) => handleEmailChange('id', e.target.value)}
                            className={`flex-1 min-w-[120px] ${isCompact ? 'px-3 py-2 text-sm' : 'px-4 py-3'} rounded-lg border focus:ring-2 outline-none`}
                            style={getInputStyle()}
                        />
                        <span className="text-gray-400">@</span>
                        <div className="relative flex-1 min-w-[140px]">
                            <select
                                value={currentDomain}
                                onChange={(e) => handleEmailChange('domain', e.target.value)}
                                className={`w-full ${isCompact ? 'px-3 py-2 text-sm' : 'px-4 py-3'} rounded-lg border focus:ring-2 outline-none appearance-none pr-10`}
                                style={getInputStyle()}
                            >
                                {EMAIL_DOMAINS.map(d => <option key={d} value={d}>{d === 'direct' ? '직접입력' : d}</option>)}
                                {!EMAIL_DOMAINS.includes('direct') && <option value="direct">직접입력</option>}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                        {(currentDomain === 'direct' || isDirect) && (
                            <input
                                type="text"
                                placeholder="도메인 입력"
                                value={domain}
                                onChange={(e) => handleEmailChange('direct', e.target.value)}
                                className={`w-full md:w-auto md:flex-1 ${isCompact ? 'px-3 py-2 text-sm' : 'px-4 py-3'} rounded-lg border focus:ring-2 outline-none`}
                                style={getInputStyle()}
                            />
                        )}
                    </div>
                );
            })()}

            {/* ADDRESS */}
            {field.type === 'address' && (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            placeholder="주소를 검색해주세요"
                            value={value || ''}
                            onClick={handleAddressSearch}
                            className={`flex-1 ${isCompact ? 'px-3 py-2 text-sm' : 'px-4 py-3'} rounded-lg border bg-gray-50 cursor-pointer`}
                            style={getInputStyle()}
                        />
                        <button
                            type="button"
                            onClick={handleAddressSearch}
                            className={`${isCompact ? 'px-3 py-2 text-sm' : 'px-4 py-3'} bg-gray-800 text-white rounded-lg whitespace-nowrap font-bold hover:bg-gray-700`}
                        >
                            주소 검색
                        </button>
                    </div>
                </div>
            )}

            {/* TIME */}
            {field.type === 'time' && (
                <div className="relative">
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full ${isCompact ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border focus:ring-2 outline-none appearance-none ${!value && isStickyMobile ? 'text-gray-400' : ''}`}
                        style={getInputStyle()}
                    >
                        <option value="" className="text-gray-400">{isStickyMobile ? getStickyPlaceholder() : '시간을 선택해주세요'}</option>
                        {generateTimeSlots().map((slot, idx) => <option key={idx} value={slot} className="text-gray-900">{slot}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
            )}

            {/* DATE */}
            {field.type === 'date' && (
                <input
                    type="date"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={inputBaseClass}
                    style={getInputStyle()}
                />
            )}

            {/* SELECT */}
            {field.type === 'select' && (
                <div className="relative">
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full ${isCompact ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border focus:ring-2 outline-none appearance-none ${!value && isStickyMobile ? 'text-gray-400' : ''}`}
                        style={getInputStyle()}
                    >
                        <option value="" className="text-gray-400">{isStickyMobile ? getStickyPlaceholder() : '선택해주세요'}</option>
                        {(field.options || []).map((opt: any) => (
                            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value} className="text-gray-900">
                                {typeof opt === 'string' ? opt : opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
            )}

            {/* RADIO */}
            {field.type === 'radio' && (
                <div className="grid grid-cols-1 gap-2">
                    {(field.options || []).map((opt: any) => {
                        const optValue = typeof opt === 'string' ? opt : opt.value;
                        const optLabel = typeof opt === 'string' ? opt : opt.label;
                        const isSelected = value === optValue;
                        return (
                            <label
                                key={optValue}
                                className={`flex items-center ${isCompact ? 'p-2 rounded-lg' : 'p-4 rounded-xl'} border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                                style={{
                                    backgroundColor: isSelected ? (primaryColor + '10') : (formStyle?.answerBgColor || '#ffffff'),
                                    borderColor: isSelected ? primaryColor : (formStyle?.answerBorderColor || '#e5e7eb'),
                                    color: isSelected ? primaryColor : (formStyle?.answerColor || '#000000')
                                }}
                            >
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={optValue}
                                    checked={isSelected}
                                    onChange={() => onChange(optValue)}
                                    className="hidden"
                                />
                                <div
                                    className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center`}
                                    style={{
                                        borderColor: isSelected ? primaryColor : '#d1d5db',
                                        backgroundColor: isSelected ? primaryColor : 'transparent'
                                    }}
                                >
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="font-medium" style={{ fontFamily: formStyle?.answerFont }}>{optLabel}</span>
                            </label>
                        );
                    })}
                </div>
            )}

            {/* CHECKBOX */}
            {field.type === 'checkbox' && (
                <div className="grid grid-cols-1 gap-2">
                    {(field.options || []).map((opt: any) => {
                        const optValue = typeof opt === 'string' ? opt : opt.value;
                        const optLabel = typeof opt === 'string' ? opt : opt.label;
                        const currentValues = value ? value.split(',') : [];
                        const isSelected = currentValues.includes(optValue);
                        const handleCheckboxChange = () => {
                            let newValues;
                            if (isSelected) {
                                newValues = currentValues.filter((v: string) => v !== optValue);
                            } else {
                                newValues = [...currentValues, optValue];
                            }
                            onChange(newValues.join(','));
                        };
                        return (
                            <label
                                key={optValue}
                                className={`flex items-center ${isCompact ? 'p-2 rounded-lg' : 'p-4 rounded-xl'} border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                                style={{
                                    backgroundColor: isSelected ? (primaryColor + '10') : (formStyle?.answerBgColor || '#ffffff'),
                                    borderColor: isSelected ? primaryColor : (formStyle?.answerBorderColor || '#e5e7eb')
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={handleCheckboxChange}
                                    className="hidden"
                                />
                                <div
                                    className={`w-5 h-5 rounded border mr-3 flex items-center justify-center`}
                                    style={{
                                        borderColor: isSelected ? primaryColor : '#d1d5db',
                                        backgroundColor: isSelected ? primaryColor : 'transparent'
                                    }}
                                >
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="font-medium" style={{ fontFamily: formStyle?.answerFont }}>{optLabel}</span>
                            </label>
                        );
                    })}
                </div>
            )}

            {/* TEXTAREA */}
            {field.type === 'textarea' && (() => {
                const currentLen = (value || '').length;
                return (
                    <div className="relative">
                        <textarea
                            value={value || ''}
                            onChange={(e) => {
                                if (e.target.value.length <= 200) onChange(e.target.value);
                            }}
                            placeholder={isStickyMobile ? getStickyPlaceholder() : (field.placeholder || '내용을 입력해주세요 (최대 200자)')}
                            maxLength={200}
                            className={`${inputBaseClass} min-h-[120px] resize-none`}
                            style={getInputStyle()}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-mono">{currentLen}/200</div>
                    </div>
                );
            })()}

            {/* TEXT & FALLBACK */}
            {(field.type === 'text' || field.type === 'number' || (!['tel', 'email', 'address', 'date', 'time', 'select', 'radio', 'checkbox', 'textarea'].includes(field.type))) && (() => {
                const currentLen = (value || '').length;
                return (
                    <div className="relative">
                        <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={value || ''}
                            onChange={(e) => {
                                if (field.type !== 'number' && e.target.value.length > 50) return;
                                onChange(e.target.value);
                            }}
                            placeholder={isStickyMobile ? getStickyPlaceholder() : (field.placeholder || (field.type === 'number' ? '숫자 입력' : '최대 50자'))}
                            maxLength={field.type === 'number' ? undefined : 50}
                            className={`${inputBaseClass} ${isStickyMobile ? '' : 'pr-12'}`}
                            style={getInputStyle()}
                        />
                        {/* Hide character counter for stickyMobile */}
                        {field.type !== 'number' && !isStickyMobile && <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-mono">{currentLen}/50</div>}
                    </div>
                );
            })()}

            {error && (
                <p className="text-red-500 text-sm pl-1">{error}</p>
            )}
        </div>
    );
};

export default UnifiedFormField;
