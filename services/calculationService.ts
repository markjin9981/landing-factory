/**
 * Calculation Service - 개인회생 변제금 계산 엔진
 * 
 * 2026년 기준 법원 실무 로직 기반
 */

import {
    RehabPolicyConfig,
    DEFAULT_POLICY_CONFIG_2026,
    extractRegionFromAddress,
    getCourtForRegion,
    getRegionGroup,
    getMedianIncome,
    getRecognizedLivingCost,
} from '../config/PolicyConfig';

/**
 * 사용자 입력 데이터 (2026년 고도화)
 */
export interface RehabUserInput {
    // 기본 정보
    address: string;           // 거주지 주소
    workLocation?: string;     // 근무지/사업장 지역 (관할 법원용)
    age?: number;              // 나이 (24개월 특례 확인용)

    // 소득 정보
    employmentType?: 'salary' | 'business' | 'freelancer' | 'both' | 'none'; // 고용 형태
    monthlyIncome: number;     // 월 실수령 소득 (세후)
    salaryIncome?: number;     // 급여 소득 (겸업 시)
    businessIncome?: number;   // 사업 소득 (겸업 시)

    // 가족 정보
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'other'; // 혼인 상태
    isMarried: boolean;        // 기혼 여부 (호환성)
    minorChildren?: number;    // 미성년 자녀 수
    familySize: number;        // 가구원 수 (본인 포함)

    // 배우자 정보 (기혼 시)
    spouseIncome?: number;     // 배우자 월 소득
    spouseAssets: number;      // 배우자 재산 총액

    // 양육비 (이혼 시)
    isCustodialParent?: boolean;   // 양육권자 여부
    childSupportReceived?: number; // 양육비 수령액
    childSupportPaid?: number;     // 양육비 지급액

    // 주거 정보
    housingType?: 'rent' | 'jeonse' | 'owned' | 'free'; // 거주 형태
    rentCost?: number;         // 월세
    deposit: number;           // 보증금/전세금
    depositLoan?: number;      // 보증금 대출금

    // 추가 생계비
    medicalCost?: number;      // 월 의료비
    educationCost?: number;    // 월 교육비

    // 본인 재산
    myAssets: number;          // 본인 재산 총액

    // 채무 정보
    creditCardDebt?: number;   // 신용카드 채무
    totalDebt: number;         // 총 채무
    priorityDebt?: number;     // 우선변제채권 (세금 체납 등)

    // 투기성 손실
    speculativeLoss?: number;  // 주식/코인 손실금
    riskFactor?: 'none' | 'recent_loan' | 'investment' | 'gambling'; // 채무 유형

    // 24개월 특례 조건
    specialCondition?: 'none' | 'basic_recipient' | 'severe_disability' | 'elderly';

    // 연락처
    name?: string;             // 고객명
    phone?: string;            // 연락처
}

/**
 * 계산 결과 (2026년 고도화)
 */
export interface RehabCalculationResult {
    status: 'POSSIBLE' | 'DIFFICULT' | 'IMPOSSIBLE';
    statusReason: string;

    // 핵심 수치
    monthlyPayment: number;      // 월 변제금
    repaymentMonths: number;     // 변제 기간 (개월)
    totalRepayment: number;      // 총 변제액
    totalDebtReduction: number;  // 총 탕감액
    debtReductionRate: number;   // 탕감율 (%)

    // 계산 상세
    baseLivingCost: number;       // 기본 생계비
    additionalLivingCost: number; // 추가 생계비 (주거/의료/교육/양육)
    recognizedLivingCost: number; // 총 인정 생계비
    availableIncome: number;      // 가용 소득 (소득 - 생계비)
    liquidationValue: number;     // 청산가치
    exemptDeposit: number;        // 면제 보증금

    // 법원 정보
    courtName: string;
    regionGroup: string;
    courtDescription: string;

    // AI 조언
    aiAdvice: string[];
    riskWarnings: string[];

    // 무직자 안내 (신규)
    unemployedNotice?: string;
}

/**
 * 메인 계산 함수
 */
