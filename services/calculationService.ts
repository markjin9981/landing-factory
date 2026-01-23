/**
 * Calculation Service - 개인회생 변제금 계산 엔진
 * 
 * 2026년 기준 법원 실무 로직 기반
 */

import {
    RehabPolicyConfig,
    DEFAULT_POLICY_CONFIG_2026,
    getPolicyForDate, // Added
    extractRegionFromAddress,
    getCourtForRegion,
    getRegionGroup,
    getMedianIncome,
    getRecognizedLivingCost,
} from '../config/PolicyConfig';

// ... (existing code)

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
    processingMonths: number;    // 개시결정까지 소요기간 (개월)

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
    config?: RehabPolicyConfig // Optional, defaults to date-based
): RehabCalculationResult {
    // config가 없으면 현재 날짜 기준으로 자동 선택
    const effectiveConfig = config || getPolicyForDate(new Date());

    // 1. 지역/법원 판별
    const region = extractRegionFromAddress(input.address);
    const courtName = getCourtForRegion(region, effectiveConfig);
    const regionGroup = getRegionGroup(region, effectiveConfig);
    const courtTrait = effectiveConfig.courtTraits[courtName] || effectiveConfig.courtTraits['Default'];

    // 상태 변수 초기화
    let status: 'POSSIBLE' | 'DIFFICULT' | 'IMPOSSIBLE' = 'POSSIBLE';
    let statusReason = '';
    const aiAdvice: string[] = [];
    const riskWarnings: string[] = [];

    // 3. 월 가용소득 (변제금) 계산 및 생계비 자동 조정
    const baseLivingCostRaw = getRecognizedLivingCost(input.familySize, effectiveConfig);
    let recognizedLivingCost = baseLivingCostRaw;

    // 추가 주거비 계산 (2026년 신규 로직)
    let additionalHousingCost = 0;
    if (input.rentCost && input.rentCost > 0) {
        // 해당 지역 및 가구원수의 기준 가져오기
        const housingCriteria = effectiveConfig.additionalHousingCosts?.[regionGroup]?.[input.familySize] ||
            effectiveConfig.additionalHousingCosts?.['그외']?.[input.familySize];

        if (housingCriteria) {
            // 공식: 인정액 = Min(월세 - 기본포함분, 한도)
            // 단, 월세가 기본포함분보다 적으면 0
            const deductibleRent = Math.max(0, input.rentCost - housingCriteria.included);
            additionalHousingCost = Math.min(deductibleRent, housingCriteria.limit);

            if (additionalHousingCost > 0) {
                aiAdvice.push(`🏠 **주거비 추가 인정**: 월세 중 ${formatCurrency(additionalHousingCost)}이 추가 생계비로 인정되었습니다.`);
            }
        }
    }

    // 추가 의료비 계산 (2026년)
    let additionalMedicalCost = 0;
    if (input.medicalCost && input.medicalCost > 0) {
        // 가구원수별 기본 포함금액 가져오기 (없으면 1인 기준 fallback)
        const medIncluded = effectiveConfig.medicalCostIncluded?.[input.familySize] ||
            effectiveConfig.medicalCostIncluded?.[4] || 64619;

        // 포함분 초과 금액 전액 인정 (한도 언급 없음)
        if (input.medicalCost > medIncluded) {
            additionalMedicalCost = input.medicalCost - medIncluded;
            aiAdvice.push(`🏥 **의료비 추가 인정**: 월 의료비 중 기본 포함분(${formatCurrency(medIncluded)})을 초과하는 ${formatCurrency(additionalMedicalCost)}이 추가 인정되었습니다.`);
        }
    }

    // 추가 교육비 계산 (2026년)
    let additionalEducationCost = 0;
    if (input.educationCost && input.educationCost > 0 && input.minorChildren && input.minorChildren > 0) {
        const eduCriteria = effectiveConfig.educationCostCriteria || { included: 89627, limit: 200000, specialLimit: 500000 };

        // 자녀 1인당 평균 교육비 산출
        const perChildCost = input.educationCost / input.minorChildren;

        if (perChildCost > eduCriteria.included) {
            // 1인당 추가 인정액 (일반 한도 적용)
            const perChildAdditional = Math.min(perChildCost - eduCriteria.included, eduCriteria.limit);

            additionalEducationCost = perChildAdditional * input.minorChildren;

            if (additionalEducationCost > 0) {
                aiAdvice.push(`🎓 **교육비 추가 인정**: 자녀 1인당 최대 ${formatCurrency(eduCriteria.limit)} 한도 내에서 총 ${formatCurrency(additionalEducationCost)}이 추가 인정되었습니다.`);
            }
        }
    }

    // 4. 총 추가 인정 생계비 합산 (기존)
    let totalAdditionalCost = additionalHousingCost + additionalMedicalCost + additionalEducationCost;
    const standardLivingCost = recognizedLivingCost; // 현재 시점(추가비용 합산 전)이 기본 생계비

    // --- [NEW] 고소득자(기타생계비) 로직 적용 ---
    const highIncomeConfig = effectiveConfig.highIncomeConfig || DEFAULT_POLICY_CONFIG_2026.highIncomeConfig;
    const medianIncome = getMedianIncome(input.familySize, effectiveConfig); // 중위소득 정의 (Fix: missing var)
    const isHighIncome = input.monthlyIncome > (medianIncome * highIncomeConfig.thresholdRate);
    let highIncomeAdjustmentMsg = '';

    if (isHighIncome) {
        // 고소득자 기준: 중위소득 150% 초과

        // A. 총 생계비 한도 체크 (중위소득 100% 이내)
        const currentTotalLivingCost = standardLivingCost + totalAdditionalCost;
        const maxAllowedLivingCost = medianIncome * highIncomeConfig.maxLivingCostRate;

        // 생계비 한도 적용
        let cappedLivingCost = Math.min(currentTotalLivingCost, maxAllowedLivingCost);

        // B. 최소 변제율(40%) 체크
        const totalDebt = input.totalDebt; // Fix: correct field name
        // 채무가 0이면 계산 불가하므로 패스
        if (totalDebt > 0) {
            const minRepaymentTotal = totalDebt * highIncomeConfig.minRepaymentRate;
            const minRepaymentMonthly = minRepaymentTotal / 36; // 기본 36개월 기준 계산
            const maxLivingCostByRepayment = input.monthlyIncome - minRepaymentMonthly;

            if (cappedLivingCost > maxLivingCostByRepayment) {
                cappedLivingCost = Math.max(0, maxLivingCostByRepayment); // 음수 방지
                highIncomeAdjustmentMsg = `\n\n[고소득자 특례 적용]\n고소득자(중위소득 ${highIncomeConfig.thresholdRate * 100}% 초과)에 해당하여, 최소 변제율(${highIncomeConfig.minRepaymentRate * 100}%) 준수를 위해 생계비가 일부 조정되었습니다.`;
            } else if (currentTotalLivingCost > maxAllowedLivingCost) {
                highIncomeAdjustmentMsg = `\n\n[고소득자 특례 적용]\n고소득자(중위소득 ${highIncomeConfig.thresholdRate * 100}% 초과)에 해당하여, 총 생계비가 중위소득의 ${highIncomeConfig.maxLivingCostRate * 100}% 이내로 제한되었습니다.`;
            }
        }

        // 최종 조정된 추가 생계비 (역산)
        const adjustedAdditionalCost = Math.max(0, cappedLivingCost - standardLivingCost);

        // 조정된 값이 기존 합산보다 작을 경우에만 적용
        if (adjustedAdditionalCost < totalAdditionalCost) {
            totalAdditionalCost = adjustedAdditionalCost;
        }
    }

    // 5. 최종 인정 생계비
    recognizedLivingCost += totalAdditionalCost;

    // AI 조언 업데이트 (High Income Msg 추가)
    if (highIncomeAdjustmentMsg) {
        // AI 조언 배열에 접근해야 함. (current scope assumes aiAdvice is available)
        aiAdvice.push(highIncomeAdjustmentMsg);
    }

    let availableIncome = input.monthlyIncome - recognizedLivingCost;
    let baseLivingCost = recognizedLivingCost; // 초기 인정 생계비 (조정 전)
    const minAvailableIncome = 100000; // 최소 보장 가용소득 (10만원)

    // 소득이 생계비보다 적거나 가용소득이 너무 적은 경우 (10만원 미만)
    if (availableIncome < minAvailableIncome) {
        // 1단계: 부양가족 제외 (본인 1인 기준으로 재계산)
        if (input.familySize > 1) {
            const singleLivingCost = getRecognizedLivingCost(1, effectiveConfig);
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
                    processingMonths: courtTrait.processingMonths,
                    aiAdvice: ['배우자 소득 합산이나 파산 절차를 고려해보세요.', '아르바이트 등으로 소득을 조금 더 늘리시는 것을 추천합니다.'],
                    riskWarnings: ['현재 소득으로는 사실상 개인회생 진행이 어렵습니다.'],
                };
            }
        }
    }

    // 4. 청산가치(재산) 계산
    const depositRule = effectiveConfig.depositExemptions[regionGroup] || effectiveConfig.depositExemptions['그외'];
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
        baseLivingCost: baseLivingCostRaw,
        additionalLivingCost: additionalHousingCost + additionalMedicalCost + additionalEducationCost,
        recognizedLivingCost,
        availableIncome,
        liquidationValue,
        exemptDeposit,
        courtName,
        regionGroup,
        courtDescription: courtTrait.description || '',
        processingMonths: courtTrait.processingMonths,
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
