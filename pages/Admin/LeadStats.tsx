import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2, LogOut, ChevronDown, ChevronUp, Database, Calendar } from 'lucide-react';
import { fetchLeads, fetchLandingConfigs } from '../../services/googleSheetService';
import { LandingConfig, FormField } from '../../types';

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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTs = today.getTime();

        let todayCount = 0;
        let totalCount = leads.length;

        leads.forEach(lead => {
            if (parseKoreanDate(lead['Timestamp']) >= todayTs) {
                todayCount++;
            }
        });

        return { todayCount, totalCount };
    }, [leads]);

    // Helper: Determine Columns for a Group
    const getColumnsForGroup = (landingId: string, groupLeads: any[]) => {
        const config = configs.find(c => String(c.id) === landingId);

        // 1. Standard Columns
        const columns = [
            { key: 'Timestamp', label: '시간' },
        ];

        // 2. Dynamic Columns from Config
        const usedKeys = new Set(['Timestamp', 'Landing ID']);

        if (config?.formConfig?.fields) {
            config.formConfig.fields.forEach((field: FormField) => {
                columns.push({ key: field.id, label: field.label });
                usedKeys.add(field.id);
                // Also add lower case version to excluded set just in case
                usedKeys.add(field.id.toLowerCase());
            });
        } else {
            // Fallback: If no config, try to guess 'name' and 'phone'
            if (groupLeads.length > 0) {
                const sample = groupLeads[0];
                if (sample['Name']) { columns.push({ key: 'Name', label: '이름' }); usedKeys.add('Name'); }
                if (sample['Phone']) { columns.push({ key: 'Phone', label: '연락처' }); usedKeys.add('Phone'); }
            }
        }

        // 3. Collect "Extra" keys found in data but not in config
        // meaningful extra data (e.g. utm tags, or fields added later)
        const extraKeys = new Set<string>();
        groupLeads.forEach(lead => {
            Object.keys(lead).forEach(k => {
                if (usedKeys.has(k) || usedKeys.has(k.toLowerCase())) return;
                if (SYSTEM_FIELDS.includes(k.toLowerCase())) return;
                if (k.startsWith('consent_')) return;
                extraKeys.add(k);
            });
        });

        // Always put 'Memo' at the end if it exists
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

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-xl font-bold">DB 수집 현황</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadData} className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-bold">
                        <RefreshCw className="w-4 h-4 mr-2" /> 새로고침
                    </button>
                    <button onClick={() => { sessionStorage.removeItem('admin_auth'); navigate('/admin/login'); }} className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-bold">
                        <LogOut className="w-4 h-4 mr-2" /> 로그아웃
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8 space-y-8">

                {/* 1. Dashboard Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-bold mb-1">오늘 수집된 DB</p>
                            <h2 className="text-3xl font-bold text-gray-900">{stats.todayCount} <span className="text-lg text-gray-400 font-normal">건</span></h2>
                        </div>
                    </div>
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

                        // Preview only top 5
                        const previewLeads = groupLeads.slice(0, 5);

                        return (
                            <div key={landingId} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fade-in-up">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 border border-gray-200 rounded-lg">
                                            <Database className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                                            <p className="text-xs text-gray-400 font-mono">ID: {landingId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                            총 {groupLeads.length} 건
                                        </span>
                                        <button
                                            onClick={() => navigate(`/admin/stats/${landingId}`)}
                                            className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-blue-600 bg-white border border-gray-300 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            상세보기 <ArrowLeft className="w-4 h-4 rotate-180" />
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
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
                            </div>
                        );
                    })
                )}
            </main>
        </div>
    );
};

export default LeadStats;