import React from 'react';
import { SNSConfig } from '../../types';
import { Instagram, Youtube, MessageCircle, Globe } from 'lucide-react';

interface Props {
    config?: SNSConfig;
    isMobileView?: boolean;
}

const SNSFloatingBar: React.FC<Props> = ({ config, isMobileView }) => {
    if (!config || !config.isShow) return null;

    const { position = 'right', kakao, naverBlog, instagram, youtube } = config;

    // Collect valid links
    const links = [
        { type: 'kakao', url: kakao, icon: <MessageCircle />, label: '카카오톡', bg: 'bg-yellow-400 text-black border border-yellow-500' },
        { type: 'blog', url: naverBlog, icon: <Globe />, label: '블로그', bg: 'bg-green-600 text-white' },
        { type: 'instagram', url: instagram, icon: <Instagram />, label: '인스타그램', bg: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white' },
        { type: 'youtube', url: youtube, icon: <Youtube />, label: '유튜브', bg: 'bg-red-600 text-white' },
    ].filter(link => !!link.url);

    if (links.length === 0) return null;

    const baseClasses = "fixed z-50 flex flex-col gap-3 transition-all duration-300";
    const posClasses = isMobileView
        ? "bottom-4 right-4"
        : position === 'left' ? "bottom-8 left-8" : "bottom-8 right-8";

    return (
        <div className={`${baseClasses} ${posClasses}`}>
            {links.map((item, idx) => (
                <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`relative group flex items-center justify-center rounded-full shadow-lg hover:scale-110 transition-transform w-[50px] h-[50px] ${item.bg}`}
                    title={item.label}
                >
                    {React.cloneElement(item.icon as React.ReactElement, { size: 24 })}

                    {!isMobileView && (
                        <span className={`absolute ${position === 'left' ? 'left-full ml-3' : 'right-full mr-3'} px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none`}>
                            {item.label}
                        </span>
                    )}
                </a>
            ))}
        </div>
    );
};

export default SNSFloatingBar;
