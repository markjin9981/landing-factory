/**
 * Gemini API Service
 * 
 * 개인회생/파산 관련 간단한 Q&A
 */

const SYSTEM_PROMPT = `당신은 개인회생과 파산 전문 법률 AI 어시스턴트입니다.
다음 규칙을 반드시 따르세요:

1. 개인회생, 개인파산, 채무조정 관련 질문에만 답변합니다.
2. 다른 주제의 질문은 정중히 거절하고 관련 주제로 안내합니다.
3. 답변은 간결하고 이해하기 쉽게 작성합니다.
4. 법적 조언이 아닌 일반적인 정보 제공임을 명시합니다.
5. 정확한 상담은 전문 변호사나 법무사와 상담하도록 권고합니다.`;

export interface GeminiMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface GeminiResponse {
    success: boolean;
    message?: string;
    error?: string;
}

/**
 * Gemini API를 통해 간단한 Q&A 수행
 */
export async function askGemini(
    apiKey: string,
    question: string,
    conversationHistory: GeminiMessage[] = []
): Promise<GeminiResponse> {
    if (!apiKey) {
        return { success: false, error: 'Gemini API Key가 설정되지 않았습니다.' };
    }

    try {
        const messages: GeminiMessage[] = [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: '네, 개인회생과 파산 관련 질문에 대해 도움을 드리겠습니다. 무엇이 궁금하신가요?' }] },
            ...conversationHistory,
            { role: 'user', parts: [{ text: question }] }
        ];

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: messages,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    ],
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error?.message || 'API 요청 실패' };
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            return { success: true, message: text };
        } else {
            return { success: false, error: '응답을 받지 못했습니다.' };
        }
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 개인회생/파산 관련 질문인지 간단히 확인
 */
export function isRehabRelatedQuestion(question: string): boolean {
    const keywords = [
        '회생', '파산', '채무', '빚', '변제', '탕감',
        '면책', '개시', '신청', '법원', '변호사', '법무사',
        '수임료', '비용', '기간', '자격', '조건', '재산',
        '소득', '가압류', '압류', '추심', '독촉', '신용',
    ];

    return keywords.some(keyword => question.includes(keyword));
}
