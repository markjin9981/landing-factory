
import React from 'react';
import { DetailContent } from '../../types';
import CountdownTimer from './CountdownTimer';
import ApplicantTicker from './ApplicantTicker';
import ApplicantList from './ApplicantList';

interface BannerBlockProps {
    data: DetailContent;
}

const BannerBlock: React.FC<BannerBlockProps> = ({ data }) => {
    const { content, bannerStyle, urgencyConfig } = data;

    if (!bannerStyle) return null;

    const containerStyle: React.CSSProperties = {
        height: bannerStyle.height || '300px',
        backgroundColor: bannerStyle.backgroundColor || '#f3f4f6',
        color: bannerStyle.textColor || '#000000',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: bannerStyle.textAlign === 'center' ? 'center' : bannerStyle.textAlign === 'right' ? 'flex-end' : 'flex-start',
        padding: bannerStyle.padding || '2rem',
        overflow: 'hidden',
    };

    const textStyle: React.CSSProperties = {
        fontSize: bannerStyle.fontSize || '1.5rem',
        fontWeight: bannerStyle.fontWeight === '700' ? 'bold' : 'normal',
        position: 'relative',
        zIndex: 10,
        whiteSpace: 'pre-wrap', // Allow line breaks
        textAlign: bannerStyle.textAlign,
    };

    return (
        <div style={containerStyle} className="w-full">
            {/* Background Image Layer */}
            {bannerStyle.backgroundImage && (
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${bannerStyle.backgroundImage})`,
                        opacity: bannerStyle.overlayOpacity ?? 0.5
                    }}
                />
            )}

            {/* Content Layer */}
            <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-4">
                {/* Main Text */}
                <div style={textStyle}>
                    {content}
                </div>

                {/* Urgency Modules */}
                {urgencyConfig && (
                    <div className="mt-4 flex flex-col gap-3 items-center">
                        {urgencyConfig.showCountdown && urgencyConfig.countdownTarget && (
                            <CountdownTimer
                                targetDate={urgencyConfig.countdownTarget}
                                label={urgencyConfig.countdownLabel}
                                expiredMessage={urgencyConfig.countdownExpiredMessage}
                                style={urgencyConfig.timerStyle}
                            />
                        )}

                        {urgencyConfig.showTicker && (
                            <>
                                {(urgencyConfig.tickerConfig?.mode === 'vertical_list' || urgencyConfig.tickerType === 'vertical_list') ? (
                                    <ApplicantList
                                        title={urgencyConfig.tickerConfig?.listTitle || urgencyConfig.listTitle}
                                        columns={urgencyConfig.tickerConfig?.columns || (urgencyConfig.listColumns as any) || []}
                                        config={{
                                            ...urgencyConfig.tickerConfig,
                                            // Fallback for legacy global speed if not in config
                                            scrollSpeed: urgencyConfig.tickerConfig?.scrollSpeed || urgencyConfig.scrollSpeed
                                        }}
                                    />
                                ) : (
                                    <ApplicantTicker
                                        messageTemplate={urgencyConfig.tickerMessage}
                                    />
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BannerBlock;
