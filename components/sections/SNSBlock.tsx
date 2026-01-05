import React from 'react';
import { SNSConfig } from '../../types';
import { Instagram, Youtube, MessageCircle, Globe } from 'lucide-react';

interface Props {
    config?: SNSConfig;
    isMobileView?: boolean;
}

const SNSBlock: React.FC<Props> = ({ config, isMobileView }) => {
    if (!config || !config.isShow) return null;

    const { kakao, naverBlog, instagram, youtube } = config;

    // Collect valid links
    const links = [
        { type: 'kakao', url: kakao, icon: <MessageCircle />, label: '카카오톡', bg: 'bg-yellow-400 text-black border-yellow-500' },
        { type: 'blog', url: naverBlog, icon: <Globe />, label: '블로그', bg: 'bg-green-600 text-white' },
        { type: 'instagram', url: instagram, icon: <Instagram />, label: '인스타그램', bg: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white' },
        { type: 'youtube', url: youtube, icon: <Youtube />, label: '유튜브', bg: 'bg-red-600 text-white' },
    ].filter(link => !!link.url);

    if (links.length === 0) return null;

    return (
        <section className="py-12 bg-gray-50 border-t border-gray-200">
            <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest hidden md:block">Connect With Us</h3>

                <div className="flex gap-6">
                    {links.map((item, idx) => (
                        <a
                            key={idx}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all ${item.bg} bg-opacity-90 hover:bg-opacity-100 hover:-translate-y-1`}
                        >
                            {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                            <span className="font-bold text-sm">{item.label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SNSBlock;
