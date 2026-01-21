/**
 * AI 변제금 진단 챗봇 V2 - 2026년 고도화 버전
 * 
 * 20+ 단계 조건부 분기 대화형 인터페이스
 * - 나이(년생 입력 가능)
 * - 고용형태(겸업 지원, 무직 시 200만원 기준)
 * - 혼인상태 4가지 분기 (미혼/기혼/이혼/사별)
 * - 재산 다중선택
 * - 신용카드 채무 분리
 * - 입력값 확인 단계
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Check, AlertCircle } from 'lucide-react';
import { calculateRepayment, RehabUserInput, RehabCalculationResult, formatCurrency } from '../../services/calculationService';
import { DEFAULT_POLICY_CONFIG_2026 } from '../../config/PolicyConfig';
import RehabResultReport from './RehabResultReport';
import ChatbotRenderer from './templates/ChatbotRenderer';
import { ChatbotTemplateId, ThemeMode, ChatbotColorPalette, getTemplateById, DEFAULT_DARK_PALETTE, DEFAULT_LIGHT_PALETTE, CHATBOT_TEMPLATES } from './templates/ChatbotTemplateConfig';

// 대화 메시지 타입
interface ChatMessage {
    id: string;
    type: 'bot' | 'user';
    content: string;
    timestamp: Date;
    options?: ChatOption[];
    inputType?: InputType;
    multiSelect?: boolean;
}

interface ChatOption {
    label: string;
    value: string | number;
    selected?: boolean;
}

type InputType = 'text' | 'number' | 'buttons' | 'address' | 'multiselect';

// 대화 단계 (2026 고도화)
type ChatStep =
    | 'intro'
    | 'address'
    | 'age'
    | 'employment'
    | 'income_salary'
    | 'income_business'
    | 'income_confirm'
    | 'marital_status'
    | 'spouse_income'
    | 'spouse_assets_select'
    | 'spouse_asset_detail'
    | 'custody'
    | 'child_support_receive'
    | 'child_support_pay'
    | 'minor_children'
    | 'housing_type'
    | 'rent_cost'
    | 'deposit_amount'
    | 'deposit_loan'
    | 'owned_value'          // 자가 시세
    | 'owned_mortgage'       // 자가 담보대출
    | 'medical_edu'
    | 'medical_edu_amount'
    | 'assets_select'
    | 'asset_detail'
    | 'business_assets_deposit' // 사업장 보증금
    | 'business_assets_facility' // 사업장 시설/권리금
    | 'credit_card'
    | 'credit_card_amount'
    | 'other_debt'
    | 'debt_confirm'
    | 'priority_debt'
    | 'priority_debt_amount'
    | 'prior_rehab'          // 기존 개인회생/파산 진행 여부
    | 'prior_rehab_detail'   // 면책 년월
    | 'prior_credit_recovery' // 신용회복 상세
    | 'risk'
    | 'contact_name'
    | 'contact_phone'
    | 'result';

// 재산 항목 타입
type AssetType = 'car' | 'realEstate' | 'land' | 'savings' | 'insurance' | 'stocks';

interface AIRehabChatbotV2Props {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: (result: RehabCalculationResult, input: RehabUserInput) => void;
    characterName?: string;
    characterImage?: string;
    // 템플릿 시스템
    templateId?: ChatbotTemplateId;
    themeMode?: ThemeMode;
    customColors?: Partial<ChatbotColorPalette>;
    chatFontFamily?: string;
}

const ASSET_LABELS: Record<AssetType, string> = {
    car: '자동차',
    realEstate: '부동산',
    land: '토지',
    savings: '예금/적금',
    insurance: '보험(해지환급금)',
    stocks: '주식/코인'
};

const AIRehabChatbotV2: React.FC<AIRehabChatbotV2Props> = ({
    isOpen,
    onClose,
    onComplete,
    characterName = '로이',
    characterImage,
    templateId = 'classic',
    themeMode = 'dark',
    customColors,
    chatFontFamily
}) => {
    // 템플릿 색상 계산
    const templateInfo = getTemplateById(templateId);
    const baseColors = themeMode === 'dark'
        ? (templateInfo?.previewColors.dark || DEFAULT_DARK_PALETTE)
        : (templateInfo?.previewColors.light || DEFAULT_LIGHT_PALETTE);
    const colors: ChatbotColorPalette = { ...baseColors, ...customColors };
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentStep, setCurrentStep] = useState<ChatStep>('intro');
    const [userInput, setUserInput] = useState<Partial<RehabUserInput>>({
        monthlyIncome: 0,
        familySize: 1,
        isMarried: false,
        myAssets: 0,
        deposit: 0,
        spouseAssets: 0,
        totalDebt: 0
    });
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [result, setResult] = useState<RehabCalculationResult | null>(null);
    const [showResult, setShowResult] = useState(false);

    // 추가 상태
    const [selectedAssets, setSelectedAssets] = useState<AssetType[]>([]);
    const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
    const [assetValues, setAssetValues] = useState<Record<AssetType, number>>({
        car: 0, realEstate: 0, land: 0, savings: 0, insurance: 0, stocks: 0
    });
    const [spouseSelectedAssets, setSpouseSelectedAssets] = useState<AssetType[]>([]);
    const [currentSpouseAssetIndex, setCurrentSpouseAssetIndex] = useState(0);
    const [spouseAssetValues, setSpouseAssetValues] = useState<Record<AssetType, number>>({
        car: 0, realEstate: 0, land: 0, savings: 0, insurance: 0, stocks: 0
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const hasInitialized = useRef(false);

    // 스크롤 자동 이동
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 초기 메시지 (중복 방지)
    useEffect(() => {
        if (isOpen && !hasInitialized.current && messages.length === 0) {
            hasInitialized.current = true;
            setTimeout(() => {
                addBotMessage(
                    `안녕하세요! 저는 AI 법률비서 '${characterName}'입니다. 🤖\n\n3분 만에 당신의 빚이 얼마나 줄어들 수 있는지 계산해 드릴게요.\n\n비밀은 100% 보장되니 안심하세요!`,
                    [{ label: '시작하기', value: 'start' }],
                    'buttons'
                );
            }, 500);
        }
    }, [isOpen, characterName, messages.length]);

    // 봇 메시지 추가
    const addBotMessage = useCallback((
        content: string,
        options?: ChatOption[],
        inputType?: InputType,
        multiSelect?: boolean
    ) => {
        setIsTyping(true);
        setTimeout(() => {
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                type: 'bot',
                content,
                timestamp: new Date(),
                options,
                inputType,
                multiSelect
            };
            setMessages(prev => [...prev, newMessage]);
            setIsTyping(false);
            if (inputType === 'number' || inputType === 'text' || inputType === 'address') {
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        }, 600);
    }, []);

    // 사용자 메시지 추가
    const addUserMessage = useCallback((content: string) => {
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    }, []);

    // 나이 계산 (년생 입력 시)
    const calculateAge = (input: string): number | null => {
        const num = parseInt(input);
        if (isNaN(num)) return null;

        // 4자리 숫자면 년생으로 간주
        if (num >= 1940 && num <= 2010) {
            return 2026 - num;
        }
        // 2자리 숫자면 나이로 간주
        if (num >= 18 && num <= 100) {
            return num;
        }
        return null;
    };

    // 다음 단계로 진행
    const processStep = useCallback((step: ChatStep, value?: string | number | string[]) => {
        switch (step) {
            case 'intro':
                setCurrentStep('address');
                addBotMessage(
                    '정확한 진단을 위해 현재 **사시는 곳**이 어디신가요?\n\n(예: 서울 강남구, 수원시 영통구)',
                    undefined,
                    'address'
                );
                break;

            case 'address':
                setUserInput(prev => ({ ...prev, address: value as string }));
                setCurrentStep('age');
                addBotMessage(
                    '만 나이가 어떻게 되시나요?\n\n(모르시면 태어난 연도를 입력해주셔도 돼요. 예: 1990)',
                    undefined,
                    'number'
                );
                break;

            case 'age':
                let age: number | undefined;
                const ageValue = typeof value === 'number' ? value : parseInt(value as string);
                if (!isNaN(ageValue)) {
                    // 4자리 숫자면 년생으로 간주
                    if (ageValue >= 1940 && ageValue <= 2010) {
                        age = 2026 - ageValue;
                    } else if (ageValue >= 18 && ageValue <= 100) {
                        age = ageValue;
                    }
                }
                setUserInput(prev => ({ ...prev, age }));
                setCurrentStep('employment');
                addBotMessage(
                    '현재 어떤 형태로 소득을 얻고 계신가요?',
                    [
                        { label: '급여소득자(직장인)', value: 'salary' },
                        { label: '영업소득자(자영업)', value: 'business' },
                        { label: '프리랜서', value: 'freelancer' },
                        { label: '직장인 + 사업자 겸업', value: 'both' },
                        { label: '무직/구직 중', value: 'none' }
                    ],
                    'buttons'
                );
                break;

            case 'employment':
                const employmentType = value as 'salary' | 'business' | 'both' | 'none';
                setUserInput(prev => ({ ...prev, employmentType }));

                if (employmentType === 'none') {
                    // 무직: 200만원 기준으로 자동 설정
                    setUserInput(prev => ({ ...prev, monthlyIncome: 2000000 }));
                    setCurrentStep('marital_status');
                    addBotMessage(
                        '현재 결혼 상태는 어떻게 되시나요?',
                        [
                            { label: '미혼', value: 'single' },
                            { label: '기혼', value: 'married' },
                            { label: '이혼', value: 'divorced' },
                            { label: '사별', value: 'widowed' }
                        ],
                        'buttons'
                    );
                } else if (employmentType === 'both') {
                    setCurrentStep('income_salary');
                    addBotMessage(
                        '먼저, 직장에서 받는 월 실수령액은 얼마인가요?\n\n(만원 단위)',
                        undefined,
                        'number'
                    );
                } else {
                    setCurrentStep('income_salary');
                    addBotMessage(
                        employmentType === 'salary'
                            ? '세금과 4대보험을 제외한 월 평균 실수령액은 얼마인가요?\n\n(만원 단위)'
                            : '매달 순수익(매출-비용)은 대략 얼마인가요?\n\n(만원 단위)',
                        undefined,
                        'number'
                    );
                }
                break;

            case 'income_salary':
                const salaryIncome = (value as number) * 10000;
                setUserInput(prev => ({ ...prev, salaryIncome }));

                if (userInput.employmentType === 'both') {
                    setCurrentStep('income_business');
                    addBotMessage(
                        '사업에서 발생하는 월 순수익은 얼마인가요?\n\n(만원 단위)',
                        undefined,
                        'number'
                    );
                } else {
                    setUserInput(prev => ({ ...prev, monthlyIncome: salaryIncome }));
                    setCurrentStep('income_confirm');
                    addBotMessage(
                        `월 소득이 ${formatCurrency(salaryIncome)}이 맞으신가요?`,
                        [
                            { label: '네, 맞아요', value: 'yes' },
                            { label: '아니요, 다시 입력', value: 'no' }
                        ],
                        'buttons'
                    );
                }
                break;

            case 'income_business':
                const businessIncome = (value as number) * 10000;
                const totalIncome = (userInput.salaryIncome || 0) + businessIncome;
                setUserInput(prev => ({
                    ...prev,
                    businessIncome,
                    monthlyIncome: totalIncome
                }));
                setCurrentStep('income_confirm');
                addBotMessage(
                    `총 월 소득이 ${formatCurrency(totalIncome)}이 맞으신가요?`,
                    [
                        { label: '네, 맞아요', value: 'yes' },
                        { label: '아니요, 다시 입력', value: 'no' }
                    ],
                    'buttons'
                );
                break;

            case 'income_confirm':
                if (value === 'no') {
                    setCurrentStep('income_salary');
                    addBotMessage(
                        '소득을 다시 입력해주세요.\n\n(만원 단위)',
                        undefined,
                        'number'
                    );
                } else {
                    setCurrentStep('marital_status');
                    addBotMessage(
                        '현재 결혼 상태는 어떻게 되시나요?',
                        [
                            { label: '미혼', value: 'single' },
                            { label: '기혼', value: 'married' },
                            { label: '이혼', value: 'divorced' },
                            { label: '사별', value: 'widowed' }
                        ],
                        'buttons'
                    );
                }
                break;

            case 'marital_status':
                const maritalStatus = value as 'single' | 'married' | 'divorced' | 'widowed';
                const isMarried = maritalStatus === 'married';
                setUserInput(prev => ({ ...prev, maritalStatus, isMarried }));

                if (maritalStatus === 'married') {
                    setCurrentStep('spouse_income');
                    addBotMessage(
                        '배우자분의 월 평균 소득은 대략 얼마인가요?\n\n(만원 단위, 없으면 0)',
                        undefined,
                        'number'
                    );
                } else if (maritalStatus === 'divorced') {
                    setCurrentStep('custody');
                    addBotMessage(
                        '미성년 자녀를 양육하고 계신가요?',
                        [
                            { label: '예, 양육 중이에요', value: 'yes' },
                            { label: '아니요, 전 배우자가 양육해요', value: 'no' }
                        ],
                        'buttons'
                    );
                } else {
                    // 미혼/사별
                    setUserInput(prev => ({ ...prev, spouseAssets: 0 }));
                    setCurrentStep('minor_children');
                    addBotMessage(
                        '함께 살고 있는 만 19세 미만 자녀가 몇 명인가요?\n\n(부양가족 인정 기준이 까다로워서 미성년 자녀만 여쭤볼게요)',
                        [
                            { label: '없어요', value: 0 },
                            { label: '1명', value: 1 },
                            { label: '2명', value: 2 },
                            { label: '3명 이상', value: 3 }
                        ],
                        'buttons'
                    );
                }
                break;

            case 'spouse_income':
                setUserInput(prev => ({ ...prev, spouseIncome: (value as number) * 10000 }));
                setCurrentStep('spouse_assets_select');
                addBotMessage(
                    '배우자 명의로 가지고 있는 재산이 있나요?\n\n(해당하는 항목을 모두 선택해주세요)',
                    [
                        { label: '자동차', value: 'car' },
                        { label: '부동산', value: 'realEstate' },
                        { label: '토지', value: 'land' },
                        { label: '예금/적금', value: 'savings' },
                        { label: '보험', value: 'insurance' },
                        { label: '주식/코인', value: 'stocks' },
                        { label: '사업재산', value: 'businessAssets' },
                        { label: '없어요', value: 'none' }
                    ],
                    'buttons',
                    true
                );
                break;

            case 'spouse_assets_select':
                if (value === 'none' || (Array.isArray(value) && value.includes('none'))) {
                    setUserInput(prev => ({ ...prev, spouseAssets: 0 }));
                    setCurrentStep('minor_children');
                    addBotMessage(
                        '함께 살고 있는 만 19세 미만 자녀가 몇 명인가요?',
                        [
                            { label: '없어요', value: 0 },
                            { label: '1명', value: 1 },
                            { label: '2명', value: 2 },
                            { label: '3명 이상', value: 3 }
                        ],
                        'buttons'
                    );
                } else {
                    const assets = (Array.isArray(value) ? value : [value]) as AssetType[];
                    setSpouseSelectedAssets(assets);
                    setCurrentSpouseAssetIndex(0);
                    setCurrentStep('spouse_asset_detail');
                    addBotMessage(
                        `배우자의 ${ASSET_LABELS[assets[0]]} 가치는 대략 얼마인가요?\n\n(만원 단위)`,
                        undefined,
                        'number'
                    );
                }
                break;

            case 'spouse_asset_detail':
                const spouseAssetType = spouseSelectedAssets[currentSpouseAssetIndex];
                setSpouseAssetValues(prev => ({ ...prev, [spouseAssetType]: (value as number) * 10000 }));

                if (currentSpouseAssetIndex < spouseSelectedAssets.length - 1) {
                    const nextIndex = currentSpouseAssetIndex + 1;
                    setCurrentSpouseAssetIndex(nextIndex);
                    addBotMessage(
                        `배우자의 ${ASSET_LABELS[spouseSelectedAssets[nextIndex]]} 가치는 얼마인가요?\n\n(만원 단위)`,
                        undefined,
                        'number'
                    );
                } else {
                    // 배우자 재산 합산
                    const totalSpouseAssets = Object.values(spouseAssetValues).reduce((a, b) => a + b, 0) + (value as number) * 10000;
                    setUserInput(prev => ({ ...prev, spouseAssets: totalSpouseAssets }));
                    setCurrentStep('minor_children');
                    addBotMessage(
                        '함께 살고 있는 만 19세 미만 자녀가 몇 명인가요?',
                        [
                            { label: '없어요', value: 0 },
                            { label: '1명', value: 1 },
                            { label: '2명', value: 2 },
                            { label: '3명 이상', value: 3 }
                        ],
                        'buttons'
                    );
                }
                break;

            case 'custody':
                setUserInput(prev => ({ ...prev, isCustodialParent: value === 'yes' }));
                if (value === 'yes') {
                    setCurrentStep('child_support_receive');
                    addBotMessage(
                        '전 배우자로부터 매달 받는 양육비는 얼마인가요?\n\n(만원 단위, 없으면 0)',
                        undefined,
                        'number'
                    );
                } else {
                    setCurrentStep('child_support_pay');
                    addBotMessage(
                        '전 배우자에게 매달 지급하는 양육비는 얼마인가요?\n\n(만원 단위, 없으면 0)',
                        undefined,
                        'number'
                    );
                }
                break;

            case 'child_support_receive':
                const received = (value as number) * 10000;
                setUserInput(prev => ({
                    ...prev,
                    childSupportReceived: received,
                    monthlyIncome: (prev.monthlyIncome || 0) + received
                }));
                setUserInput(prev => ({ ...prev, spouseAssets: 0 }));
                setCurrentStep('minor_children');
                addBotMessage(
                    '함께 살고 있는 만 19세 미만 자녀가 몇 명인가요?',
                    [
                        { label: '없어요', value: 0 },
                        { label: '1명', value: 1 },
                        { label: '2명', value: 2 },
                        { label: '3명 이상', value: 3 }
                    ],
                    'buttons'
                );
                break;

            case 'child_support_pay':
                setUserInput(prev => ({
                    ...prev,
                    childSupportPaid: (value as number) * 10000,
                    spouseAssets: 0
                }));
                setCurrentStep('minor_children');
                addBotMessage(
                    '함께 살고 있는 만 19세 미만 자녀가 몇 명인가요?',
                    [
                        { label: '없어요', value: 0 },
                        { label: '1명', value: 1 },
                        { label: '2명', value: 2 },
                        { label: '3명 이상', value: 3 }
                    ],
                    'buttons'
                );
                break;

            case 'minor_children':
                const minorChildren = value as number;
                // 가구원 수 계산: 본인(1) + 미성년자녀 + 무소득 배우자(기혼 시 1)
                let familySize = 1 + minorChildren;
                if (userInput.isMarried && (!userInput.spouseIncome || userInput.spouseIncome === 0)) {
                    familySize += 1;
                }
                setUserInput(prev => ({ ...prev, minorChildren, familySize }));
                setCurrentStep('housing_type');
                addBotMessage(
                    '현재 거주 형태는 무엇인가요?',
                    [
                        { label: '월세', value: 'rent' },
                        { label: '전세', value: 'jeonse' },
                        { label: '자가(내 집)', value: 'owned' },
                        { label: '무상거주(친가 등)', value: 'free' }
                    ],
                    'buttons'
                );
                break;

            case 'housing_type':
                const housingType = value as 'rent' | 'jeonse' | 'owned' | 'free';
                setUserInput(prev => ({ ...prev, housingType }));

                if (housingType === 'rent') {
                    setCurrentStep('rent_cost');
                    addBotMessage(
                        '매달 월세는 얼마인가요?\n\n(만원 단위)',
                        undefined,
                        'number'
                    );
                } else if (housingType === 'jeonse') {
                    setCurrentStep('deposit_amount');
                    addBotMessage(
                        '전세금은 얼마인가요?\n\n(만원 단위)',
                        undefined,
                        'number'
                    );
                } else if (housingType === 'owned') {
                    setCurrentStep('owned_value');
                    addBotMessage(
                        '자가 부동산의 대략적인 시세는 얼마인가요?\n\n(만원 단위)',
                        undefined,
                        'number'
                    );
                } else {
                    setUserInput(prev => ({ ...prev, deposit: 0, rentCost: 0 }));
                    setCurrentStep('medical_edu');
                    addBotMessage(
                        '본인이나 가족의 병원비, 미성년 자녀 교육비로 매달 고정 지출이 있나요?\n\n(증빙 가능한 금액)',
                        [
                            { label: '없어요', value: 'no' },
                            { label: '있어요', value: 'yes' }
                        ],
                        'buttons'
                    );
                }
                break;

            case 'rent_cost':
                setUserInput(prev => ({ ...prev, rentCost: (value as number) * 10000 }));
                setCurrentStep('deposit_amount');
                addBotMessage(
                    '보증금은 얼마인가요?\n\n(만원 단위)',
                    undefined,
                    'number'
                );
                break;

            case 'deposit_amount':
                setUserInput(prev => ({ ...prev, deposit: (value as number) * 10000 }));
                setCurrentStep('deposit_loan');
                addBotMessage(
                    '보증금 중 대출받은 금액이 있나요?',
                    [
                        { label: '없어요', value: 'no' },
                        { label: '있어요', value: 'yes' }
                    ],
                    'buttons'
                );
                break;

            case 'deposit_loan':
                if (value === 'yes') {
                    addBotMessage(
                        '보증금 대출 금액은 얼마인가요?\n\n(만원 단위)',
                        undefined,
                        'number'
                    );
                    // 다음 입력 후 medical_edu로 이동
                    setCurrentStep('medical_edu');
                } else {
                    setUserInput(prev => ({ ...prev, depositLoan: 0 }));
                    setCurrentStep('medical_edu');
                    addBotMessage(
                        '본인이나 가족의 병원비, 미성년 자녀 교육비로 매달 고정 지출이 있나요?',
                        [
                            { label: '없어요', value: 'no' },
                            { label: '있어요', value: 'yes' }
                        ],
                        'buttons'
                    );
                }
                break;

            case 'owned_value':
                setUserInput(prev => ({ ...prev, myAssets: (prev.myAssets || 0) + (value as number) * 10000 }));
                setCurrentStep('owned_mortgage');
                addBotMessage(
                    '해당 부동산에 담보대출이 있으신가요?\n\n만원 단위로 입력해주세요. (없으면 0)',
                    undefined,
                    'number'
                );
                break;

            case 'owned_mortgage':
                // 담보대출은 자산에서 차감
                const mortgageAmount = (value as number) * 10000;
                setUserInput(prev => ({ ...prev, myAssets: Math.max(0, (prev.myAssets || 0) - mortgageAmount) }));
                setCurrentStep('medical_edu');
                addBotMessage(
                    '본인이나 가족의 병원비, 미성년 자녀 교육비로 매달 고정 지출이 있나요?\n\n(증빙 가능한 금액)',
                    [
                        { label: '없어요', value: 'no' },
                        { label: '있어요', value: 'yes' }
                    ],
                    'buttons'
                );
                break;

            case 'medical_edu':
                if (value === 'yes') {
                    setCurrentStep('medical_edu_amount');
                    addBotMessage(
                        '월 의료비/교육비는 대략 얼마인가요?\n\n(만원 단위)',
                        undefined,
                        'number'
                    );
                } else {
                    setUserInput(prev => ({ ...prev, medicalCost: 0, educationCost: 0 }));
                    setCurrentStep('assets_select');
                    addBotMessage(
                        '현재 본인 명의로 가지고 있는 재산이 있으신가요?\n\n(해당하는 항목을 모두 선택해주세요)',
                        [
                            { label: '자동차', value: 'car' },
                            { label: '부동산', value: 'realEstate' },
                            { label: '토지', value: 'land' },
                            { label: '예금/적금', value: 'savings' },
                            { label: '보험', value: 'insurance' },
                            { label: '주식/코인', value: 'stocks' },
                            { label: '없어요', value: 'none' }
                        ],
                        'buttons',
                        true
                    );
                }
                break;

            case 'medical_edu_amount':
                setUserInput(prev => ({
                    ...prev,
                    medicalCost: (value as number) * 10000
                }));
                setCurrentStep('assets_select');
                addBotMessage(
                    '현재 본인 명의로 가지고 있는 재산이 있으신가요?\n\n(해당하는 항목을 모두 선택해주세요)',
                    [
                        { label: '자동차', value: 'car' },
                        { label: '부동산', value: 'realEstate' },
                        { label: '토지', value: 'land' },
                        { label: '예금/적금', value: 'savings' },
                        { label: '보험', value: 'insurance' },
                        { label: '주식/코인', value: 'stocks' },
                        { label: '없어요', value: 'none' }
                    ],
                    'buttons',
                    true
                );
                break;

            case 'assets_select':
                if (value === 'none' || (Array.isArray(value) && value.includes('none'))) {
                    setUserInput(prev => ({ ...prev, myAssets: 0 }));
                    setCurrentStep('credit_card');
                    addBotMessage(
                        '현재 신용카드를 사용하고 계신가요?\n\n(카드 사용금액도 채무에 포함됩니다)',
                        [
                            { label: '사용 중이에요', value: 'yes' },
                            { label: '사용 안 해요', value: 'no' }
                        ],
                        'buttons'
                    );
                } else {
                    const assets = (Array.isArray(value) ? value : [value]) as AssetType[];
                    setSelectedAssets(assets);
                    setCurrentAssetIndex(0);
                    setCurrentStep('asset_detail');
                    addBotMessage(
                        `${ASSET_LABELS[assets[0]]}의 현재 가치는 대략 얼마인가요?\n\n(만원 단위)`,
                        undefined,
                        'number'
                    );
                }
                break;

            case 'asset_detail':
                const assetType = selectedAssets[currentAssetIndex];
                setAssetValues(prev => ({ ...prev, [assetType]: (value as number) * 10000 }));

                if (currentAssetIndex < selectedAssets.length - 1) {
                    const nextIndex = currentAssetIndex + 1;
                    setCurrentAssetIndex(nextIndex);
                    addBotMessage(
                        `${ASSET_LABELS[selectedAssets[nextIndex]]}의 현재 가치는 얼마인가요?\n\n(만원 단위)`,
                        undefined,
                        'number'
                    );
                } else {
                    // 재산 합산
                    const totalAssets = Object.values(assetValues).reduce((a, b) => a + b, 0) + (value as number) * 10000;
                    setUserInput(prev => ({ ...prev, myAssets: totalAssets }));
                    setCurrentStep('credit_card');
                    addBotMessage(
                        '현재 신용카드를 사용하고 계신가요?\n\n(카드 사용금액도 채무에 포함됩니다)',
                        [
                            { label: '사용 중이에요', value: 'yes' },
                            { label: '사용 안 해요', value: 'no' }
                        ],
                        'buttons'
                    );
                }
                break;

            case 'credit_card':
                if (value === 'yes') {
                    setCurrentStep('credit_card_amount');
                    addBotMessage(
                        '신용카드 총 사용금액(미결제액)은 얼마인가요?\n\n(여러 장 있으시면 합산해주세요, 만원 단위)',
                        undefined,
                        'number'
                    );
                } else {
                    setUserInput(prev => ({ ...prev, creditCardDebt: 0 }));
                    setCurrentStep('other_debt');
                    addBotMessage(
                        '갚아야 할 채무(대출, 카드론, 사채, 개인간 채무 등)는 총 얼마인가요?\n\n(개인간 채무도 포함해서 입력해주세요, 만원 단위)',
                        undefined,
                        'number'
                    );
                }
                break;

            case 'credit_card_amount':
                setUserInput(prev => ({ ...prev, creditCardDebt: (value as number) * 10000 }));
                setCurrentStep('other_debt');
                addBotMessage(
                    '신용카드 외에 갚아야 할 채무(대출, 카드론, 사채, 개인간 채무 등)는 총 얼마인가요?\n\n(개인간 채무도 포함해서 입력해주세요, 만원 단위)',
                    undefined,
                    'number'
                );
                break;

            case 'other_debt':
                const otherDebt = (value as number) * 10000;
                const totalDebt = (userInput.creditCardDebt || 0) + otherDebt;
                setUserInput(prev => ({ ...prev, totalDebt }));
                setCurrentStep('debt_confirm');
                addBotMessage(
                    `총 채무가 ${formatCurrency(totalDebt)}이 맞으신가요?`,
                    [
                        { label: '네, 맞아요', value: 'yes' },
                        { label: '아니요, 다시 입력', value: 'no' }
                    ],
                    'buttons'
                );
                break;

            case 'debt_confirm':
                if (value === 'no') {
                    setCurrentStep('credit_card');
                    addBotMessage(
                        '채무를 다시 입력해주세요.\n\n신용카드를 사용하고 계신가요?',
                        [
                            { label: '사용 중이에요', value: 'yes' },
                            { label: '사용 안 해요', value: 'no' }
                        ],
                        'buttons'
                    );
                } else {
                    setCurrentStep('priority_debt');
                    addBotMessage(
                        '세금, 건강보험료 등 미납된 공과금이 있으신가요?',
                        [
                            { label: '없어요', value: 'no' },
                            { label: '있어요', value: 'yes' }
                        ],
                        'buttons'
                    );
                }
                break;

            case 'priority_debt':
                if (value === 'yes') {
                    setCurrentStep('priority_debt_amount');
                    addBotMessage(
                        '미납된 세금/보험료 총액은 대략 얼마인가요?\n\n(만원 단위)',
                        undefined,
                        'number'
                    );
                } else {
                    setUserInput(prev => ({ ...prev, priorityDebt: 0 }));
                    setCurrentStep('risk');
                    addBotMessage(
                        '혹시 다음 중 해당하는 항목이 있나요?',
                        [
                            { label: '아니요, 일반 채무예요', value: 'none' },
                            { label: '최근 1년 내 대출이 많아요', value: 'recent_loan' },
                            { label: '주식/코인 투자 손실이 있어요', value: 'investment' },
                            { label: '도박으로 인한 채무가 있어요', value: 'gambling' }
                        ],
                        'buttons'
                    );
                }
                break;

            case 'priority_debt_amount':
                setUserInput(prev => ({ ...prev, priorityDebt: (value as number) * 10000 }));
                setCurrentStep('risk');
                addBotMessage(
                    '혹시 다음 중 해당하는 항목이 있나요?',
                    [
                        { label: '아니요, 일반 채무예요', value: 'none' },
                        { label: '최근 1년 내 대출이 많아요', value: 'recent_loan' },
                        { label: '주식/코인 투자 손실이 있어요', value: 'investment' },
                        { label: '도박으로 인한 채무가 있어요', value: 'gambling' }
                    ],
                    'buttons'
                );
                break;

            case 'risk':
                setUserInput(prev => ({ ...prev, riskFactor: value as RehabUserInput['riskFactor'] }));
                setCurrentStep('prior_rehab');
                addBotMessage(
                    '기존에 개인회생, 파산, 신용회복, 새출발기금을 진행 중이거나 진행하신 적 있으신가요?',
                    [
                        { label: '없어요', value: 'none' },
                        { label: '개인회생', value: 'rehab' },
                        { label: '파산', value: 'bankruptcy' },
                        { label: '신용회복', value: 'credit_recovery' },
                        { label: '새출발기금', value: 'fresh_start' }
                    ],
                    'buttons'
                );
                break;

            case 'prior_rehab':
                if (value === 'none' || value === 'fresh_start') {
                    setCurrentStep('contact_name');
                    addBotMessage(
                        '분석이 거의 끝났습니다! 🎉\n\n정확한 진단 결과를 받으실 **성함**을 입력해주세요.',
                        undefined,
                        'text'
                    );
                } else if (value === 'rehab' || value === 'bankruptcy') {
                    setCurrentStep('prior_rehab_detail');
                    addBotMessage(
                        '면책받으신 년도와 월을 대략적으로 입력해주세요.\n\n(정확하지 않아도 괜찮아요. 예: 2020년 5월)',
                        undefined,
                        'text'
                    );
                } else if (value === 'credit_recovery') {
                    setCurrentStep('prior_credit_recovery');
                    addBotMessage(
                        '신용회복 상태가 어떻게 되시나요?',
                        [
                            { label: '완납했어요', value: 'completed' },
                            { label: '진행 중이에요', value: 'ongoing' }
                        ],
                        'buttons'
                    );
                }
                break;

            case 'prior_rehab_detail':
                // 면책 년월 저장 (문자열로)
                setCurrentStep('contact_name');
                addBotMessage(
                    '분석이 거의 끝났습니다! 🎉\n\n정확한 진단 결과를 받으실 **성함**을 입력해주세요.',
                    undefined,
                    'text'
                );
                break;

            case 'prior_credit_recovery':
                if (value === 'ongoing') {
                    addBotMessage(
                        '신용회복 남은 채무금액은 대략 얼마인가요?\n\n(만원 단위)',
                        undefined,
                        'number'
                    );
                    setCurrentStep('contact_name');
                } else {
                    setCurrentStep('contact_name');
                    addBotMessage(
                        '분석이 거의 끝났습니다! 🎉\n\n정확한 진단 결과를 받으실 **성함**을 입력해주세요.',
                        undefined,
                        'text'
                    );
                }
                break;

            case 'contact_name':
                setUserInput(prev => ({ ...prev, name: value as string }));
                setCurrentStep('contact_phone');
                addBotMessage(
                    '감사합니다! 이제 **연락처**를 입력해주세요.\n\n(예: 010-1234-5678)',
                    undefined,
                    'text'
                );
                break;

            case 'contact_phone':
                setUserInput(prev => ({ ...prev, phone: value as string }));
                calculateResult({ ...userInput, phone: value as string } as RehabUserInput);
                break;
        }
    }, [userInput, addBotMessage, selectedAssets, currentAssetIndex, assetValues, spouseSelectedAssets, currentSpouseAssetIndex, spouseAssetValues]);

    // 결과 계산
    const calculateResult = useCallback((input: RehabUserInput) => {
        setIsTyping(true);

        setTimeout(() => {
            const calculationResult = calculateRepayment(input, DEFAULT_POLICY_CONFIG_2026);
            setResult(calculationResult);

            const statusEmoji = calculationResult.status === 'POSSIBLE' ? '🟢' :
                calculationResult.status === 'DIFFICULT' ? '🟡' : '🔴';

            // 무직자 안내 메시지
            let resultMessage = `${statusEmoji} **분석이 완료되었습니다!**\n\n${input.name}님은 빚을 최대 **${calculationResult.debtReductionRate}%**까지 탕감받을 수 있어요.`;

            if (input.employmentType === 'none') {
                resultMessage += '\n\n💡 현재 무직이시지만 월 200만원 수입 기준으로 계산한 결과입니다.\n\n어렵게 생각하지 마세요! 아르바이트 하루만 나가시거나 일용직 하루만 출근하셔도 수입이 인정되어 개인회생 진행이 가능합니다.';
            }

            addBotMessage(
                resultMessage,
                [{ label: '📊 진단 결과 보기', value: 'show_result' }],
                'buttons'
            );

            setCurrentStep('result');

            if (onComplete) {
                onComplete(calculationResult, input);
            }
        }, 1500);
    }, [addBotMessage, onComplete]);

    // 입력 처리
    const handleSubmit = useCallback(() => {
        if (!inputValue.trim()) return;

        const lastMessage = messages[messages.length - 1];
        const value = lastMessage?.inputType === 'number'
            ? parseFloat(inputValue)
            : inputValue;

        addUserMessage(inputValue);
        setInputValue('');

        setTimeout(() => {
            processStep(currentStep, value);
        }, 300);
    }, [inputValue, messages, addUserMessage, processStep, currentStep]);

    // 옵션 선택 처리
    const handleOptionSelect = useCallback((option: ChatOption) => {
        // 시작하기 버튼은 사용자 메시지 표시 안 함
        if (option.value === 'start') {
            setTimeout(() => processStep('intro'), 300);
        } else if (option.value === 'show_result') {
            setShowResult(true);
        } else {
            addUserMessage(option.label);
            setTimeout(() => processStep(currentStep, option.value), 300);
        }
    }, [addUserMessage, processStep, currentStep]);

    // 진행률 계산
    const getProgress = useCallback(() => {
        const stepOrder: Record<ChatStep, number> = {
            'intro': 0, 'address': 5, 'age': 10, 'employment': 15,
            'income_salary': 20, 'income_business': 22, 'income_confirm': 25,
            'marital_status': 30, 'spouse_income': 35, 'spouse_assets_select': 38,
            'spouse_asset_detail': 40, 'custody': 35, 'child_support_receive': 38,
            'child_support_pay': 38, 'minor_children': 42, 'housing_type': 48,
            'rent_cost': 50, 'deposit_amount': 52, 'deposit_loan': 54,
            'owned_value': 53, 'owned_mortgage': 55,
            'medical_edu': 58, 'medical_edu_amount': 60, 'assets_select': 65,
            'asset_detail': 70, 'business_assets_deposit': 72, 'business_assets_facility': 74,
            'credit_card': 75, 'credit_card_amount': 78,
            'other_debt': 82, 'debt_confirm': 85, 'priority_debt': 88,
            'priority_debt_amount': 90, 'prior_rehab': 91, 'prior_rehab_detail': 92,
            'prior_credit_recovery': 93, 'risk': 94, 'contact_name': 96,
            'contact_phone': 98, 'result': 100
        };
        return stepOrder[currentStep] || 0;
    }, [currentStep]);

    if (!isOpen) return null;

    const isDark = themeMode === 'dark';
    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const borderColor = isDark ? '#374151' : '#e5e7eb';

    return createPortal(
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    className="w-full max-w-md h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                        borderWidth: '1px',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        fontFamily: chatFontFamily || 'inherit'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ChatbotRenderer를 사용하여 템플릿별 UI 렌더링 */}
                    <ChatbotRenderer
                        templateId={templateId}
                        mode={themeMode}
                        colors={colors}
                        messages={messages.map(msg => ({
                            id: msg.id,
                            type: msg.type,
                            content: msg.content,
                            options: msg.options?.map(opt => ({ label: opt.label, value: String(opt.value) })),
                            inputType: msg.inputType,
                            multiSelect: msg.multiSelect,
                            timestamp: msg.timestamp
                        }))}
                        inputValue={inputValue}
                        isTyping={isTyping}
                        characterName={characterName}
                        progress={getProgress()}
                        onInputChange={setInputValue}
                        onSubmit={handleSubmit}
                        onOptionSelect={(opt) => handleOptionSelect({ label: opt.label, value: opt.value })}
                        onClose={onClose}
                        messagesEndRef={messagesEndRef}
                        inputRef={inputRef}
                    />
                </motion.div>
            </motion.div>

            {/* Result Modal */}
            {showResult && result && (
                <RehabResultReport
                    result={result}
                    userInput={userInput as RehabUserInput}
                    onClose={() => setShowResult(false)}
                />
            )}
        </>,
        document.body
    );
};

export default AIRehabChatbotV2;
