import React, { useState } from 'react';
import { FormField } from '../../../types';
import { Check, ChevronDown } from 'lucide-react';

interface EmbeddedFormProps {
    fields: FormField[];
    formData: any;
    onChange: (id: string, value: any) => void;
    errors: Record<string, string>;
    formStyle?: {
        // Container
        containerBgColor?: string;
        containerBgOpacity?: number;     // NEW: 0-100
        containerMaxHeight?: string;     // NEW: triggers scroll
        containerBorderColor?: string;
        containerBorderRadius?: string;
        containerPadding?: string;
        // Question Label
        questionColor?: string;
        questionSize?: 'sm' | 'md' | 'xl';
        questionFont?: string;
        // Answer Input
        answerBgColor?: string;
        answerColor?: string;
        answerBorderColor?: string;
        answerFont?: string;
        answerFontSize?: string;
    };
    primaryColor?: string;
    fieldOverrides?: {    // NEW: field-level overrides
        [fieldId: string]: {
            label?: string;
            type?: FormField['type'];
            required?: boolean;
            placeholder?: string;
            options?: any[];
        };
    };
}

const PHONE_PREFIXES = [
    '010', '011', '016', '017', '018', '019',
    '02', '031', '032', '033', '041', '042', '043', '044',
    '051', '052', '053', '054', '055', '061', '062', '063', '064'
];

const EMAIL_DOMAINS = ['naver.com', 'hanmail.net', 'gmail.com', 'nate.com', 'daum.net', 'kakao.com', 'direct'];

