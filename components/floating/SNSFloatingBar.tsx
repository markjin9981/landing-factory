import React from 'react';
import { SNSConfig } from '../../types';
import { Instagram, Youtube, MessageCircle, Globe, Share2 } from 'lucide-react';

interface Props {
    config?: SNSConfig;
    isMobileView?: boolean;
}

const SNSFloatingBar: React.FC<Props> = ({ config, isMobileView }) => {
    if (!config || !config.isShow || !config.items || config.items.length === 0) return null;

    const { position = 'bottom-right', displayMode = 'floating' } = config;

    // Helper to get icon
    const getIcon = (type: string, customUrl?: string) => {
        if (customUrl) return <img src={customUrl} alt={type} className="w-full h-full object-cover rounded-full" />;

        switch (type) {
            case 'kakao': return <MessageCircle className="w-full h-full p-1" />;
            case 'blog': return <span className="font-bold text-xs">Blog</span>;
            case 'instagram': return <Instagram className="w-full h-full p-1" />;
            case 'youtube': return <Youtube className="w-full h-full p-1" />;
            default: return <Share2 className="w-full h-full p-2" />;
        }
    };

    // Helper to get color
    const getColor = (type: string) => {
        switch (type) {
            case 'kakao': return '#FEE500';
            case 'blog': return '#03C75A';
            case 'instagram': return '#E4405F';
            case 'youtube': return '#FF0000';
            default: return '#1F2937';
        }
    };

    // Helper to get text color
    const getTextColor = (type: string) => {
        return type === 'kakao' ? '#000000' : '#ffffff';
    };

    // --- BANNER MODE (Bottom Fixed) ---
    if (displayMode === 'block') {
        return (
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-3 px-4 z-[55] flex justify-center gap-4 animate-slide-up">
                {config.items?.map((item) => (
                    <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div
                            className="shadow-sm transition-transform group-hover:scale-110 flex items-center justify-center"
                            style={{
                                width: 40,
                                height: 40,
                                backgroundColor: item.customIconUrl ? 'transparent' : getColor(item.type),
                                color: getTextColor(item.type),
                                borderRadius: '50%',
                            }}
                        >
                            {getIcon(item.type, item.customIconUrl)}
                        </div>
                        {item.label && <span className="text-[10px] text-gray-500 font-bold">{item.label}</span>}
                    </a>
                ))}
            </div>
        );
    }

    // --- FLOATING MODE ---
    const getPositionClasses = () => {
        // Mobile Optimization: Force Bottom-Left to avoid Chat Button (usually Bottom-Right)
        if (isMobileView) return "bottom-4 left-4 flex-col-reverse";

        switch (position) {
            case 'bottom-left': return "bottom-8 left-8 flex-col-reverse";
            case 'side-right': return "top-1/2 right-4 -translate-y-1/2 flex-col";
            case 'side-left': return "top-1/2 left-4 -translate-y-1/2 flex-col";
            case 'bottom-right': default: return "bottom-8 right-8 flex-col-reverse";
        }
    };
    const posClass = getPositionClasses();

    return (
        <div className={`fixed z-50 flex gap-3 ${posClass}`} style={{ gap: config.style?.gap }}>
            {config.items?.map((item) => (
                <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative group flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                    style={{
                        width: config.style?.iconSize || 48,
                        height: config.style?.iconSize || 48,
                        backgroundColor: item.customIconUrl ? 'transparent' : getColor(item.type),
                        color: getTextColor(item.type),
                        borderRadius: '50%',
                    }}
                >
                    {getIcon(item.type, item.customIconUrl)}

                    {/* Tooltip */}
                    {item.label && (
                        <span className="absolute whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -top-8 left-1/2 -translate-x-1/2">
                            {item.label}
                        </span>
                    )}
                </a>
            ))}
        </div>
    );
};

export default SNSFloatingBar;
