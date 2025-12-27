import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2, LogOut, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { fetchLeads } from '../../services/googleSheetService';

const LeadStats: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  // Filters state
  const [selectedLandingId, setSelectedLandingId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // Calendar Filter state
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // Format: 'YYYY-MM-DD'
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadLeads = async () => {
      setLoading(true);
      setError(false);
      try {
          const data = await fetchLeads();
          setLeads(data);
      } catch (err) {
          setError(true);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      loadLeads();
  }, []);

  const handleLogout = () => {
      sessionStorage.removeItem('admin_auth');
      navigate('/admin/login');
  }

  // Derived state: Unique Landing IDs from data
  const uniqueLandingIds = useMemo(() => {
      const ids = new Set(leads.map(lead => lead['Landing ID']));
      return Array.from(ids).sort();
  }, [leads]);

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
              // Assuming 'Timestamp' is something like "2024-03-20 10:00:00" or similar
              // We check if it starts with the selected YYYY-MM-DD
              // If format differs, might need real date parsing. 
              // Google Sheet default is typically formatted string or date object.
              const ts = lead['Timestamp'];
              if (!ts) return false;
              
              // Normalize date comparison
              try {
                  const leadDate = new Date(ts);
                  // Format lead date to YYYY-MM-DD
                  const y = leadDate.getFullYear();
                  const m = String(leadDate.getMonth() + 1).padStart(2, '0');
                  const d = String(leadDate.getDate()).padStart(2, '0');
                  return `${y}-${m}-${d}` === selectedDate;
              } catch (e) {
                  return String(ts).startsWith(selectedDate);
              }
          });
      }

      // Sort by Timestamp
      result.sort((a, b) => {
          const dateA = new Date(a['Timestamp']).getTime();
          const dateB = new Date(b['Timestamp']).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });

      return result;
  }, [leads, selectedLandingId, sortOrder, selectedDate]);


  // --- Simple Calendar Logic ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      
      const days = [];
      // Empty cells for days before the 1st
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
      }
      // Actual days
      for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;
          
          // Check if any leads exist for this date
          const hasLeads = leads.some(lead => {
             try {
                 const ld = new Date(lead['Timestamp']);
                 const ly = ld.getFullYear();
                 const lm = ld.getMonth();
                 const ldd = ld.getDate();
                 return ly === year && lm === month && ldd === d;
             } catch(e) { return false; }
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
                    onClick={loadLeads}
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

               <div className="w-px h-6 bg-gray-300 mx-2 hidden md:block"></div>

               <div className="flex items-center gap-2">
                   <span className="text-sm font-bold text-gray-700">정렬:</span>
                   <button 
                        onClick={() => setSortOrder('desc')}
                        className={`px-3 py-1 rounded text-sm ${sortOrder === 'desc' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-100'}`}
                   >
                       최신순
                   </button>
                   <button 
                        onClick={() => setSortOrder('asc')}
                        className={`px-3 py-1 rounded text-sm ${sortOrder === 'asc' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-100'}`}
                   >
                       과거순
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
                                   <th className="px-6 py-3">랜딩 ID</th>
                                   <th className="px-6 py-3">이름</th>
                                   <th className="px-6 py-3">연락처</th>
                                   <th className="px-6 py-3">추가 정보 (JSON)</th>
                               </tr>
                           </thead>
                           <tbody>
                               {filteredLeads.map((lead, idx) => (
                                   <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                                       <td className="px-6 py-4 whitespace-nowrap">{lead['Timestamp']}</td>
                                       <td className="px-6 py-4">
                                           <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">
                                               {lead['Landing ID']}
                                           </span>
                                       </td>
                                       <td className="px-6 py-4 font-bold text-gray-900">{lead['Name']}</td>
                                       <td className="px-6 py-4 whitespace-nowrap">{lead['Phone']}</td>
                                       <td className="px-6 py-4 max-w-xs truncate text-xs text-gray-400">
                                           {JSON.stringify(lead)}
                                       </td>
                                   </tr>
                               ))}
                               {filteredLeads.length === 0 && (
                                   <tr>
                                       <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                           {leads.length > 0 ? "검색 조건에 맞는 데이터가 없습니다." : "수집된 데이터가 없습니다."}
                                       </td>
                                   </tr>
                               )}
                           </tbody>
                       </table>
                   </div>
               </div>
           )}
       </main>
    </div>
  );
};

export default LeadStats;