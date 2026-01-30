/**
 * 애니메이션 유틸리티 컴포넌트
 * - CountUp: 숫자 카운트업 애니메이션
 * - GlowingCard: 글로우 효과가 있는 카드
 * - AnimatedProgress: 웨이브 애니메이션 프로그레스 바
 * - DonutChart: 원형 도넛 차트
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';

// ============================================
// CountUp - 숫자 카운트업 애니메이션
// ============================================
interface CountUpProps {
    end: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    delay?: number;
    className?: string;
    formatter?: (value: number) => string;
}

export const CountUp: React.FC<CountUpProps> = ({
    end,
    duration = 2,
    prefix = '',
    suffix = '',
    decimals = 0,
    delay = 0,
    className = '',
    formatter
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
    const display = useTransform(spring, (current) => {
        if (formatter) return formatter(Math.floor(current));
        return current.toFixed(decimals);
    });
    const [displayValue, setDisplayValue] = useState('0');

    useEffect(() => {
        if (isInView) {
            const timeout = setTimeout(() => {
                spring.set(end);
            }, delay * 1000);
            return () => clearTimeout(timeout);
        }
    }, [isInView, end, spring, delay]);

    useEffect(() => {
        return display.on('change', (latest) => {
            setDisplayValue(latest);
        });
    }, [display]);

    return (
        <span ref={ref} className={className}>
            {prefix}{displayValue}{suffix}
        </span>
    );
};

// ============================================
// GlowingCard - 글로우 효과 카드
// ============================================
interface GlowingCardProps {
    children: React.ReactNode;
    glowColor?: string;
    className?: string;
    delay?: number;
    hoverScale?: number;
}

export const GlowingCard: React.FC<GlowingCardProps> = ({
    children,
    glowColor = 'cyan',
    className = '',
    delay = 0,
    hoverScale = 1.02
}) => {
    const glowColors: Record<string, string> = {
        cyan: 'shadow-cyan-500/20 hover:shadow-cyan-500/40',
        green: 'shadow-green-500/20 hover:shadow-green-500/40',
        purple: 'shadow-purple-500/20 hover:shadow-purple-500/40',
        blue: 'shadow-blue-500/20 hover:shadow-blue-500/40',
        yellow: 'shadow-yellow-500/20 hover:shadow-yellow-500/40',
        red: 'shadow-red-500/20 hover:shadow-red-500/40',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, duration: 0.5, ease: 'easeOut' }}
            whileHover={{
                scale: hoverScale,
                rotateX: 2,
                rotateY: 2,
            }}
            className={`
                relative overflow-hidden rounded-2xl
                bg-gradient-to-br from-slate-800/80 to-slate-900/80
                backdrop-blur-xl border border-slate-700/50
                shadow-xl ${glowColors[glowColor] || glowColors.cyan}
                transition-shadow duration-500
                ${className}
            `}
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Shimmer effect */}
            <motion.div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)',
                }}
                animate={{
                    x: ['-100%', '200%'],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: 'easeInOut',
                }}
            />
            {children}
        </motion.div>
    );
};

