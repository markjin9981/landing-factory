/**
 * AI 챗봇 템플릿 시스템 설정
 * 
 * 10가지 디자인 템플릿과 색상/다크모드 옵션 정의
 */

// 템플릿 ID 타입
export type ChatbotTemplateId =
    | 'classic'
    | 'messenger'
    | 'minimal'
    | 'gradient'
    | 'bot'
    | 'sidebar'
    | 'modern'
    | 'bubble'
    | 'corporate'
    | 'neon';

// 색상 팔레트 타입
export interface ChatbotColorPalette {
    primary: string;      // 헤더, 사용자 메시지
    secondary: string;    // 봇 메시지
    accent: string;       // 버튼 호버, CTA
    headerText: string;   // 헤더 텍스트
    userText: string;     // 사용자 메시지 텍스트
    botText: string;      // 봇 메시지 텍스트
}

// 테마 모드
export type ThemeMode = 'light' | 'dark';

// 템플릿 설정
export interface ChatbotTemplateConfig {
    templateId: ChatbotTemplateId;
    mode: ThemeMode;
    colors: ChatbotColorPalette;
}

// 기본 색상 팔레트 (라이트 모드)
export const DEFAULT_LIGHT_PALETTE: ChatbotColorPalette = {
    primary: '#2563eb',
    secondary: '#f1f5f9',
    accent: '#3b82f6',
    headerText: '#ffffff',
    userText: '#ffffff',
    botText: '#1e293b'
};

// 기본 색상 팔레트 (다크 모드)
export const DEFAULT_DARK_PALETTE: ChatbotColorPalette = {
    primary: '#3b82f6',
    secondary: '#334155',
    accent: '#60a5fa',
    headerText: '#ffffff',
    userText: '#ffffff',
    botText: '#f1f5f9'
};

// 템플릿 정보
export interface TemplateInfo {
    id: ChatbotTemplateId;
    name: string;
    nameKo: string;
    description: string;
    previewColors: {
        light: ChatbotColorPalette;
        dark: ChatbotColorPalette;
    };
}

// 10가지 템플릿 정보
export const CHATBOT_TEMPLATES: TemplateInfo[] = [
    {
        id: 'classic',
        name: 'Classic',
        nameKo: '클래식',
        description: '전통적인 라이브챗 스타일',
        previewColors: {
            light: { primary: '#334155', secondary: '#f8fafc', accent: '#475569', headerText: '#fff', userText: '#fff', botText: '#1e293b' },
            dark: { primary: '#1e293b', secondary: '#334155', accent: '#64748b', headerText: '#fff', userText: '#fff', botText: '#e2e8f0' }
        }
    },
    {
        id: 'messenger',
        name: 'Messenger',
        nameKo: '메신저',
        description: 'iOS/Facebook 메시지 스타일',
        previewColors: {
            light: { primary: '#0ea5e9', secondary: '#e2e8f0', accent: '#0284c7', headerText: '#fff', userText: '#fff', botText: '#1e293b' },
            dark: { primary: '#0284c7', secondary: '#374151', accent: '#38bdf8', headerText: '#fff', userText: '#fff', botText: '#f3f4f6' }
        }
    },
    {
        id: 'minimal',
        name: 'Minimal',
        nameKo: '미니멀',
        description: '깔끔한 미니멀리즘',
        previewColors: {
            light: { primary: '#18181b', secondary: '#fafafa', accent: '#27272a', headerText: '#fff', userText: '#fff', botText: '#18181b' },
            dark: { primary: '#fafafa', secondary: '#27272a', accent: '#d4d4d8', headerText: '#18181b', userText: '#18181b', botText: '#fafafa' }
        }
    },
    {
        id: 'gradient',
        name: 'Gradient',
        nameKo: '그라데이션',
        description: '화려한 그라데이션 색상',
        previewColors: {
            light: { primary: '#8b5cf6', secondary: '#fef3c7', accent: '#a78bfa', headerText: '#fff', userText: '#fff', botText: '#1e1b4b' },
            dark: { primary: '#7c3aed', secondary: '#1e1b4b', accent: '#a78bfa', headerText: '#fff', userText: '#fff', botText: '#ede9fe' }
        }
    },
    {
        id: 'bot',
        name: 'Bot',
        nameKo: '봇 스타일',
        description: 'AI 봇 느낌 강조',
        previewColors: {
            light: { primary: '#10b981', secondary: '#ecfdf5', accent: '#34d399', headerText: '#fff', userText: '#fff', botText: '#065f46' },
            dark: { primary: '#059669', secondary: '#064e3b', accent: '#6ee7b7', headerText: '#fff', userText: '#fff', botText: '#d1fae5' }
        }
    },
    {
        id: 'sidebar',
        name: 'Sidebar',
        nameKo: '사이드바',
        description: '사이드 컬러 악센트',
        previewColors: {
            light: { primary: '#ef4444', secondary: '#fef2f2', accent: '#f87171', headerText: '#fff', userText: '#fff', botText: '#7f1d1d' },
            dark: { primary: '#dc2626', secondary: '#450a0a', accent: '#f87171', headerText: '#fff', userText: '#fff', botText: '#fecaca' }
        }
    },
    {
        id: 'modern',
        name: 'Modern',
        nameKo: '모던',
        description: '모던 카드 스타일',
        previewColors: {
            light: { primary: '#6366f1', secondary: '#eef2ff', accent: '#818cf8', headerText: '#fff', userText: '#fff', botText: '#312e81' },
            dark: { primary: '#4f46e5', secondary: '#1e1b4b', accent: '#a5b4fc', headerText: '#fff', userText: '#fff', botText: '#e0e7ff' }
        }
    },
    {
        id: 'bubble',
        name: 'Bubble',
        nameKo: '버블',
        description: '큰 둥근 말풍선',
        previewColors: {
            light: { primary: '#ec4899', secondary: '#fdf2f8', accent: '#f472b6', headerText: '#fff', userText: '#fff', botText: '#831843' },
            dark: { primary: '#db2777', secondary: '#500724', accent: '#f472b6', headerText: '#fff', userText: '#fff', botText: '#fbcfe8' }
        }
    },
    {
        id: 'corporate',
        name: 'Corporate',
        nameKo: '기업용',
        description: '프로페셔널 비즈니스',
        previewColors: {
            light: { primary: '#1e40af', secondary: '#eff6ff', accent: '#3b82f6', headerText: '#fff', userText: '#fff', botText: '#1e3a8a' },
            dark: { primary: '#1d4ed8', secondary: '#172554', accent: '#60a5fa', headerText: '#fff', userText: '#fff', botText: '#dbeafe' }
        }
    },
    {
        id: 'neon',
        name: 'Neon',
        nameKo: '네온',
        description: '사이버펑크 글로우',
        previewColors: {
            light: { primary: '#06b6d4', secondary: '#ecfeff', accent: '#22d3ee', headerText: '#fff', userText: '#fff', botText: '#164e63' },
            dark: { primary: '#0891b2', secondary: '#0c0a09', accent: '#22d3ee', headerText: '#fff', userText: '#fff', botText: '#a5f3fc' }
        }
    }
];

// 템플릿 ID로 정보 가져오기
export const getTemplateById = (id: ChatbotTemplateId): TemplateInfo | undefined => {
    return CHATBOT_TEMPLATES.find(t => t.id === id);
};

// 기본 템플릿 설정
export const DEFAULT_TEMPLATE_CONFIG: ChatbotTemplateConfig = {
    templateId: 'classic',
    mode: 'dark',
    colors: DEFAULT_DARK_PALETTE
};
