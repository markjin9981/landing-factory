import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LANDING_CONFIGS_JSON from '../../data/landingConfigs.json';
import { LandingConfig } from '../../types';
import { fetchLandingConfigs, fetchLeads } from '../../services/googleSheetService';
import { fetchAllLandingConfigsWithMeta, getVisitCountsByLandingId, ConfigMetadata } from '../../services/supabaseService';
import { deleteConfigFromGithub, triggerDeployWorkflow, getGithubToken } from '../../services/githubService';
import { Plus, Edit, ExternalLink, Database, UserCog, Globe, Activity, Loader2, Link2, Trash2, Copy, FileText, Rocket, Calendar, Clock, Users, TrendingUp, MessageSquare, Layers, Sparkles } from 'lucide-react';

import OgStatusBadge from '../../components/OgStatusBadge';

const AdminDashboard: React.FC = () => {
    const LANDING_CONFIGS = LANDING_CONFIGS_JSON as unknown as Record<string, LandingConfig>;

    const [configs, setConfigs] = useState<LandingConfig[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'lead_count_desc' | 'last_lead_desc'>('newest');
    const [deploying, setDeploying] = useState(false);

    // NEW: Config metadata and visit counts for enhanced display
    const [configMetas, setConfigMetas] = useState<Map<string, ConfigMetadata>>(new Map());
    const [visitCounts, setVisitCounts] = useState<Map<string, number>>(new Map());

    // Helper: Parse Date
    const parseDate = (dateStr: string) => {
        if (!dateStr) return 0;
        try {
            return new Date(dateStr).getTime();
        } catch (e) { return 0; }
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Reset page on sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [sortOrder]);

    // 2. Computed Stats (Map for fast lookup)
    const statsMap = React.useMemo(() => {
        const map = new Map<string, { count: number, lastInfoTime: number }>();

        leads.forEach(lead => {
            const id = String(lead['Landing ID'] || 'unknown');
            const data = map.get(id) || { count: 0, lastInfoTime: 0 };

            data.count++;
            // Try Timestamp field or implicit
            const ts = parseDate(lead['Timestamp']);
            if (ts > data.lastInfoTime) data.lastInfoTime = ts;

            map.set(id, data);
        });
        return map;
    }, [leads]);

    // 3. Sorting & Filtering
    const sortedConfigs = React.useMemo(() => {
        let sorted = [...configs];

        sorted.sort((a, b) => {
            const idA = Number(a.id) || 0;
            const idB = Number(b.id) || 0;
            const statsA = statsMap.get(a.id) || { count: 0, lastInfoTime: 0 };
            const statsB = statsMap.get(b.id) || { count: 0, lastInfoTime: 0 };

            switch (sortOrder) {
                case 'oldest':
                    return idA - idB; // ID Asc
                case 'lead_count_desc':
                    if (statsB.count !== statsA.count) return statsB.count - statsA.count;
                    return idB - idA; // Tie-break with ID
                case 'last_lead_desc':
                    if (statsB.lastInfoTime !== statsA.lastInfoTime) return statsB.lastInfoTime - statsA.lastInfoTime;
                    return idB - idA;
                case 'newest':
                default:
                    // ID Desc (Newest) logic
                    if (idA !== 0 && idB !== 0) return idB - idA;
                    return String(b.id).localeCompare(String(a.id));
            }
        });
        return sorted;
    }, [configs, sortOrder, statsMap]);

    // 4. Pagination
    useEffect(() => { setCurrentPage(1); }, [sortOrder, configs.length]);

    const currentConfigs = sortedConfigs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // 1. Initial Data Fetch
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch Configs, Leads, Metas, and Visit counts in parallel
                const [remoteConfigs, leadsData, configMetaList, visitCountMap] = await Promise.all([
                    fetchLandingConfigs(),
                    fetchLeads(),
                    fetchAllLandingConfigsWithMeta(),
                    getVisitCountsByLandingId()
                ]);

                // Build metadata map
                const metaMap = new Map<string, ConfigMetadata>();
                configMetaList.forEach(meta => metaMap.set(meta.id, meta));
                setConfigMetas(metaMap);
                setVisitCounts(visitCountMap);

                // Merge Configs (Local Drafts > Remote)
                const configMap = new Map<string, LandingConfig>();

                // Base
                Object.values(LANDING_CONFIGS).forEach(c => configMap.set(c.id, c));

                // Remote
                if (Array.isArray(remoteConfigs)) {
                    remoteConfigs.forEach(c => configMap.set(c.id, c));
                }

                // Local Drafts
                try {
                    const stored = localStorage.getItem('landing_drafts');
                    if (stored) {
                        const drafts = JSON.parse(stored);
                        Object.values(drafts).forEach((d: any) => configMap.set(d.id, d));
                    }
                } catch (e) { console.error(e); }

                setConfigs(Array.from(configMap.values()));
                setLeads(Array.isArray(leadsData) ? leadsData : []);

            } catch (err) {
                console.error("Dashboard Load Error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

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

    // NEW: Page Type Badge (표준형/스텝형/챗봇 전용)
    const getTypeBadge = (config: LandingConfig) => {
        const template = config.template || 'standard';
        switch (template) {
            case 'dynamic_step':
                return (
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 flex items-center">
                        <Layers className="w-3 h-3 mr-1" /> 스텝형
                    </span>
                );
            case 'chatbot':
                return (
                    <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 flex items-center">
                        <MessageSquare className="w-3 h-3 mr-1" /> 챗봇 전용
                    </span>
                );
            default:
                return (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center">
                        <FileText className="w-3 h-3 mr-1" /> 표준형
                    </span>
                );
        }
    };

    // NEW: AI Chatbot Badge
    const getAIChatbotBadge = (config: LandingConfig) => {
        if (config.rehabChatConfig?.isEnabled) {
            return (
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" /> AI 챗봇
                </span>
            );
        }
        return null;
    };

    // NEW: Date Helper Functions
    const getCreatedDate = (config: LandingConfig): Date | null => {
        const meta = configMetas.get(config.id);

        // 1. Try Supabase created_at first
        if (meta?.created_at) {
            return new Date(meta.created_at);
        }

        // 2. Fallback: Parse ID as timestamp
        const timestamp = parseInt(config.id);
        if (!isNaN(timestamp) && timestamp > 1600000000000 && timestamp < 2000000000000) {
            return new Date(timestamp);
        }

        return null;
    };

    const getUpdatedDate = (config: LandingConfig): Date | null => {
        const meta = configMetas.get(config.id);
        if (meta?.updated_at) {
            return new Date(meta.updated_at);
        }
        return null;
    };

    const formatRelativeDate = (date: Date | null): string => {
        if (!date) return '-';

        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '오늘';
        if (days === 1) return '어제';
        if (days < 7) return `${days}일 전`;
        if (days < 30) return `${Math.floor(days / 7)}주 전`;
        if (days < 365) return `${Math.floor(days / 30)}개월 전`;
        return date.toLocaleDateString('ko-KR');
    };

    // NEW: Calculate conversion rate
    const getConversionRate = (configId: string): string => {
        const visits = visitCounts.get(configId) || 0;
        const leadCount = statsMap.get(configId)?.count || 0;

        if (visits === 0) return '-';
        const rate = (leadCount / visits) * 100;
        return rate.toFixed(1) + '%';
    };

    const handleDuplicate = (targetConfig: LandingConfig) => {
        if (!confirm(`'${targetConfig.title}' 페이지를 복제하시겠습니까?\n\n복제된 페이지는 '작성 중' 상태로 생성됩니다.`)) return;

        // 1. Generate New ID
        const newId = String(Date.now());

        // 2. Deep Clone & Modify
        const newConfig = JSON.parse(JSON.stringify(targetConfig));
        newConfig.id = newId;
        newConfig.title = `${targetConfig.title} (복제본)`;
        if (newConfig.hero) {
            newConfig.hero.headline = `[복제] ${newConfig.hero.headline}`;
        }

        // 3. Save to Local Drafts
        const stored = localStorage.getItem('landing_drafts');
        const drafts = stored ? JSON.parse(stored) : {};
        drafts[newId] = newConfig;
        localStorage.setItem('landing_drafts', JSON.stringify(drafts));

        // 4. Reload List
        alert('페이지가 복제되었습니다.\n목록 상단에 "작성 중" 상태로 추가됩니다.');
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-5 flex justify-between items-center">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-blue-600 rounded-lg">
                        <Database className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h1 className="text-base md:text-xl font-bold">Landing Admin</h1>
                </div>
                <div className="flex gap-2 md:gap-3 items-center">
                    <Link to="/" className="hidden md:inline-block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">
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

            <main className="max-w-6xl mx-auto p-4 md:p-8">

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

                    {/* Policy Manager Link */}
                    <Link
                        to="/admin/policy"
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-400 transition-colors flex items-center gap-4 group"
                    >
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">법원 정책 관리</h3>
                            <p className="text-xs text-gray-500">2026 개정법 및 관할 법원 설정</p>
                        </div>
                    </Link>

                    {/* Deploy Button */}
                    <button
                        onClick={async () => {
                            if (!getGithubToken()) {
                                alert('GitHub Token이 설정되지 않았습니다.\n설정 > 이미지 호스팅 설정에서 GitHub Token을 먼저 입력해주세요.');
                                return;
                            }
                            if (!confirm('지금 바로 GitHub Pages에 배포하시겠습니까?\n\n랜딩 페이지 변경사항이 즉시 반영됩니다.\n(약 1분 소요)')) return;

                            setDeploying(true);
                            const result = await triggerDeployWorkflow();
                            setDeploying(false);
                            alert(result.message || (result.success ? '배포 시작!' : '배포 실패'));
                        }}
                        disabled={deploying}
                        className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-xl border border-emerald-400 shadow-sm hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-4 group disabled:opacity-60 disabled:cursor-wait text-left"
                    >
                        <div className="p-3 bg-white/20 text-white rounded-lg group-hover:bg-white/30 transition-colors">
                            {deploying ? <Loader2 className="w-6 h-6 animate-spin" /> : <Rocket className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-white">{deploying ? '배포 중...' : '즉시 배포'}</h3>
                            <p className="text-xs text-emerald-100">SEO 메타태그 즉시 반영</p>
                        </div>
                    </button>
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
                                    onChange={(e) => setSortOrder(e.target.value as any)}
                                    className="bg-transparent border-none outline-none text-gray-800 font-medium cursor-pointer"
                                >
                                    <option value="newest">최신순 (Newest)</option>
                                    <option value="oldest">오래된순 (Oldest)</option>
                                    <option value="lead_count_desc">DB입력 많은 순</option>
                                    <option value="last_lead_desc">최근 DB입력 순</option>
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

                {
                    loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {currentConfigs.map((config) => {
                                const pageStats = statsMap.get(config.id);
                                const visits = visitCounts.get(config.id) || 0;
                                const createdDate = getCreatedDate(config);
                                const updatedDate = getUpdatedDate(config);

                                return (
                                    <div key={config.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 transition-colors">
                                        {/* Row 1: ID + Badges */}
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono font-bold">
                                                /{config.id}
                                            </span>
                                            {getTypeBadge(config)}
                                            {getStatusBadge(config.id)}
                                            {getAIChatbotBadge(config)}
                                            <OgStatusBadge id={config.id} expectedTitle={config.title || config.hero?.headline || ''} />
                                        </div>

                                        {/* Row 2: Title & Headline */}
                                        <div className="mb-3">
                                            <h3 className="text-lg font-bold text-gray-800 mb-1">{config.title || '(제목 없음)'}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-1">{config.hero?.headline || '(헤드라인 없음)'}</p>
                                        </div>

                                        {/* Row 3: Stats Info Bar */}
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4 py-2 px-3 bg-gray-50 rounded-lg">
                                            {/* Created Date */}
                                            <div className="flex items-center gap-1" title={createdDate ? createdDate.toLocaleString('ko-KR') : '알 수 없음'}>
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span>생성: <strong className="text-gray-700">{formatRelativeDate(createdDate)}</strong></span>
                                            </div>

                                            {/* Updated Date */}
                                            {updatedDate && (
                                                <div className="flex items-center gap-1" title={updatedDate.toLocaleString('ko-KR')}>
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>수정: <strong className="text-gray-700">{formatRelativeDate(updatedDate)}</strong></span>
                                                </div>
                                            )}

                                            {/* Separator */}
                                            <div className="hidden md:block w-px h-4 bg-gray-300"></div>

                                            {/* Visit Count */}
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                                <span>방문: <strong className="text-gray-700">{visits > 0 ? visits.toLocaleString() : '-'}</strong></span>
                                            </div>

                                            {/* Lead Count */}
                                            <div className="flex items-center gap-1">
                                                <Database className="w-3.5 h-3.5 text-green-500" />
                                                <span>리드: <strong className="text-green-700">{pageStats?.count || 0}건</strong></span>
                                            </div>

                                            {/* Conversion Rate */}
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                                                <span>전환율: <strong className="text-blue-700">{getConversionRate(config.id)}</strong></span>
                                            </div>
                                        </div>

                                        {/* Row 4: Action Buttons */}

                                        <div className="flex flex-wrap items-center gap-2 md:gap-3 border-t md:border-t-0 pt-4 md:pt-0">
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
                                                className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 border border-red-200 bg-red-50 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                                                title="페이지 삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDuplicate(config)}
                                                className="flex items-center justify-center w-9 h-9 md:w-auto md:px-4 md:py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                                title="페이지 복제"
                                            >
                                                <Copy className="w-4 h-4 md:mr-2" />
                                                <span className="hidden md:inline">복제</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const url = `${window.location.origin}/${config.id}`;
                                                    navigator.clipboard.writeText(url);
                                                    alert('배포 주소가 복사되었습니다.\n' + url);
                                                }}
                                                className="flex items-center justify-center w-9 h-9 md:w-auto md:px-4 md:py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                                title="배포 링크 복사"
                                            >
                                                <Link2 className="w-4 h-4 md:mr-2" />
                                                <span className="hidden md:inline">링크</span>
                                            </button>
                                            <Link
                                                to={`/${config.id}`}
                                                target="_blank"
                                                className="flex items-center justify-center w-9 h-9 md:w-auto md:px-4 md:py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                                title="미리보기"
                                            >
                                                <ExternalLink className="w-4 h-4 md:mr-2" />
                                                <span className="hidden md:inline">미리보기</span>
                                            </Link>
                                            <Link
                                                to={`/admin/editor/${config.id}`}
                                                className="flex items-center justify-center px-3 py-2 md:px-4 bg-gray-900 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors"
                                            >
                                                <Edit className="w-4 h-4 mr-1 md:mr-2" />
                                                수정
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                            {configs.length === 0 && (
                                <div className="text-center py-20 bg-gray-100 rounded-xl border-dashed border-2 border-gray-300">
                                    <p className="text-gray-500">생성된 랜딩페이지가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    )
                }
                {/* Pagination Controls */}
                {
                    !loading && configs.length > 0 && (
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
                    )
                }
            </main >
        </div >
    );
};

export default AdminDashboard;