/**
 * AI 변제금 진단 챗봇 버튼
 * 
 * 랜딩페이지 어디에나 배치 가능한 플로팅/삽입 버튼
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Calculator, Sparkles } from 'lucide-react';
import AIRehabChatbot from './AIRehabChatbot';
import { RehabChatConfig, GlobalSettings } from '../../types';
import { RehabCalculationResult, RehabUserInput } from '../../services/calculationService';

interface RehabChatButtonProps {
    config?: RehabChatConfig;
    globalSettings?: GlobalSettings;
    onComplete?: (result: RehabCalculationResult, input: RehabUserInput) => void;
    className?: string;
    // 팝업 모드인 경우 버튼 렌더링, embedded인 경우 직접 삽입
    forceMode?: 'popup' | 'embedded' | 'floating';

    // Controlled Mode (Optional)
    isOpen?: boolean;
    onClose?: () => void;
    onOpen?: () => void; // Parent trigger
}

const DEFAULT_CONFIG: RehabChatConfig = {
    isEnabled: true,
    displayMode: 'floating',
    buttonText: 'AI 변제금 확인',
    buttonPosition: 'bottom-right',
    buttonColor: '#3B82F6',
    characterName: '로이',
};

const RehabChatButton: React.FC<RehabChatButtonProps> = ({
    config = DEFAULT_CONFIG,
    globalSettings,
    onComplete,
    className,
    forceMode,
    isOpen: propIsOpen,
    onClose: propOnClose,
    onOpen: propOnOpen
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    // Determine state mode (Controlled vs Uncontrolled)
    const isControlled = propIsOpen !== undefined;
    const isOpen = isControlled ? propIsOpen : internalIsOpen;

    const handleOpen = () => {
        if (isControlled && propOnOpen) {
            propOnOpen();
        } else if (!isControlled) {
            setInternalIsOpen(true);
        }
    };

    const handleClose = () => {
        if (isControlled && propOnClose) {
            propOnClose();
        } else {
            setInternalIsOpen(false);
        }
    };

    const displayMode = forceMode || config.displayMode;
    const buttonPosition = config.buttonPosition || 'bottom-right';

    // 위치 스타일
    const positionStyles: Record<string, string> = {
        'bottom-right': 'bottom-6 right-6',
        'bottom-left': 'bottom-6 left-6',
        'top-right': 'top-24 right-6',
        'top-left': 'top-24 left-6',
    };

    // 플로팅 버튼 렌더링
    if (displayMode === 'floating') {
        return (
            <>
                {!config.hideFloatingButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpen} // Use handleOpen
                        className={`fixed ${positionStyles[buttonPosition]} z-50 px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-bold text-white ${className || ''}`}
                        style={{
                            ...(config.buttonBackgroundImage ? {
                                backgroundImage: `url(${config.buttonBackgroundImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                backgroundColor: 'transparent'
                            } : {
                                background: `linear-gradient(135deg, ${config.buttonColor || '#3B82F6'}, ${config.buttonColor || '#3B82F6'}dd)`
                            }),
                            boxShadow: `0 4px 20px ${config.buttonColor || '#3B82F6'}40`
                        }}
                    >
                        <Sparkles className="w-5 h-5" />
                        <span>{config.buttonText || 'AI 변제금 확인'}</span>
                    </motion.button>
                )}

                <AnimatePresence>
                    {isOpen && (
                        <AIRehabChatbot
                            isOpen={isOpen}
                            onClose={handleClose}
                            onComplete={onComplete}
                            characterName={config.characterName}
                            characterImage={config.characterImage}
                            buttonColor={config.buttonColor}
                        />
                    )}
                </AnimatePresence>
            </>
        );
    }

    // 임베디드/팝업 버튼 렌더링
    return (
        <>
            {/* 임베디드 모드에서 버튼 클릭 시에도 팝업 열려야 함 (기존 로직 유지) */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpen} // Use handleOpen
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all ${className || ''}`}
                style={{
                    ...(config.buttonBackgroundImage ? {
                        backgroundImage: `url(${config.buttonBackgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: 'transparent'
                    } : {
                        background: `linear-gradient(135deg, ${config.buttonColor || '#3B82F6'}, ${config.buttonColor || '#3B82F6'}cc)`
                    }),
                    boxShadow: `0 4px 15px ${config.buttonColor || '#3B82F6'}30`
                }}
            >
                <Calculator className="w-5 h-5" />
                <span>{config.buttonText || 'AI 변제금 확인'}</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <AIRehabChatbot
                        isOpen={isOpen}
                        onClose={handleClose}
                        onComplete={onComplete}
                        characterName={config.characterName}
                        characterImage={config.characterImage}
                        buttonColor={config.buttonColor}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default RehabChatButton;
