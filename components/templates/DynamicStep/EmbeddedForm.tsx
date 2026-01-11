import React from 'react';
import { FormField } from '../../../types';
import { Check } from 'lucide-react';

interface EmbeddedFormProps {
    fields: FormField[];
    formData: any;
    onChange: (id: string, value: any) => void;
    errors: Record<string, string>;
    formStyle?: any;
    primaryColor?: string;
}

const EmbeddedForm: React.FC<EmbeddedFormProps> = ({
    fields,
    formData,
    onChange,
    errors,
    formStyle,
    primaryColor = '#3b82f6'
}) => {
    if (!fields || fields.length === 0) return null;

    return (
        <div className="space-y-6 w-full mt-8">
            {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                    <label
                        className="block font-bold mb-1"
                        style={{
                            color: formStyle?.questionColor || '#374151',
                            fontSize: formStyle?.questionSize === 'sm' ? '0.875rem' : formStyle?.questionSize === 'xl' ? '1.25rem' : '1rem'
                        }}
                    >
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === 'select' || field.type === 'radio' || field.type === 'checkbox' ? (
                        <div className={field.type === 'radio' || field.type === 'checkbox' ? 'space-y-2' : ''}>
                            {field.type === 'select' && (
                                <select
                                    value={formData[field.id] || ''}
                                    onChange={(e) => onChange(field.id, e.target.value)}
                                    className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                    style={{
                                        backgroundColor: formStyle?.answerBgColor || '#ffffff',
                                        color: formStyle?.answerColor || '#000000',
                                        borderColor: errors[field.id] ? '#ef4444' : (formStyle?.answerBorderColor || '#e5e7eb')
                                    }}
                                >
                                    <option value="">선택해주세요</option>
                                    {(field.options || []).map((opt: any) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            )}

                            {(field.type === 'radio' || field.type === 'checkbox') && (
                                <div className="grid grid-cols-1 gap-2">
                                    {(field.options || []).map((opt: any) => (
                                        <label
                                            key={opt}
                                            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${formData[field.id] === opt
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'hover:bg-gray-50'
                                                }`}
                                            style={{
                                                backgroundColor: formData[field.id] === opt ? (primaryColor + '10') : (formStyle?.answerBgColor || '#ffffff'),
                                                borderColor: formData[field.id] === opt ? primaryColor : (errors[field.id] ? '#ef4444' : '#e5e7eb'),
                                                color: formData[field.id] === opt ? primaryColor : (formStyle?.answerColor || '#000000')
                                            }}
                                        >
                                            <input
                                                type={field.type}
                                                name={field.id}
                                                value={opt}
                                                checked={formData[field.id] === opt}
                                                onChange={(e) => onChange(field.id, opt)}
                                                className="hidden"
                                            />
                                            <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${formData[field.id] === opt ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                                }`}
                                                style={{
                                                    borderColor: formData[field.id] === opt ? primaryColor : '#d1d5db',
                                                    backgroundColor: formData[field.id] === opt ? primaryColor : 'transparent'
                                                }}
                                            >
                                                {formData[field.id] === opt && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="font-medium">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        field.type === 'textarea' ? (
                            <textarea
                                value={formData[field.id] || ''}
                                onChange={(e) => onChange(field.id, e.target.value)}
                                className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[120px]"
                                placeholder={field.placeholder}
                                style={{
                                    backgroundColor: formStyle?.answerBgColor || '#ffffff',
                                    color: formStyle?.answerColor || '#000000',
                                    borderColor: errors[field.id] ? '#ef4444' : (formStyle?.answerBorderColor || '#e5e7eb')
                                }}
                            />
                        ) : (
                            <input
                                type={field.type === 'number' ? 'number' : 'text'}
                                value={formData[field.id] || ''}
                                onChange={(e) => onChange(field.id, e.target.value)}
                                className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                placeholder={field.placeholder}
                                style={{
                                    backgroundColor: formStyle?.answerBgColor || '#ffffff',
                                    color: formStyle?.answerColor || '#000000',
                                    borderColor: errors[field.id] ? '#ef4444' : (formStyle?.answerBorderColor || '#e5e7eb')
                                }}
                            />
                        )
                    )}
                    {errors[field.id] && (
                        <p className="text-red-500 text-sm pl-1">{errors[field.id]}</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default EmbeddedForm;
