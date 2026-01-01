import React from 'react';

interface ApplicantListProps {
    title?: string;
    columns: {
        label: string;
        type: 'name' | 'phone' | 'gender' | 'weight' | 'text';
        masking: boolean;
    }[];
    speed?: number; // seconds
}

// Helper to generate fake data
const generateFakeRow = (columns: ApplicantListProps['columns'], seed: number) => {
    return columns.map(col => {
        // Simple deterministic pseudo-random based on seed
        const rand = (seed * 9301 + 49297) % 233280 / 233280;

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
        if (col.type === 'gender') {
            const gender = rand > 0.5 ? '남' : '여';
            return col.masking ? gender + '*' : gender;
        }
        if (col.type === 'weight') {
            const weight = Math.floor(rand * 40) + 50; // 50-90
            return col.masking ? String(weight).substring(0, 1) + '*' : String(weight);
        }
        return '-';
    });
};

const ApplicantList: React.FC<ApplicantListProps> = ({
    title = "실시간 참여 현황",
    columns = [{ label: '이름', type: 'name', masking: true }, { label: '전화번호', type: 'phone', masking: true }],
    speed = 20
}) => {
    // Generate static list of 20 items to scroll
    const data = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        cells: generateFakeRow(columns, i + Date.now()) // Use Date.now to randomize on load
    }));

    return (
        <div className="w-full bg-white border-2 border-blue-600 rounded-xl overflow-hidden shadow-lg">
            {/* Header */}
            <div className="bg-blue-600 text-white font-bold text-center py-3 text-lg md:text-xl">
                {title}
            </div>

            {/* Table Header */}
            <div className="grid bg-blue-50 border-b border-blue-100 font-bold text-blue-900 text-sm">
                <div className="grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
                    {columns.map((col, idx) => (
                        <div key={idx} className="py-2 text-center border-r border-blue-100 last:border-0">
                            {col.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Scrolling Body */}
            <div className="h-48 overflow-hidden relative bg-white">
                <div
                    className="absolute w-full animate-marquee-vertical"
                    style={{ '--duration': `${speed}s` } as React.CSSProperties}
                >
                    {/* Render Double for infinite loop illusion */}
                    {[...data, ...data].map((row, rowIdx) => (
                        <div key={rowIdx} className="grid border-b border-gray-100 text-sm text-gray-700 hover:bg-gray-50 transition-colors" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
                            {row.cells.map((cell, cellIdx) => (
                                <div key={cellIdx} className="py-2 text-center truncate px-1">
                                    {cell}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* CSS Animation Injection */}
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
