import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { fetchVisits, fetchLeads, fetchLandingConfigs } from '../../../services/googleSheetService';
import { VisitData, LeadData, LandingConfig } from '../../../types';
import DailyStats from './DailyStats';
import DetailStats from './DetailStats';
import MarketingStats from './MarketingStats';

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

    // Tabs: 'daily' | 'detail' | 'marketing'
    const [activeTab, setActiveTab] = useState<'daily' | 'detail' | 'marketing'>('daily');

    const loadData = async () => {
        setLoading(true);
        try {
            const [vData, lData, cData] = await Promise.all([fetchVisits(), fetchLeads(), fetchLandingConfigs()]);
            setVisits(vData || []);
            setLeads(lData || []);
            setConfigs(cData || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
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

    // Derived state: Filtered Data
    const filteredData = useMemo(() => {
        let fVisits = visits;
        let fLeads = leads;

        // 1. Landing ID Filter
        if (selectedLandingId !== 'all') {
            fVisits = fVisits.filter(v => String(v['Landing ID']) === selectedLandingId);
            fLeads = fLeads.filter(l => String(l['Landing ID']) === selectedLandingId);
        }

        // 2. Date Filter
        if (selectedDate) {
            const parseDateStr = (ts: string) => {
                try {
                    // Reuse robust parsing logic if possible, or simple check
                    // Assuming standard format or reusing previous heuristic
                    // For now, strict 'YYYY-MM-DD' match might be tricky with "2026. 1. 15. 오후 8:55:04" format
                    // We need the parser.
                    // Let's duplicate basic parser for filter
                    const d = new Date(ts);
                    if (isNaN(d.getTime())) return '';
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                } catch { return ''; }
            };

            // Using a simpler substring match if standardized, but let's try to be safe
            // NOTE: This might be weak if Date format varies. 
            // Ideally we pass RAW data to children and children handle filtering?
            // But 'DetailStats' needs filtered data.
            // Let's rely on simple string inclusion check for 'YYYY-MM-DD' if source format is ISO-like,
            // But source is '2026. 1. 15.' usually in Google Sheets.
            // If we really want Robustness, we need the `parseKoreanDate` logic here.

            // Quick fix: Just filter in children or implement robust parser here?
            // Let's Implement a simple parser here.
        }

        return { visits: fVisits, leads: fLeads };
    }, [visits, leads, selectedLandingId, selectedDate]);


    // --- UI Helpers ---
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            days.push(
                <button
                    key={d}
                    onClick={() => { setSelectedDate(isSelected ? null : dateStr); setShowCalendar(false); }}
                    className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center relative ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                    {d}
                </button>
            );
        }
        return days;
    };


    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-xl font-bold">
                        접속 통계 ({selectedDate ? selectedDate : '전체 기간'})
                    </h1>
                </div>
                <button onClick={loadData} className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-bold">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    새로고침
                </button>
            </header>

            <main className="max-w-7xl mx-auto p-8">
                {/* Filters */}
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

                    {/* Calendar (Simple Date Picker) */}
                    <div className="relative">
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${selectedDate ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'border-gray-300 text-gray-700'}`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            {selectedDate || '날짜 선택'}
                            {selectedDate && <X className="w-3 h-3 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setSelectedDate(null); }} />}
                        </button>
                        {showCalendar && (
                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 w-64">
                                <div className="flex justify-between items-center mb-4">
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded">&lt;</button>
                                    <span className="text-sm font-bold">{currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월</span>
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded">&gt;</button>
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {renderCalendar()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-8 border-b border-gray-200 mb-8 px-2">
                    <button onClick={() => setActiveTab('daily')} className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'daily' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>일별 현황 (Daily)</button>
                    <button onClick={() => setActiveTab('detail')} className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'detail' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>상세 현황 (Detail)</button>
                    <button onClick={() => setActiveTab('marketing')} className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'marketing' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>마케팅 통계 (UTM)</button>
                </div>

                {/* CONTENT */}
                <div className="min-h-[500px]">
                    {activeTab === 'daily' && <DailyStats visits={filteredData.visits} leads={filteredData.leads} />}
                    {activeTab === 'detail' && <DetailStats visits={filteredData.visits} leads={filteredData.leads} />}
                    {activeTab === 'marketing' && <MarketingStats visits={filteredData.visits} leads={filteredData.leads} />}
                </div>

            </main>
        </div>
    );
};

export default TrafficStats;
