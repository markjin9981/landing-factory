/**
 * PolicyConfig - 2026년 기준 개인회생 변제금 계산 설정값
 * 
 * 이 파일의 값들은 관리자 설정에서 동적으로 override 가능합니다.
 */

export interface RehabPolicyConfig {
    baseYear: number;
    // 가구원수별 중위소득 (1~6인)
    medianIncome: Record<number, number>;
    // 5인 이상 시 1인당 추가금액
    medianIncomeIncrement: number;
    // 2026년 확정 인정 생계비 (1.5/2.5인 포함)
    recognizedLivingCost: Record<number, number>;
    // 지역별 보증금 공제 기준
    depositExemptions: Record<string, { limit: number; deduct: number }>;
    // 지역별 추가 주거비 인정 한도 (신규)
    housingAllowance: Record<string, { limit: number; included: number }>;
    // 생계비 인정률 (기본 60%)
    livingCostRate: number;
    // 법원별 성향
    courtTraits: Record<string, CourtTrait>;
    // 지역->법원 매핑
    regionToCourtMap: Record<string, string>;
    // 지역->그룹 매핑 (Seoul, Overcrowded, Metro, Others)
    regionToGroupMap: Record<string, string>;
}

export interface CourtTrait {
    name: string;
    allow24Months: boolean;      // 24개월 단축 가능 여부
    spousePropertyRate: number;  // 배우자 재산 반영률 (0.0 ~ 1.0)
    investLossInclude: boolean;  // 투기성 손실금 청산가치 반영 여부 (신규)
    description?: string;        // 법원 성향 설명
}

/**
 * 2026년 기준 정책 설정 (기본값)
 * 실제 값은 정부 발표 후 업데이트 필요
 */
export const DEFAULT_POLICY_CONFIG_2026: RehabPolicyConfig = {
    baseYear: 2026,

    // 2026년 기준 중위소득 60% (인정 생계비) - 2026년 확정치
    medianIncome: {
        1: 2564238,   // 1인 가구 중위소득 (60% = 1,538,543)
        2: 4199292,   // 2인 가구 중위소득 (60% = 2,519,575)
        3: 5359037,   // 3인 가구 중위소득 (60% = 3,215,422)
        4: 6494738,   // 4인 가구 중위소득 (60% = 3,896,843)
        5: 7479740,   // 5인 가구
        6: 8464742,   // 6인 가구
    },
    medianIncomeIncrement: 985002, // 6인 초과 시 1인당 추가분

    // 2026년 확정 인정 생계비 (중위소득 60%, 1.5/2.5인 포함)
    recognizedLivingCost: {
        1: 1538543,     // 1인
        1.5: 2029059,   // 1.5인 (이혼 1인 + 양육미성년)
        2: 2519575,     // 2인
        2.5: 2867498,   // 2.5인 (기혼 배우자 미합가)
        3: 3215422,     // 3인
        4: 3896843,     // 4인
        5: 4492318,     // 5인 (추정)
        6: 5087793,     // 6인 (추정)
    } as Record<number, number>,

    // 지역별 보증금 공제 기준 (주택임대차보호법 기준 예상)
    depositExemptions: {
        'Seoul': { limit: 170000000, deduct: 57000000 },         // 서울
        'Overcrowded': { limit: 150000000, deduct: 50000000 },   // 과밀억제권역
        'Metro': { limit: 88000000, deduct: 29000000 },          // 광역시
        'Others': { limit: 78000000, deduct: 26000000 }          // 그 외
    },

    // 생계비 인정률
    livingCostRate: 0.6,

    // 지역별 추가 주거비 인정 한도 (신규 - 2026년 서울회생법원 기준)
    housingAllowance: {
        'Seoul': { limit: 589208, included: 273861 },         // 서울
        'Overcrowded': { limit: 430122, included: 273861 },   // 과밀억제권역/세종/용인/화성
        'Metro': { limit: 229791, included: 273861 },         // 광역시/안산/김포/광주/파주
        'Others': { limit: 176762, included: 273861 }         // 그 밖의 지역
    },

    // 법원별 성향
    courtTraits: {
        '서울회생법원': {
            name: '서울회생법원',
            allow24Months: true,
            spousePropertyRate: 0.0,
            investLossInclude: false,
            description: '24개월 단축 변제 가능, 배우자 재산 미반영, 투기손실 미반영'
        },
        '수원회생법원': {
            name: '수원회생법원',
            allow24Months: false,
            spousePropertyRate: 0.5,
            investLossInclude: true,
            description: '배우자 재산 50% 반영, 투기손실 반영'
        },
        '인천회생법원': {
            name: '인천회생법원',
            allow24Months: false,
            spousePropertyRate: 0.5,
            investLossInclude: true,
            description: '배우자 재산 50% 반영, 투기손실 반영'
        },
        '대전회생법원': {
            name: '대전회생법원',
            allow24Months: false,
            spousePropertyRate: 0.5,
            investLossInclude: false,
            description: '배우자 재산 50% 반영, 투기손실 미반영 예상 (2026년 개원)'
        },
        '대구회생법원': {
            name: '대구회생법원',
            allow24Months: false,
            spousePropertyRate: 0.5,
            investLossInclude: false,
            description: '배우자 재산 50% 반영, 투기손실 미반영 예상 (2026년 개원)'
        },
        '부산회생법원': {
            name: '부산회생법원',
            allow24Months: false,
            spousePropertyRate: 0.0,
            investLossInclude: false,
            description: '배우자 재산 미반영, 투기손실 미반영'
        },
        '광주회생법원': {
            name: '광주회생법원',
            allow24Months: false,
            spousePropertyRate: 0.5,
            investLossInclude: false,
            description: '배우자 재산 50% 반영, 투기손실 미반영 예상 (2026년 개원)'
        },
        'Default': {
            name: '기타 법원',
            allow24Months: false,
            spousePropertyRate: 0.5,
            investLossInclude: true,
            description: '36개월 변제 기준, 보수적 접근'
        }
    },

    // 지역 -> 관할 법원 매핑
    regionToCourtMap: {
        // 서울
        '서울': '서울회생법원',
        '서울특별시': '서울회생법원',
        // 경기
        '수원': '수원회생법원',
        '성남': '수원회생법원',
        '용인': '수원회생법원',
        '화성': '수원회생법원',
        '안양': '수원회생법원',
        '안산': '수원회생법원',
        '평택': '수원회생법원',
        '시흥': '수원회생법원',
        '김포': '수원회생법원',
        '광주시': '수원회생법원', // 경기 광주
        '광명': '수원회생법원',
        '군포': '수원회생법원',
        '오산': '수원회생법원',
        '이천': '수원회생법원',
        '안성': '수원회생법원',
        '하남': '수원회생법원',
        '의왕': '수원회생법원',
        '여주': '수원회생법원',
        '양평': '수원회생법원',
        '과천': '수원회생법원',
        // 고양/의정부 권역
        '고양': '서울회생법원',
        '의정부': '서울회생법원',
        '남양주': '서울회생법원',
        '파주': '서울회생법원',
        '구리': '서울회생법원',
        '양주': '서울회생법원',
        '포천': '서울회생법원',
        '동두천': '서울회생법원',
        '가평': '서울회생법원',
        '연천': '서울회생법원',
        // 인천
        '인천': '인천회생법원',
        '인천광역시': '인천회생법원',
        '부천': '인천회생법원',
        // 대전/충청
        '대전': '대전회생법원',
        '세종': '대전회생법원',
        '천안': '대전회생법원',
        '청주': '대전회생법원',
        '충주': '대전회생법원',
        '제천': '대전회생법원',
        // 대구/경북
        '대구': '대구회생법원',
        '경산': '대구회생법원',
        '포항': '대구회생법원',
        '구미': '대구회생법원',
        '경주': '대구회생법원',
        '안동': '대구회생법원',
        // 부산/울산/경남
        '부산': '부산회생법원',
        '울산': '부산회생법원',
        '창원': '부산회생법원',
        '김해': '부산회생법원',
        '양산': '부산회생법원',
        '진주': '부산회생법원',
        '거제': '부산회생법원',
        '통영': '부산회생법원',
        // 광주/전라
        '광주': '광주회생법원',
        '광주광역시': '광주회생법원',
        '전주': '광주회생법원',
        '익산': '광주회생법원',
        '군산': '광주회생법원',
        '목포': '광주회생법원',
        '여수': '광주회생법원',
        '순천': '광주회생법원',
    },

    // 지역 -> 그룹 매핑 (보증금 공제용)
    regionToGroupMap: {
        // 서울
        '서울': 'Seoul',
        '서울특별시': 'Seoul',
        // 과밀억제권역 (수도권 일부)
        '고양': 'Overcrowded',
        '성남': 'Overcrowded',
        '부천': 'Overcrowded',
        '안양': 'Overcrowded',
        '수원': 'Overcrowded',
        '의정부': 'Overcrowded',
        '남양주': 'Overcrowded',
        '구리': 'Overcrowded',
        '하남': 'Overcrowded',
        '인천': 'Overcrowded',
        // 광역시
        '부산': 'Metro',
        '대구': 'Metro',
        '인천광역시': 'Metro',
        '광주': 'Metro',
        '광주광역시': 'Metro',
        '대전': 'Metro',
        '울산': 'Metro',
        '세종': 'Metro',
    }
};

