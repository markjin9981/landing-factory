import React, { useEffect, useState, useRef } from 'react';

interface ApplicantListProps {
    title?: string;
    columns: {
        id: string;
        label: string;
        type: 'name' | 'phone' | 'debt' | 'text' | 'gender' | 'custom';
        isEnabled: boolean;
        masking: boolean;
    }[];
    config?: {
        scrollMode?: 'continuous' | 'random_step';
        scrollSpeed?: number; // for continuous
        randomRange?: [number, number]; // for random_step
        containerStyle?: {
            height?: string;
            backgroundColor?: string;
            borderColor?: string;
            borderRadius?: string;
        };
        fakeDataRules?: {
            debtRange?: [number, number];
        };
    };
    // Legacy support (to be deprecated or mapped)
    speed?: number;
}

// Helper: Korean Currency Formatter
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '만원';
};

// Helper: Generate Fake Data
const generateFakeRow = (columns: ApplicantListProps['columns'], rules: any, seed: number) => {
    return columns.filter(c => c.isEnabled).map(col => {
        // Simple deterministic pseudo-random based on seed + col.id
        const colSeed = seed + col.id.charCodeAt(0);
        const rand = (colSeed * 9301 + 49297) % 233280 / 233280;

        if (col.type === 'name') {
            const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
            const firstNames = ['민수', '서준', '도윤', '예준', '시우', '하준', '지호', '지후', '준서', '준우'];
            const name = lastNames[Math.floor(rand * lastNames.length)] + firstNames[Math.floor((rand * 100) % firstNames.length)];
            return col.masking ? name[0] + '*' + (name.length > 2 ? name.substring(2) : '') : name;
        }
        if (col.type === 'phone') {
            const middle = String(Math.floor(rand * 9000) + 1000);
            const last = String(Math.floor((rand * 100) % 9000) + 1000);
            return col.masking ? `010-****-${last}` : `010-${middle}-${last}`;
        }
        if (col.type === 'debt') {
            const min = rules?.debtRange?.[0] || 1000;
            const max = rules?.debtRange?.[1] || 10000;
            const amount = Math.floor(rand * (max - min)) + min;
            // Round to nearest 100
            const rounded = Math.round(amount / 100) * 100;
            return col.masking ? formatCurrency(rounded).replace(/[0-9]/g, '*') : formatCurrency(rounded);
        }
        if (col.type === 'gender') {
            const gender = rand > 0.5 ? '남' : '여';
            return col.masking ? gender + '*' : gender;
        }
        // Generic Text / Custom
        return '-';
    });
};

const ApplicantList: React.FC<ApplicantListProps> = ({
    title = "실시간 참여 현황",
    columns = [],
    config
}) => {
    const activeColumns = columns.filter(c => c.isEnabled);
    const ROW_HEIGHT = 40; // px, fixed for simplicity
    const VISIBLE_COUNT = 5;

    // Generate static list of 20 items (enough for looping)
    const [data] = useState(() => Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        cells: generateFakeRow(columns, config?.fakeDataRules, i + Date.now())
    })));

    // V2 Logic: Random Step Scroll
    const [scrollTop, setScrollTop] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isContinuous = config?.scrollMode !== 'random_step';

    useEffect(() => {
        if (isContinuous) return;

        let timeoutId: NodeJS.Timeout;

        const step = () => {
            const minDelay = (config?.randomRange?.[0] || 1) * 1000;
            const maxDelay = (config?.randomRange?.[1] || 3) * 1000;
            const delay = Math.random() * (maxDelay - minDelay) + minDelay;

            timeoutId = setTimeout(() => {
                setScrollTop(prev => {
                    const next = prev + ROW_HEIGHT;
                    // Reset seamlessly if needed (simplified infinite scroll for Step Mode)
                    return next >= (data.length * ROW_HEIGHT) ? 0 : next;
                });
                step(); // recursion
            }, delay);
        };

        step();
        return () => clearTimeout(timeoutId);
    }, [config?.randomRange, isContinuous, data.length]);

    // Container Style
    const containerStyle: React.CSSProperties = {
        height: config?.containerStyle?.height || '200px',
        backgroundColor: config?.containerStyle?.backgroundColor || '#ffffff',
        borderColor: config?.containerStyle?.borderColor || '#2563eb', // blue-600
        borderRadius: config?.containerStyle?.borderRadius || '0.75rem',
    };

    return (
        <div style={containerStyle} className="w-full border-2 overflow-hidden shadow-lg flex flex-col">
            {/* Header */}
            {title && (
                <div className="bg-blue-600 text-white font-bold text-center py-3 text-lg md:text-xl shrink-0"
                    style={{ backgroundColor: config?.containerStyle?.borderColor || '#2563eb' }}>
                    {title}
                </div>
            )}

            {/* Table Header */}
            <div className="grid bg-gray-50 border-b border-gray-200 font-bold text-gray-700 text-xs shrink-0">
                <div className="grid" style={{ gridTemplateColumns: `repeat(${activeColumns.length}, 1fr)` }}>
                    {activeColumns.map((col, idx) => (
                        <div key={idx} className="py-2 text-center border-r border-gray-200 last:border-0">
                            {col.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Scrolling Body */}
            <div className="relative overflow-hidden flex-1" style={{ height: '100%' }}>
                {isContinuous ? (
                    // 1. CSS Continuous Mode
                    <div
                        className="absolute w-full animate-marquee-vertical"
                        style={{ '--duration': `${config?.scrollSpeed || 20}s` } as React.CSSProperties}
                    >
                        {[...data, ...data].map((row, rowIdx) => (
                            <div key={rowIdx} className="grid border-b border-gray-100 text-sm text-gray-700 h-[40px] items-center" style={{ gridTemplateColumns: `repeat(${activeColumns.length}, 1fr)` }}>
                                {row.cells.map((cell, cellIdx) => (
                                    <div key={cellIdx} className="text-center truncate px-1">
                                        {cell}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    // 2. JS Random Step Mode
                    <div
                        className="absolute w-full transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateY(-${scrollTop}px)` }}
                    >
                        {/* Render 3 copies to simulate infinite list with resets */}
                        {[...data, ...data, ...data].map((row, rowIdx) => (
                            <div key={rowIdx} className="grid border-b border-gray-100 text-sm text-gray-700 h-[40px] items-center" style={{ gridTemplateColumns: `repeat(${activeColumns.length}, 1fr)` }}>
                                {row.cells.map((cell, cellIdx) => (
                                    <div key={cellIdx} className="text-center truncate px-1">
                                        {cell}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes marquee-vertical {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
                .animate-marquee-vertical {
                    animation: marquee-vertical var(--duration) linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ApplicantList;
