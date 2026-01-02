
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
    targetDate: string; // ISO string
    label?: string;
    expiredMessage?: string;
    style?: {
        fontSize?: string;
        textColor?: string;
        backgroundColor?: string;
        borderRadius?: string;
        // V2 Labels
        labelFontSize?: string;
        labelColor?: string;
        labelFontWeight?: string;
        labelPosition?: 'top' | 'left' | 'bottom' | 'right'; // V3: Expanded
        // V3: New Fields
        digitColor?: string;
        isTransparent?: boolean;
        labelFontFamily?: string;
    };
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, label = "마감까지 남은 시간", expiredMessage = "이벤트가 종료되었습니다.", style }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
                setIsExpired(false);
            } else {
                setTimeLeft(null);
                setIsExpired(true);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    // Style Mappings
    const fontSizeClass = (() => {
        switch (style?.fontSize) {
            case 'sm': return 'text-xl md:text-2xl';
            case 'md': return 'text-2xl md:text-3xl';
            case 'lg': return 'text-4xl md:text-5xl';
            case 'xl': return 'text-5xl md:text-6xl';
            default: return 'text-2xl md:text-3xl';
        }
    })();

    // V3: Flex Direction Logic
    const getFlexDirection = () => {
        switch (style?.labelPosition) {
            case 'top': return 'column';
            case 'bottom': return 'column-reverse';
            case 'right': return 'row-reverse';
            default: return 'row'; // left (default)
        }
    };

    const customContainerStyle: React.CSSProperties = {
        color: style?.textColor || '#dc2626', // red-600 default
        backgroundColor: style?.isTransparent ? 'transparent' : (style?.backgroundColor || 'rgba(220, 38, 38, 0.1)'),
        borderColor: style?.isTransparent ? 'transparent' : (style?.textColor || '#ef4444'),
        borderRadius: style?.borderRadius || '0.75rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: getFlexDirection(),
        alignItems: 'center',
        justifyContent: 'center',
        gap: (style?.labelPosition === 'top' || style?.labelPosition === 'bottom') ? '0.5rem' : '1rem',
        borderWidth: style?.isTransparent ? 0 : '1px',
        borderStyle: 'solid',
    };

    // Label Style
    const labelStyle: React.CSSProperties = {
        fontSize: style?.labelFontSize || '0.875rem',
        color: style?.labelColor || (style?.textColor || '#dc2626'),
        fontWeight: (style?.labelFontWeight as any) || 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontFamily: style?.labelFontFamily
    };

    // V3: Digit Color Control
    const digitStyle: React.CSSProperties = {
        color: style?.digitColor || '#111827', // gray-900 default
    };

    if (isExpired) {
        return (
            <div className="bg-gray-800 text-white p-3 rounded-lg text-center font-bold animate-pulse">
                {expiredMessage}
            </div>
        );
    }

    if (!timeLeft) return null;

    return (
        <div style={customContainerStyle} className={`rounded-xl animate-fade-in ${style?.isTransparent ? '' : 'border shadow-lg backdrop-blur-sm'}`}>
            {label && (
                <div style={labelStyle}>
                    <Clock className="w-3 h-3" /> {label}
                </div>
            )}
            <div className={`flex gap-2 font-black tabular-nums tracking-tighter ${fontSizeClass}`}>
                <div className="flex flex-col items-center">
                    <span
                        className={`px-2 py-1 rounded shadow-sm min-w-[2ch] text-center ${style?.isTransparent ? '' : 'bg-white/80'}`}
                        style={digitStyle}
                    >
                        {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-normal mt-1 opacity-70 tracking-widest">일</span>
                </div>
                <span className="self-start py-1" style={digitStyle}>:</span>
                <div className="flex flex-col items-center">
                    <span
                        className={`px-2 py-1 rounded shadow-sm min-w-[2ch] text-center ${style?.isTransparent ? '' : 'bg-white/80'}`}
                        style={digitStyle}
                    >
                        {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-normal mt-1 opacity-70 tracking-widest">시간</span>
                </div>
                <span className="self-start py-1" style={digitStyle}>:</span>
                <div className="flex flex-col items-center">
                    <span
                        className={`px-2 py-1 rounded shadow-sm min-w-[2ch] text-center ${style?.isTransparent ? '' : 'bg-white/80'}`}
                        style={digitStyle}
                    >
                        {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-normal mt-1 opacity-70 tracking-widest">분</span>
                </div>
                <span className="self-start py-1" style={digitStyle}>:</span>
                <div className="flex flex-col items-center">
                    <span
                        className={`px-2 py-1 rounded shadow-sm min-w-[2ch] text-center ${style?.isTransparent ? '' : 'bg-white/80'}`}
                        style={digitStyle}
                    >
                        {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-normal mt-1 opacity-70 tracking-widest">초</span>
                </div>
            </div>
        </div>
    );
};

export default CountdownTimer;
