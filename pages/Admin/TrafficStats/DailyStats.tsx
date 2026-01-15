import React, { useMemo } from 'react';
import { VisitData, LeadData } from '../../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
    visits: VisitData[];
    leads: LeadData[];
}

const DailyStats: React.FC<Props> = ({ visits, leads }) => {

    // Helper: Parse Korean Date
    const parseKoreanDate = (dateStr: string) => {
        if (!dateStr || typeof dateStr !== 'string') return 0;
        const standard = new Date(dateStr).getTime();
        if (!isNaN(standard)) return standard;

        try {
            const isPM = dateStr.includes('오후') || dateStr.toLowerCase().includes('pm');
            const isAM = dateStr.includes('오전') || dateStr.toLowerCase().includes('am');
            const numbers = dateStr.match(/\d+/g);
            if (!numbers || numbers.length < 3) return 0;

            let year = parseInt(numbers[0], 10);
            let month = parseInt(numbers[1], 10) - 1;
            let day = parseInt(numbers[2], 10);
            let hour = 0;
            if (numbers.length >= 4) hour = parseInt(numbers[3], 10);
            if (isPM && hour < 12) hour += 12;
            if (isAM && hour === 12) hour = 0;

            return new Date(year, month, day, hour).getTime();
        } catch (e) { return 0; }
    };

    // Helper: Get Day/Night Type (Day = 09:00 ~ 17:59)
    const getTimeType = (date: Date) => {
        const h = date.getHours();
        return (h >= 9 && h <= 17) ? 'day' : 'night';
    };

    // 1. Process Data by Date
    const dailyData = useMemo(() => {
        const map = new Map<string, {
            date: string,
            visits: {
                day: { total: number, pc: number, mobile: number },
                night: { total: number, pc: number, mobile: number },
                sum: { total: number, pc: number, mobile: number }
            },
            leads: {
                day: { total: number, pc: number, mobile: number },
                night: { total: number, pc: number, mobile: number },
                sum: { total: number, pc: number, mobile: number }
            }
        }>();

        const initBucket = () => ({ total: 0, pc: 0, mobile: 0 });

        // Visits
        visits.forEach(v => {
            const ts = parseKoreanDate(v.Timestamp);
            if (!ts) return;
            const d = new Date(ts);
            const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const timeType = getTimeType(d);
            const isPC = v.Device === 'PC';

            if (!map.has(dateKey)) {
                map.set(dateKey, {
                    date: dateKey,
                    visits: { day: initBucket(), night: initBucket(), sum: initBucket() },
                    leads: { day: initBucket(), night: initBucket(), sum: initBucket() }
                });
            }

            const entry = map.get(dateKey)!;

            // Increment Type Bucket
            entry.visits[timeType].total++;
            if (isPC) entry.visits[timeType].pc++; else entry.visits[timeType].mobile++;

            // Increment Sum Bucket
            entry.visits.sum.total++;
            if (isPC) entry.visits.sum.pc++; else entry.visits.sum.mobile++;
        });

        // Leads
        leads.forEach(l => {
            const ts = parseKoreanDate(l.timestamp || l['Timestamp']);
            if (!ts) return;
            const d = new Date(ts);
            const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const timeType = getTimeType(d);
            // Device info might be separate in Leads depending on implementation, 
            // but usually we join logic or assume mobile if not parsed.
            // Wait, LeadData does NOT strictly have 'Device' field in previous types.ts snippets.
            // Let's check logic. Usually we capture User Agent.
            // For now, let's assume unknown device or try to parse UA if available.
            // If User Agent exists:
            const isPC = l.user_agent ? !/mobile/i.test(l.user_agent) : true; // Fallback

            if (!map.has(dateKey)) {
                map.set(dateKey, {
                    date: dateKey,
                    visits: { day: initBucket(), night: initBucket(), sum: initBucket() },
                    leads: { day: initBucket(), night: initBucket(), sum: initBucket() }
                });
            }

            const entry = map.get(dateKey)!;
            entry.leads[timeType].total++;
            if (isPC) entry.leads[timeType].pc++; else entry.leads[timeType].mobile++;
            entry.leads.sum.total++;
            if (isPC) entry.leads.sum.pc++; else entry.leads.sum.mobile++;
        });

        return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    }, [visits, leads]);

    // Chart Data (Last 10 Days)
    const chartData = useMemo(() => {
        // Reverse for chart (Oldest -> Newest)
        return [...dailyData].slice(0, 10).reverse().map(d => ({
            date: d.date.slice(5).replace('-', '.'), // MM.DD
            visits: d.visits.sum.total,
            pc: d.visits.sum.pc,
            mobile: d.visits.sum.mobile,
            leads: d.leads.sum.total
        }));
    }, [dailyData]);

    // Function to render cell "Total (PC/Mobile)"
    const renderCell = (bucket: { total: number, pc: number, mobile: number }) => (
        <div className="text-center">
            <span className="font-bold text-gray-800">{bucket.total}</span>
            <span className="text-xs text-gray-500 ml-1">({bucket.pc}/{bucket.mobile})</span>
        </div>
    );

    const handleDownloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(dailyData.map(d => ({
            날짜: d.date,
            '방문_전체': d.visits.sum.total,
            '방문_PC': d.visits.sum.pc,
            '방문_모바일': d.visits.sum.mobile,
            '방문_주간': d.visits.day.total,
            '방문_야간': d.visits.night.total,
            '접수_전체': d.leads.sum.total,
            '접수_PC': d.leads.sum.pc,
            '접수_모바일': d.leads.sum.mobile,
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "일별통계");
        XLSX.writeFile(wb, "landing_factory_daily_stats.xlsx");
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Chart Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">일별 통계</h3>
                        <p className="text-sm text-gray-500">랜딩을 접속한 기록과 신청한 데이터를 날짜별로 확인할 수 있습니다.</p>
                    </div>
                    <div className="text-sm font-bold text-gray-700">검색일 기준 최근 10일간 그래프</div>
                </div>

                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend iconType="circle" />
                            <Line type="monotone" dataKey="pc" name="유입(PC)" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="mobile" name="유입(모바일)" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="visits" name="유입(전체)" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="leads" name="접수(전체)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <div className="flex gap-2">
                            {/* Placeholder for Filters if parent doesn't handle them globally. Parent handles them. */}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">주야기준 : 주간(09~17시) 외 야간</span>
                        <button onClick={handleDownloadExcel} className="flex items-center px-3 py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 transition-colors">
                            <Download className="w-3 h-3 mr-1" />
                            엑셀 다운로드
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-white border-b text-center text-xs text-gray-500">
                                <th rowSpan={2} className="px-4 py-3 font-medium bg-gray-50 w-32 border-r">날짜</th>
                                <th colSpan={3} className="px-4 py-2 font-medium border-r border-b">유입 (PC/Mobile)</th>
                                <th colSpan={3} className="px-4 py-2 font-medium border-b">접수 (PC/Mobile)</th>
                                <th rowSpan={2} className="px-4 py-3 font-medium bg-gray-50 border-l w-24">접수율</th>
                            </tr>
                            <tr className="bg-gray-50 text-center text-xs text-gray-500 border-b">
                                <th className="px-4 py-2 font-normal w-32">주간</th>
                                <th className="px-4 py-2 font-normal w-32">야간</th>
                                <th className="px-4 py-2 font-normal w-32 bg-gray-100">합계</th>
                                <th className="px-4 py-2 font-normal w-32">주간</th>
                                <th className="px-4 py-2 font-normal w-32">야간</th>
                                <th className="px-4 py-2 font-normal w-32 bg-gray-100">합계</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {dailyData.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
                            ) : (
                                dailyData.map((row) => (
                                    <tr key={row.date} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-4 py-3 text-center font-medium text-gray-800 bg-gray-50 border-r text-xs">
                                            {row.date}
                                        </td>
                                        {/* Visits */}
                                        <td className="px-4 py-3 border-r">{renderCell(row.visits.day)}</td>
                                        <td className="px-4 py-3 border-r">{renderCell(row.visits.night)}</td>
                                        <td className="px-4 py-3 border-r bg-gray-50/50">{renderCell(row.visits.sum)}</td>
                                        {/* Leads */}
                                        <td className="px-4 py-3 border-r">{renderCell(row.leads.day)}</td>
                                        <td className="px-4 py-3 border-r">{renderCell(row.leads.night)}</td>
                                        <td className="px-4 py-3 bg-gray-50/50">{renderCell(row.leads.sum)}</td>
                                        {/* Rate */}
                                        <td className="px-4 py-3 text-center border-l font-bold text-blue-600 bg-gray-50">
                                            {row.visits.sum.total > 0
                                                ? ((row.leads.sum.total / row.visits.sum.total) * 100).toFixed(1) + '%'
                                                : '0%'
                                            }
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DailyStats;