// ============================================
// AnimatedProgress - 웨이브 애니메이션 프로그레스
// ============================================
interface AnimatedProgressProps {
    value: number;
    maxValue?: number;
    height?: number;
    colorFrom?: string;
    colorTo?: string;
    delay?: number;
    showValue?: boolean;
    label?: string;
    className?: string;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
    value,
    maxValue = 100,
    height = 12,
    colorFrom = '#06b6d4',
    colorTo = '#3b82f6',
    delay = 0,
    showValue = false,
    label,
    className = ''
}) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true });

    return (
        <div ref={ref} className={className}>
            {label && (
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">{label}</span>
                    {showValue && <span className="text-slate-300">{value}%</span>}
                </div>
            )}
            <div
                className="relative rounded-full overflow-hidden bg-slate-700/50"
                style={{ height }}
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
                    transition={{ delay, duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                        background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
                    }}
                >
                    {/* Wave animation overlay */}
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                            backgroundSize: '200% 100%',
                        }}
                        animate={{
                            backgroundPosition: ['100% 0%', '-100% 0%'],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                    {/* Glow effect at the end */}
                    <motion.div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                        style={{
                            background: colorTo,
                            boxShadow: `0 0 10px ${colorTo}, 0 0 20px ${colorTo}`,
                        }}
                        animate={{
                            opacity: [0.5, 1, 0.5],
                            scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                </motion.div>
            </div>
        </div>
    );
};

// ============================================
// DonutChart - 원형 도넛 차트
// ============================================
interface DonutChartProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    colorFrom?: string;
    colorTo?: string;
    delay?: number;
    label?: string;
    sublabel?: string;
    className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
    percentage,
    size = 120,
    strokeWidth = 10,
    colorFrom = '#06b6d4',
    colorTo = '#10b981',
    delay = 0,
    label,
    sublabel,
    className = ''
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const ref = useRef<SVGSVGElement>(null);
    const isInView = useInView(ref, { once: true });

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg
                ref={ref}
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                <defs>
                    <linearGradient id={`donut-gradient-${percentage}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colorFrom} />
                        <stop offset="100%" stopColor={colorTo} />
                    </linearGradient>
                </defs>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(100, 116, 139, 0.3)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#donut-gradient-${percentage})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={isInView ? {
                        strokeDashoffset: circumference - (percentage / 100) * circumference
                    } : { strokeDashoffset: circumference }}
                    transition={{ delay, duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
                    style={{
                        filter: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.5))',
                    }}
                />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                    transition={{ delay: delay + 0.5, duration: 0.5 }}
                    className="text-2xl font-bold text-white"
                >
                    {percentage}%
                </motion.span>
                {label && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ delay: delay + 0.7, duration: 0.3 }}
                        className="text-xs text-slate-400"
                    >
                        {label}
                    </motion.span>
                )}
                {sublabel && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ delay: delay + 0.8, duration: 0.3 }}
                        className="text-[10px] text-slate-500"
                    >
                        {sublabel}
                    </motion.span>
                )}
            </div>
        </div>
    );
};

// ============================================
// PulsingBadge - 펄스 효과 배지
// ============================================
interface PulsingBadgeProps {
    children: React.ReactNode;
    color?: 'green' | 'yellow' | 'red' | 'cyan';
    className?: string;
}

export const PulsingBadge: React.FC<PulsingBadgeProps> = ({
    children,
    color = 'cyan',
    className = ''
}) => {
    const colorConfig = {
        green: {
            bg: 'from-green-500/20 to-green-600/10',
            border: 'border-green-500/50',
            text: 'text-green-400',
            glow: 'rgba(34, 197, 94, 0.4)',
        },
        yellow: {
            bg: 'from-yellow-500/20 to-yellow-600/10',
            border: 'border-yellow-500/50',
            text: 'text-yellow-400',
            glow: 'rgba(234, 179, 8, 0.4)',
        },
        red: {
            bg: 'from-red-500/20 to-red-600/10',
            border: 'border-red-500/50',
            text: 'text-red-400',
            glow: 'rgba(239, 68, 68, 0.4)',
        },
        cyan: {
            bg: 'from-cyan-500/20 to-cyan-600/10',
            border: 'border-cyan-500/50',
            text: 'text-cyan-400',
            glow: 'rgba(6, 182, 212, 0.4)',
        },
    };

    const config = colorConfig[color];

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
            className={`
                relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                border ${config.border} bg-gradient-to-r ${config.bg} ${config.text}
                font-bold text-sm
                ${className}
            `}
        >
            {/* Pulse ring */}
            <motion.div
                className={`absolute inset-0 rounded-full border ${config.border}`}
                animate={{
                    scale: [1, 1.3, 1.3],
                    opacity: [0.5, 0, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                }}
            />
            {/* Glow effect */}
            <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                    boxShadow: [
                        `0 0 20px ${config.glow}`,
                        `0 0 40px ${config.glow}`,
                        `0 0 20px ${config.glow}`,
                    ],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <span className="relative z-10">{children}</span>
        </motion.div>
    );
};

// ============================================
// GradientButton - 그라데이션 애니메이션 버튼
// ============================================
interface GradientButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    delay?: number;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
    children,
    onClick,
    className = '',
    delay = 0
}) => {
    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
                relative w-full py-4 rounded-xl font-bold text-white
                overflow-hidden
                ${className}
            `}
        >
            {/* Animated gradient background */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6, #3b82f6, #06b6d4)',
                    backgroundSize: '300% 100%',
                }}
                animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
            {/* Shimmer overlay */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                }}
                animate={{
                    x: ['-100%', '200%'],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: 'easeInOut',
                }}
            />
            {/* Shadow glow */}
            <motion.div
                className="absolute inset-0 rounded-xl"
                animate={{
                    boxShadow: [
                        '0 10px 40px rgba(6, 182, 212, 0.3)',
                        '0 10px 60px rgba(59, 130, 246, 0.4)',
                        '0 10px 40px rgba(6, 182, 212, 0.3)',
                    ],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>
        </motion.button>
    );
};

// ============================================
// StaggerContainer - 순차 등장 컨테이너
// ============================================
interface StaggerContainerProps {
    children: React.ReactNode;
    staggerDelay?: number;
    className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
    children,
    staggerDelay = 0.1,
    className = ''
}) => {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = ''
}) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
