import React, { useMemo } from 'react';
import { VisitData, LeadData } from '../../../types';
import { TrendingUp } from 'lucide-react';

interface Props {
    visits: VisitData[];
    leads: LeadData[];
}

const MarketingStats: React.FC<Props> = ({ visits, leads }) => {

    // Helper: Parse Date (if needed for internal filtering, but assuming visits/leads passed are already filtered by parent if needed)
    // Actually parent handles date filtering, so 'visits' prop contains only relevant data?
    // Parent logic: "If date selected, pass filtered visits". Yes, that's better design.

    const utmStats = useMemo(() => {
        const stats: Record<string, {
            id: string, source: string, medium: string, campaign: string, term: string, content: string,
            visits: number, leads: number
        }> = {};

        // Aggregate Visits
        visits.forEach(v => {
            const source = v.utm_source || '(direct)';
            const medium = v.utm_medium || '-';
            const campaign = v.utm_campaign || '-';
            const term = v.utm_term || '-';
            const content = v.utm_content || '-';
            const key = `${source}|${medium}|${campaign}|${term}|${content}`;

            if (!stats[key]) {
                stats[key] = { id: key, source, medium, campaign, term, content, visits: 0, leads: 0 };
            }
            stats[key].visits++;
        });

        // Aggregate Leads
        leads.forEach(l => {
            const source = l.utm_source || '(direct)';
            const medium = l.utm_medium || '-';
            const campaign = l.utm_campaign || '-';
            const term = l.utm_term || '-';
            const content = l.utm_content || '-';
            const key = `${source}|${medium}|${campaign}|${term}|${content}`;

            if (!stats[key]) {
                stats[key] = { id: key, source, medium, campaign, term, content, visits: 0, leads: 0 };
            }
            stats[key].leads++;
        });

        return Object.values(stats).sort((a, b) => b.leads - a.leads || b.visits - a.visits);
    }, [visits, leads]);

    const totalVisits = visits.length;
    const totalLeads = leads.length;

    return (
        <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-xs font-bold mb-1">UTM 추적 방문</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {utmStats.reduce((acc, s) => s.source !== '(direct)' ? acc + s.visits : acc, 0).toLocaleString()}
                        <span className="text-xs text-gray-400 font-normal ml-1">/ {totalVisits.toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-xs font-bold mb-1">마케팅 전환 (Leads)</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {utmStats.reduce((acc, s) => s.source !== '(direct)' ? acc + s.leads : acc, 0).toLocaleString()}
                        <span className="text-xs text-gray-400 font-normal ml-1">건</span>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        캠페인 상세 분석
                    </h3>
                    <div className="text-xs text-gray-400">전환수(DB) 기준 내림차순 정렬</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Source (출처)</th>
                                <th className="px-6 py-3">Medium (매체)</th>
                                <th className="px-6 py-3">Campaign</th>
                                <th className="px-6 py-3 text-right text-gray-400">방문수</th>
                                <th className="px-6 py-3 text-right font-bold text-blue-600">전환수(DB)</th>
                                <th className="px-6 py-3 text-right">전환율</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {utmStats.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        데이터가 없습니다. (기간을 조정하거나 UTM 설정을 확인하세요)
                                    </td>
                                </tr>
                            ) : (
                                utmStats.map((stat, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            {stat.source === '(direct)' ? (
                                                <span className="text-gray-400 font-normal italic">(직접 유입)</span>
                                            ) : (
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100">{stat.source}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{stat.medium}</td>
                                        <td className="px-6 py-3 text-gray-600">
                                            {stat.campaign !== '-' && <div className="font-medium">{stat.campaign}</div>}
                                            {stat.term !== '-' && <div className="text-xs text-gray-400">Term: {stat.term}</div>}
                                        </td>
                                        <td className="px-6 py-3 text-right">{stat.visits.toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right font-bold text-blue-600">{stat.leads.toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right text-gray-600">
                                            {stat.visits > 0 ? ((stat.leads / stat.visits) * 100).toFixed(1) : '0'}%
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-700">
                <strong>💡 팁:</strong> UTM 파라미터가 포함된 링크로 유입된 경우에만 이곳에 집계됩니다.
                (예: <code className="bg-white px-1 py-0.5 rounded border">?utm_source=instagram&utm_medium=sns</code>)
            </div>
        </div>
    );
};

export default MarketingStats;