/**
 * 주소에서 지역명 추출
 */
export function extractRegionFromAddress(address: string): string {
    // 시/군/구 단위 추출
    const patterns = [
        /서울|서울특별시/,
        /부산|부산광역시/,
        /대구|대구광역시/,
        /인천|인천광역시/,
        /광주광역시/,
        /대전|대전광역시/,
        /울산|울산광역시/,
        /세종|세종특별자치시/,
        /고양|성남|용인|수원|화성|안산|안양|평택|시흥|김포|광명|군포|오산|이천|안성|하남|의왕|여주|양평|과천|부천/,
        /의정부|남양주|파주|구리|양주|포천|동두천|가평|연천/,
        /창원|김해|양산|진주|거제|통영/,
        /천안|청주|충주|제천/,
        /전주|익산|군산|목포|여수|순천/,
        /포항|구미|경주|안동|경산/,
    ];

    for (const pattern of patterns) {
        const match = address.match(pattern);
        if (match) return match[0];
    }

    return '기타';
}

/**
 * 지역에서 관할 법원 가져오기
 */
export function getCourtForRegion(region: string, config: RehabPolicyConfig): string {
    return config.regionToCourtMap[region] || 'Default';
}

/**
 * 지역에서 보증금 그룹 가져오기
 */
export function getRegionGroup(region: string, config: RehabPolicyConfig): string {
    return config.regionToGroupMap[region] || 'Others';
}

/**
 * 가구원수에 따른 중위소득 계산
 */
export function getMedianIncome(familySize: number, config: RehabPolicyConfig): number {
    if (familySize <= 6) {
        return config.medianIncome[familySize] || config.medianIncome[1];
    }
    // 6인 초과
    return config.medianIncome[6] + (familySize - 6) * config.medianIncomeIncrement;
}
