import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LANDING_CONFIGS } from '../../data/landingConfigs';
import { LandingConfig } from '../../types';
import { Plus, Edit, ExternalLink, Database, BarChart, UserCog, Globe, Activity } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [localConfigs, setLocalConfigs] = useState<LandingConfig[]>([]);

  useEffect(() => {
    // Merge hardcoded configs with any local drafts (simulated persistence)
    const stored = localStorage.getItem('landing_drafts');
    const drafts = stored ? JSON.parse(stored) : {};
    
    const hardcoded = Object.values(LANDING_CONFIGS);
    const combined = [...hardcoded];
    
    Object.values(drafts).forEach((d: any) => {
        if (!combined.find(c => c.id === d.id)) {
            combined.push(d);
        }
    });

    setLocalConfigs(combined);
  }, []);

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

        <div className="flex justify-between items-end mb-4 border-b pb-2">
            <div>
                <h2 className="text-lg font-bold mb-1">보유 중인 랜딩페이지</h2>
                <p className="text-gray-500 text-sm">
                    코드(`data/landingConfigs.ts`) 또는 로컬 초안 목록
                </p>
            </div>
            <Link 
                to="/admin/editor" 
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-md"
            >
                <Plus className="w-4 h-4 mr-2" />
                새 페이지 만들기
            </Link>
        </div>

        <div className="grid gap-6">
          {localConfigs.map((config) => (
            <div key={config.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-300 transition-colors">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono font-bold">
                            /{config.id}
                        </span>
                        {LANDING_CONFIGS[config.id] ? (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                배포됨 (Hardcoded)
                            </span>
                        ) : (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                                로컬 초안 (Draft)
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{config.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{config.hero.headline}</p>
                </div>

                <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0">
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
          
          {localConfigs.length === 0 && (
              <div className="text-center py-20 bg-gray-100 rounded-xl border-dashed border-2 border-gray-300">
                  <p className="text-gray-500">생성된 랜딩페이지가 없습니다.</p>
              </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;