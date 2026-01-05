import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2, LogOut, Database, Calendar, Clock, Trash2 } from 'lucide-react';
import { fetchLeads, fetchLandingConfigs, deleteLandingConfig } from '../../services/googleSheetService';
import { LandingConfig, FormField } from '../../types';
import { RecentLeadsModal } from '../../components/RecentLeadsModal';

// Meta fields to hide from the main columns unless explicitly requested
const SYSTEM_FIELDS = [
    'landing_id', 'timestamp', 'user_agent', 'referrer',
    'page_title', 'marketing_consent', 'third_party_consent',
    'privacy_consent', 'type'
];

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

const LeadStats: React.FC = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [configs, setConfigs] = useState<LandingConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalLeads, setModalLeads] = useState<any[]>([]);

    // Delete State
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteStep, setDeleteStep] = useState(0); // 0: None, 1: Confirm, 2: Final
    const [isDeleting, setIsDeleting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [leadsData, configsData] = await Promise.all([
                fetchLeads(),
                fetchLandingConfigs()
            ]);
            setLeads(leadsData);
            setConfigs(configsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // 1. Group Leads by Landing ID
    const groupedLeads = useMemo(() => {
        const groups: Record<string, any[]> = {};

        leads.forEach(lead => {
            const id = String(lead['Landing ID'] || 'unknown');
            if (!groups[id]) groups[id] = [];
            groups[id].push(lead);
        });

        // Sort leads within groups by timestamp (newest first)
        Object.keys(groups).forEach(id => {
            groups[id].sort((a, b) => {
                return parseKoreanDate(b['Timestamp']) - parseKoreanDate(a['Timestamp']);
            });
        });

        return groups;
    }, [leads]);

    // 2. Dashboard Stats
    const stats = useMemo(() => {
        const now = new Date().getTime();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTs = today.getTime();
        const oneHourAgoTs = now - (60 * 60 * 1000);

        const todayLeads: any[] = [];
        const hourLeads: any[] = [];

        leads.forEach(lead => {
            const ts = parseKoreanDate(lead['Timestamp']);
            if (ts >= todayTs) {
                todayLeads.push(lead);
            }
            if (ts >= oneHourAgoTs) {
                hourLeads.push(lead);
            }
        });

        return {
            todayCount: todayLeads.length,
            todayLeads,
            hourCount: hourLeads.length,
            hourLeads,
            totalCount: leads.length
        };
    }, [leads]);

    const landingTitles = useMemo(() => {
        const map: Record<string, string> = {};
        configs.forEach(c => map[String(c.id)] = c.title);
        return map;
    }, [configs]);

    // Handlers
    const openRecentModal = (type: 'today' | 'hour') => {
        if (type === 'today') {
            setModalTitle('오늘 수집된 DB');
            setModalLeads(stats.todayLeads);
        } else {
            setModalTitle('최근 1시간 내 수집된 DB');
            setModalLeads(stats.hourLeads);
        }
        setModalOpen(true);
    };

    const handleDeleteStart = (id: string) => {
        setDeleteTargetId(id);
        setDeleteStep(1);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTargetId) return;

        if (deleteStep === 1) {
            setDeleteStep(2);
            return;
        }

        setIsDeleting(true);
        const config = configs.find(c => String(c.id) === deleteTargetId);

        if (config) {
            // Case 1: Delete Config
            const success = await deleteLandingConfig(deleteTargetId);

            if (success) {
                // Optimistic Update
                setConfigs(prev => prev.filter(c => String(c.id) !== deleteTargetId));
                setDeleteStep(0);
                setDeleteTargetId(null);
            } else {
                alert("설정 삭제 실패");
            }
        } else {
            // Case 2: Delete All Leads (Unknown Page)
            const { deleteLeads } = await import('../../services/googleSheetService');
            const targetLeads = groupedLeads[deleteTargetId] || [];

            if (targetLeads.length === 0) {
                setDeleteStep(0);
                setDeleteTargetId(null);
                setIsDeleting(false);
                return;
            }

            const result = await deleteLeads(targetLeads);
            if (result.result === 'success') {
                // Remove these leads from state
                setLeads(prev => prev.filter(l => String(l['Landing ID'] || 'unknown') !== deleteTargetId));
                setDeleteStep(0);
                setDeleteTargetId(null);
            } else {
                alert("데이터 삭제 실패: " + result.message);
            }
        }
        setIsDeleting(false);
    };

    // Helper: Determine Columns for a Group
    const getColumnsForGroup = (landingId: string, groupLeads: any[]) => {
        const config = configs.find(c => String(c.id) === landingId);
        const columns = [{ key: 'Timestamp', label: '시간' }];
        const usedKeys = new Set(['Timestamp', 'Landing ID']);

        if (config?.formConfig?.fields) {
            config.formConfig.fields.forEach((field: FormField) => {
                columns.push({ key: field.id, label: field.label });
                usedKeys.add(field.id);
                usedKeys.add(field.id.toLowerCase());
            });
        } else {
            if (groupLeads.length > 0) {
                const sample = groupLeads[0];
                if (sample['Name']) { columns.push({ key: 'Name', label: '이름' }); usedKeys.add('Name'); }
                if (sample['Phone']) { columns.push({ key: 'Phone', label: '연락처' }); usedKeys.add('Phone'); }
            }
        }

        const extraKeys = new Set<string>();
        groupLeads.forEach(lead => {
            Object.keys(lead).forEach(k => {
                if (usedKeys.has(k) || usedKeys.has(k.toLowerCase())) return;
                if (SYSTEM_FIELDS.includes(k.toLowerCase())) return;
                if (k.startsWith('consent_')) return;
                extraKeys.add(k);
            });
        });

        if (extraKeys.has('Memo')) {
            extraKeys.delete('Memo');
            columns.push({ key: 'Memo', label: '메모' });
        }

        return { columns, extraKeys: Array.from(extraKeys) };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    // Identify if target is unknown for modal text
    const isTargetUnknown = deleteTargetId && !configs.find(c => String(c.id) === deleteTargetId);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-4 md:px-8 md:py-5 flex flex-col md:flex-row items-center justify-between sticky top-0 z-10 shadow-sm gap-4 md:gap-0">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-lg md:text-xl font-bold">DB 수집 현황</h1>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button onClick={loadData} className="flex-1 md:flex-none justify-center items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-bold">
                        <RefreshCw className="w-4 h-4 mr-2" /> 새로고침
                    </button>
                    <button onClick={() => { sessionStorage.removeItem('admin_auth'); navigate('/admin/login'); }} className="flex-1 md:flex-none justify-center items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-bold">
                        <LogOut className="w-4 h-4 mr-2" /> 로그아웃
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8 space-y-8">

                {/* 1. Dashboard Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Today Card */}
                    <div
                        onClick={() => openRecentModal('today')}
                        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                    >
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-bold mb-1 group-hover:text-blue-600">오늘 수집된 DB</p>
                            <h2 className="text-3xl font-bold text-gray-900">{stats.todayCount} <span className="text-lg text-gray-400 font-normal">건</span></h2>
                        </div>
                    </div>

                    {/* 1 Hour Card */}
                    <div
                        onClick={() => openRecentModal('hour')}
                        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5 cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
                    >
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-bold mb-1 group-hover:text-emerald-600">최근 1시간 내 수집</p>
                            <h2 className="text-3xl font-bold text-gray-900">{stats.hourCount} <span className="text-lg text-gray-400 font-normal">건</span></h2>
                        </div>
                    </div>

                    {/* Total Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-lg">
                            <Database className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-bold mb-1">누적 수집 DB</p>
                            <h2 className="text-3xl font-bold text-gray-900">{stats.totalCount} <span className="text-lg text-gray-400 font-normal">건</span></h2>
                        </div>
                    </div>
                </div>

                {/* 2. Grouped Lists */}
                {Object.keys(groupedLeads).length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border-dashed border-2 border-gray-300">
                        <p className="text-gray-500">수집된 데이터가 없습니다.</p>
                    </div>
                ) : (
                    Object.entries(groupedLeads).map(([landingId, groupLeads]) => {
                        const config = configs.find(c => String(c.id) === landingId);
                        const title = config ? config.title : `알 수 없는 페이지 (ID: ${landingId})`;
                        const { columns } = getColumnsForGroup(landingId, groupLeads);
                        const previewLeads = groupLeads.slice(0, 5);
                        const isUnknown = !config;

                        return (
                            <div key={landingId} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fade-in-up">
                                <div className="px-4 py-3 md:px-6 md:py-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
                                    <div className="flex items-start justify-between w-full md:w-auto md:justify-start gap-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="bg-white p-2 border border-gray-200 rounded-lg shrink-0">
                                                <Database className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-800 text-base md:text-lg truncate pr-2">{title}</h3>
                                                <p className="text-xs text-gray-400 font-mono truncate">ID: {landingId}</p>
                                            </div>
                                        </div>
                                        {/* Mobile Badge Position: Top Right */}
                                        <div className="md:hidden shrink-0">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold">
                                                총 {groupLeads.length}건
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 w-full md:w-auto">
                                        {/* Desktop Badge Position */}
                                        <span className="hidden md:inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mr-2">
                                            총 {groupLeads.length} 건
                                        </span>

                                        <button
                                            onClick={() => navigate(`/admin/stats/${landingId}`)}
                                            className="flex-1 md:flex-none justify-center items-center gap-1 text-xs md:text-sm font-bold text-gray-600 hover:text-blue-600 bg-white border border-gray-300 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-all flex"
                                        >
                                            상세보기 <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 rotate-180" />
                                        </button>

                                        <button
                                            onClick={() => handleDeleteStart(landingId)}
                                            className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                            title={isUnknown ? "모든 데이터 삭제" : "페이지 삭제"}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 w-12 font-medium">No.</th>
                                                {columns.slice(0, 5).map(col => (
                                                    <th key={col.key} className="px-6 py-3 font-medium text-gray-700">
                                                        {col.label}
                                                    </th>
                                                ))}
                                                {columns.length > 5 && <th className="px-6 py-3 font-medium text-gray-400">...</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {previewLeads.map((lead, idx) => (
                                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4 text-gray-400 text-xs">{groupLeads.length - idx}</td>
                                                    {columns.slice(0, 5).map(col => (
                                                        <td key={col.key} className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                            {lead[col.key] || lead[col.key.toLowerCase()] || '-'}
                                                        </td>
                                                    ))}
                                                    {columns.length > 5 && <td className="px-6 py-4 text-gray-300">...</td>}
                                                </tr>
                                            ))}
                                            {groupLeads.length > 5 && (
                                                <tr>
                                                    <td colSpan={columns.slice(0, 5).length + 2} className="px-6 py-3 text-center bg-gray-50/30">
                                                        <button
                                                            onClick={() => navigate(`/admin/stats/${landingId}`)}
                                                            className="text-xs font-bold text-blue-600 hover:underline"
                                                        >
                                                            + {groupLeads.length - 5}개 더보기
                                                        </button>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden">
                                    <div className="divide-y divide-gray-100">
                                        {previewLeads.map((lead, idx) => (
                                            <div key={idx} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-mono text-gray-400">#{groupLeads.length - idx}</span>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        {lead['Timestamp'] ? lead['Timestamp'].split(' ')[1] : '-'}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    {columns.slice(1, 4).map(col => (
                                                        <div key={col.key} className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-500 w-16 truncate">{col.label}</span>
                                                            <span className={`text-sm font-medium ${col.key === 'Phone' ? 'text-blue-600' : 'text-gray-900'} text-right truncate flex-1`}>
                                                                {lead[col.key] || lead[col.key.toLowerCase()] || '-'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {groupLeads.length > 5 && (
                                            <div className="p-3 text-center bg-gray-50 border-t border-gray-100">
                                                <button
                                                    onClick={() => navigate(`/admin/stats/${landingId}`)}
                                                    className="w-full py-2 text-sm font-bold text-blue-600 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                                >
                                                    전체보기 (+{groupLeads.length - 5})
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </main>

            {/* Recent Leads Modal */}
            <RecentLeadsModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalTitle}
                leads={modalLeads}
                landingTitles={landingTitles}
            />

            {/* Delete Page Confirmation Modal */}
            {deleteTargetId && deleteStep > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                            {deleteStep === 1 ? (isTargetUnknown ? '해당 목록을 비우시겠습니까?' : '페이지 설정을 삭제하시겠습니까?') : '정말 삭제하시겠습니까?'}
                        </h3>

                        <p className="text-center text-gray-500 mb-8 break-keep text-sm">
                            {deleteStep === 1 ? (
                                isTargetUnknown ? (
                                    <>해당 그룹의 <strong className="text-red-500">모든 DB({groupedLeads[deleteTargetId]?.length}건)</strong>가 삭제됩니다.<br />이 작업은 설정 파일과 무관하게 데이터만 삭제합니다.</>
                                ) : (
                                    <>랜딩페이지 설정이 목록에서 사라집니다.<br />(이미 수집된 DB는 보존되지만 '알 수 없는 페이지'로 분류됩니다.)</>
                                )
                            ) : (
                                <>삭제된 데이터는 <strong className="text-red-500">복구할 수 없습니다.</strong><br />신중하게 결정해 주세요.</>
                            )}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeleteStep(0); setDeleteTargetId(null); }}
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

export default LeadStats;