
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
    targetDate: string; // ISO string
    label?: string;
    expiredMessage?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, label = "마감까지 남은 시간", expiredMessage = "이벤트가 종료되었습니다." }) => {
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

    if (isExpired) {
        return (
            <div className="bg-gray-800 text-white p-3 rounded-lg text-center font-bold animate-pulse">
                {expiredMessage}
            </div>
        );
    }

    if (!timeLeft) return null;

    return (
        <div className="flex flex-col items-center justify-center gap-2 p-4 bg-red-600/10 border border-red-500 rounded-xl animate-fade-in shadow-lg backdrop-blur-sm">
            {label && <div className="text-red-600 font-bold text-sm flex items-center gap-1"><Clock className="w-3 h-3" /> {label}</div>}
            <div className="flex gap-2 text-2xl md:text-3xl font-black text-red-600 tabular-nums tracking-tighter">
                <div className="flex flex-col items-center">
                    <span className="bg-white px-2 py-1 rounded shadow-sm min-w-[2ch] text-center">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="text-[10px] font-normal mt-1 text-gray-500">일</span>
                </div>
                <span className="self-start py-1">:</span>
                <div className="flex flex-col items-center">
                    <span className="bg-white px-2 py-1 rounded shadow-sm min-w-[2ch] text-center">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[10px] font-normal mt-1 text-gray-500">시간</span>
                </div>
                <span className="self-start py-1">:</span>
                <div className="flex flex-col items-center">
                    <span className="bg-white px-2 py-1 rounded shadow-sm min-w-[2ch] text-center">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-[10px] font-normal mt-1 text-gray-500">분</span>
                </div>
                <span className="self-start py-1">:</span>
                <div className="flex flex-col items-center">
                    <span className="bg-white px-2 py-1 rounded shadow-sm min-w-[2ch] text-center">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-[10px] font-normal mt-1 text-gray-500">초</span>
                </div>
            </div>
        </div>
    );
};

export default CountdownTimer;
