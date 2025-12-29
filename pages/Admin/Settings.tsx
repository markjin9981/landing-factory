import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Mail, Lock, CheckCircle, AlertCircle, Shield, Smartphone, Monitor, Globe, LogOut } from 'lucide-react';
import { sendAdminNotification, fetchAdminSessions, revokeSession } from '../../services/googleSheetService';
import { authService } from '../../services/authService';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
    const [msg, setMsg] = useState('');

    // Session State
    const [sessions, setSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const currentSessionId = authService.getSessionId();

    useEffect(() => {
        const creds = authService.getCredentials();
        setEmail(creds.email);
        setPassword(creds.password);

        loadSessions();
    }, []);

    const loadSessions = async () => {
        setLoadingSessions(true);
        const data = await fetchAdminSessions();
        setSessions(data);
        setLoadingSessions(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            alert('비밀번호는 필수입니다.');
            return;
        }

        setStatus('saving');

        // Save using Auth Service
        authService.updateCredentials(email, password);

        // Send email notification if email provided
        if (email) {
            const success = await sendAdminNotification(
                email,
                '[Landing Factory] 관리자 계정 정보 변경 알림',
                `관리자 비밀번호가 변경되었습니다.\n\n변경된 비밀번호: ${password}\n\n본인이 변경한 것이 아니라면 즉시 확인하세요.`
            );
            if (success) {
                setMsg('저장 및 이메일 발송 완료');
            } else {
                setMsg('저장 완료 (이메일 발송 실패)');
            }
        } else {
            setMsg('저장 완료');
        }

        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
    };

    const handleRevoke = async (targetId: string) => {
        if (!confirm('정말로 이 기기를 로그아웃 시키겠습니까?')) return;

        const success = await revokeSession(targetId);
        if (success) {
            alert('로그아웃 처리되었습니다.');
            loadSessions();
        } else {
            alert('처리에 실패했습니다.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold">마이페이지 (설정)</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-8 space-y-8">
                {/* 1. Account Settings */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        관리자 계정 설정
                    </h2>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-sm text-yellow-800">
                        <strong className="block mb-1">주의사항</strong>
                        이 시스템은 서버가 없는 구조이므로 계정 정보는 <strong>현재 브라우저(LocalStorage)</strong>에 저장됩니다.
                        브라우저 캐시를 삭제하면 설정이 초기화될 수 있습니다.
                        비밀번호 변경 시 입력한 이메일로 백업 메일이 발송됩니다.
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">관리자 이메일 (ID)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="example@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">변경할 비밀번호</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    placeholder="새로운 비밀번호 입력"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <button
                                type="submit"
                                disabled={status === 'saving'}
                                className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center"
                            >
                                {status === 'saving' ? '처리중...' : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        설정 저장하기
                                    </>
                                )}
                            </button>
                            {status === 'success' && (
                                <div className="mt-4 flex items-center justify-center text-green-600 text-sm font-bold animate-fade-in">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    {msg}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* 2. Login Security & Sessions */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-green-600" />
                            로그인 보안 / 기기 관리
                        </h2>
                        <button
                            onClick={loadSessions}
                            className="text-sm text-gray-500 hover:text-gray-900 underline"
                        >
                            새로고침
                        </button>
                    </div>

                    <div className="space-y-4">
                        {loadingSessions ? (
                            <p className="text-center text-gray-500 py-4">활동 기록을 불러오는 중...</p>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-500 text-sm">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                기록된 로그인 활동이 없습니다.
                                <p className="text-xs mt-1 text-gray-400">
                                    (최근 배포된 버전에서 로그인해야 기록됩니다)
                                </p>
                            </div>
                        ) : (
                            sessions.map((session) => {
                                const isCurrent = session.session_id === currentSessionId;
                                return (
                                    <div
                                        key={session.session_id}
                                        className={`flex items-center justify-between p-4 rounded-lg border ${isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {session.device.toLowerCase().includes('phone') || session.device.toLowerCase().includes('mobile')
                                                    ? <Smartphone className="w-5 h-5" />
                                                    : <Monitor className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                    {session.device}
                                                    {isCurrent && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">현재 기기</span>}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                    <Globe className="w-3 h-3" /> {session.ip}
                                                    <span className="text-gray-300">|</span>
                                                    {session.timestamp}
                                                </div>
                                            </div>
                                        </div>

                                        {!isCurrent && (
                                            <button
                                                onClick={() => handleRevoke(session.session_id)}
                                                className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center"
                                            >
                                                <LogOut className="w-3 h-3 mr-1" />
                                                로그아웃
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;