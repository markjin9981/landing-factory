import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LandingConfig, FormField, TextStyle, FloatingBanner } from '../../types';
import LandingPage from '../LandingPage';
import { saveLandingConfig, fetchLandingConfigById, uploadImageToDrive } from '../../services/googleSheetService';
import { Save, Copy, ArrowLeft, Trash2, PlusCircle, Smartphone, Monitor, Image as ImageIcon, AlignLeft, CheckSquare, Upload, Type, Palette, ArrowUp, ArrowDown, Youtube, FileText, Megaphone, X, Plus, Layout, AlertCircle, Maximize, Globe, Share2, Anchor, Send, Loader2, CheckCircle } from 'lucide-react';

// GitHub Sync Check: Force Update
// Default empty config template
const DEFAULT_CONFIG: LandingConfig = {
    id: '',
    title: '',
    favicon: '',
    ogImage: '',
    ogTitle: '',
    ogDescription: '',
    keywords: '',
    theme: { primaryColor: '#0ea5e9', secondaryColor: '#0f172a' },
    banners: [],
    hero: {
        headline: '메인 카피를 입력하세요',
        headlineStyle: { fontSize: '3rem', fontWeight: '800', color: '#ffffff', textAlign: 'center' },
        subHeadline: '서브 카피를 입력하세요',
        subHeadlineStyle: { fontSize: '1.25rem', fontWeight: '400', color: '#d1d5db', textAlign: 'center' },
        ctaText: '신청하기',
        backgroundImage: 'https://picsum.photos/1920/1080',
        size: 'md'
    },
    detailImages: [],
    problem: { title: '문제 제기 제목', description: '', points: ['문제점 1'] },
    solution: { title: '해결책 제목', description: '', features: [{ title: '특징 1', desc: '설명' }] },
    trust: { reviews: [], stats: [] }, // Default empty to avoid unwanted display
    formConfig: {
        title: '무료 상담 신청',
        subTitle: '',
        submitButtonText: '신청하기',
        submitSuccessTitle: '신청이 완료되었습니다!',
        submitSuccessMessage: '담당자가 내용을 확인 후 최대한 빠르게 연락드리겠습니다.',
        position: 'bottom', // Default
        layout: 'vertical',
        fields: [{ id: 'name', label: '이름', type: 'text', required: true }, { id: 'phone', label: '연락처', type: 'tel', required: true }],
        showPrivacyPolicy: true,
        showTerms: false,
        showMarketingConsent: false,
        showThirdPartyConsent: false,
        style: { backgroundColor: '#ffffff', borderRadius: '16px', borderColor: '#e5e7eb', borderWidth: '1px' }
    },
    footer: {
        isShow: true,
        images: [],
        copyrightText: '© 2025 Company Name. All Rights Reserved.',
        copyrightStyle: { fontSize: '0.75rem', fontWeight: '400', color: '#9ca3af', textAlign: 'center' }
    }
};

const LandingEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [config, setConfig] = useState<LandingConfig>(DEFAULT_CONFIG);
    const [activeTab, setActiveTab] = useState('hero');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
    const [deployStatus, setDeployStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    // File input refs
    const heroBgInputRef = useRef<HTMLInputElement>(null);
    const detailImageInputRef = useRef<HTMLInputElement>(null);
    const bannerImageInputRef = useRef<HTMLInputElement>(null);
    const footerImageInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const ogImageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (id) {
            // 1. Try to load from LocalStorage first (Draft)
            const stored = localStorage.getItem('landing_drafts');
            if (stored) {
                const drafts = JSON.parse(stored);
                if (drafts[id]) {
                    // Deep copy and migration if needed
                    const loadedConfig = drafts[id];
                    // Migrate old single banner to banners array if needed (runtime safety)
                    if (!loadedConfig.banners && (loadedConfig as any).banner) {
                        loadedConfig.banners = [(loadedConfig as any).banner];
                        loadedConfig.banners[0].id = 'b_migrated';
                    }
                    if (!loadedConfig.banners) loadedConfig.banners = [];
                    // Migrate footer
                    if (!loadedConfig.footer) {
                        loadedConfig.footer = JSON.parse(JSON.stringify(DEFAULT_CONFIG.footer));
                    }
                    setConfig(loadedConfig);
                    return; // Loaded from draft, stop.
                }
            }

            // 2. If no draft, fetch from Google Sheet
            const loadFromSheet = async () => {
                const sheetConfig = await fetchLandingConfigById(id);
                if (sheetConfig) {
                    // Migration
                    if (!sheetConfig.banners) sheetConfig.banners = [];
                    if (!sheetConfig.footer) sheetConfig.footer = JSON.parse(JSON.stringify(DEFAULT_CONFIG.footer));
                    setConfig(sheetConfig);
                } else {
                    // Fallback or New
                    // Keep default
                }
            };
            loadFromSheet();

        } else {
            const newId = String(Date.now()).slice(-6);
            setConfig({ ...DEFAULT_CONFIG, id: newId });
        }
    }, [id]);

    const saveToLocal = () => {
        const stored = localStorage.getItem('landing_drafts');
        const drafts = stored ? JSON.parse(stored) : {};
        drafts[config.id] = config;
        localStorage.setItem('landing_drafts', JSON.stringify(drafts));
        alert('브라우저 임시 저장소에 저장되었습니다.');
    };

    const handleDeploy = async () => {
        // [Size Check] Google Sheets Cell Limit is ~50,000 chars.
        // We conservatively check for 45,000 to be safe.
        const configStr = JSON.stringify(config);
        if (configStr.length > 45000) {
            alert(
                '저장 용량을 초과했습니다! (현재: ' + (configStr.length / 1024).toFixed(2) + 'KB)\n\n' +
                'Google Sheets에는 대용량 이미지(Base64)를 직접 저장할 수 없습니다.\n' +
                '이미지 "업로드" 대신 "이미지 주소(URL)"를 입력해주세요.\n\n' +
                '(팁: 이미지를 웹에 올린 후 주소를 복사해 붙여넣으세요.)'
            );
            return;
        }

        setDeployStatus('saving');
        const success = await saveLandingConfig(config);

        if (success) {
            // Verify if it is actually retrievable from the server
            // Google Sheets might take a split second, so we wait briefly
            await new Promise(resolve => setTimeout(resolve, 1500));

            const remoteParams = await fetchLandingConfigById(config.id);
            const isVerified = remoteParams && String(remoteParams.id) === String(config.id);

            if (isVerified) {
                setDeployStatus('success');
                // Clear local draft only if verified
                const stored = localStorage.getItem('landing_drafts');
                if (stored) {
                    const drafts = JSON.parse(stored);
                    delete drafts[config.id];
                    localStorage.setItem('landing_drafts', JSON.stringify(drafts));
                }
            } else {
                // If verification failed, keeps draft but shows success message with warning
                setDeployStatus('success');
                alert('저장이 완료되었으나 서버 확인이 지연되고 있습니다.\n잠시 후 다시 확인해주세요.');
            }
        } else {
            setDeployStatus('error');
            alert('저장에 실패했습니다. 네트워크 상태를 확인해주세요.');
        }

        setTimeout(() => setDeployStatus('idle'), 3000);
    };

    const updateNested = (path: string[], value: any) => {
        setConfig(prev => {
            const next = { ...prev };
            let current: any = next;
            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) current[path[i]] = {};
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return next;
        });
    };

    // Image Helper: Upload to Drive and get URL
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (Google Drive API limit in GAS is ~50MB, but let's be reasonable)
            if (file.size > 10 * 1024 * 1024) {
                alert("파일 용량이 너무 큽니다. (10MB 제한)");
                return;
            }

            const confirmUpload = confirm(`"${file.name}" 파일을 서버(구글 드라이브)에 업로드하시겠습니까?\n\n(참고: 업로드 후 '공유 가능한 링크'가 자동으로 입력됩니다.)`);
            if (!confirmUpload) return;

            // Show loading cursor or rudimentary feedback
            const prevCursor = document.body.style.cursor;
            document.body.style.cursor = 'wait';

            // Temporary alert or toast could be better, but sticking to simple feedback for now
            // We can add a 'isUploading' state if we want to block UI, but keep it simple.

            try {
                const url = await uploadImageToDrive(file);
                if (url) {
                    callback(url);
                    alert("이미지 업로드가 완료되었습니다!");
                } else {
                    alert("업로드에 실패했습니다. 다시 시도해주세요.");
                }
            } catch (err) {
                console.error(err);
                alert("오류가 발생했습니다.");
            } finally {
                document.body.style.cursor = prevCursor;
                // Clear input so same file can be selected again
                e.target.value = '';
            }
        }
    };

    // --- FORM PRESETS ---
    const applyFormPreset = (type: 'default' | 'dark' | 'pastel' | 'border' | 'grid') => {
        let newStyle = { ...config.formConfig.style };
        let newLayout = 'vertical';

        switch (type) {
            case 'default':
                newStyle = { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: '1px', borderRadius: '16px', textColor: '#1f2937', buttonBackgroundColor: config.theme.primaryColor, buttonTextColor: '#ffffff', buttonRadius: '12px' };
                newLayout = 'vertical';
                break;
            case 'dark':
                newStyle = { backgroundColor: '#1e40af', borderColor: '#1e3a8a', borderWidth: '0px', borderRadius: '24px', textColor: '#ffffff', buttonBackgroundColor: '#dc2626', buttonTextColor: '#ffffff', buttonRadius: '50px' };
                newLayout = 'vertical';
                break;
            case 'pastel':
                newStyle = { backgroundColor: '#f0f9ff', borderColor: '#bae6fd', borderWidth: '1px', borderRadius: '12px', textColor: '#0c4a6e', buttonBackgroundColor: '#3b82f6', buttonTextColor: '#ffffff', buttonRadius: '8px' };
                newLayout = 'vertical';
                break;
            case 'border':
                newStyle = { backgroundColor: '#fff7ed', borderColor: '#ea580c', borderWidth: '4px', borderRadius: '4px', textColor: '#431407', buttonBackgroundColor: '#ea580c', buttonTextColor: '#ffffff', buttonRadius: '4px' };
                newLayout = 'vertical';
                break;
            case 'grid':
                newStyle = { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: '1px', borderRadius: '16px', textColor: '#1f2937', buttonBackgroundColor: config.theme.primaryColor, buttonTextColor: '#ffffff', buttonRadius: '12px' };
                newLayout = 'grid';
                break;
        }

        setConfig(prev => ({
            ...prev,
            formConfig: {
                ...prev.formConfig,
                style: newStyle,
                layout: newLayout as 'vertical' | 'grid'
            }
        }));
    };

    // Banner Helpers (omitted for brevity, assume existing)
    // ... (Banner functions are same as before) ...
    const addBanner = () => {
        if (config.banners.length >= 5) {
            alert("띠배너는 최대 5개까지 추가할 수 있습니다.");
            return;
        }
        setConfig(prev => ({
            ...prev,
            banners: [
                ...prev.banners,
                {
                    id: `b_${Date.now()}`,
                    isShow: true,
                    text: '새로운 띠배너입니다.',
                    backgroundColor: '#1e293b',
                    textColor: '#ffffff',
                    position: 'bottom',
                    size: 'md'
                }
            ]
        }));
    };

    const updateBanner = (index: number, key: keyof FloatingBanner, value: any) => {
        setConfig(prev => {
            const newBanners = [...prev.banners];
            newBanners[index] = { ...newBanners[index], [key]: value };
            return { ...prev, banners: newBanners };
        });
    };

    const removeBanner = (index: number) => {
        setConfig(prev => ({
            ...prev,
            banners: prev.banners.filter((_, i) => i !== index)
        }));
    };

    // --- TEXT SECTION HELPERS ---
    // ... (Same as before) ...
    const addProblemPoint = () => {
        setConfig(prev => ({
            ...prev,
            problem: {
                ...prev.problem,
                points: [...prev.problem.points, '새로운 문제점']
            }
        }));
    };
    const updateProblemPoint = (index: number, val: string) => {
        setConfig(prev => {
            const newPoints = [...prev.problem.points];
            newPoints[index] = val;
            return { ...prev, problem: { ...prev.problem, points: newPoints } };
        });
    };
    const removeProblemPoint = (index: number) => {
        setConfig(prev => ({
            ...prev,
            problem: {
                ...prev.problem,
                points: prev.problem.points.filter((_, i) => i !== index)
            }
        }));
    };

    const addSolutionFeature = () => {
        setConfig(prev => ({
            ...prev,
            solution: {
                ...prev.solution,
                features: [...prev.solution.features, { title: '새 특징', desc: '설명' }]
            }
        }));
    };
    const updateSolutionFeature = (index: number, key: 'title' | 'desc', val: string) => {
        setConfig(prev => {
            const newFeatures = [...prev.solution.features];
            newFeatures[index] = { ...newFeatures[index], [key]: val };
            return { ...prev, solution: { ...prev.solution, features: newFeatures } };
        });
    };
    const removeSolutionFeature = (index: number) => {
        setConfig(prev => ({
            ...prev,
            solution: {
                ...prev.solution,
                features: prev.solution.features.filter((_, i) => i !== index)
            }
        }));
    };


    // --- COMPONENT RENDERERS ---

    const TextStyleEditor = ({ label, stylePath }: { label: string, stylePath: string[] }) => {
        // Helper to access safe value
        const getValue = (key: keyof TextStyle) => {
            let current: any = config;
            for (const p of stylePath) {
                if (!current) return undefined;
                current = current[p];
            }
            return current ? current[key] : undefined;
        }
        const updateStyle = (key: keyof TextStyle, val: any) => updateNested([...stylePath, key], val);

        return (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Type className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-bold text-gray-700">{label} 디자인</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block">크기 (e.g. 2rem, 16px)</label>
                        <input type="text" value={getValue('fontSize') || ''} onChange={e => updateStyle('fontSize', e.target.value)} className="w-full border rounded p-1 text-xs" placeholder="inherit" />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">굵기</label>
                        <select value={getValue('fontWeight') || '400'} onChange={e => updateStyle('fontWeight', e.target.value)} className="w-full border rounded p-1 text-xs">
                            <option value="300">얇게 (300)</option>
                            <option value="400">보통 (400)</option>
                            <option value="700">굵게 (700)</option>
                            <option value="800">매우 굵게 (800)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">색상</label>
                        <div className="flex items-center gap-1">
                            <input type="color" value={getValue('color') || '#000000'} onChange={e => updateStyle('color', e.target.value)} className="w-6 h-6 border rounded cursor-pointer p-0" />
                            <input type="text" value={getValue('color') || ''} onChange={e => updateStyle('color', e.target.value)} className="flex-1 border rounded p-1 text-xs" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">정렬</label>
                        <select value={getValue('textAlign') || 'left'} onChange={e => updateStyle('textAlign', e.target.value)} className="w-full border rounded p-1 text-xs">
                            <option value="left">왼쪽</option>
                            <option value="center">가운데</option>
                            <option value="right">오른쪽</option>
                        </select>
                    </div>
                </div>
            </div>
        )
    }

    // --- STATE HELPERS ---
    const updateField = (index: number, key: keyof FormField, value: any) => {
        setConfig(prev => {
            const nextFields = [...prev.formConfig.fields];
            nextFields[index] = { ...nextFields[index], [key]: value };
            return { ...prev, formConfig: { ...prev.formConfig, fields: nextFields } };
        });
    };
    const removeField = (index: number) => {
        setConfig(prev => ({ ...prev, formConfig: { ...prev.formConfig, fields: prev.formConfig.fields.filter((_, i) => i !== index) } }));
    };

    // Field Options Helpers (Select/Radio)
    const addFieldOption = (fieldIdx: number) => {
        setConfig(prev => {
            const nextFields = [...prev.formConfig.fields];
            const currentOptions = nextFields[fieldIdx].options || [];
            nextFields[fieldIdx] = {
                ...nextFields[fieldIdx],
                options: [...currentOptions, { label: '', value: '' }]
            };
            return { ...prev, formConfig: { ...prev.formConfig, fields: nextFields } };
        });
    };

    const updateFieldOption = (fieldIdx: number, optIdx: number, key: 'label' | 'value', val: string) => {
        setConfig(prev => {
            const nextFields = [...prev.formConfig.fields];
            const nextOptions = [...(nextFields[fieldIdx].options || [])];
            nextOptions[optIdx] = { ...nextOptions[optIdx], [key]: val };
            nextFields[fieldIdx] = { ...nextFields[fieldIdx], options: nextOptions };
            return { ...prev, formConfig: { ...prev.formConfig, fields: nextFields } };
        });
    };

    const removeFieldOption = (fieldIdx: number, optIdx: number) => {
        setConfig(prev => {
            const nextFields = [...prev.formConfig.fields];
            const nextOptions = (nextFields[fieldIdx].options || []).filter((_, i) => i !== optIdx);
            nextFields[fieldIdx] = { ...nextFields[fieldIdx], options: nextOptions };
            return { ...prev, formConfig: { ...prev.formConfig, fields: nextFields } };
        });
    };

    // Detail Images Logic
    const addDetailImage = (url: string) => setConfig(prev => ({ ...prev, detailImages: [...(prev.detailImages || []), url] }));

    const addYoutube = () => {
        const url = prompt('유튜브 영상 링크를 입력하세요 (예: https://youtu.be/...)');
        if (url) addDetailImage(url);
    };

    const updateDetailImage = (index: number, val: string) => {
        setConfig(prev => {
            const newImgs = [...(prev.detailImages || [])];
            newImgs[index] = val;
            return { ...prev, detailImages: newImgs };
        });
    };
    const removeDetailImage = (index: number) => setConfig(prev => ({ ...prev, detailImages: (prev.detailImages || []).filter((_, i) => i !== index) }));

    const moveDetailImage = (index: number, direction: 'up' | 'down') => {
        setConfig(prev => {
            const newImgs = [...(prev.detailImages || [])];
            if (direction === 'up' && index > 0) {
                [newImgs[index], newImgs[index - 1]] = [newImgs[index - 1], newImgs[index]];
            } else if (direction === 'down' && index < newImgs.length - 1) {
                [newImgs[index], newImgs[index + 1]] = [newImgs[index + 1], newImgs[index]];
            }
            return { ...prev, detailImages: newImgs };
        });
    };

    // --- Footer Helpers ---
    const addFooterImage = (url: string) => {
        setConfig(prev => {
            const currentImages = prev.footer?.images || [];
            return {
                ...prev,
                footer: { ...prev.footer!, images: [...currentImages, url] }
            };
        });
    };

    const removeFooterImage = (index: number) => {
        setConfig(prev => {
            const currentImages = prev.footer?.images || [];
            return {
                ...prev,
                footer: { ...prev.footer!, images: currentImages.filter((_, i) => i !== index) }
            };
        });
    };

    const moveFooterImage = (index: number, direction: 'left' | 'right') => {
        setConfig(prev => {
            const newImgs = [...(prev.footer?.images || [])];
            if (direction === 'left' && index > 0) {
                [newImgs[index], newImgs[index - 1]] = [newImgs[index - 1], newImgs[index]];
            } else if (direction === 'right' && index < newImgs.length - 1) {
                [newImgs[index], newImgs[index + 1]] = [newImgs[index + 1], newImgs[index]];
            }
            return { ...prev, footer: { ...prev.footer!, images: newImgs } };
        });
    };

    return (
        <div className="h-screen bg-gray-100 flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between shrink-0 z-20 shadow-md">
                {/* ... Same as before ... */}
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-700 rounded-full text-white transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-white font-bold flex items-center gap-2">
                            랜딩페이지 에디터
                            <span className="text-xs font-mono bg-gray-700 px-2 py-0.5 rounded text-gray-300">ID: {config.id}</span>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={saveToLocal} className="flex items-center px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600">
                        <Save className="w-3 h-3 mr-1.5" />
                        임시 저장
                    </button>
                    <button onClick={handleDeploy} disabled={deployStatus === 'saving'} className="flex items-center px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-sm w-32 justify-center disabled:opacity-50">
                        {deployStatus === 'saving' ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> 저장중...</> :
                            deployStatus === 'success' ? <><CheckCircle className="w-3 h-3 mr-1.5" /> 저장완료!</> :
                                deployStatus === 'error' ? <><AlertCircle className="w-3 h-3 mr-1.5" /> 저장실패</> :
                                    <><Send className="w-3 h-3 mr-1.5" /> 저장 및 배포</>}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">

                {/* LEFT: Editor Panel */}
                <div className="w-full lg:w-[450px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-10 relative">

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'basic', label: '기본', icon: <AlignLeft className="w-4 h-4" /> },
                            { id: 'hero', label: '상단', icon: <ImageIcon className="w-4 h-4" /> },
                            { id: 'images', label: '상세', icon: <ImageIcon className="w-4 h-4" /> },
                            { id: 'form', label: '입력폼', icon: <CheckSquare className="w-4 h-4" /> },
                            { id: 'text', label: '텍스트', icon: <AlignLeft className="w-4 h-4" /> },
                            { id: 'footer', label: '하단', icon: <Anchor className="w-4 h-4" /> }, // New Tab
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id
                                    ? 'bg-white text-blue-600 border-blue-600'
                                    : 'text-gray-500 hover:bg-gray-100 border-transparent'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">

                        {/* ... BASIC TAB ... */}
                        {activeTab === 'basic' && (
                            <div className="space-y-4 animate-fade-in">
                                {/* ... Existing Basic Tab Content ... */}
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">기본 설정</h3>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">페이지 ID</label>
                                    <input type="text" value={config.id} onChange={(e) => updateNested(['id'], e.target.value)} className="w-full border rounded p-2 text-sm bg-gray-50" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">페이지 제목 (Title)</label>
                                    <input type="text" value={config.title} onChange={(e) => updateNested(['title'], e.target.value)} className="w-full border rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">검색 키워드 (Meta Keywords)</label>
                                    <input
                                        type="text"
                                        value={config.keywords || ''}
                                        onChange={(e) => updateNested(['keywords'], e.target.value)}
                                        className="w-full border rounded p-2 text-sm"
                                        placeholder="예: 개인회생, 파산면책, 법률상담 (콤마로 구분)"
                                    />
                                </div>
                                {/* ... SEO Fields & Color Picker ... */}
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> 아이콘 & SNS 공유 이미지
                                    </h4>
                                    <div className="mb-3">
                                        <label className="text-[10px] text-gray-500 block mb-1 flex justify-between">
                                            파비콘 (탭 아이콘)
                                            <button onClick={() => faviconInputRef.current?.click()} className="text-blue-600 hover:underline flex items-center">
                                                <Upload className="w-3 h-3 mr-1" /> 업로드
                                            </button>
                                        </label>
                                        <input
                                            type="file" ref={faviconInputRef} className="hidden" accept="image/*"
                                            onChange={(e) => handleImageUpload(e, (url) => updateNested(['favicon'], url))}
                                        />
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text" value={config.favicon || ''}
                                                onChange={(e) => updateNested(['favicon'], e.target.value)}
                                                className="w-full border rounded p-1 text-xs bg-white" placeholder="URL 입력 (기본값 사용)"
                                            />
                                            {config.favicon && <img src={config.favicon} alt="icon" className="w-8 h-8 rounded border p-0.5 bg-white" />}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-[10px] text-gray-500 block mb-1 flex justify-between">
                                            <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> SNS 썸네일 (OG Image)</span>
                                            <button onClick={() => ogImageInputRef.current?.click()} className="text-blue-600 hover:underline flex items-center">
                                                <Upload className="w-3 h-3 mr-1" /> 업로드
                                            </button>
                                        </label>
                                        <input
                                            type="file" ref={ogImageInputRef} className="hidden" accept="image/*"
                                            onChange={(e) => handleImageUpload(e, (url) => updateNested(['ogImage'], url))}
                                        />
                                        <div className="space-y-2">
                                            <input
                                                type="text" value={config.ogImage || ''}
                                                onChange={(e) => updateNested(['ogImage'], e.target.value)}
                                                className="w-full border rounded p-1 text-xs bg-white" placeholder="URL 입력 (기본값 사용)"
                                            />
                                            {config.ogImage && (
                                                <div className="w-full h-24 bg-gray-100 rounded border overflow-hidden">
                                                    <img src={config.ogImage} alt="OG" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <label className="text-[10px] text-gray-500 block mb-1">SNS 공유 제목 (비우면 페이지 제목 사용)</label>
                                        <input
                                            type="text" value={config.ogTitle || ''}
                                            onChange={(e) => updateNested(['ogTitle'], e.target.value)}
                                            className="w-full border rounded p-1 text-xs bg-white"
                                            placeholder={config.title}
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label className="text-[10px] text-gray-500 block mb-1">SNS 공유 설명 (비우면 서브카피 사용)</label>
                                        <textarea
                                            value={config.ogDescription || ''}
                                            onChange={(e) => updateNested(['ogDescription'], e.target.value)}
                                            className="w-full border rounded p-1 text-xs bg-white h-16 resize-none"
                                            placeholder={config.hero.subHeadline}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                                        * 서버가 없는 사이트 특성상, 카카오톡/페이스북 봇은 초기 로딩 시 기본 이미지를 가져갈 수 있습니다.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">메인 컬러</label>
                                        <div className="flex items-center gap-2 border rounded p-1">
                                            <input type="color" value={config.theme.primaryColor} onChange={(e) => updateNested(['theme', 'primaryColor'], e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none" />
                                            <span className="text-xs font-mono">{config.theme.primaryColor}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ... HERO TAB ... */}
                        {activeTab === 'hero' && (
                            <div className="space-y-4 animate-fade-in">
                                {/* ... Existing Hero Content ... */}
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">상단 히어로 섹션</h3>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 flex justify-between">
                                        배경 이미지
                                        <button onClick={() => heroBgInputRef.current?.click()} className="text-blue-600 hover:underline flex items-center">
                                            <Upload className="w-3 h-3 mr-1" /> 업로드
                                        </button>
                                    </label>
                                    <input
                                        type="file" ref={heroBgInputRef} className="hidden" accept="image/*"
                                        onChange={(e) => handleImageUpload(e, (url) => updateNested(['hero', 'backgroundImage'], url))}
                                    />
                                    <input
                                        type="text" value={config.hero.backgroundImage}
                                        onChange={(e) => updateNested(['hero', 'backgroundImage'], e.target.value)}
                                        className="w-full border rounded p-2 text-sm mb-2" placeholder="http://..."
                                    />
                                    {config.hero.backgroundImage && (
                                        <img src={config.hero.backgroundImage} alt="Preview" className="w-full h-24 object-cover rounded border" />
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                                        <Maximize className="w-3 h-3" /> 섹션 크기 (높이)
                                    </label>
                                    <select
                                        value={config.hero.size || 'md'}
                                        onChange={(e) => updateNested(['hero', 'size'], e.target.value)}
                                        className="w-full border rounded p-2 text-sm"
                                    >
                                        <option value="xs">1단계 (매우 작게)</option>
                                        <option value="sm">2단계 (작게)</option>
                                        <option value="md">3단계 (보통)</option>
                                        <option value="lg">4단계 (크게)</option>
                                        <option value="xl">5단계 (매우 크게)</option>
                                    </select>
                                </div>
                                <div className="border-t pt-4">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">메인 헤드카피</label>
                                    <textarea
                                        value={config.hero.headline}
                                        onChange={(e) => updateNested(['hero', 'headline'], e.target.value)}
                                        className="w-full border rounded p-2 text-sm h-16 resize-none mb-2"
                                    />
                                    <TextStyleEditor label="헤드카피" stylePath={['hero', 'headlineStyle']} />
                                </div>
                                <div className="border-t pt-4">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">서브 카피</label>
                                    <textarea
                                        value={config.hero.subHeadline}
                                        onChange={(e) => updateNested(['hero', 'subHeadline'], e.target.value)}
                                        className="w-full border rounded p-2 text-sm h-16 resize-none mb-2"
                                    />
                                    <TextStyleEditor label="서브카피" stylePath={['hero', 'subHeadlineStyle']} />
                                </div>
                            </div>
                        )}

                        {/* ... IMAGES TAB ... */}
                        {activeTab === 'images' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* ... Existing Banners & Images Logic ... */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center justify-between mb-4">
                                        <span className="flex items-center gap-2"><Megaphone className="w-4 h-4 text-blue-500" /> 띠 배너 관리 (최대 5개)</span>
                                        <button onClick={addBanner} disabled={config.banners.length >= 5} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-500 disabled:opacity-50">
                                            + 배너 추가
                                        </button>
                                    </h3>
                                    <div className="space-y-4">
                                        {config.banners.map((banner, idx) => (
                                            <div key={banner.id} className="border p-3 rounded-lg bg-gray-50 relative">
                                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                                                    <span className="text-xs font-bold text-gray-500">배너 #{idx + 1}</span>
                                                    <div className="flex gap-2 items-center">
                                                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={banner.isShow}
                                                                onChange={(e) => updateBanner(idx, 'isShow', e.target.checked)}
                                                            /> 노출
                                                        </label>
                                                        <button onClick={() => removeBanner(idx)} className="text-red-500 hover:text-red-700">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {banner.isShow && (
                                                    <div className="space-y-2">
                                                        <div className="flex gap-2">
                                                            <div className="flex-1">
                                                                <label className="text-[10px] text-gray-500 block">위치</label>
                                                                <select
                                                                    value={banner.position}
                                                                    onChange={(e) => updateBanner(idx, 'position', e.target.value)}
                                                                    className="w-full text-xs border rounded p-1"
                                                                >
                                                                    <option value="top">상단 고정 (Top)</option>
                                                                    <option value="bottom">하단 고정 (Bottom)</option>
                                                                </select>
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="text-[10px] text-gray-500 block">크기</label>
                                                                <select
                                                                    value={banner.size || 'md'}
                                                                    onChange={(e) => updateBanner(idx, 'size', e.target.value)}
                                                                    className="w-full text-xs border rounded p-1"
                                                                >
                                                                    <option value="xs">1단계 (초소형)</option>
                                                                    <option value="sm">2단계 (소형)</option>
                                                                    <option value="md">3단계 (기본)</option>
                                                                    <option value="lg">4단계 (대형)</option>
                                                                    <option value="xl">5단계 (초대형)</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div className="flex-1">
                                                                <label className="text-[10px] text-gray-500 block">배경색</label>
                                                                <div className="flex items-center gap-1">
                                                                    <input type="color" value={banner.backgroundColor} onChange={(e) => updateBanner(idx, 'backgroundColor', e.target.value)} className="w-4 h-4 p-0 border-0" />
                                                                    <input type="text" value={banner.backgroundColor} onChange={(e) => updateBanner(idx, 'backgroundColor', e.target.value)} className="w-full text-xs border rounded p-1" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="text-[10px] text-gray-500 block">글자색</label>
                                                                <div className="flex items-center gap-1">
                                                                    <input type="color" value={banner.textColor} onChange={(e) => updateBanner(idx, 'textColor', e.target.value)} className="w-4 h-4 p-0 border-0" />
                                                                    <input type="text" value={banner.textColor} onChange={(e) => updateBanner(idx, 'textColor', e.target.value)} className="w-full text-xs border rounded p-1" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block">문구</label>
                                                            <input
                                                                type="text" value={banner.text}
                                                                onChange={(e) => updateBanner(idx, 'text', e.target.value)}
                                                                className="w-full text-xs border rounded p-1"
                                                                placeholder="배너 문구 입력"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block flex justify-between">
                                                                이미지 URL (문구 대신 노출)
                                                                <button
                                                                    onClick={() => {
                                                                        bannerImageInputRef.current?.setAttribute('data-banner-index', idx.toString());
                                                                        bannerImageInputRef.current?.click();
                                                                    }}
                                                                    className="text-blue-600 hover:underline"
                                                                >
                                                                    업로드
                                                                </button>
                                                            </label>
                                                            <input
                                                                type="text" value={banner.imageUrl || ''}
                                                                onChange={(e) => updateBanner(idx, 'imageUrl', e.target.value)}
                                                                className="w-full text-xs border rounded p-1"
                                                                placeholder="https://..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block">링크 URL</label>
                                                            <input
                                                                type="text" value={banner.linkUrl || ''}
                                                                onChange={(e) => updateBanner(idx, 'linkUrl', e.target.value)}
                                                                className="w-full text-xs border rounded p-1"
                                                                placeholder="클릭 시 이동할 주소 (비우면 폼으로 이동)"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {config.banners.length === 0 && (
                                            <div className="text-center py-4 text-xs text-gray-400 border border-dashed rounded">
                                                추가된 배너가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file" ref={bannerImageInputRef} className="hidden" accept="image/*"
                                        onChange={(e) => handleImageUpload(e, (url) => {
                                            const idxStr = bannerImageInputRef.current?.getAttribute('data-banner-index');
                                            if (idxStr !== null && idxStr !== undefined) {
                                                updateBanner(parseInt(idxStr), 'imageUrl', url);
                                            }
                                        })}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" /> 상세 이미지 관리
                                    </h3>
                                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 mb-4 border border-blue-100">
                                        <strong>TIP:</strong> 이미지(GIF 포함) 또는 유튜브 링크를 순서대로 배치하세요.
                                    </div>
                                    <input
                                        type="file" ref={detailImageInputRef} className="hidden" accept="image/*"
                                        onChange={(e) => handleImageUpload(e, (url) => {
                                            addDetailImage(url);
                                            if (detailImageInputRef.current) detailImageInputRef.current.value = ''; // reset
                                        })}
                                    />
                                    <div className="space-y-3">
                                        {(config.detailImages || []).map((img, idx) => (
                                            <div key={idx} className="bg-white border border-gray-200 p-2 rounded-lg relative group shadow-sm flex gap-3 items-center">
                                                <div className="flex flex-col gap-1">
                                                    <button onClick={() => moveDetailImage(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                                                        <ArrowUp className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => moveDetailImage(idx, 'down')} disabled={idx === (config.detailImages?.length || 0) - 1} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                                                        <ArrowDown className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="w-16 h-12 bg-gray-100 rounded shrink-0 overflow-hidden border flex items-center justify-center">
                                                    {img.includes('youtu') ? <Youtube className="w-6 h-6 text-red-600" /> : <img src={img} className="w-full h-full object-cover" alt="thumb" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <input
                                                        type="text" value={img}
                                                        onChange={(e) => updateDetailImage(idx, e.target.value)}
                                                        className="w-full border rounded p-1 text-xs truncate"
                                                    />
                                                </div>
                                                <button onClick={() => removeDetailImage(idx)} className="p-2 text-gray-400 hover:text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <button
                                            onClick={() => detailImageInputRef.current?.click()}
                                            className="py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-bold text-xs flex items-center justify-center"
                                        >
                                            <Upload className="w-3 h-3 mr-1" /> 이미지/GIF 업로드
                                        </button>
                                        <button
                                            onClick={addYoutube}
                                            className="py-2 border-2 border-red-100 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-xs flex items-center justify-center"
                                        >
                                            <Youtube className="w-4 h-4 mr-1" /> 유튜브 추가
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- FORM TAB --- */}
                        {activeTab === 'form' && (
                            <div className="space-y-6 animate-fade-in">

                                {/* 1. Form Presets (New) */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                                        <Palette className="w-4 h-4 text-blue-600" /> 폼 디자인 템플릿 (Presets)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => applyFormPreset('default')} className="border hover:border-blue-500 rounded p-2 text-xs text-left bg-white hover:bg-gray-50 transition-colors">
                                            <div className="font-bold mb-1">⚪ 기본형 (흰색)</div>
                                            <div className="w-full h-8 bg-white border border-gray-200 rounded mb-1"></div>
                                            <span className="text-[10px] text-gray-400">가장 무난한 스타일</span>
                                        </button>
                                        <button onClick={() => applyFormPreset('dark')} className="border hover:border-blue-500 rounded p-2 text-xs text-left bg-blue-50 hover:bg-blue-100 transition-colors">
                                            <div className="font-bold mb-1">🔵 파랑/빨강 (강조)</div>
                                            <div className="w-full h-8 bg-blue-900 rounded mb-1 flex items-center justify-center"><div className="w-8 h-2 bg-red-600 rounded"></div></div>
                                            <span className="text-[10px] text-gray-400">전환율이 높은 배색</span>
                                        </button>
                                        <button onClick={() => applyFormPreset('pastel')} className="border hover:border-blue-500 rounded p-2 text-xs text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <div className="font-bold mb-1">🎨 파스텔 (소프트)</div>
                                            <div className="w-full h-8 bg-sky-50 border border-sky-200 rounded mb-1"></div>
                                            <span className="text-[10px] text-gray-400">부드러운 느낌</span>
                                        </button>
                                        <button onClick={() => applyFormPreset('border')} className="border hover:border-blue-500 rounded p-2 text-xs text-left bg-orange-50 hover:bg-orange-100 transition-colors">
                                            <div className="font-bold mb-1">🟧 주황 테두리</div>
                                            <div className="w-full h-8 bg-white border-2 border-orange-500 rounded mb-1"></div>
                                            <span className="text-[10px] text-gray-400">가독성 높은 스타일</span>
                                        </button>
                                        <button onClick={() => applyFormPreset('grid')} className="col-span-2 border hover:border-blue-500 rounded p-2 text-xs text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <div className="font-bold mb-1 flex items-center justify-between">
                                                <span>🔳 2열 배치 (가로형)</span>
                                                <span className="text-[10px] bg-gray-200 px-1 rounded">PC 전용</span>
                                            </div>
                                            <div className="w-full h-8 bg-white border border-gray-200 rounded mb-1 flex gap-1 p-1">
                                                <div className="flex-1 bg-gray-100 rounded"></div>
                                                <div className="flex-1 bg-gray-100 rounded"></div>
                                            </div>
                                            <span className="text-[10px] text-gray-400">입력 항목이 많을 때 추천 (모바일은 1열)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Position Setting */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                                        <Layout className="w-4 h-4" /> 폼 위치 설정
                                    </h3>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">폼 노출 위치</label>
                                        <select
                                            value={config.formConfig.position || 'bottom'}
                                            onChange={(e) => updateNested(['formConfig', 'position'], e.target.value)}
                                            className="w-full border rounded p-2 text-sm bg-gray-50"
                                        >
                                            <option value="bottom">페이지 하단 (기본)</option>
                                            <option value="after_hero">히어로 섹션 바로 아래 (상단)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Success Message Settings */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                                        <CheckSquare className="w-4 h-4" /> 제출 완료 메시지 설정
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">완료 제목</label>
                                            <input
                                                type="text"
                                                value={config.formConfig.submitSuccessTitle || ''}
                                                onChange={(e) => updateNested(['formConfig', 'submitSuccessTitle'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm"
                                                placeholder="신청이 완료되었습니다!"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">완료 상세 메시지</label>
                                            <textarea
                                                value={config.formConfig.submitSuccessMessage || ''}
                                                onChange={(e) => updateNested(['formConfig', 'submitSuccessMessage'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm h-20 resize-none"
                                                placeholder="담당자가 내용을 확인 후 최대한 빠르게 연락드리겠습니다."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Manual Design Section (Collapsible details could be good, keeping simple for now) */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                                        <Palette className="w-4 h-4" /> 세부 디자인 수정 (선택)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">배경색</label>
                                            <div className="flex gap-1">
                                                <input type="color" value={config.formConfig.style?.backgroundColor || '#ffffff'} onChange={(e) => updateNested(['formConfig', 'style', 'backgroundColor'], e.target.value)} className="w-6 h-6 border rounded cursor-pointer p-0" />
                                                <input type="text" value={config.formConfig.style?.backgroundColor || ''} onChange={(e) => updateNested(['formConfig', 'style', 'backgroundColor'], e.target.value)} className="w-full border rounded p-1 text-xs" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">테두리 색상</label>
                                            <div className="flex gap-1">
                                                <input type="color" value={config.formConfig.style?.borderColor || '#e5e7eb'} onChange={(e) => updateNested(['formConfig', 'style', 'borderColor'], e.target.value)} className="w-6 h-6 border rounded cursor-pointer p-0" />
                                                <input type="text" value={config.formConfig.style?.borderColor || ''} onChange={(e) => updateNested(['formConfig', 'style', 'borderColor'], e.target.value)} className="w-full border rounded p-1 text-xs" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">버튼 배경색</label>
                                            <div className="flex gap-1">
                                                <input type="color" value={config.formConfig.style?.buttonBackgroundColor || config.theme.primaryColor} onChange={(e) => updateNested(['formConfig', 'style', 'buttonBackgroundColor'], e.target.value)} className="w-6 h-6 border rounded cursor-pointer p-0" />
                                                <input type="text" value={config.formConfig.style?.buttonBackgroundColor || ''} onChange={(e) => updateNested(['formConfig', 'style', 'buttonBackgroundColor'], e.target.value)} className="w-full border rounded p-1 text-xs" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">버튼 글자색</label>
                                            <div className="flex gap-1">
                                                <input type="color" value={config.formConfig.style?.buttonTextColor || '#ffffff'} onChange={(e) => updateNested(['formConfig', 'style', 'buttonTextColor'], e.target.value)} className="w-6 h-6 border rounded cursor-pointer p-0" />
                                                <input type="text" value={config.formConfig.style?.buttonTextColor || ''} onChange={(e) => updateNested(['formConfig', 'style', 'buttonTextColor'], e.target.value)} className="w-full border rounded p-1 text-xs" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Policy Section (Existing) */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">정책 설정 (총 4종)</h3>

                                    {[
                                        { key: 'showPrivacyPolicy', contentKey: 'privacyPolicyContent', label: '개인정보 수집 이용' },
                                        { key: 'showThirdPartyConsent', contentKey: 'thirdPartyConsentContent', label: '제3자 정보 제공' },
                                        { key: 'showMarketingConsent', contentKey: 'marketingConsentContent', label: '광고성 정보 수신' },
                                        { key: 'showTerms', contentKey: 'termsContent', label: '이용약관' },
                                    ].map((policy) => (
                                        <div key={policy.key} className="mb-4 border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-gray-700">{policy.label}</span>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <span className="text-[10px] text-gray-400">{config.formConfig[policy.key] ? '표시함' : '숨김'}</span>
                                                    <input
                                                        type="checkbox" checked={config.formConfig[policy.key] as boolean}
                                                        onChange={(e) => updateNested(['formConfig', policy.key], e.target.checked)}
                                                        className="w-4 h-4 accent-blue-600"
                                                    />
                                                </label>
                                            </div>
                                            {config.formConfig[policy.key] && (
                                                <textarea
                                                    placeholder={`${policy.label} 전문을 입력하세요.`}
                                                    value={(config.formConfig[policy.contentKey] as string) || ''}
                                                    onChange={(e) => updateNested(['formConfig', policy.contentKey], e.target.value)}
                                                    className="w-full border rounded p-2 text-xs h-20 bg-gray-50 resize-y"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Fields Section (Existing) */}
                                <div className="space-y-3 pt-4 border-t">
                                    {/* ... Existing Fields Editor ... */}
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">입력 항목 관리</h3>
                                    {config.formConfig.fields.map((field, idx) => (
                                        <div key={idx} className="border p-3 rounded-lg bg-white shadow-sm relative">
                                            <button onClick={() => removeField(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="flex gap-2 mb-2 pr-6">
                                                <input
                                                    type="text" value={field.label}
                                                    onChange={(e) => updateField(idx, 'label', e.target.value)}
                                                    className="flex-1 border p-1 rounded text-sm font-bold"
                                                    placeholder="항목명"
                                                />
                                                <select
                                                    value={field.type}
                                                    onChange={(e) => updateField(idx, 'type', e.target.value)}
                                                    className="border p-1 rounded text-xs bg-gray-50"
                                                >
                                                    <option value="text">단문 텍스트 (20자)</option>
                                                    <option value="textarea">장문 텍스트 (200자)</option>
                                                    <option value="tel">연락처 (3단 분리)</option>
                                                    <option value="select">선택박스</option>
                                                    <option value="radio">라디오</option>
                                                </select>
                                            </div>
                                            <label className="flex items-center gap-2 text-xs text-gray-600">
                                                <input
                                                    type="checkbox" checked={field.required}
                                                    onChange={(e) => updateField(idx, 'required', e.target.checked)}
                                                /> 필수항목
                                            </label>

                                            {/* Options Management for Select/Radio */}
                                            {(field.type === 'select' || field.type === 'radio') && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-xs font-bold text-gray-500">
                                                            {field.type === 'select' ? '선택박스' : '라디오'} 옵션 관리
                                                        </label>
                                                        <button
                                                            onClick={() => addFieldOption(idx)}
                                                            className="text-xs text-blue-600 font-bold hover:underline flex items-center"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" /> 옵션 추가
                                                        </button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {field.options?.map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex gap-2 items-center">
                                                                <div className="flex-1 grid grid-cols-2 gap-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="라벨 (화면용)"
                                                                        value={opt.label}
                                                                        onChange={(e) => updateFieldOption(idx, optIdx, 'label', e.target.value)}
                                                                        className="border p-1 rounded text-xs"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="값 (저장용)"
                                                                        value={opt.value}
                                                                        onChange={(e) => updateFieldOption(idx, optIdx, 'value', e.target.value)}
                                                                        className="border p-1 rounded text-xs"
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => removeFieldOption(idx, optIdx)}
                                                                    className="text-gray-400 hover:text-red-500 p-1"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {(!field.options || field.options.length === 0) && (
                                                            <p className="text-xs text-gray-400 text-center py-2">
                                                                옵션이 없습니다. 추가해주세요.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={() => setConfig(prev => ({
                                        ...prev,
                                        formConfig: { ...prev.formConfig, fields: [...prev.formConfig.fields, { id: `f${Date.now()}`, label: '새 항목', type: 'text', required: true }] }
                                    }))} className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg text-sm font-bold hover:border-blue-400 hover:text-blue-500">
                                        + 입력 항목 추가
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* --- TEXT SECTION TAB --- */}
                        {activeTab === 'text' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* ... Existing Text Tab Content ... */}
                                <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-800 mb-4">
                                    상세 이미지 섹션을 사용할 경우, 아래 텍스트 섹션의 제목을 비워두면 화면에 표시되지 않습니다.
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">문제 제기 섹션</h3>
                                    <input
                                        type="text" value={config.problem.title}
                                        onChange={(e) => updateNested(['problem', 'title'], e.target.value)}
                                        className="w-full border p-2 rounded text-sm" placeholder="섹션 제목 (비우면 숨김)"
                                    />
                                    <textarea
                                        value={config.problem.description}
                                        onChange={(e) => updateNested(['problem', 'description'], e.target.value)}
                                        className="w-full border p-2 rounded text-sm h-20" placeholder="설명"
                                    />
                                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                        <label className="text-xs font-bold text-gray-500 block mb-2 flex justify-between">
                                            문제점 리스트
                                            <button onClick={addProblemPoint} className="text-blue-600 hover:underline flex items-center">
                                                <Plus className="w-3 h-3 mr-1" /> 추가
                                            </button>
                                        </label>
                                        <div className="space-y-2">
                                            {config.problem.points.map((point, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        type="text" value={point}
                                                        onChange={(e) => updateProblemPoint(idx, e.target.value)}
                                                        className="flex-1 border p-1 rounded text-xs"
                                                        placeholder="문제점 입력"
                                                    />
                                                    <button onClick={() => removeProblemPoint(idx)} className="text-gray-400 hover:text-red-500 p-1">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 border-t pt-4">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">해결책 섹션</h3>
                                    <input
                                        type="text" value={config.solution.title}
                                        onChange={(e) => updateNested(['solution', 'title'], e.target.value)}
                                        className="w-full border p-2 rounded text-sm" placeholder="섹션 제목 (비우면 숨김)"
                                    />
                                    <textarea
                                        value={config.solution.description}
                                        onChange={(e) => updateNested(['solution', 'description'], e.target.value)}
                                        className="w-full border p-2 rounded text-sm h-20" placeholder="해결책 설명 (선택)"
                                    />
                                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                        <label className="text-xs font-bold text-gray-500 block mb-2 flex justify-between">
                                            특징 리스트 (3개 권장)
                                            <button onClick={addSolutionFeature} className="text-blue-600 hover:underline flex items-center">
                                                <Plus className="w-3 h-3 mr-1" /> 추가
                                            </button>
                                        </label>
                                        <div className="space-y-3">
                                            {config.solution.features.map((feat, idx) => (
                                                <div key={idx} className="bg-white border p-2 rounded relative">
                                                    <button onClick={() => removeSolutionFeature(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                    <div className="mb-1">
                                                        <input
                                                            type="text" value={feat.title}
                                                            onChange={(e) => updateSolutionFeature(idx, 'title', e.target.value)}
                                                            className="w-full border-b p-1 text-xs font-bold focus:border-blue-500 outline-none"
                                                            placeholder="특징 제목"
                                                        />
                                                    </div>
                                                    <div>
                                                        <textarea
                                                            value={feat.desc}
                                                            onChange={(e) => updateSolutionFeature(idx, 'desc', e.target.value)}
                                                            className="w-full p-1 text-xs resize-none h-12 outline-none"
                                                            placeholder="특징 설명"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- FOOTER TAB (NEW) --- */}
                        {activeTab === 'footer' && (
                            <div className="space-y-6 animate-fade-in">

                                {/* Footer Images */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-green-600" /> 하단 이미지
                                            <button
                                                onClick={() => footerImageInputRef.current?.click()}
                                                className="ml-2 w-6 h-6 bg-green-600 text-white rounded flex items-center justify-center hover:bg-green-700"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </h3>
                                        <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                                            <span className="text-[10px] font-bold text-blue-600">표시</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={config.footer?.isShow || false}
                                                    onChange={(e) => updateNested(['footer', 'isShow'], e.target.checked)}
                                                />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    <input
                                        type="file" ref={footerImageInputRef} className="hidden" accept="image/*"
                                        onChange={(e) => handleImageUpload(e, (url) => {
                                            addFooterImage(url);
                                            if (footerImageInputRef.current) footerImageInputRef.current.value = ''; // reset
                                        })}
                                    />

                                    {/* Image List (Carousel Style) */}
                                    <div className="flex gap-2 overflow-x-auto pb-2 min-h-[80px]">
                                        {(config.footer?.images || []).map((img, idx) => (
                                            <div key={idx} className="relative group shrink-0 w-20 h-16 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                                                <img src={img} alt="Footer" className="w-full h-full object-contain" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                    <button onClick={() => moveFooterImage(idx, 'left')} className="text-white p-0.5 hover:text-blue-300"><ArrowLeft className="w-3 h-3" /></button>
                                                    <button onClick={() => removeFooterImage(idx)} className="text-white p-0.5 hover:text-red-400"><X className="w-4 h-4" /></button>
                                                    <button onClick={() => moveFooterImage(idx, 'right')} className="text-white p-0.5 hover:text-blue-300"><ArrowUp className="w-3 h-3 rotate-90" /></button>
                                                </div>
                                            </div>
                                        ))}
                                        {(config.footer?.images?.length === 0) && (
                                            <div className="w-full text-center text-xs text-gray-400 py-4 bg-gray-50 rounded border border-dashed">
                                                등록된 이미지가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Copyright Text */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">카피라이트 문구</h3>

                                    {/* Toolbar */}
                                    <div className="flex gap-2 mb-2 p-1 bg-gray-50 border rounded text-xs items-center">
                                        <select
                                            value={config.footer?.copyrightStyle?.fontSize || '0.75rem'}
                                            onChange={(e) => updateNested(['footer', 'copyrightStyle', 'fontSize'], e.target.value)}
                                            className="border rounded p-1"
                                        >
                                            <option value="0.75rem">작게 (12px)</option>
                                            <option value="0.875rem">보통 (14px)</option>
                                            <option value="1rem">크게 (16px)</option>
                                        </select>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config.footer?.copyrightStyle?.fontWeight === '700'}
                                                onChange={(e) => updateNested(['footer', 'copyrightStyle', 'fontWeight'], e.target.checked ? '700' : '400')}
                                            />
                                            글자굵게
                                        </label>
                                        <select
                                            value={config.footer?.copyrightStyle?.textAlign || 'center'}
                                            onChange={(e) => updateNested(['footer', 'copyrightStyle', 'textAlign'], e.target.value)}
                                            className="border rounded p-1 ml-auto"
                                        >
                                            <option value="left">왼쪽 정렬</option>
                                            <option value="center">가운데 정렬</option>
                                            <option value="right">오른쪽 정렬</option>
                                        </select>
                                    </div>

                                    <textarea
                                        value={config.footer?.copyrightText || ''}
                                        onChange={(e) => updateNested(['footer', 'copyrightText'], e.target.value)}
                                        className="w-full border rounded p-3 text-sm h-24 font-mono leading-relaxed"
                                        placeholder="예: © 2025 Company Name. All Rights Reserved."
                                    />

                                    <button
                                        onClick={() => updateNested(['footer', 'copyrightText'], DEFAULT_CONFIG.footer?.copyrightText)}
                                        className="text-xs text-gray-400 underline mt-2 hover:text-gray-600"
                                    >
                                        기본 카피라이트 문구 가져오기
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* RIGHT: Live Preview Panel */}
                {/* ... Same as before ... */}
                <div className="flex-1 bg-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-4 flex gap-2 bg-white p-1 rounded-lg shadow-lg z-20">
                        <button
                            onClick={() => setPreviewMode('mobile')}
                            className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="모바일 뷰"
                        >
                            <Smartphone className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setPreviewMode('desktop')}
                            className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="PC 뷰"
                        >
                            <Monitor className="w-5 h-5" />
                        </button>
                    </div>
                    <div
                        className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden no-scrollbar border-[8px] border-gray-800 rounded-[2rem] relative transform
                    ${previewMode === 'mobile' ? 'w-[375px] h-[812px]' : 'w-full h-full rounded-none border-none'}
                `}
                    >
                        {previewMode === 'mobile' && (
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-xl z-50"></div>
                        )}

                        <LandingPage previewConfig={config} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LandingEditor;