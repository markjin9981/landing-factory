import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2, Search, Trash2, ChevronLeft, ChevronRight, Download, Filter, ArrowUpDown } from 'lucide-react';
import { fetchLeads, fetchLandingConfigs, deleteLeads } from '../../services/googleSheetService';
import { LandingConfig, FormField } from '../../types';

// Helper: Parse Korean Date
const parseKoreanDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return 0;
    const standard = new Date(dateStr).getTime();
    if (!isNaN(standard)) return standard;
    try {
        const numbers = dateStr.match(/\d+/g);
        if (!numbers || numbers.length < 3) return 0;
        let year = parseInt(numbers[0], 10);
        let month = parseInt(numbers[1], 10) - 1;
        let day = parseInt(numbers[2], 10);
        let hour = 0, min = 0;
        if (numbers.length >= 4) hour = parseInt(numbers[3], 10);
        if (numbers.length >= 5) min = parseInt(numbers[4], 10);

        if ((dateStr.includes('오후') || dateStr.toLowerCase().includes('pm')) && hour < 12) hour += 12;

        return new Date(year, month, day, hour, min).getTime();
    } catch (e) { return 0; }
};

const SYSTEM_FIELDS = [
    'landing_id', 'timestamp', 'user_agent', 'referrer',
    'page_title', 'marketing_consent', 'third_party_consent',
    'privacy_consent', 'type'
];

