import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Monitor, Smartphone, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { fetchVisits, fetchLandingConfigs } from '../../services/googleSheetService';
import { VisitData, LandingConfig } from '../../types';

const TrafficLogs: React.FC = () => {
    const [visits, setVisits] = useState<VisitData[]>([]);
    const [configs, setConfigs] = useState<LandingConfig[]>([]);
    const [loading, setLoading] = useState(true);

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
        const [vData, cData] = await Promise.all([fetchVisits(), fetchLandingConfigs()]);
        setVisits(vData);
        setConfigs(cData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

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

    // Helper: Get Title
    const getPageTitle = (id: string) => {
        const config = configs.find(c => String(c.id) === String(id));
        return config ? config.title : `(ID: ${id})`;
    };

    // Derived state: Unique Landing IDs (Sorted by Title)
    const uniqueLandingOptions = useMemo(() => {
        const ids = Array.from(new Set(visits.map(v => v['Landing ID'])));
        const options = ids.map(id => ({
            id: String(id),
            title: getPageTitle(String(id))
        }));
        // Sort by Title
        options.sort((a, b) => a.title.localeCompare(b.title));
        return options;
    }, [visits, configs]);

    // Derived state: Filtered and Sorted Visits
    const filteredVisits = useMemo(() => {
        let result = [...visits];

        // Filter by Landing ID
        if (selectedLandingId !== 'all') {
            result = result.filter(v => String(v['Landing ID']) === selectedLandingId);
        }

        // Filter by Date
        if (selectedDate) {
            result = result.filter(v => {
                const ts = v.Timestamp;
                const time = parseKoreanDate(ts);
                if (!time) return false;

                const d = new Date(time);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const date = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${date}` === selectedDate;
            });
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'timestamp') {
                const dateA = parseKoreanDate(a.Timestamp);
                const dateB = parseKoreanDate(b.Timestamp);
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            } else if (sortBy === 'title') {
                const titleA = getPageTitle(String(a['Landing ID'])) || '';
                const titleB = getPageTitle(String(b['Landing ID'])) || '';
                return sortOrder === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
            }
            return 0;
        });

        return result;
    }, [visits, configs, selectedLandingId, selectedDate, sortOrder, sortBy]);


    // --- Calendar Helpers (Same as LeadStats) ---
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
                    <h1 className="text-xl font-bold">유입 경로 상세 (로그)</h1>
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
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none max-w-xs"
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
                            {selectedDate || '날짜 선택'}
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
                        총 <strong>{filteredVisits.length}</strong>건 조회됨
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">날짜</th>
                                    <th className="px-6 py-3">페이지 (Title)</th>
                                    <th className="px-6 py-3">기기</th>
                                    <th className="px-6 py-3">OS/브라우저</th>
                                    <th className="px-6 py-3">IP</th>
                                    <th className="px-6 py-3">유입경로</th>
                                    <th className="px-6 py-3">랜딩ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVisits.map((v, i) => {
                                    const title = getPageTitle(String(v['Landing ID']));
                                    return (
                                        <tr key={i} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">{v.Timestamp}</td>
                                            <td className="px-6 py-4 font-bold text-blue-600">{title}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {v.Device === 'Mobile' ? <Smartphone className="w-4 h-4 text-orange-500" /> : <Monitor className="w-4 h-4 text-blue-500" />}
                                                    {v.Device}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="mr-2 text-gray-800 font-medium">{v.OS}</span>
                                                <span className="text-gray-400">{v.Browser}</span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">{v.IP}</td>
                                            <td className="px-6 py-4 max-w-xs truncate" title={v.Referrer}>
                                                {v.Referrer === 'Direct' ? (
                                                    <span className="text-gray-400">직접 접속/없음</span>
                                                ) : (
                                                    <a href={v.Referrer} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                                        {v.Referrer}
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{v['Landing ID']}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && filteredVisits.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                                            {visits.length > 0 ? "검색 조건에 맞는 데이터가 없습니다." : "수집된 데이터가 없습니다."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TrafficLogs;