export function calculateRepayment(
    input: RehabUserInput,
    config: RehabPolicyConfig = DEFAULT_POLICY_CONFIG_2026
): RehabCalculationResult {
    // 1. 지역/법원 판별
    const region = extractRegionFromAddress(input.address);
    const courtName = getCourtForRegion(region, config);
    const regionGroup = getRegionGroup(region, config);
    const courtTrait = config.courtTraits[courtName] || config.courtTraits['Default'];

    // 상태 변수 초기화
    let status: 'POSSIBLE' | 'DIFFICULT' | 'IMPOSSIBLE' = 'POSSIBLE';
    let statusReason = '';
    const aiAdvice: string[] = [];
    const riskWarnings: string[] = [];

    // 3. 월 가용소득 (변제금) 계산 및 생계비 자동 조정
    let recognizedLivingCost = getRecognizedLivingCost(input.familySize, config);
    let availableIncome = input.monthlyIncome - recognizedLivingCost;
    let baseLivingCost = recognizedLivingCost; // 초기 인정 생계비 저장
    const minAvailableIncome = 100000; // 최소 보장 가용소득 (10만원)

    // 소득이 생계비보다 적거나 가용소득이 너무 적은 경우 (10만원 미만)
    if (availableIncome < minAvailableIncome) {
        // 1단계: 부양가족 제외 (본인 1인 기준으로 재계산)
        if (input.familySize > 1) {
            const singleLivingCost = getRecognizedLivingCost(1, config);
            if (input.monthlyIncome - singleLivingCost >= minAvailableIncome) {
                recognizedLivingCost = singleLivingCost;
                availableIncome = input.monthlyIncome - recognizedLivingCost;
                aiAdvice.push(`⚠️ 소득 부족으로 부양가족을 제외하고 **본인 1인 생계비**(${formatCurrency(recognizedLivingCost)})로 조정하여 계산했습니다.`);
            } else {
                // 부양가족 제외해도 부족한 경우 -> 1인 생계비 기준으로 2단계 진입
                recognizedLivingCost = singleLivingCost;
                availableIncome = input.monthlyIncome - recognizedLivingCost;
            }
        }

        // 2단계: 생계비 추가 삭감 (최대 20%까지)
        if (availableIncome < minAvailableIncome) {
            // 목표 가용소득(10만원)을 맞추기 위한 필요 생계비
            const targetLivingCost = input.monthlyIncome - minAvailableIncome;
            const minAllowedLivingCost = Math.floor(baseLivingCost * 0.8); // 최대 20% 삭감 한도

            if (targetLivingCost >= minAllowedLivingCost) {
                // 20% 범위 내에서 조정 가능
                const reductionRate = Math.round(((baseLivingCost - targetLivingCost) / baseLivingCost) * 100);
                recognizedLivingCost = targetLivingCost;
                availableIncome = minAvailableIncome; // 10만원으로 맞춤
                aiAdvice.push(`⚠️ 가용소득 확보를 위해 생계비를 **${reductionRate}%** 추가 조정하여 최저 가용소득(10만원)을 맞췄습니다.`);
            } else {
                // 삭감해도 10만원 확보 불가 -> 신청 불가
                return {
                    status: 'IMPOSSIBLE',
                    statusReason: '생계비를 최대 20%까지 줄여도 월 소득이 너무 적어 진행이 불가능합니다.',
                    monthlyPayment: 0,
                    repaymentMonths: 0,
                    totalRepayment: 0,
                    totalDebtReduction: 0,
                    debtReductionRate: 0,
                    baseLivingCost,
                    additionalLivingCost: 0,
                    recognizedLivingCost,
                    availableIncome: 0,
                    liquidationValue: 0,
                    exemptDeposit: 0,
                    courtName,
                    regionGroup,
                    courtDescription: courtTrait.description || '',
                    aiAdvice: ['배우자 소득 합산이나 파산 절차를 고려해보세요.', '아르바이트 등으로 소득을 조금 더 늘리시는 것을 추천합니다.'],
                    riskWarnings: ['현재 소득으로는 사실상 개인회생 진행이 어렵습니다.'],
                };
            }
        }
    }

    // 4. 청산가치(재산) 계산
    const depositRule = config.depositExemptions[regionGroup] || config.depositExemptions['Others'];
    let exemptDeposit = 0;

    if (input.deposit <= depositRule.limit) {
        exemptDeposit = Math.min(input.deposit, depositRule.deduct);
    }

    // 본인 재산 (보증금 면제분 제외)
    let liquidationValue = input.myAssets - exemptDeposit;
    if (liquidationValue < 0) liquidationValue = 0;

    // 배우자 재산 반영 (법원 성향에 따라)
    if (input.isMarried && input.spouseAssets > 0) {
        liquidationValue += Math.round(input.spouseAssets * courtTrait.spousePropertyRate);
    }



    // 5. 변제 기간 산정 (기본 36개월)
    let repaymentMonths = 36;
    let isYouthSpecial = false;

    // Case 3: 서울 청년 특례 (만 30세 미만)
    if (courtTrait.allow24Months && input.age && input.age < 30) {
        repaymentMonths = 24;
        isYouthSpecial = true;
    }

    // 6. 월 변제금 결정
    let monthlyPayment = availableIncome;

    // 청산가치 보장 원칙: 총 변제액 >= 청산가치
    let totalRepayment = monthlyPayment * repaymentMonths;

    // 시나리오별 처리
    if (isYouthSpecial && totalRepayment < liquidationValue) {
        // 청년 특례인데 청산가치 미충족 시 -> 두 가지 옵션 제안
        // Option A: 기간 연장 (36개월)
        const optionAMonths = 36;
        const optionAPayment = availableIncome;
        const optionATotal = optionAPayment * optionAMonths;

        // Option B: 변제금 상향 (24개월 유지)
        const optionBMonths = 24;
        const optionBPayment = Math.ceil(liquidationValue / 24);

        // 더 유리한 쪽(변제금 적은 쪽)을 기본으로 하되, 조언에 포함
        if (optionATotal >= liquidationValue) {
            // 36개월로 늘리면 해결되는 경우 -> 기본값은 36개월로 변경 (안전하게)
            repaymentMonths = 36;
            monthlyPayment = availableIncome;
            totalRepayment = totalRepayment * (36 / 24);
            statusReason = '청산가치 보장을 위해 기간이 36개월로 조정되었습니다. (청년 특례 24개월 유지 시 월 변제금 상향 필요)';

            aiAdvice.push(`💡 **청년 특례 옵션**: 기간을 24개월로 유지하려면 월 변제금을 약 ${formatCurrency(optionBPayment)}으로 상향해야 합니다.`);
        } else {
            // 36개월로도 부족한 경우 -> Case 2 로직으로 넘어감
            repaymentMonths = 36; // 일단 36개월로 설정하고 아래 로직 태움
        }
    }

    // Case 2: 재산 과다형 - 청산가치가 총 변제액보다 큰 경우 (청년 특례 조정 후에도 부족하거나, 일반인 경우)
    totalRepayment = monthlyPayment * repaymentMonths; // 재계산

    if (totalRepayment < liquidationValue) {
        // 1단계: 기간 연장 시도 (최대 60개월)
        if (availableIncome * 60 >= liquidationValue) {
            // 기간만 늘려서 청산가치 충족 가능
            repaymentMonths = Math.ceil(liquidationValue / availableIncome);
            if (repaymentMonths > 60) repaymentMonths = 60;
            totalRepayment = monthlyPayment * repaymentMonths;
        } else {
            // 2단계: 변제금 상향 (60개월 고정)
            repaymentMonths = 60;
            monthlyPayment = Math.ceil(liquidationValue / 60);
            totalRepayment = monthlyPayment * 60;
        }
    }

    // 7. 탕감액/탕감률 계산
    const totalDebtReduction = input.totalDebt - totalRepayment;
    const debtReductionRate = Math.round((totalDebtReduction / input.totalDebt) * 100);

    // 8. 상태 판단
    if (liquidationValue >= input.totalDebt) {
        status = 'IMPOSSIBLE';
        statusReason = '재산 가치가 채무보다 많아 개인회생 신청이 어렵습니다.';
    } else if (monthlyPayment > input.monthlyIncome * 0.8) {
        status = 'DIFFICULT';
        statusReason = '변제금이 소득의 80%를 초과하여 생활이 어려울 수 있습니다.';
    } else if (debtReductionRate < 0) { // 탕감액 마이너스인 경우
        status = 'IMPOSSIBLE';
        statusReason = '총 변제액이 원금을 초과합니다. (이자율에 따라 유불리 판단 필요)';
    } else if (debtReductionRate < 30) {
        status = 'DIFFICULT';
        statusReason = '탕감율이 낮아 실익이 적을 수 있습니다.';
    } else {
        status = 'POSSIBLE';
        statusReason = '개인회생 신청이 가능합니다.';
    }

    // 9. AI 조언 생성 (업데이트)
    // 법원 관련 조언
    if (isYouthSpecial) {
        if (repaymentMonths === 24) {
            aiAdvice.push(`${courtName} 관할 청년 특례로 24개월 단축 변제가 적용되었습니다.`);
        } else if (repaymentMonths > 24 && repaymentMonths <= 36) {
            // 위에서 이미 추가됨
        }
    } else if (courtTrait.allow24Months && input.age && input.age < 30) {
        // 서울인데 청년 특례 미적용 (나이 등)
    }

    if (courtTrait.spousePropertyRate === 0 && input.isMarried) {
        aiAdvice.push('이 법원은 배우자 재산을 반영하지 않아 유리합니다.');
    }

    // 탕감율 관련
    if (debtReductionRate >= 80) {
        aiAdvice.push(`최대 ${debtReductionRate}% 탕감이 예상됩니다. 매우 유리한 조건입니다.`);
    } else if (debtReductionRate >= 50) {
        aiAdvice.push(`약 ${debtReductionRate}% 탕감이 예상됩니다.`);
    }

    // 리스크 경고
    if (input.riskFactor === 'gambling') {
        riskWarnings.push('도박으로 인한 채무는 법원 심사가 까다로울 수 있습니다.');
        riskWarnings.push('면책불허사유에 해당할 수 있어 전문가 상담이 필요합니다.');
    } else if (input.riskFactor === 'investment') {
        riskWarnings.push('주식/코인 투자 손실금은 일부 법원에서 반영될 수 있습니다.');
    } else if (input.riskFactor === 'recent_loan') {
        riskWarnings.push('최근 1년 이내 대출이 많으면 추가 소명이 필요할 수 있습니다.');
    }

    return {
        status,
        statusReason,
        monthlyPayment,
        repaymentMonths,
        totalRepayment,
        totalDebtReduction,
        debtReductionRate,
        baseLivingCost: recognizedLivingCost,
        additionalLivingCost: 0,
        recognizedLivingCost,
        availableIncome,
        liquidationValue,
        exemptDeposit,
        courtName,
        regionGroup,
        courtDescription: courtTrait.description || '',
        aiAdvice,
        riskWarnings,
    };
}

/**
 * 금액 포맷팅 (한국어)
 */
export function formatCurrency(amount: number): string {
    if (amount >= 100000000) {
        const eok = Math.floor(amount / 100000000);
        const man = Math.floor((amount % 100000000) / 10000);
        return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
    } else if (amount >= 10000) {
        return `${Math.round(amount / 10000).toLocaleString()}만원`;
    }
    return `${amount.toLocaleString()}원`;
}

/**
 * 월 변제금 포맷팅
 */
export function formatMonthlyPayment(amount: number): string {
    return `월 ${formatCurrency(amount)}`;
}

/**
 * 만원 단위 숫자를 한국어 포맷으로 변환 (입력 프리뷰용)
 * 예: 12000 -> 1억 2,000만원
 */
export function formatTenThousandWon(amount: number): string {
    if (amount === 0) return '0원';
    const eok = Math.floor(amount / 10000);
    const man = amount % 10000;

    let result = '';
    if (eok > 0) result += `${eok}억 `;
    if (man > 0) result += `${man.toLocaleString()}만 `;
    return result.trim() + '원';
}
