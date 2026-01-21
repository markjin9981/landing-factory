import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, AlertCircle, Shield, Smartphone, Monitor, Globe, LogOut, Plus, Trash2, User, UserPlus, Key, Eye, EyeOff, Save, CheckCircle, Cloud } from 'lucide-react';
import { fetchAdminSessions, revokeSession, fetchAdminUsers, addAdminUser, removeAdminUser, fetchGlobalSettings, saveGlobalSettings } from '../../services/googleSheetService';
import { authService } from '../../services/authService';
import { GlobalSettings } from '../../types';

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

    // NEW: Global Settings State (for ImgBB API Key)
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
    const [imgbbApiKey, setImgbbApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false); // ImgBB API Key visibility
    const [savingApiKey, setSavingApiKey] = useState(false);
    const [apiKeySaved, setApiKeySaved] = useState(false);

    // Cloudinary states
    const [cloudinaryCloudName, setCloudinaryCloudName] = useState('');
    const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState('');
    const [showCloudinaryKeys, setShowCloudinaryKeys] = useState(false); // Cloudinary keys visibility
    const [savingCloudinary, setSavingCloudinary] = useState(false);
    const [cloudinarySaved, setCloudinarySaved] = useState(false);

    // NEW: Kakao Map Settings State
    const [kakaoApiKey, setKakaoApiKey] = useState('');
    const [showKakaoKey, setShowKakaoKey] = useState(false); // Kakao API Key visibility

    // NEW: Gemini API Key State
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [showGeminiKey, setShowGeminiKey] = useState(false); // Gemini API Key visibility
    const [savingGeminiKey, setSavingGeminiKey] = useState(false);
    const [geminiKeySaved, setGeminiKeySaved] = useState(false);

    // NEW: Edit Mode States for UX Upgrade
    const [isEditingImgbb, setIsEditingImgbb] = useState(false);
    const [isEditingCloudinary, setIsEditingCloudinary] = useState(false);
    const [isEditingKakao, setIsEditingKakao] = useState(false);
    const [isEditingGemini, setIsEditingGemini] = useState(false);

    // Track if values have been modified from saved state
    const hasImgbbChanges = globalSettings?.imgbbApiKey !== imgbbApiKey;
    const hasCloudinaryChanges = (globalSettings?.cloudinaryCloudName !== cloudinaryCloudName) ||
        (globalSettings?.cloudinaryUploadPreset !== cloudinaryUploadPreset);
    const hasKakaoChanges = globalSettings?.kakaoApiKey !== kakaoApiKey;
    const hasGeminiChanges = globalSettings?.geminiApiKey !== geminiApiKey;

    // Helper to enter edit mode with confirmation
    const enterEditMode = (section: 'imgbb' | 'cloudinary' | 'kakao' | 'gemini') => {
        const confirmed = window.confirm(
            '⚠️ 주의: 기존 저장된 설정을 수정하시겠습니까?\n\n잘못된 수정은 서비스에 문제를 일으킬 수 있습니다.'
        );
        if (!confirmed) return;

        switch (section) {
            case 'imgbb': setIsEditingImgbb(true); break;
            case 'cloudinary': setIsEditingCloudinary(true); break;
            case 'kakao': setIsEditingKakao(true); break;
            case 'gemini': setIsEditingGemini(true); break;
        }
    };

    // Helper to cancel edit and restore original values
    const cancelEdit = (section: 'imgbb' | 'cloudinary' | 'kakao' | 'gemini') => {
        if (!globalSettings) return;
        switch (section) {
            case 'imgbb':
                setImgbbApiKey(globalSettings.imgbbApiKey || '');
                setIsEditingImgbb(false);
                break;
            case 'cloudinary':
                setCloudinaryCloudName(globalSettings.cloudinaryCloudName || '');
                setCloudinaryUploadPreset(globalSettings.cloudinaryUploadPreset || '');
                setIsEditingCloudinary(false);
                break;
            case 'kakao':
                setKakaoApiKey(globalSettings.kakaoApiKey || '');
                setIsEditingKakao(false);
                break;
            case 'gemini':
                setGeminiApiKey(globalSettings.geminiApiKey || '');
                setIsEditingGemini(false);
                break;
        }
    };


    useEffect(() => {
        loadSessions();
        loadAdminUsers();
        loadGlobalSettings();
    }, []);

    // NEW: Load Global Settings
    const loadGlobalSettings = async () => {
        const settings = await fetchGlobalSettings();
        if (settings) {
            setGlobalSettings(settings);
            setImgbbApiKey(settings.imgbbApiKey || '');
            setCloudinaryCloudName(settings.cloudinaryCloudName || '');
            setCloudinaryUploadPreset(settings.cloudinaryUploadPreset || '');
            setKakaoApiKey(settings.kakaoApiKey || '');
            setGeminiApiKey(settings.geminiApiKey || '');
        } else {
            // First time setup: Init with empty object
            setGlobalSettings({} as GlobalSettings);
        }
    };

    // NEW: Save ImgBB API Key
    const handleSaveApiKey = async () => {
        if (!globalSettings) return;

        // Check if overwriting existing key
        if (globalSettings.imgbbApiKey && globalSettings.imgbbApiKey !== imgbbApiKey) {
            const confirmed = window.confirm(
                '⚠️ 주의: 기존 ImgBB API 키가 이미 설정되어 있습니다.\n\n새 키로 교체하면 기존 키는 복구할 수 없습니다.\n계속하시겠습니까?'
            );
            if (!confirmed) return;
        }

        setSavingApiKey(true);
        const newSettings = { ...globalSettings, imgbbApiKey };
        await saveGlobalSettings(newSettings);
        setGlobalSettings(newSettings);
        setSavingApiKey(false);
        setApiKeySaved(true);
        setTimeout(() => setApiKeySaved(false), 2000);
    };

    // NEW: Save Cloudinary Settings
    const handleSaveCloudinary = async () => {
        if (!globalSettings) return;

        // Check if overwriting existing settings
        if ((globalSettings.cloudinaryCloudName || globalSettings.cloudinaryUploadPreset) &&
            (globalSettings.cloudinaryCloudName !== cloudinaryCloudName ||
                globalSettings.cloudinaryUploadPreset !== cloudinaryUploadPreset)) {
            const confirmed = window.confirm(
                '⚠️ 주의: 기존 Cloudinary 설정이 이미 존재합니다.\n\n새 설정으로 교체하면 기존 설정은 복구할 수 없습니다.\n계속하시겠습니까?'
            );
            if (!confirmed) return;
        }

        setSavingCloudinary(true);
        const newSettings = { ...globalSettings, cloudinaryCloudName, cloudinaryUploadPreset };
        await saveGlobalSettings(newSettings);
        setGlobalSettings(newSettings);
        setSavingCloudinary(false);
        setCloudinarySaved(true);
        setTimeout(() => setCloudinarySaved(false), 2000);
    };

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

                {/* NEW: ImgBB API Key Settings */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Key className="w-5 h-5 text-amber-600" />
                        이미지 호스팅 설정
                    </h2>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
                        <strong className="block mb-1">ImgBB API Key</strong>
                        대용량 이미지 업로드에 필요합니다. <a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">api.imgbb.com</a>에서 무료로 발급받을 수 있습니다.
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                API Key
                                {globalSettings?.imgbbApiKey && !isEditingImgbb && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        저장됨
                                    </span>
                                )}
                                {isEditingImgbb && hasImgbbChanges && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        변경사항 있음
                                    </span>
                                )}
                            </label>

                            {/* VIEW MODE: Show saved value as read-only */}
                            {globalSettings?.imgbbApiKey && !isEditingImgbb ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Key className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={imgbbApiKey}
                                            readOnly
                                            className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                        <div className="absolute right-3 top-3 text-green-600">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => enterEditMode('imgbb')}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 border border-gray-300 text-sm"
                                    >
                                        수정하기
                                    </button>
                                </div>
                            ) : (
                                /* EDIT MODE: Allow input */
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Key className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showApiKey ? 'text' : 'password'}
                                            value={imgbbApiKey}
                                            onChange={(e) => setImgbbApiKey(e.target.value)}
                                            placeholder="ImgBB API Key 입력"
                                            className={`w-full pl-10 pr-12 py-3 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none ${hasImgbbChanges ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {globalSettings?.imgbbApiKey && isEditingImgbb && (
                                        <button
                                            onClick={() => cancelEdit('imgbb')}
                                            className="px-3 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 border border-gray-300"
                                        >
                                            취소
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            await handleSaveApiKey();
                                            setIsEditingImgbb(false);
                                        }}
                                        disabled={savingApiKey || !globalSettings}
                                        className="px-4 py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {savingApiKey ? '저장 중...' : apiKeySaved ? <><CheckCircle className="w-4 h-4" /> 저장됨</> : <><Save className="w-4 h-4" /> 저장</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cloudinary Settings Section */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-sm text-orange-800">
                            <strong className="block mb-1">Cloudinary (빠른 CDN)</strong>
                            고속 글로벌 CDN과 이미지 갤러리 기능. <a href="https://cloudinary.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">cloudinary.com</a>에서 무료 가입 후 설정하세요.
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                Cloudinary 설정
                                {(globalSettings?.cloudinaryCloudName || globalSettings?.cloudinaryUploadPreset) && !isEditingCloudinary && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        저장됨
                                    </span>
                                )}
                                {isEditingCloudinary && hasCloudinaryChanges && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        변경사항 있음
                                    </span>
                                )}
                            </label>

                            {/* VIEW MODE: Show saved values as read-only */}
                            {(globalSettings?.cloudinaryCloudName || globalSettings?.cloudinaryUploadPreset) && !isEditingCloudinary ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Cloud Name</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={cloudinaryCloudName}
                                                readOnly
                                                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
                                            />
                                            <div className="absolute right-3 top-3 text-green-600">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Upload Preset</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={cloudinaryUploadPreset}
                                                readOnly
                                                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
                                            />
                                            <div className="absolute right-3 top-3 text-green-600">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => enterEditMode('cloudinary')}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 border border-gray-300 text-sm"
                                    >
                                        수정하기
                                    </button>
                                </div>
                            ) : (
                                /* EDIT MODE: Allow input */
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Cloud Name</label>
                                        <div className="relative">
                                            <input
                                                type={showCloudinaryKeys ? 'text' : 'password'}
                                                value={cloudinaryCloudName}
                                                onChange={(e) => setCloudinaryCloudName(e.target.value)}
                                                placeholder="예: my-cloud-name"
                                                className={`w-full px-4 py-3 pr-12 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${hasCloudinaryChanges ? 'border-orange-400 bg-orange-50' : 'border-gray-300'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCloudinaryKeys(!showCloudinaryKeys)}
                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                            >
                                                {showCloudinaryKeys ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Upload Preset (Unsigned)</label>
                                        <div className="relative">
                                            <input
                                                type={showCloudinaryKeys ? 'text' : 'password'}
                                                value={cloudinaryUploadPreset}
                                                onChange={(e) => setCloudinaryUploadPreset(e.target.value)}
                                                placeholder="예: landing_unsigned"
                                                className={`w-full px-4 py-3 pr-12 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${hasCloudinaryChanges ? 'border-orange-400 bg-orange-50' : 'border-gray-300'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCloudinaryKeys(!showCloudinaryKeys)}
                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                            >
                                                {showCloudinaryKeys ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Cloudinary 대시보드 → Settings → Upload → Upload Presets에서 생성 (Unsigned 모드)</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {(globalSettings?.cloudinaryCloudName || globalSettings?.cloudinaryUploadPreset) && isEditingCloudinary && (
                                            <button
                                                onClick={() => cancelEdit('cloudinary')}
                                                className="px-3 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 border border-gray-300"
                                            >
                                                취소
                                            </button>
                                        )}
                                        <button
                                            onClick={async () => {
                                                await handleSaveCloudinary();
                                                setIsEditingCloudinary(false);
                                            }}
                                            disabled={savingCloudinary || !globalSettings}
                                            className="px-4 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {savingCloudinary ? '저장 중...' : cloudinarySaved ? <><CheckCircle className="w-4 h-4" /> 저장됨</> : <><Save className="w-4 h-4" /> 저장</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Kakao Map API Settings Section */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
                            <strong className="block mb-1">Kakao Map API Key</strong>
                            지도 표시 및 위치 서비스에 필요합니다. <a href="https://developers.kakao.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">Kakao Developers</a>에서 JavaScript 키를 발급받으세요.
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                Kakao JavaScript API Key
                                {globalSettings?.kakaoApiKey && !isEditingKakao && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        저장됨
                                    </span>
                                )}
                                {isEditingKakao && hasKakaoChanges && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        변경사항 있음
                                    </span>
                                )}
                            </label>

                            {/* VIEW MODE */}
                            {globalSettings?.kakaoApiKey && !isEditingKakao ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={kakaoApiKey}
                                            readOnly
                                            className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                        <div className="absolute right-3 top-3 text-green-600">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => enterEditMode('kakao')}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 border border-gray-300 text-sm"
                                    >
                                        수정하기
                                    </button>
                                </div>
                            ) : (
                                /* EDIT MODE */
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type={showKakaoKey ? 'text' : 'password'}
                                            value={kakaoApiKey}
                                            onChange={(e) => setKakaoApiKey(e.target.value)}
                                            placeholder="Kakao JavaScript App Key"
                                            className={`w-full px-4 py-3 pr-12 rounded-lg border focus:ring-2 focus:ring-yellow-500 outline-none ${hasKakaoChanges ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKakaoKey(!showKakaoKey)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showKakaoKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        {globalSettings?.kakaoApiKey && isEditingKakao && (
                                            <button
                                                onClick={() => cancelEdit('kakao')}
                                                className="px-3 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 border border-gray-300"
                                            >
                                                취소
                                            </button>
                                        )}
                                        <button
                                            onClick={async () => {
                                                setSavingApiKey(true);
                                                const baseSettings = globalSettings || {} as GlobalSettings;
                                                const newSettings = { ...baseSettings, kakaoApiKey };
                                                await saveGlobalSettings(newSettings);
                                                setGlobalSettings(newSettings);
                                                setSavingApiKey(false);
                                                setApiKeySaved(true);
                                                setIsEditingKakao(false);
                                                setTimeout(() => setApiKeySaved(false), 2000);
                                            }}
                                            disabled={savingApiKey}
                                            className="px-4 py-3 bg-yellow-400 text-black hover:bg-yellow-500 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {savingApiKey ? '저장 중...' : apiKeySaved ? <><CheckCircle className="w-4 h-4" /> 저장됨</> : <><Save className="w-4 h-4" /> 저장</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gemini API Settings Section */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 text-sm text-purple-800">
                            <strong className="block mb-1">Gemini API (AI 챗봇)</strong>
                            AI 변제금 진단 챗봇에 필요합니다. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google AI Studio</a>에서 무료로 발급받을 수 있습니다.
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                Gemini API Key
                                {globalSettings?.geminiApiKey && !isEditingGemini && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        저장됨
                                    </span>
                                )}
                                {isEditingGemini && hasGeminiChanges && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        변경사항 있음
                                    </span>
                                )}
                            </label>

                            {/* VIEW MODE */}
                            {globalSettings?.geminiApiKey && !isEditingGemini ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={geminiApiKey}
                                            readOnly
                                            className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                        <div className="absolute right-3 top-3 text-green-600">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => enterEditMode('gemini')}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 border border-gray-300 text-sm"
                                    >
                                        수정하기
                                    </button>
                                </div>
                            ) : (
                                /* EDIT MODE */
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type={showGeminiKey ? 'text' : 'password'}
                                            value={geminiApiKey}
                                            onChange={(e) => setGeminiApiKey(e.target.value)}
                                            placeholder="AIza..."
                                            className={`w-full px-4 py-3 pr-12 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none ${hasGeminiChanges ? 'border-purple-400 bg-purple-50' : 'border-gray-300'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowGeminiKey(!showGeminiKey)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showGeminiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        {globalSettings?.geminiApiKey && isEditingGemini && (
                                            <button
                                                onClick={() => cancelEdit('gemini')}
                                                className="px-3 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 border border-gray-300"
                                            >
                                                취소
                                            </button>
                                        )}
                                        <button
                                            onClick={async () => {
                                                if (!globalSettings) return;
                                                setSavingGeminiKey(true);
                                                const newSettings = { ...globalSettings, geminiApiKey };
                                                await saveGlobalSettings(newSettings);
                                                setGlobalSettings(newSettings);
                                                setSavingGeminiKey(false);
                                                setGeminiKeySaved(true);
                                                setIsEditingGemini(false);
                                                setTimeout(() => setGeminiKeySaved(false), 2000);
                                            }}
                                            disabled={savingGeminiKey || !globalSettings}
                                            className="px-4 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {savingGeminiKey ? '저장 중...' : geminiKeySaved ? <><CheckCircle className="w-4 h-4" /> 저장됨</> : <><Save className="w-4 h-4" /> 저장</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Interactive Block Settings Section */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 mb-6 text-sm text-pink-800">
                            <strong className="block mb-1">Interactive Block (폼-혼합형)</strong>
                            AI 챗봇에서 날짜 선택, 연락처 입력, 다중 선택 등의 고급 폼 UI를 활성화합니다.
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                                <div className="font-bold text-gray-800">Interactive Block 활성화</div>
                                <div className="text-sm text-gray-500">모든 챗봇 템플릿에서 폼 블록 UI 사용</div>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!globalSettings) return;
                                    const existingConfig = globalSettings.rehabChatConfig || {
                                        isEnabled: true,
                                        displayMode: 'floating' as const,
                                        buttonText: 'AI 변제금 확인'
                                    };
                                    const newConfig = {
                                        ...existingConfig,
                                        enableFormBlocks: !existingConfig.enableFormBlocks
                                    };
                                    const newSettings = { ...globalSettings, rehabChatConfig: newConfig };
                                    await saveGlobalSettings(newSettings);
                                    setGlobalSettings(newSettings);
                                }}
                                className={`relative w-14 h-7 rounded-full transition-colors ${globalSettings?.rehabChatConfig?.enableFormBlocks
                                    ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                                    : 'bg-gray-300'
                                    }`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${globalSettings?.rehabChatConfig?.enableFormBlocks ? 'translate-x-8' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {/* 프리셋 선택 UI */}
                        {globalSettings?.rehabChatConfig?.enableFormBlocks && (
                            <div className="mt-4 space-y-4">
                                <label className="block text-sm font-bold text-gray-700">프리셋 선택</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'none', label: '없음', desc: '비활성화' },
                                        { value: 'basic', label: '기본', desc: '연락처 폼만' },
                                        { value: 'advanced', label: '고급', desc: '모든 블록' },
                                        { value: 'custom', label: '사용자 정의', desc: '직접 선택' }
                                    ].map(preset => (
                                        <button
                                            key={preset.value}
                                            onClick={async () => {
                                                if (!globalSettings) return;
                                                const existingConfig = globalSettings.rehabChatConfig || {
                                                    isEnabled: true,
                                                    displayMode: 'floating' as const,
                                                    buttonText: 'AI 변제금 확인'
                                                };
                                                const newConfig = {
                                                    ...existingConfig,
                                                    interactiveBlockPreset: preset.value as 'none' | 'basic' | 'advanced' | 'custom'
                                                };
                                                const newSettings = { ...globalSettings, rehabChatConfig: newConfig };
                                                await saveGlobalSettings(newSettings);
                                                setGlobalSettings(newSettings);
                                            }}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${globalSettings?.rehabChatConfig?.interactiveBlockPreset === preset.value
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="font-bold text-gray-800">{preset.label}</div>
                                            <div className="text-xs text-gray-500">{preset.desc}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* 사용자 정의 옵션 */}
                                {globalSettings?.rehabChatConfig?.interactiveBlockPreset === 'custom' && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                        <div className="text-sm font-bold text-gray-700">세부 설정</div>
                                        {[
                                            { key: 'useContactForm', label: '연락처 폼 블록', desc: '이름/전화 입력을 폼으로' },
                                            { key: 'useMultiSelect', label: '다중 선택 블록', desc: '재산 선택 시 체크박스 UI' },
                                            { key: 'useDatePicker', label: '날짜 선택기', desc: '날짜 질문에 캘린더 UI' }
                                        ].map(option => (
                                            <label key={option.key} className="flex items-center justify-between p-2 bg-white rounded border">
                                                <div>
                                                    <div className="font-medium text-gray-800 text-sm">{option.label}</div>
                                                    <div className="text-xs text-gray-500">{option.desc}</div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={globalSettings?.rehabChatConfig?.interactiveBlockConfig?.[option.key as 'useContactForm' | 'useMultiSelect' | 'useDatePicker'] || false}
                                                    onChange={async (e) => {
                                                        if (!globalSettings) return;
                                                        const existingConfig = globalSettings.rehabChatConfig || {
                                                            isEnabled: true,
                                                            displayMode: 'floating' as const,
                                                            buttonText: 'AI 변제금 확인'
                                                        };
                                                        const newConfig = {
                                                            ...existingConfig,
                                                            interactiveBlockConfig: {
                                                                ...(existingConfig.interactiveBlockConfig || {}),
                                                                [option.key]: e.target.checked
                                                            }
                                                        };
                                                        const newSettings = { ...globalSettings, rehabChatConfig: newConfig };
                                                        await saveGlobalSettings(newSettings);
                                                        setGlobalSettings(newSettings);
                                                    }}
                                                    className="w-5 h-5 text-purple-600 rounded"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>




                    {/* 2026년 정책 설정 Section */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 text-sm text-indigo-800">
                            <strong className="block mb-1">2026년 개인회생 계산 정책 <span className="text-xs font-normal text-indigo-400">(v2026.01.14.R1)</span></strong>
                            AI 변제금 진단에 사용되는 중위소득, 생계비율, 보증금 공제 등을 설정합니다.
                        </div>

                        <div className="space-y-4">
                            {/* 기준년도 & 생계비율 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">기준년도</label>
                                    <input
                                        type="number"
                                        value={globalSettings?.rehabPolicyConfig?.baseYear || 2026}
                                        onChange={(e) => setGlobalSettings(prev => prev ? {
                                            ...prev,
                                            rehabPolicyConfig: {
                                                ...prev.rehabPolicyConfig,
                                                baseYear: parseInt(e.target.value)
                                            }
                                        } as any : null)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">생계비 인정률</label>
                                    <select
                                        value={(globalSettings?.rehabPolicyConfig?.livingCostRate || 0.6) * 100}
                                        onChange={(e) => setGlobalSettings(prev => prev ? {
                                            ...prev,
                                            rehabPolicyConfig: {
                                                ...prev.rehabPolicyConfig,
                                                livingCostRate: parseInt(e.target.value) / 100
                                            }
                                        } as any : null)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="50">50%</option>
                                        <option value="60">60% (기본)</option>
                                        <option value="70">70%</option>
                                    </select>
                                </div>
                            </div>

                            {/* 중위소득 테이블 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">가구원수별 중위소득 (원)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5, 6].map((size) => (
                                        <div key={size} className="bg-gray-50 rounded-lg p-2">
                                            <label className="text-xs text-gray-500 block">{size}인 가구</label>
                                            <input
                                                type="number"
                                                value={globalSettings?.rehabPolicyConfig?.medianIncome?.[size] || 0}
                                                onChange={(e) => {
                                                    setGlobalSettings(prev => {
                                                        if (!prev) return null;
                                                        const newMedian = { ...(prev.rehabPolicyConfig?.medianIncome || {}), [size]: parseInt(e.target.value) };
                                                        return {
                                                            ...prev,
                                                            rehabPolicyConfig: { ...prev.rehabPolicyConfig, medianIncome: newMedian }
                                                        } as any;
                                                    });
                                                }}
                                                className="w-full px-2 py-1.5 rounded border border-gray-300 text-sm"
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 보증금 공제 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">지역별 보증금 공제 (원)</label>
                                <div className="space-y-2">
                                    {[
                                        { key: 'Seoul', label: '서울' },
                                        { key: 'Overcrowded', label: '과밀억제권역' },
                                        { key: 'Metro', label: '광역시' },
                                        { key: 'Others', label: '기타 지역' }
                                    ].map((region) => (
                                        <div key={region.key} className="grid grid-cols-3 gap-2 items-center bg-gray-50 p-2 rounded">
                                            <span className="text-sm font-medium">{region.label}</span>
                                            <input
                                                type="number"
                                                value={globalSettings?.rehabPolicyConfig?.depositExemptions?.[region.key]?.limit || 0}
                                                onChange={(e) => {
                                                    setGlobalSettings(prev => {
                                                        if (!prev) return null;
                                                        const newExemptions = {
                                                            ...(prev.rehabPolicyConfig?.depositExemptions || {}),
                                                            [region.key]: {
                                                                ...(prev.rehabPolicyConfig?.depositExemptions?.[region.key] || {}),
                                                                limit: parseInt(e.target.value)
                                                            }
                                                        };
                                                        return { ...prev, rehabPolicyConfig: { ...prev.rehabPolicyConfig, depositExemptions: newExemptions } } as any;
                                                    });
                                                }}
                                                className="px-2 py-1 rounded border text-sm"
                                                placeholder="한도"
                                            />
                                            <input
                                                type="number"
                                                value={globalSettings?.rehabPolicyConfig?.depositExemptions?.[region.key]?.deduct || 0}
                                                onChange={(e) => {
                                                    setGlobalSettings(prev => {
                                                        if (!prev) return null;
                                                        const newExemptions = {
                                                            ...(prev.rehabPolicyConfig?.depositExemptions || {}),
                                                            [region.key]: {
                                                                ...(prev.rehabPolicyConfig?.depositExemptions?.[region.key] || {}),
                                                                deduct: parseInt(e.target.value)
                                                            }
                                                        };
                                                        return { ...prev, rehabPolicyConfig: { ...prev.rehabPolicyConfig, depositExemptions: newExemptions } } as any;
                                                    });
                                                }}
                                                className="px-2 py-1 rounded border text-sm"
                                                placeholder="공제액"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 법원 성향 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">법원별 성향</label>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {['서울회생법원', '수원회생법원', '인천회생법원', '대전회생법원', '대구회생법원', '부산회생법원', '광주회생법원'].map((court) => (
                                        <div key={court} className="bg-gray-50 p-3 rounded border">
                                            <div className="font-medium text-sm mb-2">{court}</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <label className="flex items-center gap-2 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={globalSettings?.rehabPolicyConfig?.courtTraits?.[court]?.allow24Months || false}
                                                        onChange={(e) => {
                                                            setGlobalSettings(prev => {
                                                                if (!prev) return null;
                                                                const newTraits = {
                                                                    ...(prev.rehabPolicyConfig?.courtTraits || {}),
                                                                    [court]: {
                                                                        ...(prev.rehabPolicyConfig?.courtTraits?.[court] || { name: court }),
                                                                        allow24Months: e.target.checked
                                                                    }
                                                                };
                                                                return { ...prev, rehabPolicyConfig: { ...prev.rehabPolicyConfig, courtTraits: newTraits } } as any;
                                                            });
                                                        }}
                                                    />
                                                    24개월 단축 가능
                                                </label>
                                                <div className="flex items-center gap-1 text-xs">
                                                    배우자 재산 반영률:
                                                    <select
                                                        value={(globalSettings?.rehabPolicyConfig?.courtTraits?.[court]?.spousePropertyRate || 0) * 100}
                                                        onChange={(e) => {
                                                            setGlobalSettings(prev => {
                                                                if (!prev) return null;
                                                                const newTraits = {
                                                                    ...(prev.rehabPolicyConfig?.courtTraits || {}),
                                                                    [court]: {
                                                                        ...(prev.rehabPolicyConfig?.courtTraits?.[court] || { name: court }),
                                                                        spousePropertyRate: parseInt(e.target.value) / 100
                                                                    }
                                                                };
                                                                return { ...prev, rehabPolicyConfig: { ...prev.rehabPolicyConfig, courtTraits: newTraits } } as any;
                                                            });
                                                        }}
                                                        className="border rounded px-1 py-0.5 text-xs"
                                                    >
                                                        <option value="0">0%</option>
                                                        <option value="50">50%</option>
                                                        <option value="100">100%</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    if (!globalSettings) return;
                                    setSavingApiKey(true);
                                    await saveGlobalSettings(globalSettings);
                                    setSavingApiKey(false);
                                    setApiKeySaved(true);
                                    setTimeout(() => setApiKeySaved(false), 2000);
                                }}
                                disabled={savingApiKey || !globalSettings}
                                className="px-4 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingApiKey ? '저장 중...' : apiKeySaved ? <><CheckCircle className="w-4 h-4" /> 저장됨</> : <><Save className="w-4 h-4" /> 정책 설정 저장</>}
                            </button>
                        </div>
                    </div>
                </div>
                {
                    currentUserEmail === 'beanhull@gmail.com' ? (
                        <>
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

                            {/* 3. Login Sessions (Super Admin Only) */}
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
                        </>
                    ) : (
                        <div className="bg-gray-100 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                            <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <h3 className="text-lg font-bold text-gray-700">관리자 권한 제한</h3>
                            <p className="text-sm mt-1">
                                관리자 추가/삭제 및 기기 관리는<br />
                                <strong>최고 관리자(beanhull@gmail.com)</strong>만 가능합니다.
                            </p>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

export default Settings;