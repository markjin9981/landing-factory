import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, AlertCircle, Shield, Smartphone, Monitor, Globe, LogOut, Plus, Trash2, User, UserPlus } from 'lucide-react';
import { fetchAdminSessions, revokeSession, fetchAdminUsers, addAdminUser, removeAdminUser } from '../../services/googleSheetService';
import { authService } from '../../services/authService';

const Settings: React.FC = () => {
    const navigate = useNavigate();

    // Session State
    const [sessions, setSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const currentSessionId = authService.getSessionId();
    const currentUserEmail = authService.getUserEmail();

    // Admin Users State
    const [adminUsers, setAdminUsers] = useState<any[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [addingAdmin, setAddingAdmin] = useState(false);

    useEffect(() => {
        loadSessions();
        loadAdminUsers();
    }, []);

    const loadAdminUsers = async () => {
        setLoadingAdmins(true);
        const users = await fetchAdminUsers();
        setAdminUsers(users);
        setLoadingAdmins(false);
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminEmail) return;

        if (!confirm(`${newAdminEmail} 님을 관리자로 추가하시겠습니까?`)) return;

        setAddingAdmin(true);
        const result = await addAdminUser(newAdminEmail);

        // Since we use no-cors, we can't confirm success easily.
        // We wait a bit and reload list.
        setTimeout(async () => {
            await loadAdminUsers();
            setAddingAdmin(false);
            setNewAdminEmail('');
            alert('초대 요청을 보냈습니다. (잠시 후 목록에 나타나지 않으면 권한 설정을 확인하세요)');
        }, 1500);
    };

    const handleRemoveAdmin = async (email: string) => {
        if (!confirm(`${email} 님의 관리자 권한을 삭제하시겠습니까?`)) return;

        await removeAdminUser(email);
        setTimeout(() => {
            loadAdminUsers();
            alert('삭제 요청을 보냈습니다.');
        }, 1000);
    };

    const loadSessions = async () => {
        setLoadingSessions(true);
        const data = await fetchAdminSessions();
        setSessions(data);
        setLoadingSessions(false);
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
                {/* 1. Account Profile (Read-Only for Google Auth) */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        관리자 계정 정보
                    </h2>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-sm text-blue-800">
                        <strong className="block mb-1">Google 계정 연동됨</strong>
                        현재 <strong>Google Sign-In</strong>을 통해 로그인되어 있습니다.<br />
                        비밀번호나 계정 정보 변경은 구글 계정 설정에서 가능합니다.
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">현재 로그인된 이메일</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={currentUserEmail || '알 수 없음'}
                                    readOnly
                                    className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Admin User Management */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-purple-600" />
                        관리자 권한 관리
                    </h2>

                    <div className="mb-6">
                        <form onSubmit={handleAddAdmin} className="flex gap-2">
                            <input
                                type="email"
                                placeholder="추가할 관리자의 Gmail 입력"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            />
                            <button
                                type="submit"
                                disabled={addingAdmin}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center"
                            >
                                {addingAdmin ? '추가 중...' : <><Plus className="w-4 h-4 mr-1" /> 추가</>}
                            </button>
                        </form>
                    </div>

                    <div className="space-y-3">
                        {loadingAdmins ? (
                            <p className="text-gray-500 text-center py-4">목록 불러오는 중...</p>
                        ) : adminUsers.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">등록된 관리자가 없습니다. (오류)</p>
                        ) : (
                            adminUsers.map((user, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-full border border-gray-200">
                                            <User className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 text-sm">{user.email}</div>
                                            <div className="text-xs text-gray-500">{user.name} {user.memo ? `(${user.memo})` : ''}</div>
                                        </div>
                                    </div>

                                    {user.email !== currentUserEmail && (
                                        <button
                                            onClick={() => handleRemoveAdmin(user.email)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="권한 삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    {user.email === currentUserEmail && (
                                        <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">본인</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Login Sessions */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-green-600" />
                            기기 접속 현황
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