const LeadStatsDetail: React.FC = () => {
    const { id: landingId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [leads, setLeads] = useState<any[]>([]);
    const [config, setConfig] = useState<LandingConfig | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters & Sort
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Selection
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isDeleteMode, setIsDeleteMode] = useState(false);

    // Delete Confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteStep, setDeleteStep] = useState(0); // 0: None, 1: Confirm Count, 2: Final Warning
    const [isDeleting, setIsDeleting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setSelectedIndices(new Set());
        try {
            const [allLeads, configs] = await Promise.all([
                fetchLeads(),
                fetchLandingConfigs()
            ]);

            // Filter specific page leads
            const targetConfig = configs.find(c => String(c.id) === String(landingId));
            setConfig(targetConfig || null);

            const pageLeads = allLeads.filter(l => String(l['Landing ID']) === String(landingId));
            setLeads(pageLeads);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [landingId]);

    // Derived: Filtered & Sorted Leads
    const processedLeads = useMemo(() => {
        let result = [...leads];

        // 1. Search (Name or Phone)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(lead => {
                const name = String(lead['Name'] || '').toLowerCase();
                const phone = String(lead['Phone'] || '').toLowerCase();
                return name.includes(lowerTerm) || phone.includes(lowerTerm);
            });
        }

        // 2. Date Range
        if (startDate) {
            const startTs = new Date(startDate).setHours(0, 0, 0, 0);
            result = result.filter(lead => parseKoreanDate(lead['Timestamp']) >= startTs);
        }
        if (endDate) {
            const endTs = new Date(endDate).setHours(23, 59, 59, 999);
            result = result.filter(lead => parseKoreanDate(lead['Timestamp']) <= endTs);
        }

        // 3. Sort
        result.sort((a, b) => {
            const dateA = parseKoreanDate(a['Timestamp']);
            const dateB = parseKoreanDate(b['Timestamp']);
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [leads, searchTerm, startDate, endDate, sortOrder]);

    // Pagination Logic
    const totalPages = Math.ceil(processedLeads.length / ITEMS_PER_PAGE);
    const paginatedLeads = processedLeads.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Dynamic Columns Helper
    const { columns, extraKeys } = useMemo(() => {
        const cols = [{ key: 'Timestamp', label: '시간' }];
        const usedKeys = new Set(['Timestamp', 'Landing ID']);

        if (config?.formConfig?.fields) {
            config.formConfig.fields.forEach((field: FormField) => {
                cols.push({ key: field.id, label: field.label });
                usedKeys.add(field.id);
                usedKeys.add(field.id.toLowerCase());
            });
        } else {
            // Fallback
            if (leads.length > 0) {
                if (leads[0]['Name']) { cols.push({ key: 'Name', label: '이름' }); usedKeys.add('Name'); }
                if (leads[0]['Phone']) { cols.push({ key: 'Phone', label: '연락처' }); usedKeys.add('Phone'); }
            }
        }

        const extra = new Set<string>();
        leads.forEach(lead => {
            Object.keys(lead).forEach(k => {
                if (usedKeys.has(k) || usedKeys.has(k.toLowerCase())) return;
                if (SYSTEM_FIELDS.includes(k.toLowerCase())) return;
                if (k.startsWith('consent_')) return;
                extra.add(k);
            });
        });
        if (extra.has('Memo')) { extra.delete('Memo'); cols.push({ key: 'Memo', label: '메모' }); }

        return { columns: cols, extraKeys: Array.from(extra) };
    }, [config, leads]);


    // Handlers
    const toggleSelect = (idx: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(idx)) newSet.delete(idx);
        else newSet.add(idx);
        setSelectedIndices(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIndices.size === paginatedLeads.length) {
            setSelectedIndices(new Set());
        } else {
            // Select all CURRENT PAGE items
            // We need to store global index? Or assume deleting handled by object reference?
            // Deletion logic relies on `leads` object content, so we just track indices relative to `paginatedLeads` for UI toggle?
            // Better: track keys or something unique.
            // Since we lack IDs, let's track the actual lead objects or indices within `processedLeads`?
            // Simple: just track index within `paginatedLeads` for current page action, but multi-page selection is hard.
            // Let's stick to "Select All on Current Page".
            const newSet = new Set<number>();
            paginatedLeads.forEach((_, i) => newSet.add(i));
            setSelectedIndices(newSet);
        }
    };

    const handleDeleteStart = () => {
        if (selectedIndices.size === 0) return;
        setDeleteStep(1); // 1st Warning
    };

    const handleDeleteConfirm = async () => {
        if (deleteStep === 1) {
            setDeleteStep(2); // 2nd Warning
            return;
        }

        // Final Delete
        setIsDeleting(true);
        const targets = Array.from(selectedIndices).map(idx => paginatedLeads[idx]);

        // Transform keys to match backend expectation if needed (Backend expects lowercase keys usually? No, it adapts)
        // Backend `handleLeadDeletion` checks: timestamp, landing_id, name, phone.
        // We should send the exact objects.
        // But headers in `leads` might be capitalized like "Timestamp".
        // Backend `handleLeadDeletion` target parsing handles lowercase/trim.
        // We need to ensure we send keys that backend understands.
        const payload = targets.map(t => ({
            timestamp: t['Timestamp'],
            landing_id: t['Landing ID'],
            name: t['Name'],
            phone: t['Phone']
        }));

        const result = await deleteLeads(payload as any[]);

        if (result.result === 'success') {
            await loadData();
            setDeleteStep(0);
            setSelectedIndices(new Set());
        } else {
            alert("삭제 실패: " + result.message);
        }
        setIsDeleting(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/stats')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            {config ? config.title : `페이지 ID: ${landingId}`}
                            <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{leads.length}건</span>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadData} className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-bold">
                        <RefreshCw className="w-4 h-4 mr-2" /> 새로고침
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8 space-y-6">
                {/* Control Bar */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="이름 또는 전화번호 검색"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                            />
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <span className="text-gray-500">기간:</span>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent outline-none text-gray-700 font-medium" />
                            <span className="text-gray-400">~</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent outline-none text-gray-700 font-medium" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Sort */}
                        <button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 text-gray-700 font-bold"
                        >
                            <ArrowUpDown className="w-4 h-4" />
                            {sortOrder === 'desc' ? '최신순' : '오래된순'}
                        </button>

                        {/* Delete Mode Toggle */}
                        <button
                            onClick={() => { setIsDeleteMode(!isDeleteMode); setSelectedIndices(new Set()); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isDeleteMode
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Trash2 className="w-4 h-4" />
                            {isDeleteMode ? '삭제 취소' : '항목 삭제'}
                        </button>

                        {/* Delete Action Button (Visible only in delete mode and selection exists) */}
                        {isDeleteMode && selectedIndices.size > 0 && (
                            <button
                                onClick={handleDeleteStart}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm animate-fade-in"
                            >
                                {selectedIndices.size}개 삭제하기
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                <tr>
                                    {isDeleteMode && (
                                        <th className="px-6 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                onChange={toggleSelectAll}
                                                checked={selectedIndices.size > 0 && selectedIndices.size === paginatedLeads.length}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </th>
                                    )}
                                    <th className="px-6 py-3 w-12 font-medium">No.</th>
                                    {columns.map(col => (
                                        <th key={col.key} className="px-6 py-3 font-medium text-gray-700">{col.label}</th>
                                    ))}
                                    {extraKeys.length > 0 && <th className="px-6 py-3 font-medium text-gray-500">추가 정보</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedLeads.map((lead, idx) => (
                                    <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${isDeleteMode && selectedIndices.has(idx) ? 'bg-red-50/50' : ''}`}>
                                        {isDeleteMode && (
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIndices.has(idx)}
                                                    onChange={() => toggleSelect(idx)}
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-gray-400 text-xs text-center">
                                            {processedLeads.length - ((currentPage - 1) * ITEMS_PER_PAGE + idx)}
                                        </td>
                                        {columns.map(col => (
                                            <td key={col.key} className="px-6 py-4 whitespace-nowrap text-gray-700">
                                                {lead[col.key] || lead[col.key.toLowerCase()] || '-'}
                                            </td>
                                        ))}
                                        {extraKeys.length > 0 && (
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {extraKeys.map(k => {
                                                    const val = lead[k];
                                                    if (!val) return null;
                                                    return (
                                                        <div key={k} className="flex gap-1">
                                                            <span className="font-bold text-gray-300">{k}:</span>
                                                            <span>{val}</span>
                                                        </div>
                                                    );
                                                })}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {paginatedLeads.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-20 text-center text-gray-400 bg-gray-50/30">
                                            데이터가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {/* Simple Page Numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                            .map((p, i, arr) => {
                                // Add ellipsis
                                const prev = arr[i - 1];
                                const gap = prev && p - prev > 1;

                                return (
                                    <React.Fragment key={p}>
                                        {gap && <span className="text-gray-300">...</span>}
                                        <button
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${currentPage === p
                                                ? 'bg-gray-900 text-white shadow-md transform scale-105'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                );
                            })}

                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </main>

            {/* Delete Modal */}
            {deleteStep > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 transform transition-all scale-100">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                            {deleteStep === 1 ? '선택한 항목 삭제' : '정말 삭제하시겠습니까?'}
                        </h3>

                        <p className="text-center text-gray-500 mb-8 break-keep">
                            {deleteStep === 1 ? (
                                <>총 <strong>{selectedIndices.size}개</strong>의 데이터를 삭제합니다.<br />계속 하시겠습니까?</>
                            ) : (
                                <>삭제된 데이터는 <strong>절대 복구할 수 없습니다.</strong><br />신중하게 결정해 주세요.</>
                            )}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteStep(0)}
                                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-70 disabled:cursor-wait flex justify-center items-center"
                            >
                                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : (deleteStep === 1 ? '계속하기' : '삭제 확정')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadStatsDetail;
