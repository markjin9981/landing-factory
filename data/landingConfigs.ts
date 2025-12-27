import { LandingConfig } from '../types';

// In a real production environment, these could be separate JSON files fetched at runtime.
// For this single-repo setup, we export a dictionary.

const CONFIG_1: LandingConfig = {
  id: '1',
  title: '개인회생 무료 상담 | 법무법인 예시',
  theme: {
    primaryColor: '#0ea5e9', // Sky 500
    secondaryColor: '#0f172a', // Slate 900
  },
  banners: [
    {
      id: 'b1',
      isShow: true,
      text: "⚡️ 지금 신청하면 수임료 10% 추가 할인!",
      backgroundColor: "#1e293b",
      textColor: "#fbbf24",
      position: 'bottom',
      size: 'md'
    }
  ],
  hero: {
    headline: "감당할 수 없는 빚, 이제 법적으로 탕감받으세요.",
    headlineStyle: {
        fontSize: '3rem',
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
    },
    subHeadline: "국가가 보장하는 채무 조정 제도, 당신도 자격이 되는지 1분 만에 확인해드립니다.",
    subHeadlineStyle: {
        fontSize: '1.25rem',
        fontWeight: '400',
        color: '#e2e8f0', // gray-200
        textAlign: 'center',
    },
    ctaText: "무료 자격 조회하기",
    backgroundImage: "https://picsum.photos/id/44/1920/1080",
  },
  detailImages: [], // Add empty default
  problem: {
    title: "독촉 전화와 압류 걱정, 언제까지 참으시겠습니까?",
    description: "혼자 고민한다고 해결되지 않습니다. 골든타임을 놓치면 상황은 더 악화됩니다.",
    points: [
      "매일 울리는 추심 전화와 문자",
      "월급/통장 압류에 대한 불안감",
      "이자로만 나가는 돈이 원금보다 많은 상황"
    ]
  },
  solution: {
    title: "개인회생, 이렇게 해결해드립니다",
    description: "법률 전문가가 복잡한 절차를 대신 처리해 드립니다.",
    features: [
      { title: "이자 100% 면제", desc: "원금 최대 90%까지 탕감 가능합니다." },
      { title: "추심 즉시 중단", desc: "접수 후 7일 이내 금지명령으로 독촉이 사라집니다." },
      { title: "비밀 보장", desc: "가족과 회사 모르게 진행 가능합니다." }
    ]
  },
  trust: {
    reviews: [
      { name: "김OO님 (직장인)", text: "매일 오던 독촉 전화가 멈추니 살 것 같습니다. 진작 신청할 걸 그랬네요.", rating: 5 },
      { name: "이OO님 (자영업)", text: "빚이 8천만원이었는데 2천만원으로 줄었습니다. 감사합니다.", rating: 5 }
    ],
    stats: [
      { label: "누적 상담", value: "12,000+" },
      { label: "성공 사례", value: "3,500+" }
    ]
  },
  formConfig: {
    title: "무료 자격 조회 신청",
    subTitle: "상담은 100% 무료이며 비밀이 보장됩니다.",
    submitButtonText: "내 탕감 금액 확인하기",
    showPrivacyPolicy: true,
    showTerms: false,
    showMarketingConsent: false,
    showThirdPartyConsent: false,
    privacyPolicyContent: "개인정보 수집 및 이용에 대한 상세 내용입니다...",
    style: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        borderColor: '#e5e7eb',
        borderWidth: '1px',
        buttonBackgroundColor: '#0ea5e9',
        buttonTextColor: '#ffffff',
        buttonRadius: '12px'
    },
    fields: [
      { id: 'name', label: '이름', type: 'text', required: true, placeholder: '성함을 입력해주세요' },
      { id: 'phone', label: '연락처', type: 'tel', required: true, placeholder: '010-0000-0000' },
      { 
        id: 'debt_type', 
        label: '채무 발생 원인', 
        type: 'select', 
        required: true,
        options: [
          { value: 'business', label: '사업 실패' },
          { value: 'living', label: '생활비 부족' },
          { value: 'investment', label: '투자/주식 손실' },
          { value: 'fraud', label: '사기 피해' },
          { value: 'other', label: '기타' }
        ]
      },
      { id: 'total_debt', label: '총 채무액 (대략)', type: 'select', required: true, 
        options: [
          { value: 'under_3000', label: '3천만원 미만' },
          { value: '3000_5000', label: '3천만원 ~ 5천만원' },
          { value: 'over_5000', label: '5천만원 이상' }
        ]
      }
    ]
  }
};

