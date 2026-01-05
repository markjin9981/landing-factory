import React from 'react';
import { SNSConfig } from '../../types';
import { MessageCircle, Globe, Instagram, Youtube, Share2 } from 'lucide-react';

interface SNSBlockProps {
    config?: SNSConfig;
}

const SNSBlock: React.FC<SNSBlockProps> = ({ config }) => {
    if (!config || !config.isShow) return null;

    // Helper to get icon
    const getIcon = (type: string, customUrl?: string) => {
        if (customUrl) return <img src={customUrl} alt={type} className="w-12 h-12 object-cover rounded-full" />;

        const size = 24;
        switch (type) {
            case 'kakao': return <MessageCircle size={size} />;
            case 'blog': return <span className="font-bold text-xs">Blog</span>;
            case 'instagram': return <Instagram size={size} />;
            case 'youtube': return <Youtube size={size} />;
            default: return <Share2 size={size} />;
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

    return (
        <section className="py-12 bg-gray-50 border-t">
            <div className="max-w-7xl mx-auto px-4 flex justify-center flex-wrap gap-6">
                {config.items?.map((item) => (
                    <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-shadow bg-white border border-gray-100 min-w-[160px] justify-center"
                    >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{
                                backgroundColor: item.customIconUrl ? 'transparent' : getColor(item.type),
                                color: getTextColor(item.type)
                            }}
                        >
                            {getIcon(item.type, item.customIconUrl)}
                        </div>
                        <span className="font-bold text-gray-700">{item.label || item.type}</span>
                    </a>
                ))}
            </div>
        </section>
    );
};

export default SNSBlock;
