import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BarChart2, Filter, Calendar as CalendarIcon, X, PieChart, TrendingUp } from 'lucide-react';
import { fetchVisits, fetchLeads, fetchLandingConfigs } from '../../services/googleSheetService';
import { VisitData, LeadData, LandingConfig } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrafficStats: React.FC = () => {
    const [visits, setVisits] = useState<VisitData[]>([]);
    const [leads, setLeads] = useState<LeadData[]>([]);
    const [configs, setConfigs] = useState<LandingConfig[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters state
    const [selectedLandingId, setSelectedLandingId] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // 'YYYY-MM-DD'
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'overview' | 'marketing'>('overview'); // New Tab State

    const loadData = async () => {
        setLoading(true);
        const [vData, lData, cData] = await Promise.all([fetchVisits(), fetchLeads(), fetchLandingConfigs()]);
        setVisits(vData);
        setLeads(lData);
        setConfigs(cData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Helper: Get Title
    const getPageTitle = (id: string) => {
        const config = configs.find(c => String(c.id) === String(id));
        return config ? config.title : `(ID: ${id})`;
    };

    // Derived state: Unique Landing IDs
    const uniqueLandingOptions = useMemo(() => {
        const ids = new Set(visits.map(v => v['Landing ID']));
        return Array.from(ids).sort().map(id => ({
            id: String(id),
            title: getPageTitle(String(id))
        }));
    }, [visits, configs]);

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
            let min = 0;
            let sec = 0;
            if (numbers.length >= 4) hour = parseInt(numbers[3], 10);
            if (numbers.length >= 5) min = parseInt(numbers[4], 10);
            if (numbers.length >= 6) sec = parseInt(numbers[5], 10);

            if (isPM && hour < 12) hour += 12;
            if (isAM && hour === 12) hour = 0;

            return new Date(year, month, day, hour, min, sec).getTime();
        } catch (e) { return 0; }
    };

    // --- Process Data for Chart & Stats ---
    // Logic: 
    // 1. Filter raw data by Landing ID
    // 2. If Date Selected -> Buckets = 0~23 Hours
    // 3. If No Date -> Buckets = Last 7 Days
    const chartData = useMemo(() => {
        let filteredVisits = visits;
        let filteredLeads = leads;

        // 1. Filter by Landing ID
        if (selectedLandingId !== 'all') {
            filteredVisits = visits.filter(v => String(v['Landing ID']) === selectedLandingId);
            filteredLeads = leads.filter(l => String(l['Landing ID']) === selectedLandingId);
        }

        // 2. Determine Mode (Hourly vs Daily)
        const result: any[] = [];

        if (selectedDate) {
            // --- HOURLY MODE (Specific Date) ---
            // Create 00~23 buckets
            for (let i = 0; i < 24; i++) {
                const hourLabel = `${String(i).padStart(2, '0')}시`;
                result.push({
                    key: i, // hour integer
                    display: hourLabel,
                    visits: 0,
                    leads: 0,
                    pc: 0,
                    mobile: 0
                });
            }

            // Fill Visits
            filteredVisits.forEach(v => {
                const time = parseKoreanDate(v.Timestamp);
                if (!time) return;

                const d = new Date(time);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${day}`;

                if (dateStr === selectedDate) {
                    const h = d.getHours();
                    const target = result.find(r => r.key === h);
                    if (target) {
                        target.visits += 1;
                        if (v.Device === 'PC') target.pc += 1;
                        else target.mobile += 1;
                    }
                }
            });

            // Fill Leads
            filteredLeads.forEach(l => {
                const time = parseKoreanDate(l.timestamp || l['Timestamp']);
                if (!time) return;

                const d = new Date(time);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${day}`;

                if (dateStr === selectedDate) {
                    const h = d.getHours();
                    const target = result.find(r => r.key === h);
                    if (target) target.leads += 1;
                }
            });

        } else {
            // --- DAILY MODE (Last 7 Days) ---
            const today = new Date(); // Browser time
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${day}`;
                const displayStr = `${m}.${day}`;

                result.push({
                    key: dateStr,
                    display: displayStr,
                    visits: 0,
                    leads: 0,
                    pc: 0,
                    mobile: 0
                });
            }

            // Fill Visits
            filteredVisits.forEach(v => {
                const time = parseKoreanDate(v.Timestamp);
                if (!time) return;

                const d = new Date(time);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${day}`;

                const target = result.find(r => r.key === dateStr);
                if (target) {
                    target.visits += 1;
                    if (v.Device === 'PC') target.pc += 1;
                    else target.mobile += 1;
                }
            });

            // Fill Leads
            filteredLeads.forEach(l => {
                const time = parseKoreanDate(l.timestamp || l['Timestamp']);
                if (!time) return;

                const d = new Date(time);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${day}`;

                const target = result.find(r => r.key === dateStr);
                if (target) target.leads += 1;
            });
        }

        return result;
    }, [visits, leads, selectedLandingId, selectedDate]);


    // --- UTM Statistics Logic ---
    const utmStats = useMemo(() => {
        // Filter filteredVisits/Leads based on selectedLandingId etc (Re-using filtering logic?)
        // Actually, chartData logic computed filters inside. We should extract filtering logic.
        let vList = visits;
        let lList = leads;

        if (selectedLandingId !== 'all') {
            vList = visits.filter(v => String(v['Landing ID']) === selectedLandingId);
            lList = leads.filter(l => String(l['Landing ID']) === selectedLandingId);
        }

        // Filter by Date (if selected)
        if (selectedDate) {
            // Very basic date filtering based on string match for now
            // v.Timestamp format check needed? Google Sheet usually returns "YYYY-MM-DD ..." or similar.
            // But parseKoreanDate handles it.
            vList = vList.filter(v => {
                const t = parseKoreanDate(v.Timestamp);
                if (!t) return false;
                const d = new Date(t);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                return dateStr === selectedDate;
            });
            lList = lList.filter(l => {
                const t = parseKoreanDate(l.timestamp || l['Timestamp']);
                if (!t) return false;
                const d = new Date(t);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                return dateStr === selectedDate;
            });
        } else {
            // Last 7 days filter? chartData does it.
            // For consistency, let's just use ALL data if no date selected, OR Apply 7 days range?
            // Usually overview table implies range.
            // Let's filter to last 30 days for UTM stats default? Or All Time?
            // Users usually want All Time or controlled range.
            // Since we only passed "Last 7 days" to Chart, maybe we should respect that range context?
            // But existing code only filters "Daily Mode (Last 7 Days)" FOR THE CHART buckets.
            // The raw data `visits` is fetched from Sheet (which usually has ALL rows).
            // Let's Default to "All Time" if no date selected, but maybe limit to prevent huge calc?
            // For now, All Time if no date selected, to show full history.
        }

        const stats: Record<string, {
            id: string, source: string, medium: string, campaign: string, term: string, content: string,
            visits: number, leads: number
        }> = {};

        // Aggregate Visits
        vList.forEach(v => {
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
        lList.forEach(l => {
            const source = l.utm_source || '(direct)';
            const medium = l.utm_medium || '-';
            const campaign = l.utm_campaign || '-';
            const term = l.utm_term || '-';
            const content = l.utm_content || '-';
            const key = `${source}|${medium}|${campaign}|${term}|${content}`;

            if (!stats[key]) {
                // If lead exists but no visit logged (e.g. tracking block), we still count it
                stats[key] = { id: key, source, medium, campaign, term, content, visits: 0, leads: 0 };
            }
            stats[key].leads++;
        });

        return Object.values(stats).sort((a, b) => b.leads - a.leads || b.visits - a.visits);
    }, [visits, leads, selectedLandingId, selectedDate]);

    const totalVisits = chartData.reduce((acc, cur) => acc + cur.visits, 0);
    const totalLeads = chartData.reduce((acc, cur) => acc + cur.leads, 0);
    const conversionRate = totalVisits > 0 ? ((totalLeads / totalVisits) * 100).toFixed(1) : '0';


    // --- Calendar Helpers ---
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;

            days.push(
                <button
                    key={d}
                    onClick={() => { setSelectedDate(isSelected ? null : dateStr); setShowCalendar(false); }}
                    className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center relative
                    ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}
                `}
                >
                    {d}
                </button>
            );
        }
        return days;
    };
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-xl font-bold">
                        접속 통계 ({selectedDate ? `${selectedDate} (시간별)` : '최근 7일'})
                    </h1>
                </div>
                <button onClick={loadData} className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-bold">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    새로고침
                </button>
            </header>

            <main className="max-w-7xl mx-auto p-8">

                {/* Filters & Controls */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-wrap items-center gap-4 shadow-sm relative">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-bold text-gray-700">필터:</span>
                    </div>

                    <select
                        value={selectedLandingId}
                        onChange={(e) => setSelectedLandingId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">전체 랜딩페이지</option>
                        {uniqueLandingOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.title} ({opt.id})</option>
                        ))}
                    </select>

                    {/* Calendar Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${selectedDate ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'border-gray-300 text-gray-700'}`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            {selectedDate || '날짜 선택 (7일/일간)'}
                            {selectedDate && (
                                <X
                                    className="w-3 h-3 hover:text-red-500"
                                    onClick={(e) => { e.stopPropagation(); setSelectedDate(null); }}
                                />
                            )}
                        </button>

                        {/* Dropdown Calendar */}
                        {showCalendar && (
                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 w-64 animate-fade-in">
                                <div className="flex justify-between items-center mb-4">
                                    <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">&lt;</button>
                                    <span className="text-sm font-bold">
                                        {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                                    </span>
                                    <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">&gt;</button>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                    {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                                        <div key={d} className="text-xs text-gray-400 font-bold">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {renderCalendar()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-6 border-b border-gray-200 mb-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-2 text-sm font-bold transition-colors relative ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        기본 통계 (Dashboard)
                    </button>
                    <button
                        onClick={() => setActiveTab('marketing')}
                        className={`pb-3 px-2 text-sm font-bold transition-colors relative ${activeTab === 'marketing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        마케팅 분석 (UTM Stats)
                    </button>
                </div>

                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <div className="animate-fade-in">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-gray-500 text-sm font-bold mb-1">
                                    총 방문자 ({selectedDate ? '선택일' : '최근 7일'})
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{totalVisits}명</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-gray-500 text-sm font-bold mb-1">
                                    총 접수 ({selectedDate ? '선택일' : '최근 7일'})
                                </div>
                                <div className="text-3xl font-bold text-blue-600">{totalLeads}건</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-gray-500 text-sm font-bold mb-1">전환율</div>
                                <div className="text-3xl font-bold text-green-600">{conversionRate}%</div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8 h-[400px]">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-gray-500" />
                                {selectedDate ? '시간대별 방문 및 접수 현황' : '일별 방문 및 접수 현황'}
                            </h3>
                            <ResponsiveContainer width="100%" height="85%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="display" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="visits" name="방문수" stroke="#94a3b8" strokeWidth={2} activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="pc" name="PC 유입" stroke="#0ea5e9" strokeWidth={2} />
                                    <Line type="monotone" dataKey="mobile" name="모바일 유입" stroke="#f97316" strokeWidth={2} />
                                    <Line type="monotone" dataKey="leads" name="접수(DB)" stroke="#22c55e" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                    </div>

                )}

                {/* --- MARKETING TAB --- */}
                {activeTab === 'marketing' && (
                    <div className="animate-fade-in space-y-8">
                        {/* Summary Cards */}
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

                        {/* UTM Breakdown Table */}
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
                            (예: <code className="bg-white px-1 py-0.5 rounded border">?utm_source=instagtram&utm_medium=sns</code>)
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default TrafficStats;