const CONFIG_2: LandingConfig = {
  id: '2',
  title: '온라인 마케팅 대행 | 매출 폭발',
  theme: {
    primaryColor: '#ea580c', // Orange 600
    secondaryColor: '#111827', // Gray 900
  },
  banners: [
    {
      id: 'b1',
      isShow: false,
      text: "🎁 지금 상담 신청하면 마케팅 진단서 무료 제공!",
      backgroundColor: "#ea580c",
      textColor: "#ffffff",
      position: 'bottom',
      size: 'md'
    }
  ],
  hero: {
    headline: "광고비는 쓰는데 매출은 제자리인가요?",
    headlineStyle: { fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', textAlign: 'center' },
    subHeadline: "DB 단가 50% 절감, 전환율 200% 상승. 데이터로 증명하는 퍼포먼스 마케팅.",
    subHeadlineStyle: { fontSize: '1.2rem', fontWeight: '400', color: '#d1d5db', textAlign: 'center' },
    ctaText: "무료 컨설팅 신청",
    backgroundImage: "https://picsum.photos/id/60/1920/1080",
  },
  detailImages: [], 
  problem: {
    title: "대행사만 배불리는 마케팅은 그만!",
    description: "대표님의 소중한 예산, 줄줄 새고 있지 않나요?",
    points: [
      "보고서만 번지르르하고 실제 매출은 그대로",
      "담당자와 연락이 잘 안 되는 답답함",
      "우리 업종을 전혀 이해하지 못하는 마케팅"
    ]
  },
  solution: {
    title: "매출이 오르는 구조를 만듭니다",
    description: "단순 노출이 아닌, 구매 전환에 집중합니다.",
    features: [
      { title: "타겟 정밀 분석", desc: "구매 가능성이 높은 고객만 찾아냅니다." },
      { title: "고효율 소재 제작", desc: "클릭을 부르는 카피와 디자인을 제공합니다." },
      { title: "실시간 성과 최적화", desc: "매일 데이터를 분석해 예산 효율을 극대화합니다." }
    ]
  },
  trust: {
    reviews: [
      { name: "박OO 대표님 (쇼핑몰)", text: "3개월 만에 월 매출 1억 돌파했습니다. 정말 감사합니다.", rating: 5 },
      { name: "최OO 원장님 (병원)", text: "신환 문의가 3배 늘었어요. 마케팅이 이렇게 중요한지 몰랐습니다.", rating: 5 }
    ],
    stats: [
      { label: "평균 ROAS", value: "450%" },
      { label: "클라이언트", value: "150+" }
    ]
  },
  formConfig: {
    title: "성장 전략 제안받기",
    subTitle: "현재 상황을 남겨주시면 맞춤 전략을 제안드립니다.",
    submitButtonText: "무료 진단 받기",
    showPrivacyPolicy: true,
    showTerms: true,
    showMarketingConsent: true,
    showThirdPartyConsent: false,
    privacyPolicyContent: "개인정보 수집 이용 동의...",
    marketingConsentContent: "할인 혜택 및 뉴스레터 수신 동의...",
    style: {
        backgroundColor: '#ffffff',
        borderRadius: '0px',
        borderColor: '#ea580c',
        borderWidth: '2px',
        buttonBackgroundColor: '#ea580c',
        buttonTextColor: '#ffffff',
        buttonRadius: '4px'
    },
    fields: [
      { id: 'name', label: '담당자명', type: 'text', required: true, placeholder: '성함을 입력해주세요' },
      { id: 'phone', label: '연락처', type: 'tel', required: true, placeholder: '010-0000-0000' },
      { id: 'company_name', label: '업체명', type: 'text', required: false, placeholder: '업체명을 입력해주세요' },
      { 
        id: 'marketing_budget', 
        label: '월 마케팅 예산', 
        type: 'radio', 
        required: true,
        options: [
          { value: 'under_100', label: '100만원 이하' },
          { value: '100_500', label: '100~500만원' },
          { value: 'over_500', label: '500만원 이상' }
        ]
      }
    ]
  }
};

export const LANDING_CONFIGS: Record<string, LandingConfig> = {
  '1': CONFIG_1,
  '2': CONFIG_2,
};