const EmbeddedForm: React.FC<EmbeddedFormProps> = ({
    fields,
    formData,
    onChange,
    errors,
    formStyle,
    primaryColor = '#3b82f6',
    fieldOverrides = {} // NEW: default to empty
}) => {
    const [emailDomains, setEmailDomains] = useState<Record<string, string>>({});
    const [emailDirects, setEmailDirects] = useState<Record<string, string>>({});

    if (!fields || fields.length === 0) return null;

    // Style helpers
    const getLabelStyle = () => ({
        color: formStyle?.questionColor || '#374151',
        fontSize: formStyle?.questionSize === 'sm' ? '0.875rem' : formStyle?.questionSize === 'xl' ? '1.25rem' : '1rem',
        fontFamily: formStyle?.questionFont
    });

    const getInputStyle = () => ({
        backgroundColor: formStyle?.answerBgColor || '#ffffff',
        color: formStyle?.answerColor || '#000000',
        borderColor: formStyle?.answerBorderColor || '#e5e7eb',
        fontFamily: formStyle?.answerFont,
        fontSize: formStyle?.answerFontSize || '1rem'
    });

    // Phone helpers
    const parsePhone = (val: string) => {
        if (!val) return { p1: '010', p2: '', p3: '' };
        const parts = val.split('-');
        return { p1: parts[0] || '010', p2: parts[1] || '', p3: parts[2] || '' };
    };

    const handlePhoneChange = (fieldId: string, part: 'p1' | 'p2' | 'p3', val: string) => {
        if ((part === 'p2' || part === 'p3') && !/^\d*$/.test(val)) return;
        const { p1, p2, p3 } = parsePhone(formData[fieldId]);
        let newP1 = p1, newP2 = p2, newP3 = p3;
        if (part === 'p1') newP1 = val;
        if (part === 'p2') newP2 = val;
        if (part === 'p3') newP3 = val;
        onChange(fieldId, `${newP1}-${newP2}-${newP3}`);
        if (part === 'p2' && val.length >= 4) {
            document.getElementById(`${fieldId}_p3`)?.focus();
        }
    };

    // Email helpers
    const parseEmail = (fieldId: string, val: string) => {
        if (!val) return { id: '', domain: emailDomains[fieldId] || 'naver.com', direct: emailDirects[fieldId] || '' };
        const parts = val.split('@');
        if (parts.length < 2) return { id: val, domain: 'naver.com', direct: '' };
        const d = parts[1];
        const isKnown = EMAIL_DOMAINS.includes(d);
        return { id: parts[0], domain: isKnown ? d : 'direct', direct: isKnown ? '' : d };
    };

    const handleEmailChange = (fieldId: string, type: 'id' | 'domain' | 'direct', val: string) => {
        const { id, domain, direct } = parseEmail(fieldId, formData[fieldId]);
        let newId = id, newDomain = domain, newDirect = direct;
        if (type === 'id') newId = val;
        if (type === 'domain') {
            newDomain = val;
            setEmailDomains(prev => ({ ...prev, [fieldId]: val }));
            if (val !== 'direct') newDirect = '';
        }
        if (type === 'direct') {
            newDirect = val;
            newDomain = 'direct';
            setEmailDirects(prev => ({ ...prev, [fieldId]: val }));
        }
        const finalDomain = newDomain === 'direct' ? newDirect : newDomain;
        onChange(fieldId, `${newId}@${finalDomain}`);
    };

    // Address helpers
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

    const handleAddressSearch = async (fieldId: string) => {
        await loadDaumPostcode();
        new (window as any).daum.Postcode({
            oncomplete: function (data: any) {
                const fullAddr = data.roadAddress || data.jibunAddress;
                const extraAddr = data.bname ? ` (${data.bname})` : '';
                const finalAddr = `[${data.zonecode}] ${fullAddr}${extraAddr}`;
                onChange(fieldId, finalAddr);
                setTimeout(() => {
                    document.getElementById(`${fieldId}_detail`)?.focus();
                }, 100);
            }
        }).open();
    };

    // Time helpers
    const generateTimeSlots = (field: FormField) => {
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

    const inputBaseClass = "w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all outline-none";

    return (
        <div
            className="space-y-6 w-full overflow-y-auto"
            style={{
                backgroundColor: formStyle?.containerBgColor,
                opacity: formStyle?.containerBgOpacity ? formStyle.containerBgOpacity / 100 : 1,
                maxHeight: formStyle?.containerMaxHeight,
                borderColor: formStyle?.containerBorderColor,
                borderRadius: formStyle?.containerBorderRadius,
                padding: formStyle?.containerPadding
            }}
        >
            {fields.map((field) => {
                // Apply overrides
                const override = fieldOverrides[field.id];
                const displayField: FormField = {
                    ...field,
                    label: override?.label ?? field.label,
                    type: override?.type ?? field.type,
                    required: override?.required ?? field.required,
                    placeholder: override?.placeholder ?? field.placeholder,
                    options: override?.options ?? field.options,
                };

                return (
                    <div key={displayField.id} className="space-y-2">
                        <label className="block font-bold mb-1" style={getLabelStyle()}>
                            {displayField.label}
                            {displayField.required && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {/* TEL - 3 Part Split */}
                        {field.type === 'tel' && (() => {
                            const { p1, p2, p3 } = parsePhone(formData[field.id]);
                            return (
                                <div className="flex gap-2 items-center">
                                    <div className="relative w-24 shrink-0">
                                        <select
                                            value={p1}
                                            onChange={(e) => handlePhoneChange(field.id, 'p1', e.target.value)}
                                            className="w-full px-2 py-3 rounded-lg border focus:ring-2 outline-none bg-white text-center appearance-none"
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
                                        onChange={(e) => handlePhoneChange(field.id, 'p2', e.target.value)}
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
                                        onChange={(e) => handlePhoneChange(field.id, 'p3', e.target.value)}
                                        maxLength={4}
                                        placeholder="0000"
                                        className="flex-1 min-w-0 px-4 py-3 rounded-lg border focus:ring-2 outline-none"
                                        style={getInputStyle()}
                                    />
                                </div>
                            );
                        })()}

                        {/* EMAIL - ID @ Domain Split */}
                        {field.type === 'email' && (() => {
                            const { id, domain, direct } = parseEmail(field.id, formData[field.id]);
                            return (
                                <div className="flex flex-wrap gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="이메일 아이디"
                                        value={id}
                                        onChange={(e) => handleEmailChange(field.id, 'id', e.target.value)}
                                        className="flex-1 min-w-[120px] px-4 py-3 rounded-lg border focus:ring-2 outline-none"
                                        style={getInputStyle()}
                                    />
                                    <span className="text-gray-400">@</span>
                                    <div className="relative flex-1 min-w-[140px]">
                                        <select
                                            value={domain}
                                            onChange={(e) => handleEmailChange(field.id, 'domain', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none appearance-none pr-10"
                                            style={getInputStyle()}
                                        >
                                            {EMAIL_DOMAINS.filter(d => d !== 'direct').map(d => <option key={d} value={d}>{d}</option>)}
                                            <option value="direct">직접입력</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                    {domain === 'direct' && (
                                        <input
                                            type="text"
                                            placeholder="도메인 입력"
                                            value={direct}
                                            onChange={(e) => handleEmailChange(field.id, 'direct', e.target.value)}
                                            className="w-full md:w-auto md:flex-1 px-4 py-3 rounded-lg border focus:ring-2 outline-none"
                                            style={getInputStyle()}
                                        />
                                    )}
                                </div>
                            );
                        })()}

                        {/* ADDRESS - Daum Postcode */}
                        {field.type === 'address' && (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="주소를 검색해주세요"
                                        value={formData[field.id] || ''}
                                        onClick={() => handleAddressSearch(field.id)}
                                        className="flex-1 px-4 py-3 rounded-lg border bg-gray-50 cursor-pointer"
                                        style={getInputStyle()}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAddressSearch(field.id)}
                                        className="px-4 py-3 bg-gray-800 text-white rounded-lg whitespace-nowrap text-sm font-bold hover:bg-gray-700"
                                    >
                                        주소 검색
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    id={`${field.id}_detail`}
                                    placeholder="상세주소를 입력해주세요"
                                    value={formData[`${field.id}_detail`] || ''}
                                    onChange={(e) => onChange(`${field.id}_detail`, e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none"
                                    style={getInputStyle()}
                                />
                            </div>
                        )}

                        {/* DATE */}
                        {field.type === 'date' && (
                            <input
                                type="date"
                                value={formData[field.id] || ''}
                                onChange={(e) => onChange(field.id, e.target.value)}
                                className={inputBaseClass}
                                style={getInputStyle()}
                            />
                        )}

                        {/* TIME */}
                        {field.type === 'time' && (
                            <div className="relative">
                                <select
                                    value={formData[field.id] || ''}
                                    onChange={(e) => onChange(field.id, e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none appearance-none"
                                    style={getInputStyle()}
                                >
                                    <option value="">시간을 선택해주세요</option>
                                    {generateTimeSlots(field).map((slot, idx) => <option key={idx} value={slot}>{slot}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        )}

                        {/* SELECT */}
                        {field.type === 'select' && (
                            <div className="relative">
                                <select
                                    value={formData[field.id] || ''}
                                    onChange={(e) => onChange(field.id, e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none appearance-none"
                                    style={getInputStyle()}
                                >
                                    <option value="">선택해주세요</option>
                                    {(field.options || []).map((opt: any) => (
                                        <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
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
                                    const isSelected = formData[field.id] === optValue;
                                    return (
                                        <label
                                            key={optValue}
                                            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
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
                                                onChange={() => onChange(field.id, optValue)}
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
                                    const currentValues = formData[field.id] ? formData[field.id].split(',') : [];
                                    const isSelected = currentValues.includes(optValue);
                                    const handleCheckboxChange = () => {
                                        let newValues;
                                        if (isSelected) {
                                            newValues = currentValues.filter((v: string) => v !== optValue);
                                        } else {
                                            newValues = [...currentValues, optValue];
                                        }
                                        onChange(field.id, newValues.join(','));
                                    };
                                    return (
                                        <label
                                            key={optValue}
                                            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
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
                            const currentLen = (formData[field.id] || '').length;
                            return (
                                <div className="relative">
                                    <textarea
                                        value={formData[field.id] || ''}
                                        onChange={(e) => {
                                            if (e.target.value.length <= 200) onChange(field.id, e.target.value);
                                        }}
                                        placeholder={field.placeholder || '내용을 입력해주세요 (최대 200자)'}
                                        maxLength={200}
                                        className={`${inputBaseClass} min-h-[120px] resize-none`}
                                        style={getInputStyle()}
                                    />
                                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-mono">{currentLen}/200</div>
                                </div>
                            );
                        })()}

                        {/* TEXT (Default) */}
                        {(field.type === 'text' || (!['tel', 'email', 'address', 'date', 'time', 'select', 'radio', 'checkbox', 'textarea'].includes(field.type))) && (() => {
                            const currentLen = (formData[field.id] || '').length;
                            return (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData[field.id] || ''}
                                        onChange={(e) => {
                                            if (e.target.value.length <= 20) onChange(field.id, e.target.value);
                                        }}
                                        placeholder={field.placeholder || '최대 20자'}
                                        maxLength={20}
                                        className={`${inputBaseClass} pr-12`}
                                        style={getInputStyle()}
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-mono">{currentLen}/20</div>
                                </div>
                            );
                        })()}

                        {errors[displayField.id] && (
                            <p className="text-red-500 text-sm pl-1">{errors[displayField.id]}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default EmbeddedForm;
