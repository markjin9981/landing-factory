/**
 * AI 챗봇 템플릿 렌더러
 * 
 * 선택된 템플릿에 따라 다른 스타일의 UI를 렌더링합니다.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, MessageCircle, User, Sparkles, Zap, Building2 } from 'lucide-react';
import { ChatbotTemplateId, ChatbotColorPalette, ThemeMode, getTemplateById } from './ChatbotTemplateConfig';

// 메시지 타입
export interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    content: string;
    options?: { label: string; value: string }[];
    inputType?: string;
    multiSelect?: boolean;
}

// 렌더러 Props
interface ChatbotRendererProps {
    templateId: ChatbotTemplateId;
    mode: ThemeMode;
    colors: ChatbotColorPalette;
    messages: ChatMessage[];
    inputValue: string;
    isTyping: boolean;
    characterName: string;
    progress: number;
    onInputChange: (value: string) => void;
    onSubmit: () => void;
    onOptionSelect: (option: { label: string; value: string }) => void;
    onClose: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    inputRef: React.RefObject<HTMLInputElement>;
}

const ChatbotRenderer: React.FC<ChatbotRendererProps> = ({
    templateId,
    mode,
    colors,
    messages,
    inputValue,
    isTyping,
    characterName,
    progress,
    onInputChange,
    onSubmit,
    onOptionSelect,
    onClose,
    messagesEndRef,
    inputRef
}) => {
    const isDark = mode === 'dark';
    const template = getTemplateById(templateId);

    // 공통 스타일 생성
    const getContainerStyle = () => {
        const baseStyle = 'w-full h-full flex flex-col overflow-hidden';

        switch (templateId) {
            case 'classic':
                return `${baseStyle} rounded-xl`;
            case 'messenger':
                return `${baseStyle} rounded-3xl`;
            case 'minimal':
                return `${baseStyle} rounded-lg`;
            case 'gradient':
                return `${baseStyle} rounded-2xl`;
            case 'bot':
                return `${baseStyle} rounded-2xl`;
            case 'sidebar':
                return `${baseStyle} rounded-xl border-l-4`;
            case 'modern':
                return `${baseStyle} rounded-2xl shadow-2xl`;
            case 'bubble':
                return `${baseStyle} rounded-3xl`;
            case 'corporate':
                return `${baseStyle} rounded-lg`;
            case 'neon':
                return `${baseStyle} rounded-xl`;
            default:
                return `${baseStyle} rounded-xl`;
        }
    };

    // 헤더 렌더링
    const renderHeader = () => {
        const headerBase = 'px-4 py-3 flex items-center justify-between';

        switch (templateId) {
            case 'classic':
                return (
                    <div
                        className={`${headerBase} border-b`}
                        style={{
                            backgroundColor: colors.primary,
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                            <span style={{ color: colors.headerText }} className="font-semibold">{characterName}</span>
                        </div>
                        <button onClick={onClose} className="p-1 hover:opacity-70 transition-opacity">
                            <X className="w-5 h-5" style={{ color: colors.headerText }} />
                        </button>
                    </div>
                );

            case 'messenger':
                return (
                    <div
                        className={`${headerBase} rounded-t-3xl`}
                        style={{ backgroundColor: colors.primary }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot className="w-6 h-6" style={{ color: colors.headerText }} />
                            </div>
                            <div>
                                <p style={{ color: colors.headerText }} className="font-semibold">{characterName}</p>
                                <p className="text-xs opacity-70" style={{ color: colors.headerText }}>온라인</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5" style={{ color: colors.headerText }} />
                        </button>
                    </div>
                );

            case 'minimal':
                return (
                    <div
                        className={`${headerBase}`}
                        style={{
                            backgroundColor: colors.primary,
                            color: colors.headerText
                        }}
                    >
                        <span className="font-medium text-sm tracking-wide">{characterName.toUpperCase()}</span>
                        <button onClick={onClose} className="hover:opacity-70">
                            <X className="w-4 h-4" style={{ color: colors.headerText }} />
                        </button>
                    </div>
                );

            case 'gradient':
                return (
                    <div
                        className={`${headerBase} py-4`}
                        style={{
                            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                <MessageCircle className="w-6 h-6" style={{ color: colors.headerText }} />
                            </div>
                            <div>
                                <p style={{ color: colors.headerText }} className="font-bold">{characterName}</p>
                                <p className="text-xs opacity-80" style={{ color: colors.headerText }}>AI 법률 상담</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                            <X className="w-5 h-5" style={{ color: colors.headerText }} />
                        </button>
                    </div>
                );

            case 'bot':
                return (
                    <div
                        className={`${headerBase} py-4`}
                        style={{ backgroundColor: colors.primary }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                                <Bot className="w-7 h-7" style={{ color: colors.primary }} />
                            </div>
                            <div>
                                <p style={{ color: colors.headerText }} className="font-bold">{characterName}</p>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                    <span className="text-xs" style={{ color: colors.headerText }}>Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                            <X className="w-5 h-5" style={{ color: colors.headerText }} />
                        </button>
                    </div>
                );

            case 'sidebar':
                return (
                    <div
                        className={`${headerBase}`}
                        style={{
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: colors.primary }}
                            >
                                <User className="w-5 h-5" style={{ color: colors.headerText }} />
                            </div>
                            <div>
                                <p className="font-semibold" style={{ color: isDark ? '#fff' : '#1e293b' }}>{characterName}</p>
                                <p className="text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Support</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1" style={{ color: colors.primary }}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                );

            case 'modern':
                return (
                    <div
                        className={`${headerBase} py-4`}
                        style={{
                            background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.accent} 100%)`
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Sparkles className="w-6 h-6" style={{ color: colors.headerText }} />
                            </div>
                            <span style={{ color: colors.headerText }} className="font-bold text-lg">{characterName}</span>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                            <X className="w-5 h-5" style={{ color: colors.headerText }} />
                        </button>
                    </div>
                );

            case 'bubble':
                return (
                    <div
                        className={`${headerBase} py-4`}
                        style={{ backgroundColor: colors.primary }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
                                <span className="text-2xl">🤖</span>
                            </div>
                            <div>
                                <p style={{ color: colors.headerText }} className="font-bold text-lg">{characterName}</p>
                                <p className="text-sm opacity-80" style={{ color: colors.headerText }}>AI Assistant</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                            <X className="w-5 h-5" style={{ color: colors.headerText }} />
                        </button>
                    </div>
                );

            case 'corporate':
                return (
                    <div
                        className={`${headerBase} py-4`}
                        style={{ backgroundColor: colors.primary }}
                    >
                        <div className="flex items-center gap-3">
                            <Building2 className="w-6 h-6" style={{ color: colors.headerText }} />
                            <div>
                                <p style={{ color: colors.headerText }} className="font-semibold">{characterName}</p>
                                <p className="text-xs opacity-70" style={{ color: colors.headerText }}>법률 상담 서비스</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 hover:opacity-70">
                            <X className="w-5 h-5" style={{ color: colors.headerText }} />
                        </button>
                    </div>
                );

            case 'neon':
                return (
                    <div
                        className={`${headerBase} py-4`}
                        style={{
                            backgroundColor: isDark ? '#0c0a09' : colors.primary,
                            boxShadow: `0 0 20px ${colors.accent}40`
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-11 h-11 rounded-lg flex items-center justify-center"
                                style={{
                                    backgroundColor: isDark ? colors.primary : 'white',
                                    boxShadow: `0 0 15px ${colors.accent}60`
                                }}
                            >
                                <Zap className="w-6 h-6" style={{ color: isDark ? '#fff' : colors.primary }} />
                            </div>
                            <span
                                className="font-bold text-lg"
                                style={{
                                    color: isDark ? colors.accent : colors.headerText,
                                    textShadow: isDark ? `0 0 10px ${colors.accent}` : 'none'
                                }}
                            >
                                {characterName}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{
                                backgroundColor: isDark ? colors.primary : 'white/20',
                                boxShadow: isDark ? `0 0 10px ${colors.accent}40` : 'none'
                            }}
                        >
                            <X className="w-5 h-5" style={{ color: isDark ? colors.accent : colors.headerText }} />
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    // 메시지 스타일 가져오기
    const getMessageStyle = (isUser: boolean) => {
        const baseUserStyle = { backgroundColor: colors.primary, color: colors.userText };
        const baseBotStyle = { backgroundColor: colors.secondary, color: colors.botText };

        switch (templateId) {
            case 'classic':
                return isUser
                    ? { ...baseUserStyle, borderRadius: '18px 18px 4px 18px' }
                    : { ...baseBotStyle, borderRadius: '18px 18px 18px 4px' };

            case 'messenger':
                return isUser
                    ? { ...baseUserStyle, borderRadius: '20px 20px 4px 20px' }
                    : { ...baseBotStyle, borderRadius: '20px 20px 20px 4px' };

            case 'minimal':
                return isUser
                    ? { ...baseUserStyle, borderRadius: '4px' }
                    : { ...baseBotStyle, borderRadius: '4px', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` };

            case 'gradient':
                return isUser
                    ? { background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`, color: colors.userText, borderRadius: '20px 20px 4px 20px' }
                    : { ...baseBotStyle, borderRadius: '20px 20px 20px 4px' };

            case 'bot':
                return isUser
                    ? { ...baseUserStyle, borderRadius: '16px 16px 4px 16px' }
                    : { ...baseBotStyle, borderRadius: '16px 16px 16px 4px' };

            case 'sidebar':
                return isUser
                    ? { ...baseUserStyle, borderRadius: '12px', borderLeft: `3px solid ${colors.accent}` }
                    : { ...baseBotStyle, borderRadius: '12px' };

            case 'modern':
                return isUser
                    ? { ...baseUserStyle, borderRadius: '16px 16px 4px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                    : { ...baseBotStyle, borderRadius: '16px 16px 16px 4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' };

            case 'bubble':
                return isUser
                    ? { ...baseUserStyle, borderRadius: '24px 24px 8px 24px' }
                    : { ...baseBotStyle, borderRadius: '24px 24px 24px 8px' };

            case 'corporate':
                return isUser
                    ? { ...baseUserStyle, borderRadius: '8px' }
                    : { ...baseBotStyle, borderRadius: '8px', borderLeft: `3px solid ${colors.primary}` };

            case 'neon':
                return isUser
                    ? { ...baseUserStyle, borderRadius: '12px', boxShadow: `0 0 15px ${colors.primary}40` }
                    : {
                        ...baseBotStyle,
                        borderRadius: '12px',
                        border: `1px solid ${colors.accent}40`,
                        boxShadow: isDark ? `0 0 10px ${colors.accent}20` : 'none'
                    };

            default:
                return isUser ? baseUserStyle : baseBotStyle;
        }
    };

    // 버튼 스타일
    const getButtonStyle = () => {
        switch (templateId) {
            case 'classic':
                return { backgroundColor: colors.primary, color: colors.headerText, borderRadius: '20px' };
            case 'messenger':
                return { backgroundColor: colors.primary, color: colors.headerText, borderRadius: '20px' };
            case 'minimal':
                return { backgroundColor: colors.primary, color: colors.headerText, borderRadius: '4px' };
            case 'gradient':
                return { background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`, color: colors.headerText, borderRadius: '20px' };
            case 'bot':
                return { backgroundColor: colors.primary, color: colors.headerText, borderRadius: '12px' };
            case 'sidebar':
                return { backgroundColor: colors.primary, color: colors.headerText, borderRadius: '8px' };
            case 'modern':
                return { backgroundColor: colors.primary, color: colors.headerText, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' };
            case 'bubble':
                return { backgroundColor: colors.primary, color: colors.headerText, borderRadius: '24px' };
            case 'corporate':
                return { backgroundColor: colors.primary, color: colors.headerText, borderRadius: '6px' };
            case 'neon':
                return {
                    backgroundColor: isDark ? 'transparent' : colors.primary,
                    color: isDark ? colors.accent : colors.headerText,
                    borderRadius: '8px',
                    border: isDark ? `2px solid ${colors.accent}` : 'none',
                    boxShadow: isDark ? `0 0 15px ${colors.accent}40` : 'none'
                };
            default:
                return { backgroundColor: colors.primary, color: colors.headerText, borderRadius: '20px' };
        }
    };

    // 배경색
    const getBackgroundColor = () => {
        if (isDark) {
            switch (templateId) {
                case 'neon': return '#0c0a09';
                case 'gradient': return '#1e1b4b';
                default: return '#1e293b';
            }
        }
        return '#ffffff';
    };

    return (
        <div
            className={getContainerStyle()}
            style={{
                backgroundColor: getBackgroundColor(),
                borderColor: templateId === 'sidebar' ? colors.primary : undefined
            }}
        >
            {/* Header */}
            {renderHeader()}

            {/* Progress Bar */}
            <div className="h-1" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
                <motion.div
                    className="h-full"
                    style={{ backgroundColor: colors.accent }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ backgroundColor: getBackgroundColor() }}
            >
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className="max-w-[85%]">
                                <div
                                    className="px-4 py-3"
                                    style={getMessageStyle(msg.type === 'user')}
                                >
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                </div>

                                {/* Option Buttons */}
                                {msg.options && msg.type === 'bot' && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {msg.options.map((opt, idx) => (
                                            <motion.button
                                                key={idx}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => onOptionSelect(opt)}
                                                className="px-4 py-2 text-sm font-medium transition-all"
                                                style={getButtonStyle()}
                                            >
                                                {opt.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div
                            className="px-4 py-3 flex gap-1"
                            style={getMessageStyle(false)}
                        >
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: colors.botText }}
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
                className="p-3 border-t"
                style={{
                    backgroundColor: getBackgroundColor(),
                    borderColor: isDark ? '#374151' : '#e5e7eb'
                }}
            >
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                        placeholder="입력해주세요..."
                        className="flex-1 px-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all"
                        style={{
                            backgroundColor: isDark ? '#334155' : '#f8fafc',
                            color: isDark ? '#f1f5f9' : '#1e293b',
                            borderColor: isDark ? '#475569' : '#e2e8f0'
                        }}
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onSubmit}
                        className="p-3 rounded-xl transition-all"
                        style={getButtonStyle()}
                    >
                        <Send className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default ChatbotRenderer;
