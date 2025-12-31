import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2, LogOut, Filter, Calendar as CalendarIcon, X, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchLeads, fetchLandingConfigs } from '../../services/googleSheetService';
import { LandingConfig } from '../../types';

// Hidden fields list (Meta Data)
const META_FIELDS = [
    'marketing_consent', 'third_party_consent', 'referrer', 'user_agent',
    'page_title', 'landing_id', 'timestamp', 'privacy_consent',
    'raw data', 'recipient', 'body', 'subject' // Technical/Legacy fields to hide
];

const LeadInfoCell: React.FC<{ lead: any; promotedKey?: string; promotedKey2?: string }> = ({ lead, promotedKey, promotedKey2 }) => {
    const [showMeta, setShowMeta] = useState(false);

    // Remove known primary keys
    // We treat Name and Phone case-insensitively for exclusion since they are primary columns
    const { Timestamp, 'Landing ID': lid, ...rest } = lead;

    // Separate visible vs meta
    const visibleKeys: string[] = [];
    const metaKeys: string[] = [];

    // Keys that are already shown in the main table
    const EXCLUDED_VISIBLE_KEYS = ['name', 'phone', 'landing id', 'timestamp'];
    if (promotedKey) EXCLUDED_VISIBLE_KEYS.push(promotedKey.toLowerCase());
    if (promotedKey2) EXCLUDED_VISIBLE_KEYS.push(promotedKey2.toLowerCase());


    Object.keys(rest).forEach(key => {
        const lowerKey = key.toLowerCase();

        if (META_FIELDS.includes(lowerKey) || lowerKey.startsWith('consent_')) {
            metaKeys.push(key);
        } else if (EXCLUDED_VISIBLE_KEYS.includes(lowerKey)) {
            // Skip - already shown in table
        } else if (key.startsWith('f') && !isNaN(Number(key[1]))) {
            // Hide internal form IDs like f1766935627610 (treat as meta)
            metaKeys.push(key);
        } else {
            visibleKeys.push(key);
        }
    });

    if (visibleKeys.length === 0 && metaKeys.length === 0) return <span>-</span>;

    return (
        <div className="space-y-2">
            {/* Primary Info (Always Visible - Custom user inputs) */}
            {visibleKeys.length > 0 && (
                <div className="space-y-1">
                    {visibleKeys.map(key => (
                        <div key={key} className="flex gap-2">
                            <span className="font-bold text-gray-700 min-w-[60px]">{key}:</span>
                            <span className="text-gray-900 break-all">{rest[key]}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Meta Info (Toggle) */}
            {metaKeys.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowMeta(!showMeta)}
                        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                    >
                        {showMeta ? (
                            <>접기 <ChevronUp className="w-3 h-3" /></>
                        ) : (
                            <>더보기 ({metaKeys.length}) <ChevronDown className="w-3 h-3" /></>
                        )}
                    </button>

                    {showMeta && (
                        <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded border border-gray-100 animate-fade-in text-[10px]">
                            {metaKeys.map(key => (
                                <div key={key} className="flex flex-col sm:flex-row sm:gap-2 border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                                    <span className="font-bold text-gray-500 w-24 shrink-0">{key}:</span>
                                    <span className="text-gray-700 break-all font-mono">{rest[key]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Helper to parse Korean date format strictly and robustly
// Move outside component to be reused
const parseKoreanDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return 0;

    // 1. Try Standard Date Parse first
    const standard = new Date(dateStr).getTime();
    if (!isNaN(standard)) return standard;

    try {
        // 2. Fallback: robust digit extraction
        const isPM = dateStr.includes('오후') || dateStr.toLowerCase().includes('pm');
        const isAM = dateStr.includes('오전') || dateStr.toLowerCase().includes('am');

        const numbers = dateStr.match(/\d+/g);
        if (!numbers || numbers.length < 3) return 0;

        let year = parseInt(numbers[0], 10);
        let month = parseInt(numbers[1], 10) - 1;
        let day = parseInt(numbers[2], 10);

        if (month < 0 || month > 11 || day < 1 || day > 31) return 0;

        let hour = 0;
        let min = 0;
        let sec = 0;

        if (numbers.length >= 4) hour = parseInt(numbers[3], 10);
        if (numbers.length >= 5) min = parseInt(numbers[4], 10);
        if (numbers.length >= 6) sec = parseInt(numbers[5], 10);

        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;

        return new Date(year, month, day, hour, min, sec).getTime();
    } catch (e) {
        return 0;
    }
};

const LeadStats: React.FC = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [configs, setConfigs] = useState<LandingConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    // Filters state
    const [selectedLandingId, setSelectedLandingId] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [sortBy, setSortBy] = useState<'timestamp' | 'title'>('timestamp'); // New Sort Field

    // Calendar Filter state
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // Format: 'YYYY-MM-DD'
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const loadData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [leadsData, configsData] = await Promise.all([
                fetchLeads(),
                fetchLandingConfigs()
            ]);
            setLeads(leadsData);
            setConfigs(configsData);
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('admin_auth');
        navigate('/admin/login');
    }

    // Helper: Get Title by ID
    const getPageTitle = (id: string) => {
        const config = configs.find(c => String(c.id) === String(id));
        return config ? config.title : `(ID: ${id})`;
    };

    // Derived state: Unique Landing IDs from data (mapped to titles)
    const uniqueLandingOptions = useMemo(() => {
        const ids = new Set(leads.map(lead => lead['Landing ID']));
        return Array.from(ids).sort().map(id => ({
            id: String(id),
            title: getPageTitle(String(id))
        }));
    }, [leads, configs]); // invalidates when configs loaded

    // Derived state: Filtered and Sorted Leads
    const filteredLeads = useMemo(() => {
        let result = [...leads];

        // Filter by Landing ID
        if (selectedLandingId !== 'all') {
            result = result.filter(lead => String(lead['Landing ID']) === selectedLandingId);
        }

        // Filter by Date
        if (selectedDate) {
            result = result.filter(lead => {
                const ts = lead['Timestamp'];
                const time = parseKoreanDate(ts);
                if (!time) return false;

                const d = new Date(time);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}` === selectedDate;
            });
        }

        // [New] Filter out invalid/system rows (e.g. from legacy bugs)
        // Check if Landing ID is valid (numeric or specific ID)
        // And Title shouldn't look like a system notification
        result = result.filter(lead => {
            const lid = String(lead['Landing ID'] || '');
            const title = getPageTitle(lid);

            // 1. Landing ID shouldn't be 'undefined', 'null', 'Unknown' (unless title is valid)
            if (!lid || lid.toLowerCase() === 'undefined' || lid.toLowerCase() === 'unknown') return false;

            // 2. Filter out things that look like Email Subjects if they accidentally got here
            // e.g. "[Landing Factory] 관리자..."
            if (lid.includes('Landing Factory')) return false;

            return true;
        });

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'timestamp') {
                const dateA = parseKoreanDate(a['Timestamp']);
                const dateB = parseKoreanDate(b['Timestamp']);
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            } else if (sortBy === 'title') {
                const titleA = getPageTitle(String(a['Landing ID'])) || '';
                const titleB = getPageTitle(String(b['Landing ID'])) || '';
                return sortOrder === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
            }
            return 0;
        });

        return result;
    }, [leads, configs, selectedLandingId, sortOrder, sortBy, selectedDate]);


    // --- Pagination Logic ---
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedLandingId, selectedDate, sortBy, sortOrder]);

    const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
    const displayedLeads = filteredLeads.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );


    // --- Simple Calendar Logic ---
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

            const hasLeads = leads.some(lead => {
                const time = parseKoreanDate(lead['Timestamp']);
                if (!time) return false;
                const ld = new Date(time);
                return ld.getFullYear() === year && ld.getMonth() === month && ld.getDate() === d;
            });

            days.push(
                <button
                    key={d}
                    onClick={() => { setSelectedDate(isSelected ? null : dateStr); setShowCalendar(false); }}
                    className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center relative
                    ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}
                `}
                >
                    {d}
                    {hasLeads && !isSelected && <span className="absolute bottom-0.5 w-1 h-1 bg-red-500 rounded-full"></span>}
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
                    <h1 className="text-xl font-bold">DB 수집 현황</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadData}
                        className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        새로고침
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-bold"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        로그아웃
                    </button>
                </div>
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
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none max-w-xs"
                    >
                        <option value="all">전체 랜딩페이지</option>
                        {uniqueLandingOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.title} ({opt.id})</option>
                        ))}
                    </select>

                    {/* Calendar ... */}
                    <div className="relative">
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${selectedDate ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'border-gray-300 text-gray-700'}`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            {selectedDate || '날짜 선택'}
                            {selectedDate && (
                                <X
                                    className="w-3 h-3 hover:text-red-500"
                                    onClick={(e) => { e.stopPropagation(); setSelectedDate(null); }}
                                />
                            )}
                        </button>

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

                    <div className="w-px h-6 bg-gray-300 mx-2 hidden md:block"></div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-700">정렬:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm outline-none"
                        >
                            <option value="timestamp">시간순</option>
                            <option value="title">페이지 제목순</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                        >
                            {sortOrder === 'desc' ? '내림차순 (▼)' : '오름차순 (▲)'}
                        </button>
                    </div>

                    <div className="ml-auto text-sm text-gray-500">
                        총 <strong>{filteredLeads.length}</strong>건 조회됨
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3">시간 (Timestamp)</th>
                                        <th className="px-6 py-3">페이지 (Title)</th>
                                        <th className="px-6 py-3 whitespace-nowrap">ID</th>
                                        <th className="px-6 py-3">이름</th>
                                        <th className="px-6 py-3">연락처</th>
                                        <th className="px-6 py-3">데이터1</th>
                                        <th className="px-6 py-3">데이터2</th>
                                        <th className="px-6 py-3">추가 정보</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedLeads.map((lead, idx) => {
                                        const title = getPageTitle(String(lead['Landing ID']));

                                        // Calculate Promoted Keys (First & Second Custom Fields)
                                        let promotedKey = undefined;
                                        let promotedKey2 = undefined;
                                        const SKIP_KEYS = ['timestamp', 'landing id', 'name', 'phone'];

                                        // Find all valid candidates
                                        const candidateKeys: string[] = [];
                                        for (const key of Object.keys(lead)) {
                                            const lowerKey = key.toLowerCase();
                                            if (SKIP_KEYS.includes(lowerKey)) continue;
                                            if (META_FIELDS.includes(lowerKey)) continue;
                                            if (lowerKey.startsWith('consent_')) continue;

                                            // Skip keys with empty values
                                            const val = lead[key];
                                            if (val === null || val === undefined || String(val).trim() === '') continue;

                                            candidateKeys.push(key);
                                        }

                                        if (candidateKeys.length > 0) promotedKey = candidateKeys[0];
                                        if (candidateKeys.length > 1) promotedKey2 = candidateKeys[1];

                                        return (
                                            <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">{lead['Timestamp']}</td>
                                                <td className="px-6 py-4 font-bold text-blue-600">
                                                    {title}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                                                        {lead['Landing ID']}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{lead['Name']}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{lead['Phone']}</td>
                                                <td className="px-6 py-4 font-medium text-gray-800">
                                                    {promotedKey ? lead[promotedKey] : '-'}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-800">
                                                    {promotedKey2 ? lead[promotedKey2] : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    <LeadInfoCell lead={lead} promotedKey={promotedKey} promotedKey2={promotedKey2} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredLeads.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                                                {leads.length > 0 ? "검색 조건에 맞는 데이터가 없습니다." : "수집된 데이터가 없습니다."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Pagination Controls */}
                {filteredLeads.length > 0 && (
                    <div className="flex justify-center items-center gap-4 py-6 border-t border-gray-100">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            이전
                        </button>
                        <span className="text-sm text-gray-600 font-bold">
                            {currentPage} / {totalPages} 페이지
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            다음
                        </button>
                    </div>
                )}
        </div>
    )
}
            </main >
        </div >
    );
};

export default LeadStats;