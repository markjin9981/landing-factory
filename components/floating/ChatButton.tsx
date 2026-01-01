import React from 'react';
import { ChatButtonConfig } from '../../types';
import { MessageCircle, Phone } from 'lucide-react';

interface ChatButtonProps {
    config?: ChatButtonConfig;
    isPreview?: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ config, isPreview = false }) => {
    if (!config || !config.useChat) return null;

    // Position Styles
    const bottomPx = config.bottom || 20;
    const sidePx = config.side || 20;
    const sizePx = config.size || 60;

    const containerStyle: React.CSSProperties = {
        position: isPreview ? 'absolute' : 'fixed',
        bottom: `${bottomPx}px`,
        zIndex: 60, // Above popup (50)
        [config.position === 'left' ? 'left' : 'right']: `${sidePx}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: config.position === 'left' ? 'flex-start' : 'flex-end',
        gap: '8px',
    };

    const buttonStyle: React.CSSProperties = {
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff', // Default
        transition: 'transform 0.2s',
    };

    // Default Appearance based on Type
    let bgColor = '#ffffff';
    let iconContent = <MessageCircle className="w-1/2 h-1/2 text-gray-600" />;

    if (config.type === 'kakao') {
        bgColor = '#FEE500'; // Kakao Yellow
        if (!config.iconUrl) {
            // Default Kakao Icon (SVG or Lucide fallback)
            iconContent = <MessageCircle className="w-1/2 h-1/2 text-[#3A1D1E] fill-current" />;
        }
    } else if (config.type === 'naver') {
        bgColor = '#03C75A'; // Naver Green
        if (!config.iconUrl) {
            iconContent = <MessageCircle className="w-1/2 h-1/2 text-white fill-current" />;
        }
    } else if (config.type === 'tel') {
        bgColor = '#3b82f6';
        if (!config.iconUrl) {
            iconContent = <Phone className="w-1/2 h-1/2 text-white" />;
        }
    }

    if (config.iconUrl) {
        buttonStyle.backgroundImage = `url(${config.iconUrl})`;
        buttonStyle.backgroundSize = 'cover';
        buttonStyle.backgroundPosition = 'center';
        iconContent = null; // Image covers it
    } else {
        buttonStyle.backgroundColor = bgColor;
    }

    const handleClick = () => {
        if (!config.linkUrl) return;
        if (config.openInNewWindow) {
            window.open(config.linkUrl, '_blank');
        } else {
            window.location.href = config.linkUrl;
        }
    };

    return (
        <div style={containerStyle} className="animate-fade-in-up">
            {/* Label Bubble */}
            {config.label && config.showLabel && (
                <div className="bg-white px-3 py-1.5 rounded-lg shadow-md text-sm font-bold text-gray-800 relative animate-bounce-subtle mb-1">
                    {config.label}
                    {/* Arrow tail */}
                    <div
                        className="absolute w-2 h-2 bg-white transform rotate-45"
                        style={{
                            bottom: '-4px',
                            [config.position === 'left' ? 'left' : 'right']: '15px'
                        }}
                    ></div>
                </div>
            )}

            {/* Main Button */}
            <div
                style={buttonStyle}
                onClick={handleClick}
                className="hover:scale-105 active:scale-95 group"
            >
                {iconContent}
            </div>
        </div>
    );
};

export default ChatButton;
