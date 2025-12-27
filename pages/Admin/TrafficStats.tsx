import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BarChart2, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { fetchVisits, fetchLeads } from '../../services/googleSheetService';
import { VisitData, LeadData } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrafficStats: React.FC = () => {
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedLandingId, setSelectedLandingId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 'YYYY-MM-DD'
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadData = async () => {
    setLoading(true);
    const [vData, lData] = await Promise.all([fetchVisits(), fetchLeads()]);
    setVisits(vData);
    setLeads(lData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Derived state: Unique Landing IDs
  const uniqueLandingIds = useMemo(() => {
    const ids = new Set(visits.map(v => v['Landing ID']));
    return Array.from(ids).sort();
  }, [visits]);

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
    const result = [];

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
            try {
                const d = new Date(v.Timestamp);
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
            } catch(e) {}
        });

        // Fill Leads
        filteredLeads.forEach(l => {
            try {
                const d = new Date(l.timestamp || l['Timestamp']);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${day}`;
                
                if (dateStr === selectedDate) {
                    const h = d.getHours();
                    const target = result.find(r => r.key === h);
                    if (target) target.leads += 1;
                }
            } catch(e) {}
        });

    } else {
        // --- DAILY MODE (Last 7 Days) ---
        const today = new Date();
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
            try {
                const d = new Date(v.Timestamp);
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
            } catch(e) {}
        });

        // Fill Leads
        filteredLeads.forEach(l => {
            try {
                const d = new Date(l.timestamp || l['Timestamp']);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${day}`;

                const target = result.find(r => r.key === dateStr);
                if (target) target.leads += 1;
            } catch(e) {}
        });
    }

    return result;
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
                 {uniqueLandingIds.map(id => (
                     <option key={id} value={id}>ID: {id}</option>
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
                             {['일','월','화','수','목','금','토'].map(d => (
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
                <BarChart2 className="w-5 h-5 text-gray-500"/>
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

         <div className="text-center text-gray-400 text-xs">
            * 차트 데이터는 브라우저 시간대를 기준으로 집계됩니다.
         </div>

       </main>
    </div>
  );
};

export default TrafficStats;