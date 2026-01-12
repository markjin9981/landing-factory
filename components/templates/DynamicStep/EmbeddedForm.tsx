import React from 'react';
import { FormField } from '../../../types';
import UnifiedFormField from './UnifiedFormField';

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
                    <UnifiedFormField
                        key={displayField.id}
                        field={displayField}
                        value={formData[displayField.id]}
                        onChange={(val) => onChange(displayField.id, val)}
                        error={errors[displayField.id]}
                        formStyle={formStyle}
                        primaryColor={primaryColor}
                    />
                );
            })}
        </div>
    );
};

export default EmbeddedForm;
