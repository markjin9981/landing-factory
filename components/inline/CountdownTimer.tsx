
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
        labelPosition?: 'top' | 'left';
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

    const customContainerStyle: React.CSSProperties = {
        color: style?.textColor || '#dc2626', // red-600 default
        backgroundColor: style?.backgroundColor || 'rgba(220, 38, 38, 0.1)', // red-600/10 default
        borderColor: style?.textColor || '#ef4444',
        borderRadius: style?.borderRadius || '0.75rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: style?.labelPosition === 'top' ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center content in both axes
        gap: style?.labelPosition === 'top' ? '0.5rem' : '1rem',
    };

    // Label Style
    const labelStyle: React.CSSProperties = {
        fontSize: style?.labelFontSize || '0.875rem',
        color: style?.labelColor || (style?.textColor || '#dc2626'),
        fontWeight: (style?.labelFontWeight as any) || 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
    };

    // Derived text color for numbers
    const numberStyle: React.CSSProperties = {
        color: style?.textColor || '#dc2626'
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
        <div style={customContainerStyle} className="border rounded-xl animate-fade-in shadow-lg backdrop-blur-sm">
            {label && (
                <div style={labelStyle}>
                    <Clock className="w-3 h-3" /> {label}
                </div>
            )}
            <div className={`flex gap-2 font-black tabular-nums tracking-tighter ${fontSizeClass}`} style={numberStyle}>
                <div className="flex flex-col items-center">
                    <span className="bg-white/80 px-2 py-1 rounded shadow-sm min-w-[2ch] text-center text-gray-900">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="text-[10px] font-normal mt-1 opacity-70">일</span>
                </div>
                <span className="self-start py-1">:</span>
                <div className="flex flex-col items-center">
                    <span className="bg-white/80 px-2 py-1 rounded shadow-sm min-w-[2ch] text-center text-gray-900">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[10px] font-normal mt-1 opacity-70">시간</span>
                </div>
                <span className="self-start py-1">:</span>
                <div className="flex flex-col items-center">
                    <span className="bg-white/80 px-2 py-1 rounded shadow-sm min-w-[2ch] text-center text-gray-900">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-[10px] font-normal mt-1 opacity-70">분</span>
                </div>
                <span className="self-start py-1">:</span>
                <div className="flex flex-col items-center">
                    <span className="bg-white/80 px-2 py-1 rounded shadow-sm min-w-[2ch] text-center text-gray-900">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-[10px] font-normal mt-1 opacity-70">초</span>
                </div>
            </div>
        </div>
    );
};

export default CountdownTimer;
