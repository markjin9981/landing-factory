import React, { useMemo } from 'react';
import { VisitData, LeadData } from '../../../types';
import { BarChart2, Smartphone, Monitor, Clock, Calendar, Globe, MousePointer } from 'lucide-react';

interface Props {
    visits: VisitData[];
    leads: LeadData[];
}

const DetailStats: React.FC<Props> = ({ visits, leads }) => {

    const totalVisits = visits.length;
    const totalLeads = leads.length;
    const conversionRate = totalVisits > 0 ? ((totalLeads / totalVisits) * 100).toFixed(1) : '0';

    // Helper: Percent calc
    const getPercent = (val: number, total: number) => total > 0 ? ((val / total) * 100).toFixed(0) + '%' : '0%';

    // Helper: Parse Date (Reused logic - should be util)
    const parseDate = (dStr: string) => {
        try {
            return new Date(dStr); // Ideally use robust parsing
        } catch (e) { return new Date(); }
    };

    // 1. Device Stats
    const deviceStats = useMemo(() => {
        const pc = visits.filter(v => v.Device === 'PC').length;
        const mobile = visits.filter(v => v.Device !== 'PC').length; // Assume non-PC is Mobile
        // Lead Device
        // Leads don't have explicit Device field in interface snippet, assume similar ratio or ignore
        // If we want exact lead source, we need to log it. 
        // For now, let's just show Visit composition as in screenshot.
        return [
            { label: 'PC', count: pc, percent: getPercent(pc, totalVisits) },
            { label: '모바일', count: mobile, percent: getPercent(mobile, totalVisits) }
        ];
    }, [visits]);

    // 2. Weekday Stats
    const weekdayStats = useMemo(() => {
        const counts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        visits.forEach(v => {
            const d = new Date(v.Timestamp);
            if (!isNaN(d.getTime())) counts[d.getDay()]++;
        });
        const labels = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        // Reorder to Mon-Sun? Screenshot has Mon first.
        const orderedIndices = [1, 2, 3, 4, 5, 6, 0];

        return orderedIndices.map(idx => ({
            label: labels[idx],
            count: counts[idx],
            percent: getPercent(counts[idx], totalVisits)
        }));
    }, [visits]);

    // 3. Hourly Stats
    const hourlyStats = useMemo(() => {
        const counts = new Array(24).fill(0);
        visits.forEach(v => {
            const d = new Date(v.Timestamp);
            if (!isNaN(d.getTime())) counts[d.getHours()]++;
        });
        return counts.map((c, i) => ({
            label: `${i}시`,
            count: c,
            percent: getPercent(c, totalVisits)
        }));
    }, [visits]);

    // 4. Browser/Referrer Stats (Simple Top 5)
    // ...

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Description */}
            <div>
                <h3 className="text-lg font-bold text-gray-900">상세 현황</h3>
                <p className="text-sm text-gray-500">랜딩 유입과 접수 현황을 항목별로 확인할 수 있습니다.</p>
            </div>

            {/* Total Stats Cards (Row) */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                <StatCard label="유입수" value={`${totalVisits}건`} color="text-gray-900" />
                <StatCard label="평균 체류 시간" value="-" color="text-gray-400" sub="(집계중)" />
                <StatCard label="체류 시간이 없는 유입" value="-" color="text-gray-400" sub="(0%)" />
                <StatCard label="접수" value={`${totalLeads}건`} color="text-blue-600" />
                <StatCard label="접수율" value={`${conversionRate}%`} color="text-blue-600" />
                <StatCard label="평균 접수 시간" value="-" color="text-gray-400" sub="(집계중)" />
            </div>

            {/* Charts Grid */}
            <h4 className="text-lg font-bold flex items-center gap-2 mt-8 mb-4">
                <BarChart2 className="w-5 h-5" /> 항목별 집계 현황
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Device */}
                <BreakdownTable
                    title="유입기기별"
                    icon={<Smartphone className="w-4 h-4" />}
                    headers={['항목', '유입', '비율']}
                    rows={deviceStats}
                />

                {/* 2. Weekday */}
                <BreakdownTable
                    title="요일별"
                    icon={<Calendar className="w-4 h-4" />}
                    headers={['항목', '유입', '비율']}
                    rows={weekdayStats}
                />

                {/* 3. Hourly */}
                <BreakdownTable
                    title="시간대별"
                    icon={<Clock className="w-4 h-4" />}
                    headers={['항목', '유입', '비율']}
                    rows={hourlyStats}
                />
            </div>

        </div>
    );
};

// Sub-components
const StatCard = ({ label, value, color, sub }: any) => (
    <div className="flex flex-col items-center justify-center py-2 border-r last:border-r-0 border-gray-100">
        <span className="text-xs font-bold text-gray-500 mb-2">{label}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {sub && <span className="text-xs text-gray-400 mt-1">{sub}</span>}
    </div>
);

const BreakdownTable = ({ title, icon, headers, rows }: any) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2 font-bold text-sm text-gray-700">
            {icon} {title}
        </div>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-xs text-center">
                <thead className="text-gray-500 bg-gray-50 border-b">
                    <tr>{headers.map((h: string) => <th key={h} className="py-2">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {rows.map((r: any) => (
                        <tr key={r.label} className="hover:bg-gray-50">
                            <td className="py-2 text-gray-600">{r.label}</td>
                            <td className="py-2 text-gray-800 font-medium">{r.count}건</td>
                            <td className="py-2 text-gray-500">{r.percent}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default DetailStats;
