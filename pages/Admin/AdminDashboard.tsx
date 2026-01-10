import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LANDING_CONFIGS_JSON from '../../data/landingConfigs.json';
import { LandingConfig } from '../../types';
import { fetchLandingConfigs, fetchLeads } from '../../services/googleSheetService';
import { deleteConfigFromGithub } from '../../services/githubService';
import { Plus, Edit, ExternalLink, Database, BarChart, UserCog, Globe, Activity, Loader2, Link2, Trash2 } from 'lucide-react';

const LANDING_CONFIGS = LANDING_CONFIGS_JSON as Record<string, LandingConfig>;

import OgStatusBadge from '../../components/OgStatusBadge';

const AdminDashboard: React.FC = () => {
    const [configs, setConfigs] = useState<LandingConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Reset page on sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [sortOrder]);

    const currentConfigs = configs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        const loadAllConfigs = async () => {
            const configMap = new Map<string, LandingConfig>();

            // 1. Hardcoded (Base)
            Object.values(LANDING_CONFIGS).forEach(c => configMap.set(c.id, c));

            // 2. Remote (Google Sheets) - Overwrites Hardcoded
            const remotePromise = fetchLandingConfigs()
                .then(remoteConfigs => {
                    remoteConfigs.forEach(c => configMap.set(c.id, c));
                })
                .catch(e => {
                    console.error("Failed to load remote configs", e);
                });

            // 3. Local Drafts - Overwrites everything (Highest priority for editor)
            try {
                const stored = localStorage.getItem('landing_drafts');
                if (stored) {
                    const drafts = JSON.parse(stored);
                    Object.values(drafts).forEach((d: any) => {
                        configMap.set(d.id, d);
                    });
                }
            } catch (e) {
                console.error("Failed to load drafts", e);
            }

            // Wait for remote fetch or timeout
            console.log("AdminDashboard: Waiting for configs...");
            await Promise.race([
                remotePromise,
                new Promise(resolve => setTimeout(resolve, 12000)) // Safety timeout slightly longer than fetch timeout
            ]);
            console.log("AdminDashboard: Fetch/Timeout finished.");

            try {
                // Convert to array and sort by ID
                const sorted = Array.from(configMap.values()).sort((a, b) => {
                    // Safety check for ID
                    if (!a?.id || !b?.id) return 0;

                    // Try numeric sort
                    const idA = Number(a.id);
                    const idB = Number(b.id);

                    // Compare based on sortOrder
                    if (!isNaN(idA) && !isNaN(idB)) {
                        return sortOrder === 'newest' ? idB - idA : idA - idB;
                    }
                    return sortOrder === 'newest'
                        ? String(b.id).localeCompare(String(a.id))
                        : String(a.id).localeCompare(String(b.id));
                });

                console.log("AdminDashboard: Setting configs.", sorted);
                setConfigs(sorted);
            } catch (sortError) {
                console.error("AdminDashboard: Error sorting/setting configs", sortError);
                // If sort fails, just show unsorted values safely
                setConfigs(Array.from(configMap.values()));
            } finally {
                console.log("AdminDashboard: Disabling loading.");
                setLoading(false);
            }
        };

        loadAllConfigs();
    }, [sortOrder]);

    const getStatusBadge = (id: string) => {
        const isDraft = localStorage.getItem('landing_drafts') && JSON.parse(localStorage.getItem('landing_drafts') || '{}')[id];
        const isSystem = LANDING_CONFIGS[id];

        if (isDraft) {
            return (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 flex items-center">
                    <Edit className="w-3 h-3 mr-1" /> 작성 중 (Draft)
                </span>
            );
        }
        if (isSystem) {
            return (
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full border border-gray-200 flex items-center">
                    <Database className="w-3 h-3 mr-1" /> 기본 (System)
                </span>
            );
        }
        return (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 flex items-center">
                <Globe className="w-3 h-3 mr-1" /> 배포됨 (Live)
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <Database className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold">Landing Factory Admin</h1>
                </div>
                <div className="flex gap-3 items-center">
                    <Link to="/" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">
                        사이트 홈으로
                    </Link>
                    <Link
                        to="/admin/settings"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="설정"
                    >
                        <UserCog className="w-5 h-5" />
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-8">

                {/* Quick Stats Nav */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Link
                        to="/admin/stats"
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-400 transition-colors flex items-center gap-4"
                    >
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">DB 수집 내역</h3>
                            <p className="text-xs text-gray-500">신청된 고객 정보 확인</p>
                        </div>
                    </Link>

                    <Link
                        to="/admin/traffic-stats"
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-400 transition-colors flex items-center gap-4"
                    >
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">접속 통계</h3>
                            <p className="text-xs text-gray-500">일별 방문자 및 전환율</p>
                        </div>
                    </Link>

                    <Link
                        to="/admin/traffic-logs"
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-400 transition-colors flex items-center gap-4"
                    >
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">유입 경로</h3>
                            <p className="text-xs text-gray-500">상세 접속 로그 및 IP</p>
                        </div>
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6 border-b pb-4">
                    <div className="w-full md:w-auto">
                        <div className="flex justify-between items-center mb-2 md:mb-1">
                            <h2 className="text-xl font-bold text-gray-800">보유 중인 랜딩페이지</h2>
                            {/* Sort Dropdown - Mobile only placement could be here, but let's keep it consistent */}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <p className="text-gray-500 text-sm hidden md:block">
                                Google Sheets와 연동된 모든 랜딩페이지 목록입니다.
                            </p>

                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white md:bg-gray-100 md:px-3 py-1 rounded-lg self-start">
                                <span className="font-bold">정렬:</span>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                                    className="bg-transparent border-none outline-none text-gray-800 font-medium cursor-pointer"
                                >
                                    <option value="newest">최신순 (Newest)</option>
                                    <option value="oldest">오래된순 (Oldest)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <Link
                        to="/admin/editor"
                        className="flex items-center justify-center w-full md:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold shadow-md"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        새 페이지 만들기
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {currentConfigs.map((config) => (
                            <div key={config.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-300 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono font-bold">
                                            /{config.id}
                                        </span>
                                        {getStatusBadge(config.id)}
                                        <OgStatusBadge id={config.id} expectedTitle={config.title || config.hero?.headline || ''} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">{config.title || '(제목 없음)'}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-1">{config.hero?.headline || '(헤드라인 없음)'}</p>
                                </div>

                                <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                                    <button
                                        onClick={async () => {
                                            if (confirm(`정말 '${config.title}' 페이지를 삭제하시겠습니까?\n\n삭제 후에는 복구할 수 없습니다.\n(GitHub 배포 파일도 함께 삭제됩니다)`)) {
                                                // 1. Delete from Sheet
                                                const sheetSuccess = await import('../../services/googleSheetService').then(m => m.deleteLandingConfig(config.id));

                                                // 2. Delete from GitHub (Fire and forget, or wait?)
                                                // Let's wait to inform user.
                                                let message = '';
                                                if (sheetSuccess) {
                                                    message += 'DB(구글 시트)에서 삭제되었습니다.\n';

                                                    try {
                                                        const ghRes = await deleteConfigFromGithub(config.id);
                                                        if (ghRes.success) {
                                                            message += 'GitHub 배포 파일도 삭제되었습니다.';
                                                        } else {
                                                            message += 'GitHub 삭제 실패: ' + ghRes.message;
                                                        }
                                                    } catch (e) {
                                                        message += 'GitHub 연결 오류 (삭제되지 않았을 수 있습니다)';
                                                    }

                                                    alert(message);
                                                    window.location.reload();
                                                } else {
                                                    alert('삭제에 실패했습니다.');
                                                }
                                            }
                                        }}
                                        className="flex items-center justify-center w-10 h-10 border border-red-200 bg-red-50 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                                        title="페이지 삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/${config.id}`;
                                            navigator.clipboard.writeText(url);
                                            alert('배포 주소가 복사되었습니다.\n' + url);
                                        }}
                                        className="flex items-center justify-center px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                        title="배포 링크 복사"
                                    >
                                        <Link2 className="w-4 h-4 mr-2" />
                                        링크 복사
                                    </button>
                                    <Link
                                        to={`/${config.id}`}
                                        target="_blank"
                                        className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        미리보기
                                    </Link>
                                    <Link
                                        to={`/admin/editor/${config.id}`}
                                        className="flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        수정하기
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {configs.length === 0 && (
                            <div className="text-center py-20 bg-gray-100 rounded-xl border-dashed border-2 border-gray-300">
                                <p className="text-gray-500">생성된 랜딩페이지가 없습니다.</p>
                            </div>
                        )}
                    </div>
                {/* Pagination Controls */}
                {!loading && configs.length > 0 && (
                    <div className="mt-8 flex justify-center items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            이전
                        </button>

                        {Array.from({ length: Math.ceil(configs.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setCurrentPage(p)}
                                className={`px-3 py-1 rounded border ${currentPage === p
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(configs.length / ITEMS_PER_PAGE), p + 1))}
                            disabled={currentPage === Math.ceil(configs.length / ITEMS_PER_PAGE)}
                            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            다음
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;