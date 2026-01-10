import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LandingConfig, FormField, TextStyle, FloatingBanner, DetailContent, CustomFont, GlobalSettings, FormStyle } from '../../types';
import LandingPage from '../LandingPage';
import { saveLandingConfig, fetchLandingConfigById, uploadImageToDrive, fetchGlobalSettings, manageVirtualData } from '../../services/googleSheetService';
import { Save, Copy, ArrowLeft, Trash2, PlusCircle, Smartphone, Monitor, Image as ImageIcon, AlignLeft, CheckSquare, Upload, Type, Palette, ArrowUp, ArrowDown, Youtube, FileText, Megaphone, X, Plus, Layout, AlertCircle, Maximize, Globe, Share2, Anchor, Send, Loader2, CheckCircle, MapPin, Clock, MessageCircle, ExternalLink, RefreshCw, Menu, Grid, List } from 'lucide-react';
import { GOOGLE_FONTS_LIST } from '../../utils/fontUtils';
import FontPicker from '../../components/admin/FontPicker';

// GitHub Sync Check: Force Update
// Default empty config template
// Helper to auto-append 'px' if only number is entered
const formatSizeValue = (val: string) => {
    if (!val) return '';
    // Allow empty string or just unit
    if (/^\d+(\.\d+)?$/.test(val)) return `${val}px`;
    return val;
};

// Helper to remove 'px' for display if it's a simple pixel value
const displaySizeValue = (val: string | undefined) => {
    if (!val) return '';
    return val.replace(/^(\d+(\.\d+)?)px$/, '$1');
};

// --- Constants ---
const FORM_PRESETS: Record<string, { label: string, style: FormStyle }> = {
    standard: {
        label: '기본형 (Standard)',
        style: {
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderWidth: '1px',
            borderRadius: '16px',
            textColor: '#1f2937',
            titleColor: '#ffffff',
            titleFontSize: '1.5rem',
            titleAlign: 'center',
            buttonBackgroundColor: '#0ea5e9', // Primary Blue
            buttonTextColor: '#ffffff',
            buttonRadius: '12px',
            buttonWidth: 'full',
            buttonAlign: 'center'
        }
    },
    dark: {
        label: '다크 임팩트 (Dark)',
        style: {
            backgroundColor: '#1f2937', // Dark Gray
            borderColor: '#374151',
            borderWidth: '1px',
            borderRadius: '12px',
            textColor: '#f9fafb', // Light Text
            titleColor: '#ffffff',
            titleFontSize: '1.5rem',
            titleAlign: 'center',
            buttonBackgroundColor: '#f59e0b', // Amber/Orange
            buttonTextColor: '#1f2937',
            buttonRadius: '8px',
            buttonWidth: 'full',
            buttonAlign: 'center'
        }
    },
    soft: {
        label: '소프트 라운드 (Soft)',
        style: {
            backgroundColor: '#f8fafc', // Slate 50
            borderColor: '#e2e8f0',
            borderWidth: '0px', // Shadow driven
            borderRadius: '24px',
            textColor: '#334155',
            titleColor: '#0ea5e9', // Title matches primary
            titleFontSize: '1.25rem',
            titleAlign: 'center',
            buttonBackgroundColor: '#3b82f6',
            buttonTextColor: '#ffffff',
            buttonRadius: '9999px', // Pill
            buttonWidth: 'auto',
            buttonAlign: 'center'
        }
    },
    clean: {
        label: '심플 미니멀 (Clean)',
        style: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: '0px',
            borderRadius: '0px',
            textColor: '#111827',
            titleColor: '#111827',
            titleFontSize: '1.5rem',
            titleAlign: 'left',
            buttonBackgroundColor: '#111827', // Black
            buttonTextColor: '#ffffff',
            buttonRadius: '4px',
            buttonWidth: 'full',
            buttonAlign: 'center'
        }
    }
};

const DEFAULT_CONFIG: LandingConfig = {
    id: '',
    title: '',
    favicon: '',
    ogImage: '',
    ogTitle: '',
    ogDescription: '',
    keywords: '',
    theme: { primaryColor: '#0ea5e9', secondaryColor: '#0f172a', fontConfig: { primaryFont: '', source: 'google' }, customFonts: [] },
    banners: [],
    hero: {
        isShow: true, // Default: Show Hero
        headline: '메인 카피를 입력하세요',
        headlineStyle: { fontSize: '3rem', fontWeight: '800', color: '#ffffff', textAlign: 'center' },
        subHeadline: '서브 카피를 입력하세요',
        subHeadlineStyle: { fontSize: '1.25rem', fontWeight: '400', color: '#d1d5db', textAlign: 'center' },
        ctaText: '신청하기',
        backgroundImage: 'https://picsum.photos/1920/1080',
        size: 'md'
    },
    detailContent: [],

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
    },
    navigation: { isShow: false, showHome: false, items: [] },
    gallery: { isShow: false, showOnMainPage: true, title: '갤러리', images: [] },
    board: { isShow: false, showOnMainPage: true, title: '게시판', type: 'list', items: [] },
    location: {
        isShow: false,
        title: '오시는 길',
        address: '서울 강남구 테헤란로 123',
        showMap: true,
        titleStyle: { fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', textAlign: 'center' },
        addressStyle: { fontSize: '1rem', fontWeight: '400', color: '#4b5563', textAlign: 'center' }
    },
    snsConfig: { isShow: false, position: 'bottom-right', displayMode: 'floating', style: {}, items: [] },
    features: { isShow: false, title: '주요 특징', description: '우리 서비스의 특별한 점을 소개합니다.', items: [] }
};

const LandingEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [config, setConfig] = useState<LandingConfig>(DEFAULT_CONFIG);
    const [activeTab, setActiveTab] = useState('hero');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
    const [deployStatus, setDeployStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({ customFonts: [], favoriteFonts: [] });
    const [fontUploadTab, setFontUploadTab] = useState<'google' | 'file'>('google');

    // File input refs
    const heroBgInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const ogImageInputRef = useRef<HTMLInputElement>(null);
    const bannerImageInputRef = useRef<HTMLInputElement>(null);
    const detailImageInputRef = useRef<HTMLInputElement>(null);
    const footerImageInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        // Fetch Global Settings (Fonts)
        console.log('Fetching global settings...');
        const loadGlobalSettings = async () => {
            const settings = await fetchGlobalSettings();
            if (settings) {
                setGlobalSettings(settings);
            }
        };
        loadGlobalSettings();

        if (id) {
            // ... Existing logic ...
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
                    // Ensure Critical Sections exist
                    if (!loadedConfig.hero) loadedConfig.hero = JSON.parse(JSON.stringify(DEFAULT_CONFIG.hero));

                    if (!loadedConfig.formConfig) loadedConfig.formConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG.formConfig));

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

                    // Migration: detailImages -> detailContent
                    if (!sheetConfig.detailContent && (sheetConfig as any).detailImages) {
                        sheetConfig.detailContent = ((sheetConfig as any).detailImages as string[]).map(url => ({
                            id: crypto.randomUUID(),
                            type: 'image',
                            content: url,
                            width: '100%'
                        }));
                    }
                    if (!sheetConfig.detailContent) sheetConfig.detailContent = [];

                    // Ensure Critical Sections exist
                    if (!sheetConfig.hero) sheetConfig.hero = JSON.parse(JSON.stringify(DEFAULT_CONFIG.hero));

                    if (!sheetConfig.formConfig) sheetConfig.formConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG.formConfig));
                    if (!sheetConfig.location) sheetConfig.location = JSON.parse(JSON.stringify(DEFAULT_CONFIG.location));
                    if (!sheetConfig.features) sheetConfig.features = JSON.parse(JSON.stringify(DEFAULT_CONFIG.features));
                    if (!sheetConfig.snsConfig) sheetConfig.snsConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG.snsConfig));
                    // Migration for SNS items
                    if (sheetConfig.snsConfig && !sheetConfig.snsConfig.items) {
                        sheetConfig.snsConfig.items = [];
                    }
                    if (!sheetConfig.features) sheetConfig.features = JSON.parse(JSON.stringify(DEFAULT_CONFIG.features));
                    if (sheetConfig.features && !sheetConfig.features.items) {
                        sheetConfig.features.items = [];
                    }

                    setConfig(sheetConfig);
                } else {
                    // Fallback or New
                    // Keep default
                }
            };
            loadFromSheet();

        } else {
            // New Page: ID generation moved to saving or keep simplified
            const newId = String(Date.now()).slice(-6);
            setConfig({ ...DEFAULT_CONFIG, id: newId });
        }
    }, [id]);

    // NEW: Inject Custom Fonts into Editor Document so FontPicker can render them
    // [SECURE LOAD] Fetch font data via Proxy to bypass CORS
    useEffect(() => {
        if (globalSettings?.customFonts && globalSettings.customFonts.length > 0) {
            import('../../services/googleSheetService').then(({ fetchProxyFont }) => {
                globalSettings.customFonts.forEach(async (font) => {
                    const styleId = `editor-font-style-${font.id}`;
                    if (document.getElementById(styleId)) return;

                    const proxyData = await fetchProxyFont(font.id || '');
                    if (proxyData) {
                        const styleTag = document.createElement('style');
                        styleTag.id = styleId;
                        styleTag.textContent = `
                           @font-face {
                               font-family: '${font.family}';
                               src: url('${proxyData.data}') format('${proxyData.format}');
                               font-weight: normal;
                               font-style: normal;
                               font-display: swap;
                           }
                       `;
                        document.head.appendChild(styleTag);
                    } else {
                        console.warn("Editor Proxy load failed for", font.family);
                        // Fallback
                    }
                });
            });
        }
    }, [globalSettings.customFonts]);

    // --- SYNC GLOBAL FONTS TO CONFIG ---
    // This ensures that when fonts are uploaded/synced, the preview immediately sees them.
    useEffect(() => {
        if (globalSettings.customFonts) {
            setConfig(prev => {
                // Prevent unnecessary re-renders
                if (JSON.stringify(prev.theme.customFonts) === JSON.stringify(globalSettings.customFonts)) {
                    return prev;
                }
                return {
                    ...prev,
                    theme: {
                        ...prev.theme,
                        customFonts: globalSettings.customFonts
                    }
                };
            });
        }
    }, [globalSettings.customFonts]);

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
            const recursiveUpdate = (obj: any, pIndex: number): any => {
                if (pIndex === path.length) return value;

                const key = path[pIndex];
                const currentVal = obj ? obj[key] : undefined;
                const safeObj = obj ? (Array.isArray(obj) ? [...obj] : { ...obj }) : {};

                safeObj[key] = recursiveUpdate(currentVal, pIndex + 1);
                return safeObj;
            };
            return recursiveUpdate(prev, 0);
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
                        <label className="text-[10px] text-gray-500 block">크기 (px 자동완성)</label>
                        <input
                            type="text"
                            value={displaySizeValue(getValue('fontSize'))}
                            onChange={e => updateStyle('fontSize', formatSizeValue(e.target.value))}
                            className="w-full border rounded p-1 text-xs"
                            placeholder="inherit"
                        />
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
                    <div className="col-span-2">
                        <FontPicker
                            label="폰트 (글꼴)"
                            value={getValue('fontFamily') || ''}
                            onChange={(val) => updateStyle('fontFamily', val)}
                            globalSettings={globalSettings}
                            onSettingsChange={setGlobalSettings}
                        />
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

    const ButtonStyleEditor = ({ label, stylePath, mode = 'nested' }: { label: string, stylePath?: string[], mode?: 'nested' | 'flat_form_button' }) => {
        // Helper to access safe value
        const getValue = (key: string) => {
            if (mode === 'flat_form_button') {
                // Map abstract key to flat config key
                const map: any = { backgroundColor: 'buttonBackgroundColor', textColor: 'buttonTextColor', borderRadius: 'buttonRadius', fontSize: 'buttonFontSize', width: 'buttonWidth', alignment: 'buttonAlign' };
                return config.formConfig.style ? config.formConfig.style[map[key] as keyof typeof config.formConfig.style] : undefined;
            }
            // Nested mode
            if (!stylePath) return undefined;
            let current: any = config;
            for (const p of stylePath) {
                if (!current) return undefined;
                current = current[p];
            }
            return current ? current[key] : undefined;
        }

        const updateStyle = (key: string, val: any) => {
            if (mode === 'flat_form_button') {
                const map: any = { backgroundColor: 'buttonBackgroundColor', textColor: 'buttonTextColor', borderRadius: 'buttonRadius', fontSize: 'buttonFontSize', width: 'buttonWidth', alignment: 'buttonAlign', fontFamily: 'buttonFontFamily' };
                updateNested(['formConfig', 'style', map[key]], val);
            } else if (stylePath) {
                updateNested([...stylePath, key], val);
            }
        };

        return (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-700">{label} 디자인</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block">배경 색상</label>
                        <div className="flex items-center gap-1">
                            <input type="color" value={getValue('backgroundColor') || '#000000'} onChange={e => updateStyle('backgroundColor', e.target.value)} className="w-6 h-6 border rounded cursor-pointer p-0" />
                            <input type="text" value={getValue('backgroundColor') || ''} onChange={e => updateStyle('backgroundColor', e.target.value)} className="flex-1 border rounded p-1 text-xs" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">텍스트 색상</label>
                        <div className="flex items-center gap-1">
                            <input type="color" value={getValue('textColor') || '#ffffff'} onChange={e => updateStyle('textColor', e.target.value)} className="w-6 h-6 border rounded cursor-pointer p-0" />
                            <input type="text" value={getValue('textColor') || ''} onChange={e => updateStyle('textColor', e.target.value)} className="flex-1 border rounded p-1 text-xs" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">글자 크기</label>
                        <input
                            type="text"
                            value={displaySizeValue(getValue('fontSize'))}
                            onChange={e => updateStyle('fontSize', formatSizeValue(e.target.value))}
                            className="w-full border rounded p-1 text-xs"
                            placeholder="inherit"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">모서리 둥글게</label>
                        <input
                            type="text"
                            value={displaySizeValue(getValue('borderRadius'))}
                            onChange={e => updateStyle('borderRadius', formatSizeValue(e.target.value))}
                            className="w-full border rounded p-1 text-xs"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">너비</label>
                        <select value={getValue('width') || 'auto'} onChange={e => updateStyle('width', e.target.value)} className="w-full border rounded p-1 text-xs">
                            <option value="auto">텍스트 맞춤 (Auto)</option>
                            <option value="xs">XS (128px)</option>
                            <option value="sm">SM (192px)</option>
                            <option value="md">MD (256px)</option>
                            <option value="lg">LG (320px)</option>
                            <option value="xl">XL (384px)</option>
                            <option value="full">가로 꽉 채움 (Full)</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <FontPicker
                            label="폰트 (글꼴)"
                            value={getValue('fontFamily') || ''}
                            onChange={(val) => updateStyle('fontFamily', val)}
                            globalSettings={globalSettings}
                            onSettingsChange={setGlobalSettings}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">정렬 (위치)</label>
                        <select value={getValue('alignment') || 'center'} onChange={e => updateStyle('alignment', e.target.value)} className="w-full border rounded p-1 text-xs">
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

    // Detail Content Logic (Image, YouTube, Map, Banner)
    const handleAddDetailContent = (url: string, type: 'image' | 'youtube' | 'map' | 'banner' = 'image') => {
        if (!url && type === 'image') return;

        const newContent: any = {
            id: crypto.randomUUID(),
            type,
            content: url,
            width: '100%',
            videoSize: 'md',
            autoPlay: false,
            mapSize: 'md'
        };

        if (type === 'banner') {
            newContent.bannerStyle = {
                height: '300px',
                backgroundColor: '#f3f4f6',
                textColor: '#000000',
                textAlign: 'center',
                fontSize: '1.5rem',
                overlayOpacity: 0
            };
            newContent.urgencyConfig = {
                showCountdown: false,
                showTicker: false,
                tickerMessage: '{name}님 ({phone}) 신청완료!'
            };
        }

        setConfig(prev => ({
            ...prev,
            detailContent: [...prev.detailContent, newContent]
        }));
    };

    const handleRemoveDetailContent = (index: number) => {
        setConfig(prev => ({
            ...prev,
            detailContent: prev.detailContent.filter((_, i) => i !== index)
        }));
    };

    const handleDetailContentOrder = (index: number, direction: 'up' | 'down') => {
        setConfig(prev => {
            const newContent = [...prev.detailContent];
            if (direction === 'up' && index > 0) {
                [newContent[index], newContent[index - 1]] = [newContent[index - 1], newContent[index]];
            } else if (direction === 'down' && index < newContent.length - 1) {
                [newContent[index], newContent[index + 1]] = [newContent[index + 1], newContent[index]];
            }
            return { ...prev, detailContent: newContent };
        });
    };

    const updateDetailContent = (index: number, updates: Partial<DetailContent>) => {
        setConfig(prev => ({
            ...prev,
            detailContent: prev.detailContent.map((item, i) => i === index ? { ...item, ...updates } : item)
        }));
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
        <div className="lg:h-screen min-h-screen bg-gray-100 flex flex-col font-sans lg:overflow-hidden overflow-y-auto">
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between shrink-0 z-20 shadow-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-700 rounded-full text-white transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-white font-bold flex items-center gap-2 text-sm md:text-xl">
                            랜딩페이지 에디터
                            <span className="text-xs font-mono bg-gray-700 px-2 py-0.5 rounded text-gray-300 hidden md:inline-flex">ID: {config.id}</span>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-1 md:gap-2">
                    <button onClick={saveToLocal} className="flex items-center px-2 md:px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600">
                        <Save className="w-4 h-4 md:mr-1.5" />
                        <span className="hidden md:inline">임시 저장</span>
                    </button>
                    <button onClick={handleDeploy} disabled={deployStatus === 'saving'} className="flex items-center px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-sm md:w-32 justify-center disabled:opacity-50">
                        {deployStatus === 'saving' ? <><Loader2 className="w-3 h-3 md:mr-1.5 animate-spin" /> <span className="hidden md:inline">저장중...</span></> :
                            deployStatus === 'success' ? <><CheckCircle className="w-3 h-3 md:mr-1.5" /> <span className="hidden md:inline">저장완료!</span></> :
                                deployStatus === 'error' ? <><AlertCircle className="w-3 h-3 md:mr-1.5" /> <span className="hidden md:inline">저장실패</span></> :
                                    <><Send className="w-3 h-3 md:mr-1.5" /> <span className="hidden md:inline">저장 및 배포</span><span className="md:hidden">배포</span></>}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden overflow-visible">

                {/* LEFT: Editor Panel */}
                <div className="w-full lg:w-[450px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-10 relative">

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'basic', label: '기본', icon: <AlignLeft className="w-4 h-4" /> },
                            { id: 'layout', label: '레이아웃/GNB', icon: <Layout className="w-4 h-4" /> },
                            { id: 'hero', label: '타이틀', icon: <Smartphone className="w-4 h-4" /> },
                            { id: 'features', label: '특징(Ani)', icon: <Layout className="w-4 h-4 text-purple-500" /> }, // New Tab

                            { id: 'images', label: '상세', icon: <ImageIcon className="w-4 h-4" /> },
                            { id: 'gallery', label: '갤러리', icon: <Grid className="w-4 h-4" /> },
                            { id: 'board', label: '게시판', icon: <List className="w-4 h-4" /> },
                            { id: 'location', label: '위치', icon: <MapPin className="w-4 h-4" /> },
                            { id: 'form', label: '입력폼', icon: <CheckSquare className="w-4 h-4" /> },
                            { id: 'popup', label: '팝업', icon: <Megaphone className="w-4 h-4" /> },
                            { id: 'chat', label: '문의버튼', icon: <MessageCircle className="w-4 h-4" /> },
                            { id: 'sns', label: 'SNS/외부', icon: <Share2 className="w-4 h-4" /> },
                            { id: 'footer', label: '하단', icon: <Anchor className="w-4 h-4" /> },
                            { id: 'seo', label: '검색엔진', icon: <Globe className="w-4 h-4" /> },
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
                    <div className="flex-1 lg:overflow-y-auto overflow-visible p-5 space-y-6">


                        {/* ... POPUP TAB ... */}
                        {activeTab === 'popup' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">팝업 관리</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs font-bold text-gray-700">팝업 사용</span>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="toggle" id="popup-toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                checked={config.popupConfig?.usePopup || false}
                                                onChange={(e) => updateNested(['popupConfig', 'usePopup'], e.target.checked)}
                                            />
                                            <label htmlFor="popup-toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${config.popupConfig?.usePopup ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                        </div>
                                    </label>
                                </div>

                                {config.popupConfig?.usePopup && (
                                    <>
                                        {/* Global Config */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                                            <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                                <Layout className="w-3 h-3" /> 공통 설정
                                            </h4>

                                            {/* Slider Config */}
                                            <div className="flex gap-4 border-b border-gray-200 pb-3">
                                                <label className="flex items-center gap-1 text-xs text-gray-600">
                                                    <input type="checkbox"
                                                        checked={config.popupConfig?.autoPlay || false}
                                                        onChange={(e) => updateNested(['popupConfig', 'autoPlay'], e.target.checked)}
                                                    /> 자동 재생
                                                </label>
                                                {config.popupConfig?.autoPlay && (
                                                    <label className="flex items-center gap-1 text-xs text-gray-600">
                                                        간격:
                                                        <input type="number"
                                                            value={config.popupConfig?.autoPlayInterval || 3}
                                                            onChange={(e) => updateNested(['popupConfig', 'autoPlayInterval'], parseInt(e.target.value))}
                                                            className="w-12 border rounded p-0.5 text-center"
                                                        />초
                                                    </label>
                                                )}
                                                <label className="flex items-center gap-1 text-xs text-gray-600">
                                                    <input type="checkbox"
                                                        checked={config.popupConfig?.showDoNotOpenToday || false}
                                                        onChange={(e) => updateNested(['popupConfig', 'showDoNotOpenToday'], e.target.checked)}
                                                    /> '오늘 하루 안 보기' 표시
                                                </label>
                                            </div>

                                            {/* Positioning Config */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white p-3 rounded border border-gray-100">
                                                    <div className="flex items-center gap-1 mb-2 text-blue-600">
                                                        <Monitor className="w-3 h-3" />
                                                        <span className="text-xs font-bold">PC 위치/크기 (px)</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        <div>
                                                            <label className="block text-gray-400 text-[10px]">너비</label>
                                                            <input type="number"
                                                                className="w-full border rounded p-1"
                                                                value={config.popupConfig?.pcStyle?.width || 400}
                                                                onChange={(e) => updateNested(['popupConfig', 'pcStyle', 'width'], parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-gray-400 text-[10px]">Top</label>
                                                            <input type="number"
                                                                className="w-full border rounded p-1"
                                                                value={config.popupConfig?.pcStyle?.top || 100}
                                                                onChange={(e) => updateNested(['popupConfig', 'pcStyle', 'top'], parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-gray-400 text-[10px]">Left</label>
                                                            <div className="flex flex-col gap-1">
                                                                <input type="number"
                                                                    className={`w-full border rounded p-1 ${config.popupConfig?.pcStyle?.isCentered ? 'bg-gray-100 text-gray-400' : ''}`}
                                                                    value={config.popupConfig?.pcStyle?.left || 50}
                                                                    disabled={config.popupConfig?.pcStyle?.isCentered}
                                                                    onChange={(e) => updateNested(['popupConfig', 'pcStyle', 'left'], parseInt(e.target.value))}
                                                                />
                                                                <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                                                                    <input type="checkbox"
                                                                        checked={config.popupConfig?.pcStyle?.isCentered || false}
                                                                        onChange={(e) => updateNested(['popupConfig', 'pcStyle', 'isCentered'], e.target.checked)}
                                                                    />
                                                                    <span className="text-blue-600 font-bold">가운데 정렬</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-3 rounded border border-gray-100">
                                                    <div className="flex items-center gap-1 mb-2 text-green-600">
                                                        <Smartphone className="w-3 h-3" />
                                                        <span className="text-xs font-bold">모바일 위치/크기 (px)</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        <div>
                                                            <label className="block text-gray-400 text-[10px]">너비</label>
                                                            <input type="number"
                                                                className="w-full border rounded p-1"
                                                                value={config.popupConfig?.mobileStyle?.width || 300}
                                                                onChange={(e) => updateNested(['popupConfig', 'mobileStyle', 'width'], parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-gray-400 text-[10px]">Top</label>
                                                            <input type="number"
                                                                className="w-full border rounded p-1"
                                                                value={config.popupConfig?.mobileStyle?.top || 80}
                                                                onChange={(e) => updateNested(['popupConfig', 'mobileStyle', 'top'], parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-gray-400 text-[10px]">Left</label>
                                                            <div className="flex flex-col gap-1">
                                                                <input type="number"
                                                                    className={`w-full border rounded p-1 ${config.popupConfig?.mobileStyle?.isCentered ? 'bg-gray-100 text-gray-400' : ''}`}
                                                                    value={config.popupConfig?.mobileStyle?.left || 20}
                                                                    disabled={config.popupConfig?.mobileStyle?.isCentered}
                                                                    onChange={(e) => updateNested(['popupConfig', 'mobileStyle', 'left'], parseInt(e.target.value))}
                                                                />
                                                                <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                                                                    <input type="checkbox"
                                                                        checked={config.popupConfig?.mobileStyle?.isCentered || false}
                                                                        onChange={(e) => updateNested(['popupConfig', 'mobileStyle', 'isCentered'], e.target.checked)}
                                                                    />
                                                                    <span className="text-blue-600 font-bold">가운데 정렬</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Popup Items */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-bold text-gray-700">팝업 목록 ({config.popupConfig?.items?.length || 0}/5)</h4>
                                                <button
                                                    onClick={() => {
                                                        const currentItems = config.popupConfig?.items || [];
                                                        if (currentItems.length >= 5) {
                                                            alert('최대 5개까지만 추가 가능합니다.');
                                                            return;
                                                        }
                                                        updateNested(['popupConfig', 'items'], [
                                                            ...currentItems,
                                                            { id: crypto.randomUUID(), imageUrl: '', openInNewWindow: false }
                                                        ]);
                                                    }}
                                                    className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs hover:bg-blue-100 font-bold"
                                                >
                                                    <PlusCircle className="w-3 h-3" /> 추가
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {config.popupConfig?.items?.map((item, idx) => (
                                                    <div key={item.id} className="bg-white border border-gray-200 rounded p-3 relative group">
                                                        <button
                                                            onClick={() => {
                                                                const newItems = config.popupConfig!.items!.filter((_, i) => i !== idx);
                                                                updateNested(['popupConfig', 'items'], newItems);
                                                            }}
                                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>

                                                        <div className="flex gap-3">
                                                            {/* Image Preview / Upload */}
                                                            <div className="w-20 h-20 shrink-0 bg-gray-100 rounded border flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 relative"
                                                                onClick={() => document.getElementById(`popup-upload-${item.id}`)?.click()}
                                                            >
                                                                {item.imageUrl ? (
                                                                    <img src={item.imageUrl} alt="Popup" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="text-center text-gray-400">
                                                                        <Upload className="w-5 h-5 mx-auto mb-1" />
                                                                        <span className="text-[9px]">업로드</span>
                                                                    </div>
                                                                )}
                                                                <input
                                                                    type="file"
                                                                    id={`popup-upload-${item.id}`}
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleImageUpload(e, (url) => {
                                                                        const newItems = [...config.popupConfig!.items!];
                                                                        newItems[idx] = { ...newItems[idx], imageUrl: url };
                                                                        updateNested(['popupConfig', 'items'], newItems);
                                                                    })}
                                                                />
                                                            </div>

                                                            {/* Infos */}
                                                            <div className="flex-1 space-y-2">
                                                                <div>
                                                                    <label className="block text-[10px] text-gray-500">연결 링크 URL</label>
                                                                    <input type="text"
                                                                        className="w-full border rounded p-1 text-xs"
                                                                        placeholder="https://..."
                                                                        value={item.linkUrl || ''}
                                                                        onChange={(e) => {
                                                                            const newItems = [...config.popupConfig!.items!];
                                                                            newItems[idx] = { ...newItems[idx], linkUrl: e.target.value };
                                                                            updateNested(['popupConfig', 'items'], newItems);
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <label className="block text-[10px] text-gray-500">게시 시작일 (YYYY-MM-DD HH:mm)</label>
                                                                        <input type="datetime-local"
                                                                            className="w-full border rounded p-1 text-xs"
                                                                            value={item.startDate || ''}
                                                                            onChange={(e) => {
                                                                                const newItems = [...config.popupConfig!.items!];
                                                                                newItems[idx] = { ...newItems[idx], startDate: e.target.value };
                                                                                updateNested(['popupConfig', 'items'], newItems);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] text-gray-500">게시 종료일 (YYYY-MM-DD HH:mm)</label>
                                                                        <input type="datetime-local"
                                                                            className="w-full border rounded p-1 text-xs"
                                                                            value={item.endDate || ''}
                                                                            onChange={(e) => {
                                                                                const newItems = [...config.popupConfig!.items!];
                                                                                newItems[idx] = { ...newItems[idx], endDate: e.target.value };
                                                                                updateNested(['popupConfig', 'items'], newItems);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <label className="flex items-center gap-1 text-[10px] text-gray-600">
                                                                    <input type="checkbox"
                                                                        checked={item.openInNewWindow || false}
                                                                        onChange={(e) => {
                                                                            const newItems = [...config.popupConfig!.items!];
                                                                            newItems[idx] = { ...newItems[idx], openInNewWindow: e.target.checked };
                                                                            updateNested(['popupConfig', 'items'], newItems);
                                                                        }}
                                                                    /> 새 창에서 열기
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!config.popupConfig?.items || config.popupConfig.items.length === 0) && (
                                                    <div className="text-center py-6 text-gray-400 text-xs bg-gray-50 rounded border border-dashed">
                                                        등록된 팝업이 없습니다.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ... CHAT TAB ... */}
                        {activeTab === 'chat' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">채팅/문의 버튼 관리</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs font-bold text-gray-700">버튼 사용</span>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                checked={config.chatConfig?.useChat || false}
                                                onChange={(e) => updateNested(['chatConfig', 'useChat'], e.target.checked)}
                                            />
                                            <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${config.chatConfig?.useChat ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                        </div>
                                    </label>
                                </div>

                                {config.chatConfig?.useChat && (
                                    <>
                                        {/* 1. Type Select */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                                            <h4 className="text-xs font-bold text-gray-700">유형 선택</h4>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[
                                                    { id: 'kakao', label: '카카오톡', color: 'bg-[#FEE500]' },
                                                    { id: 'naver', label: '네이버톡톡', color: 'bg-[#03C75A] text-white' },
                                                    { id: 'tel', label: '전화', color: 'bg-blue-500 text-white' },
                                                    { id: 'custom', label: '커스텀', color: 'bg-gray-100' }
                                                ].map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => updateNested(['chatConfig', 'type'], t.id)}
                                                        className={`p-2 rounded text-xs font-bold border ${config.chatConfig?.type === t.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 opacity-60 hover:opacity-100'} ${t.color}`}
                                                    >
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. Configuration */}
                                        <div className="space-y-4">
                                            {/* Link & Icon */}
                                            <div className="bg-white border rounded p-3 space-y-3">
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 mb-1">
                                                        {config.chatConfig?.type === 'kakao' ? '카카오 채널 채팅 URL (예: http://pf.kakao.com/_xxxx/chat)' :
                                                            config.chatConfig?.type === 'naver' ? '네이버 톡톡 URL (예: https://talk.naver.com/Wxxxx)' :
                                                                config.chatConfig?.type === 'tel' ? '전화번호 (예: 010-1234-5678)' : '연결할 링크 URL'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={config.chatConfig?.linkUrl || ''}
                                                        onChange={(e) => {
                                                            let val = e.target.value;
                                                            if (config.chatConfig?.type === 'tel' && !val.startsWith('tel:') && /^[0-9-]+$/.test(val)) {
                                                                val = `tel:${val}`;
                                                            }
                                                            updateNested(['chatConfig', 'linkUrl'], val);
                                                        }}
                                                        placeholder="https://..."
                                                        className="w-full border rounded p-2 text-xs"
                                                    />
                                                </div>

                                                <label className="flex items-center gap-1 text-xs text-gray-600">
                                                    <input type="checkbox"
                                                        checked={config.chatConfig?.openInNewWindow || false}
                                                        onChange={(e) => updateNested(['chatConfig', 'openInNewWindow'], e.target.checked)}
                                                    /> 새 창에서 열기
                                                </label>

                                                <div className="flex gap-4">
                                                    <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center overflow-hidden shrink-0 relative hover:bg-gray-200 cursor-pointer"
                                                        onClick={() => document.getElementById('chat-icon-upload')?.click()}>
                                                        {config.chatConfig?.iconUrl ? (
                                                            <img src={config.chatConfig.iconUrl} alt="icon" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="text-center text-gray-400">
                                                                {config.chatConfig?.type === 'custom' ? <Upload className="w-5 h-5 mx-auto" /> : <span className="text-[10px]">기본 아이콘</span>}
                                                            </div>
                                                        )}
                                                        <input type="file" id="chat-icon-upload" className="hidden" accept="image/*"
                                                            onChange={(e) => handleImageUpload(e, (url) => updateNested(['chatConfig', 'iconUrl'], url))}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] text-gray-500 mb-1">말풍선 라벨 텍스트</label>
                                                        <input type="text"
                                                            value={config.chatConfig?.label || ''}
                                                            onChange={(e) => updateNested(['chatConfig', 'label'], e.target.value)}
                                                            className="w-full border rounded p-2 text-xs mb-2"
                                                            placeholder="예: 24시간 상담 가능"
                                                        />
                                                        <label className="flex items-center gap-1 text-[10px] text-gray-600">
                                                            <input type="checkbox"
                                                                checked={config.chatConfig?.showLabel || false}
                                                                onChange={(e) => updateNested(['chatConfig', 'showLabel'], e.target.checked)}
                                                            /> 라벨 표시
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Position */}
                                            <div className="bg-white border rounded p-3">
                                                <h4 className="text-xs font-bold text-gray-700 mb-3">위치 및 크기</h4>

                                                <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                                                    <label className="flex items-center gap-1">
                                                        <input type="radio"
                                                            name="chat-pos"
                                                            checked={config.chatConfig?.position === 'right' || !config.chatConfig?.position}
                                                            onChange={() => updateNested(['chatConfig', 'position'], 'right')}
                                                        /> 오른쪽 하단
                                                    </label>
                                                    <label className="flex items-center gap-1">
                                                        <input type="radio"
                                                            name="chat-pos"
                                                            checked={config.chatConfig?.position === 'left'}
                                                            onChange={() => updateNested(['chatConfig', 'position'], 'left')}
                                                        /> 왼쪽 하단
                                                    </label>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div>
                                                        <label className="block text-gray-400 text-[10px]">크기 (Size)</label>
                                                        <input type="number"
                                                            value={config.chatConfig?.size || 60}
                                                            onChange={(e) => updateNested(['chatConfig', 'size'], parseInt(e.target.value))}
                                                            className="w-full border rounded p-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-400 text-[10px]">하단 여백 (Bottom)</label>
                                                        <input type="number"
                                                            value={config.chatConfig?.bottom || 20}
                                                            onChange={(e) => updateNested(['chatConfig', 'bottom'], parseInt(e.target.value))}
                                                            className="w-full border rounded p-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-400 text-[10px]">측면 여백 (Side)</label>
                                                        <input type="number"
                                                            value={config.chatConfig?.side || 20}
                                                            onChange={(e) => updateNested(['chatConfig', 'side'], parseInt(e.target.value))}
                                                            className="w-full border rounded p-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ... BASIC TAB ... */}
                        {activeTab === 'basic' && (
                            <div className="space-y-4 animate-fade-in">
                                {/* ... Existing Basic Tab Content ... */}
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">기본 설정</h3>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">페이지 ID</label>
                                    <input type="text" value={config.id} onChange={(e) => updateNested(['id'], e.target.value)} className="w-full border rounded p-2 text-sm bg-gray-50" />
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <label className="text-xs font-bold text-blue-700 mb-2 block flex items-center gap-1">
                                        <Layout className="w-4 h-4" /> 템플릿 선택 (Design Template)
                                    </label>
                                    <select
                                        value={config.template || 'standard'}
                                        onChange={(e) => updateNested(['template'], e.target.value)}
                                        className="w-full border-blue-300 rounded p-2 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="standard">기본형 (Standard One-Page)</option>
                                        <option value="dynamic_step">다이내믹 스텝 폼 (Dynamic Step Form)</option>
                                    </select>
                                    <p className="text-[10px] text-blue-600 mt-1">
                                        * <b>기본형</b>: 모든 섹션이 한 페이지에 나열됩니다.<br />
                                        * <b>다이내믹 스텝</b>: 풀스크린 히어로와 단계별(Step-by-step) 입력 폼이 적용됩니다.
                                    </p>
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
                                {/* Global Font Picker */}
                                <div className="mt-4">
                                    <FontPicker
                                        label="기본 폰트 설정 (전역 폰트 및 즐겨찾기)"
                                        value={config.theme.fontConfig?.primaryFont || ''}
                                        globalSettings={globalSettings}
                                        onSettingsChange={(newSettings) => {
                                            setGlobalSettings(newSettings);
                                            // Sync global fonts to local config for preview and saving
                                            updateNested(['theme', 'customFonts'], newSettings.customFonts || []);
                                        }}
                                        onChange={(fontFamily) => {
                                            updateNested(['theme', 'fontConfig'], {
                                                primaryFont: fontFamily,
                                                source: 'google' // We rely on name matching for custom fonts
                                            });
                                            // Legacy sync
                                            updateNested(['theme', 'fontFamily'], fontFamily);
                                        }}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        * 폰트 업로드 및 즐겨찾기는 모든 랜딩페이지에 공유됩니다.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ... HERO TAB ... */}
                        {activeTab === 'hero' && (
                            <div className="space-y-4 animate-fade-in">
                                {/* ... Existing Hero Content ... */}
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">상단 히어로 섹션</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs font-bold text-gray-700">섹션 사용</span>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                checked={config.hero.isShow ?? true}
                                                onChange={(e) => updateNested(['hero', 'isShow'], e.target.checked)}
                                            />
                                            <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${(config.hero.isShow ?? true) ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                        </div>
                                    </label>
                                </div>

                                {(config.hero.isShow ?? true) && (
                                    <>
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
                                                <option value="3xs">① 매우 작게 (Tiny)</option>
                                                <option value="2xs">② 더 작게 (Ex-Small)</option>
                                                <option value="xs">③ 작게 (Small)</option>
                                                <option value="sm">④ 약간 작게 (Semi-Small)</option>
                                                <option value="md">⑤ 보통 (Medium)</option>
                                                <option value="lg">⑥ 약간 크게 (Semi-Large)</option>
                                                <option value="xl">⑦ 크게 (Large)</option>
                                                <option value="2xl">⑧ 더 크게 (Ex-Large)</option>
                                                <option value="3xl">⑨ 매우 크게 (Huge)</option>
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
                                        <div className="border-t pt-4">
                                            <label className="text-xs font-bold text-gray-500 mb-1 block">신청하기(CTA) 버튼 문구</label>
                                            <input
                                                type="text"
                                                value={config.hero.ctaText}
                                                onChange={(e) => updateNested(['hero', 'ctaText'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm mb-2"
                                                placeholder="예: 무료 상담 신청하기"
                                            />
                                            <ButtonStyleEditor label="CTA 버튼" stylePath={['hero', 'ctaStyle']} />
                                        </div>
                                    </>
                                )}
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
                                                        <div className="flex gap-2 items-center bg-gray-100 p-2 rounded">
                                                            <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={banner.isSliding || false}
                                                                    onChange={(e) => updateBanner(idx, 'isSliding', e.target.checked)}
                                                                /> 텍스트 흐르기 (슬라이딩)
                                                            </label>
                                                            {banner.isSliding && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[10px] text-gray-500 border-l pl-2 ml-1">속도:</span>
                                                                    <select
                                                                        value={banner.slideSpeed || 15}
                                                                        onChange={(e) => updateBanner(idx, 'slideSpeed', parseInt(e.target.value))}
                                                                        className="text-[10px] border rounded p-0.5"
                                                                    >
                                                                        <option value="30">매우 느림 (30s)</option>
                                                                        <option value="20">느림 (20s)</option>
                                                                        <option value="15">보통 (15s)</option>
                                                                        <option value="10">빠름 (10s)</option>
                                                                        <option value="5">매우 빠름 (5s)</option>
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block">글자 크기 (직접 입력, e.g. 18)</label>
                                                            <input
                                                                type="text"
                                                                value={displaySizeValue(banner.fontSize)}
                                                                onChange={(e) => updateBanner(idx, 'fontSize', formatSizeValue(e.target.value))}
                                                                className="w-full text-xs border rounded p-1"
                                                                placeholder="기본값 (비워두면 자동)"
                                                            />
                                                        </div>
                                                        <div>
                                                            <FontPicker
                                                                label="배너 폰트"
                                                                value={banner.fontFamily || ''}
                                                                onChange={(val) => updateBanner(idx, 'fontFamily', val)}
                                                                globalSettings={globalSettings}
                                                                onSettingsChange={setGlobalSettings}
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
                                            handleAddDetailContent(url, 'image');
                                            if (detailImageInputRef.current) detailImageInputRef.current.value = '';
                                        })}
                                    />
                                    <div className="space-y-3">
                                        {(config.detailContent || []).map((item, idx) => (
                                            <div key={item.id || idx} className="bg-white border border-gray-200 p-3 rounded-lg relative group shadow-sm flex flex-col gap-3">
                                                <div className="flex gap-3 items-center">
                                                    <div className="flex flex-col gap-1">
                                                        <button onClick={() => handleDetailContentOrder(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                                                            <ArrowUp className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => handleDetailContentOrder(idx, 'down')} disabled={idx === (config.detailContent?.length || 0) - 1} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                                                            <ArrowDown className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    {/* Thumbnail / Icon Area */}
                                                    <div className="w-16 h-12 bg-gray-100 rounded shrink-0 overflow-hidden border flex items-center justify-center relative">
                                                        {item.type === 'youtube' && <Youtube className="w-6 h-6 text-red-600" />}
                                                        {item.type === 'map' && <MapPin className="w-6 h-6 text-green-600" />}
                                                        {item.type === 'image' && (
                                                            item.content ? <img src={item.content} className="w-full h-full object-cover" alt="thumb" /> : <ImageIcon className="w-6 h-6 text-gray-400" />
                                                        )}
                                                        <span className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-[9px] px-1">
                                                            {item.type === 'youtube' ? 'VIDEO' : item.type === 'map' ? 'MAP' : 'IMG'}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        {/* Content Input */}
                                                        <input
                                                            type="text"
                                                            value={item.content}
                                                            onChange={(e) => updateDetailContent(idx, { content: e.target.value })}
                                                            placeholder={item.type === 'youtube' ? '유튜브 링크 (예: https://youtu.be/...)' : item.type === 'map' ? '주소 입력 (예: 서울 강남구...)' : '이미지 주소'}
                                                            className="w-full border rounded p-1.5 text-xs"
                                                        />

                                                        {/* Options Row */}
                                                        <div className="flex gap-2">
                                                            {/* Size Select */}
                                                            <select
                                                                value={item.type === 'youtube' ? (item.videoSize || 'md') : (item.mapSize || 'md')}
                                                                onChange={(e) => updateDetailContent(idx, item.type === 'youtube' ? { videoSize: e.target.value as any } : { mapSize: e.target.value as any })}
                                                                className="border rounded text-[10px] p-1 bg-gray-50"
                                                            >
                                                                <option value="sm">작게 (50%)</option>
                                                                <option value="md">중간 (80%)</option>
                                                                <option value="full">가득 (100%)</option>
                                                            </select>

                                                            {/* Type Specific Options */}
                                                            {item.type === 'youtube' && (
                                                                <label className="flex items-center gap-1 text-[10px] text-gray-600 bg-gray-50 px-2 rounded border cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={item.autoPlay || false}
                                                                        onChange={(e) => updateDetailContent(idx, { autoPlay: e.target.checked })}
                                                                    />
                                                                    PC 자동재생
                                                                </label>
                                                            )}
                                                            {item.type === 'map' && (
                                                                <input
                                                                    type="text"
                                                                    placeholder="장소명 (예: 본점)"
                                                                    value={item.mapPlaceName || ''}
                                                                    onChange={(e) => updateDetailContent(idx, { mapPlaceName: e.target.value })}
                                                                    className="border rounded text-[10px] p-1 w-24"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button onClick={() => handleRemoveDetailContent(idx)} className="p-2 text-gray-400 hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* BANNER EDITOR UI */}
                                                {item.type === 'banner' && item.bannerStyle && item.urgencyConfig && (
                                                    <div className="mt-2 p-3 bg-gray-50 border rounded text-xs space-y-3">
                                                        {/* 1. Design Settings */}
                                                        <div>
                                                            <div className="font-bold mb-2 flex items-center text-gray-700"><Palette className="w-3 h-3 mr-1" /> 배너 디자인 (높이/배경/글자)</div>
                                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                                <div>
                                                                    <label className="block text-[10px] text-gray-500">높이 설정</label>
                                                                    <select
                                                                        value={item.bannerStyle.height}
                                                                        onChange={(e) => updateDetailContent(idx, { bannerStyle: { ...item.bannerStyle!, height: e.target.value } })}
                                                                        className="w-full border p-1 rounded"
                                                                    >
                                                                        <option value="200px">작게 (200px)</option>
                                                                        <option value="300px">보통 (300px)</option>
                                                                        <option value="400px">크게 (400px)</option>
                                                                        <option value="60vh">화면 60% 높이</option>
                                                                        <option value="100vh">화면 전체 높이</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] text-gray-500">배경색</label>
                                                                    <div className="flex items-center gap-1">
                                                                        <input type="color" value={item.bannerStyle.backgroundColor} onChange={(e) => updateDetailContent(idx, { bannerStyle: { ...item.bannerStyle!, backgroundColor: e.target.value } })} className="w-5 h-5 p-0 border rounded cursor-pointer" />
                                                                        <input type="text" value={item.bannerStyle.backgroundColor} onChange={(e) => updateDetailContent(idx, { bannerStyle: { ...item.bannerStyle!, backgroundColor: e.target.value } })} className="flex-1 border p-1 rounded" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mb-2">
                                                                <label className="block text-[10px] text-gray-500 mb-1">배경 이미지</label>
                                                                <div className="flex gap-1">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="이미지 주소 (https://...)"
                                                                        value={item.bannerStyle.backgroundImage || ''}
                                                                        onChange={(e) => updateDetailContent(idx, { bannerStyle: { ...item.bannerStyle!, backgroundImage: e.target.value } })}
                                                                        className="flex-1 border p-1 rounded"
                                                                    />
                                                                    <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-2 flex items-center justify-center text-xs whitespace-nowrap">
                                                                        <Upload className="w-3 h-3" />
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept="image/*"
                                                                            onChange={(e) => {
                                                                                handleImageUpload(e, (url) => updateDetailContent(idx, { bannerStyle: { ...item.bannerStyle!, backgroundImage: url } }));
                                                                            }}
                                                                        />
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        min="0"
                                                                        max="1"
                                                                        value={item.bannerStyle.overlayOpacity}
                                                                        onChange={(e) => updateDetailContent(idx, { bannerStyle: { ...item.bannerStyle!, overlayOpacity: parseFloat(e.target.value) } })}
                                                                        className="w-12 border p-1 rounded text-center"
                                                                        title="오버레이 투명도"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div>
                                                                    <label className="block text-[10px] text-gray-500">글자 크기</label>
                                                                    <select
                                                                        value={item.bannerStyle.fontSize}
                                                                        onChange={(e) => updateDetailContent(idx, { bannerStyle: { ...item.bannerStyle!, fontSize: e.target.value } })}
                                                                        className="w-full border p-1 rounded"
                                                                    >
                                                                        <option value="1rem">작게</option>
                                                                        <option value="1.5rem">보통</option>
                                                                        <option value="2.5rem">크게</option>
                                                                        <option value="4rem">초대형</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] text-gray-500">글자 색상</label>
                                                                    <input type="color" value={item.bannerStyle.textColor} onChange={(e) => updateDetailContent(idx, { bannerStyle: { ...item.bannerStyle!, textColor: e.target.value } })} className="w-full h-7 border rounded p-0 cursor-pointer" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] text-gray-500">텍스트 정렬</label>
                                                                    <select
                                                                        value={item.bannerStyle.textAlign}
                                                                        onChange={(e) => updateDetailContent(idx, { bannerStyle: { ...item.bannerStyle!, textAlign: e.target.value as any } })}
                                                                        className="w-full border p-1 rounded"
                                                                    >
                                                                        <option value="left">왼쪽</option>
                                                                        <option value="center">가운데</option>
                                                                        <option value="right">오른쪽</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2">
                                                                <label className="block text-[10px] text-gray-500 mb-1">배너 메인 문구 (줄바꿈 가능)</label>
                                                                <textarea
                                                                    value={item.content}
                                                                    onChange={(e) => updateDetailContent(idx, { content: e.target.value })}
                                                                    className="w-full border rounded p-2 h-20 text-sm"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* 2. Urgency Features */}
                                                        <div className="border-t pt-2">
                                                            <div className="font-bold mb-2 flex items-center text-red-600"><Clock className="w-3 h-3 mr-1" /> 마감 임박 / 실시간 알림 기능</div>

                                                            {/* Countdown */}
                                                            <div className="mb-3 bg-white border p-2 rounded">
                                                                <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={item.urgencyConfig.showCountdown}
                                                                        onChange={(e) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, showCountdown: e.target.checked } })}
                                                                    />
                                                                    <span className="font-bold text-gray-700 text-xs">타이머(카운트다운) 활성화</span>
                                                                </label>
                                                                {item.urgencyConfig.showCountdown && (
                                                                    <div className="pl-5 space-y-2 animate-fade-in">
                                                                        <div>
                                                                            <label className="block text-[10px] text-gray-500">종료 날짜/시간 선택</label>
                                                                            <input
                                                                                type="datetime-local"
                                                                                value={item.urgencyConfig.countdownTarget || ''}
                                                                                onChange={(e) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, countdownTarget: e.target.value } })}
                                                                                className="w-full border p-1 rounded text-xs"
                                                                            />
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="라벨 (예: 마감 임박)"
                                                                                value={item.urgencyConfig.countdownLabel || ''}
                                                                                onChange={(e) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, countdownLabel: e.target.value } })}
                                                                                className="border p-1 rounded text-xs"
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="종료 후 메시지"
                                                                                value={item.urgencyConfig.countdownExpiredMessage || ''}
                                                                                onChange={(e) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, countdownExpiredMessage: e.target.value } })}
                                                                                className="border p-1 rounded text-xs"
                                                                            />
                                                                        </div>
                                                                        {/* Timer Style Settings */}
                                                                        <div className="bg-gray-50 p-2 rounded border border-gray-100 space-y-2">
                                                                            <label className="block text-[10px] font-bold text-gray-600">타이머 디자인 (V3)</label>

                                                                            {/* DESIGN TEMPLATES (NEW) */}
                                                                            <div className="grid grid-cols-5 gap-1 mb-2">
                                                                                {[
                                                                                    { label: '레드', style: { backgroundColor: '#EF4444', textColor: '#ffffff', borderRadius: '8px', digitColor: '#ffffff', isTransparent: false, labelPosition: 'bottom' } },
                                                                                    { label: '다크', style: { backgroundColor: '#1F2937', textColor: '#E5E7EB', borderRadius: '9999px', digitColor: '#F3F4F6', isTransparent: false, labelPosition: 'right' } },
                                                                                    { label: '블루', style: { backgroundColor: 'transparent', textColor: '#1E40AF', borderRadius: '0px', digitColor: '#2563EB', isTransparent: true, labelPosition: 'bottom' } },
                                                                                    { label: '네온', style: { backgroundColor: '#000000', textColor: '#00FF00', borderRadius: '0px', digitColor: '#00FF00', isTransparent: false, labelPosition: 'right' } },
                                                                                    { label: '골드', style: { backgroundColor: '#78350F', textColor: '#FCD34D', borderRadius: '4px', digitColor: '#FCD34D', isTransparent: false, labelPosition: 'bottom' } },
                                                                                ].map((t, i) => (
                                                                                    <button
                                                                                        key={i}
                                                                                        onClick={() => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, timerStyle: { ...item.urgencyConfig?.timerStyle, ...t.style } as any } })}
                                                                                        className="px-1 py-1 text-[9px] border border-gray-300 rounded hover:bg-white hover:border-blue-500 transition-colors bg-white shadow-sm whitespace-nowrap"
                                                                                    >
                                                                                        {t.label}
                                                                                    </button>
                                                                                ))}
                                                                            </div>

                                                                            {/* 1. Transparent Mode */}
                                                                            <label className="flex items-center gap-2 text-xs mb-1">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={item.urgencyConfig.timerStyle?.isTransparent || false}
                                                                                    onChange={(e) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, timerStyle: { ...item.urgencyConfig?.timerStyle, isTransparent: e.target.checked } } })}
                                                                                />
                                                                                배경 없음 (누끼 모드)
                                                                            </label>

                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <select
                                                                                    value={item.urgencyConfig.timerStyle?.fontSize || 'md'}
                                                                                    onChange={(e) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, timerStyle: { ...item.urgencyConfig?.timerStyle, fontSize: e.target.value } } })}
                                                                                    className="border p-1 rounded text-xs"
                                                                                >
                                                                                    <option value="sm">크기: 작게</option>
                                                                                    <option value="md">크기: 보통</option>
                                                                                    <option value="lg">크기: 크게</option>
                                                                                    <option value="xl">크기: 아주 크게</option>
                                                                                </select>
                                                                                <div className="mt-1"><FontPicker label="라벨 폰트" value={item.urgencyConfig.timerLabelFontFamily || ''} onChange={(val) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, timerLabelFontFamily: val } })} globalSettings={globalSettings} onSettingsChange={setGlobalSettings} /></div>
                                                                                <select
                                                                                    value={item.urgencyConfig.timerStyle?.labelPosition || 'left'}
                                                                                    onChange={(e) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, timerStyle: { ...item.urgencyConfig?.timerStyle, labelPosition: e.target.value as any } } })}
                                                                                    className="border p-1 rounded text-xs"
                                                                                >
                                                                                    <option value="left">라벨: 왼쪽</option>
                                                                                    <option value="right">라벨: 오른쪽</option>
                                                                                    <option value="top">라벨: 위쪽</option>
                                                                                    <option value="bottom">라벨: 아래쪽</option>
                                                                                </select>
                                                                            </div>

                                                                            <div className="grid grid-cols-3 gap-2">
                                                                                <div>
                                                                                    <label className="text-[10px] text-gray-500">글자색</label>
                                                                                    <div className="flex items-center gap-1">
                                                                                        <input type="color" value={item.urgencyConfig.timerStyle?.textColor || '#dc2626'} onChange={(e) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, timerStyle: { ...item.urgencyConfig?.timerStyle, textColor: e.target.value } } })} className="w-5 h-5 p-0 border rounded cursor-pointer" />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[10px] text-gray-500">숫자색</label>
                                                                                    <div className="flex items-center gap-1">
                                                                                        <input type="color" value={item.urgencyConfig.timerStyle?.digitColor || '#111827'} onChange={(e) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, timerStyle: { ...item.urgencyConfig?.timerStyle, digitColor: e.target.value } } })} className="w-5 h-5 p-0 border rounded cursor-pointer" />
                                                                                    </div>
                                                                                </div>
                                                                                {!item.urgencyConfig.timerStyle?.isTransparent && (
                                                                                    <div>
                                                                                        <label className="text-[10px] text-gray-500">배경색</label>
                                                                                        <div className="flex items-center gap-1">
                                                                                            <input type="color" value={item.urgencyConfig.timerStyle?.backgroundColor || '#fee2e2'} onChange={(e) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, timerStyle: { ...item.urgencyConfig?.timerStyle, backgroundColor: e.target.value } } })} className="w-5 h-5 p-0 border rounded cursor-pointer" />
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Ticker V2 */}
                                                            <div className="bg-white border p-2 rounded">
                                                                <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={item.urgencyConfig.showTicker}
                                                                        onChange={(e) => {
                                                                            const isChecked = e.target.checked;
                                                                            // Initialize V2 config if missing
                                                                            const currentConfig = item.urgencyConfig.tickerConfig || {
                                                                                mode: 'horizontal',
                                                                                scrollMode: 'continuous',
                                                                                columns: [
                                                                                    { id: 'c1', label: '이름', type: 'name', isEnabled: true, masking: true },
                                                                                    { id: 'c2', label: '전화번호', type: 'phone', isEnabled: true, masking: true },
                                                                                    { id: 'c3', label: '채무금액', type: 'debt', isEnabled: true, masking: false },
                                                                                    { id: 'c4', label: '성별', type: 'gender', isEnabled: false, masking: true },
                                                                                    { id: 'c5', label: '상담상태', type: 'text', isEnabled: false, masking: false },
                                                                                ]
                                                                            };
                                                                            updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, showTicker: isChecked, tickerConfig: currentConfig } as any });
                                                                        }}
                                                                    />
                                                                    <span className="font-bold text-gray-700 text-xs">가상 실시간 신청 알림 (Ticker)</span>
                                                                </label>

                                                                {item.urgencyConfig.showTicker && (
                                                                    <div className="pl-5 animate-fade-in space-y-3">

                                                                        {/* TICKER TEMPLATES (NEW) */}
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-600 mb-1">📢 디자인 템플릿</label>
                                                                            <div className="grid grid-cols-5 gap-1 mb-2">
                                                                                {[
                                                                                    { label: '기본형', config: { mode: 'horizontal', containerStyle: { backgroundColor: '#F3F4F6', borderRadius: '0px', borderColor: 'transparent' }, scrollMode: 'continuous' } },
                                                                                    { label: '카드형', config: { mode: 'vertical_list', containerStyle: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', height: '300px' }, scrollMode: 'continuous' } },
                                                                                    { label: '다크', config: { mode: 'vertical_list', containerStyle: { backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '16px', borderColor: 'transparent', height: '80px' }, scrollMode: 'continuous' } },
                                                                                    { label: '투명', config: { mode: 'vertical_list', containerStyle: { backgroundColor: 'transparent', borderRadius: '0px', borderColor: 'transparent' }, scrollMode: 'random_step' } },
                                                                                    { label: '블루', config: { mode: 'horizontal', containerStyle: { backgroundColor: '#4f46e5', borderRadius: '0px', borderColor: 'transparent', textColor: '#ffffff' }, scrollMode: 'continuous' } },
                                                                                ].map((t, i) => (
                                                                                    <button
                                                                                        key={i}
                                                                                        onClick={() => {
                                                                                            const currentTicker = item.urgencyConfig.tickerConfig || { columns: [], containerStyle: {} };
                                                                                            // @ts-ignore
                                                                                            const newTicker = {
                                                                                                ...currentTicker,
                                                                                                mode: t.config.mode,
                                                                                                scrollMode: t.config.scrollMode,
                                                                                                // @ts-ignore
                                                                                                containerStyle: { ...(currentTicker.containerStyle || {}), ...t.config.containerStyle }
                                                                                            };
                                                                                            updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: newTicker } as any });
                                                                                        }}
                                                                                        className="px-1 py-1 text-[9px] border border-gray-300 rounded hover:bg-white hover:border-blue-500 transition-colors bg-white shadow-sm whitespace-nowrap"
                                                                                    >
                                                                                        {t.label}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        {/* Mode Selection */}
                                                                        <div>
                                                                            <label className="block text-[10px] text-gray-500 mb-1">표시 방식</label>
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    onClick={() => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerType: 'horizontal', tickerConfig: { ...item.urgencyConfig.tickerConfig!, mode: 'horizontal' } } as any })}
                                                                                    className={`px-3 py-1 rounded text-xs border ${(!item.urgencyConfig?.tickerConfig?.mode || item.urgencyConfig.tickerConfig.mode === 'horizontal') ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-white border-gray-200 text-gray-500'}`}
                                                                                >
                                                                                    가로 흐르기 (기본)
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerType: 'vertical_list', tickerConfig: { ...item.urgencyConfig.tickerConfig!, mode: 'vertical_list' } } as any })}
                                                                                    className={`px-3 py-1 rounded text-xs border ${item.urgencyConfig.tickerConfig?.mode === 'vertical_list' ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-white border-gray-200 text-gray-500'}`}
                                                                                >
                                                                                    세로 리스트 (표)
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Horizontal Config */}
                                                                        {(!item.urgencyConfig.tickerConfig?.mode || item.urgencyConfig.tickerConfig.mode === 'horizontal') && (
                                                                            <div>
                                                                                <label className="block text-[10px] text-gray-500 mb-1">메시지 템플릿</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.urgencyConfig.tickerMessage || '{name}님이 상담을 신청했습니다.'}
                                                                                    onChange={(e) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerMessage: e.target.value } })}
                                                                                    className="w-full border p-1 rounded text-xs"
                                                                                    placeholder="{name}, {phone}, {city} 사용 가능"
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        {/* Vertical List Config (V2) */}
                                                                        {item.urgencyConfig.tickerConfig?.mode === 'vertical_list' && (
                                                                            <div className="bg-gray-50 p-2 rounded border border-gray-100 space-y-3">
                                                                                {/* 1. Header & Box Style */}
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    <div>
                                                                                        <label className="block text-[10px] text-gray-500">리스트 제목</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={item.urgencyConfig.tickerConfig?.listTitle || ''}
                                                                                            onChange={(e) => {
                                                                                                const newConf = { ...item.urgencyConfig.tickerConfig!, listTitle: e.target.value };
                                                                                                updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: newConf } as any });
                                                                                            }}
                                                                                            placeholder="실시간 접수 현황"
                                                                                            className="w-full border p-1 rounded text-xs"
                                                                                        />
                                                                                        <FontPicker label="제목 폰트" value={item.urgencyConfig.listTitleFontFamily || ''} onChange={(val) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, listTitleFontFamily: val } })} globalSettings={globalSettings} onSettingsChange={setGlobalSettings} />
                                                                                        <div className="mt-1"><FontPicker label="내용(리스트) 폰트" value={item.urgencyConfig.listContentFontFamily || ''} onChange={(val) => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, listContentFontFamily: val } })} globalSettings={globalSettings} onSettingsChange={setGlobalSettings} /></div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="block text-[10px] text-gray-500">박스 높이</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={item.urgencyConfig.tickerConfig?.containerStyle?.height || '200px'}
                                                                                            onChange={(e) => {
                                                                                                const newConf = { ...item.urgencyConfig.tickerConfig!, containerStyle: { ...item.urgencyConfig.tickerConfig!.containerStyle, height: e.target.value } };
                                                                                                updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: newConf } as any });
                                                                                            }}
                                                                                            className="w-full border p-1 rounded text-xs"
                                                                                            placeholder="예: 200px"
                                                                                        />
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex gap-2 items-center">
                                                                                    <div className="flex-1">
                                                                                        <label className="block text-[10px] text-gray-500">배경 색상</label>
                                                                                        <div className="flex gap-1">
                                                                                            <input type="color" className="w-6 h-6 p-0 border-0"
                                                                                                value={item.urgencyConfig.tickerConfig?.containerStyle?.backgroundColor || '#ffffff'}
                                                                                                onChange={(e) => {
                                                                                                    const newConf = { ...item.urgencyConfig.tickerConfig!, containerStyle: { ...item.urgencyConfig.tickerConfig!.containerStyle, backgroundColor: e.target.value } };
                                                                                                    updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: newConf } as any });
                                                                                                }}
                                                                                            />
                                                                                            <input type="text" className="flex-1 border p-1 text-[10px]"
                                                                                                value={item.urgencyConfig.tickerConfig?.containerStyle?.backgroundColor || ''}
                                                                                                onChange={(e) => {
                                                                                                    const newConf = { ...item.urgencyConfig.tickerConfig!, containerStyle: { ...item.urgencyConfig.tickerConfig!.containerStyle, backgroundColor: e.target.value } };
                                                                                                    updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: newConf } as any });
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <label className="block text-[10px] text-gray-500">테두리 색상</label>
                                                                                        <div className="flex gap-1">
                                                                                            <input type="color" className="w-6 h-6 p-0 border-0"
                                                                                                value={item.urgencyConfig.tickerConfig?.containerStyle?.borderColor || '#2563eb'}
                                                                                                onChange={(e) => {
                                                                                                    const newConf = { ...item.urgencyConfig.tickerConfig!, containerStyle: { ...item.urgencyConfig.tickerConfig!.containerStyle, borderColor: e.target.value } };
                                                                                                    updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: newConf } as any });
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                {/* 2. Scroll Animation Mode */}
                                                                                <div>
                                                                                    <label className="block text-[10px] text-gray-500 mb-1">스크롤 방식</label>
                                                                                    <div className="flex gap-4 text-xs">
                                                                                        <label className="flex items-center gap-1">
                                                                                            <input type="radio"
                                                                                                checked={item.urgencyConfig.tickerConfig?.scrollMode !== 'random_step'}
                                                                                                onChange={() => {
                                                                                                    const newConf = { ...item.urgencyConfig.tickerConfig!, scrollMode: 'continuous' };
                                                                                                    updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: newConf } as any });
                                                                                                }}
                                                                                            /> 일정하게 (부드럽게)
                                                                                        </label>
                                                                                        <label className="flex items-center gap-1">
                                                                                            <input type="radio"
                                                                                                checked={item.urgencyConfig.tickerConfig?.scrollMode === 'random_step'}
                                                                                                onChange={() => {
                                                                                                    const newConf = { ...item.urgencyConfig.tickerConfig!, scrollMode: 'random_step', randomRange: [1, 5] };
                                                                                                    updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: newConf } as any });
                                                                                                }}
                                                                                            /> 불규칙적 (자연스럽게, 1~5초)
                                                                                        </label>
                                                                                    </div>
                                                                                </div>

                                                                                {/* 3. Column Configuration */}
                                                                                <div>
                                                                                    <label className="block text-[10px] font-bold text-gray-600 mb-2">
                                                                                        표시할 컬럼 (최대 5개 체크)
                                                                                    </label>
                                                                                    <div className="space-y-1">
                                                                                        {item.urgencyConfig.tickerConfig?.columns.map((col, colIdx) => (
                                                                                            <div key={col.id} className={`flex items-center gap-2 p-1 rounded ${col.isEnabled ? 'bg-blue-50 border border-blue-100' : 'opacity-60'}`}>
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={col.isEnabled}
                                                                                                    onChange={(e) => {
                                                                                                        // Max 5 limiter
                                                                                                        const enabledCount = item.urgencyConfig.tickerConfig!.columns.filter(c => c.isEnabled).length;
                                                                                                        if (e.target.checked && enabledCount >= 5) {
                                                                                                            alert('최대 5개까지만 선택 가능합니다.');
                                                                                                            return;
                                                                                                        }
                                                                                                        const newCols = [...item.urgencyConfig.tickerConfig!.columns];
                                                                                                        newCols[colIdx] = { ...col, isEnabled: e.target.checked };
                                                                                                        updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: { ...item.urgencyConfig.tickerConfig!, columns: newCols } } as any });
                                                                                                    }}
                                                                                                />
                                                                                                <input
                                                                                                    type="text"
                                                                                                    value={col.label}
                                                                                                    onChange={(e) => {
                                                                                                        const newCols = [...item.urgencyConfig.tickerConfig!.columns];
                                                                                                        newCols[colIdx] = { ...col, label: e.target.value };
                                                                                                        updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: { ...item.urgencyConfig.tickerConfig!, columns: newCols } } as any });
                                                                                                    }}
                                                                                                    className="flex-1 text-xs border-b bg-transparent"
                                                                                                />
                                                                                                {col.isEnabled && (
                                                                                                    <label className="flex items-center gap-1 text-[10px] whitespace-nowrap">
                                                                                                        <input
                                                                                                            type="checkbox"
                                                                                                            checked={col.masking}
                                                                                                            onChange={(e) => {
                                                                                                                const newCols = [...item.urgencyConfig.tickerConfig!.columns];
                                                                                                                newCols[colIdx] = { ...col, masking: e.target.checked };
                                                                                                                updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: { ...item.urgencyConfig.tickerConfig!, columns: newCols } } as any });
                                                                                                            }}
                                                                                                        /> 가리기
                                                                                                    </label>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>

                                                                                {/* V3: Data Source Management */}
                                                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                                                    <label className="block text-[10px] font-bold text-gray-600 mb-2">데이터 관리</label>
                                                                                    <div className="flex bg-gray-100 p-1 rounded mb-3">
                                                                                        <button
                                                                                            onClick={() => updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: { ...item.urgencyConfig.tickerConfig!, customData: undefined } } as any })}
                                                                                            className={`flex-1 py-1 text-xs rounded ${!item.urgencyConfig.tickerConfig?.customData ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                        >
                                                                                            가상 데이터 자동 생성
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                if (!item.urgencyConfig.tickerConfig?.customData) {
                                                                                                    updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: { ...item.urgencyConfig.tickerConfig!, customData: [] } } as any });
                                                                                                }
                                                                                            }}
                                                                                            className={`flex-1 py-1 text-xs rounded ${item.urgencyConfig.tickerConfig?.customData ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                        >
                                                                                            직접 입력 (Custom)
                                                                                        </button>
                                                                                    </div>

                                                                                    {/* Case 1: Fake Data Rules */}
                                                                                    {!item.urgencyConfig.tickerConfig?.customData && (
                                                                                        <div>
                                                                                            {item.urgencyConfig.tickerConfig?.columns.find(c => c.type === 'debt' && c.isEnabled) && (
                                                                                                <div className="bg-white border rounded p-2">
                                                                                                    <label className="block text-[10px] text-gray-500 mb-1">채무 금액 랜덤 범위 (단위: 만원)</label>
                                                                                                    <div className="flex gap-2 items-center">
                                                                                                        <input type="number"
                                                                                                            value={item.urgencyConfig.tickerConfig?.fakeDataRules?.debtRange?.[0] || 1000}
                                                                                                            onChange={(e) => {
                                                                                                                const min = parseInt(e.target.value);
                                                                                                                const currentMax = item.urgencyConfig.tickerConfig?.fakeDataRules?.debtRange?.[1] || 10000;
                                                                                                                const newRules = { ...item.urgencyConfig.tickerConfig?.fakeDataRules, debtRange: [min, currentMax] };
                                                                                                                updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: { ...item.urgencyConfig.tickerConfig!, fakeDataRules: newRules } } as any });
                                                                                                            }}
                                                                                                            className="w-16 border p-1 rounded text-xs"
                                                                                                        />
                                                                                                        <span className="text-xs">~</span>
                                                                                                        <input type="number"
                                                                                                            value={item.urgencyConfig.tickerConfig?.fakeDataRules?.debtRange?.[1] || 10000}
                                                                                                            onChange={(e) => {
                                                                                                                const max = parseInt(e.target.value);
                                                                                                                const currentMin = item.urgencyConfig.tickerConfig?.fakeDataRules?.debtRange?.[0] || 1000;
                                                                                                                const newRules = { ...item.urgencyConfig.tickerConfig?.fakeDataRules, debtRange: [currentMin, max] };
                                                                                                                updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: { ...item.urgencyConfig.tickerConfig!, fakeDataRules: newRules } } as any });
                                                                                                            }}
                                                                                                            className="w-16 border p-1 rounded text-xs"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                            <p className="text-[10px] text-gray-400 mt-2">* 활성화된 컬럼 유형에 맞춰 랜덤 데이터가 생성됩니다.</p>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Case 2: Custom Data Management */}
                                                                                    {item.urgencyConfig.tickerConfig?.customData && (
                                                                                        <div className="space-y-3">
                                                                                            {/* Google Sheet Sync */}
                                                                                            <div className="bg-green-50 p-2 rounded border border-green-200">
                                                                                                <div className="flex items-center justify-between mb-2">
                                                                                                    <span className="text-[10px] font-bold text-green-800 flex items-center gap-1">
                                                                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                                                                        구글 시트 연동 관리
                                                                                                    </span>
                                                                                                </div>
                                                                                                <p className="text-[9px] text-green-700 mb-2">
                                                                                                    전용 시트에 데이터를 대량으로 입력하고,<br />
                                                                                                    '데이터 가져오기'를 누르면 항목명과 내용이 자동 적용됩니다.
                                                                                                </p>
                                                                                                <div className="flex gap-1">
                                                                                                    <button
                                                                                                        onClick={async () => {
                                                                                                            if (!config.id) { alert('랜딩페이지 저장 후 이용 가능합니다.'); return; }
                                                                                                            const res = await manageVirtualData(config.id, 'init_sheet');
                                                                                                            if (res.result === 'success' && res.url) {
                                                                                                                window.open(res.url, '_blank');
                                                                                                            } else {
                                                                                                                alert('시트 열기 실패: ' + (res.message || 'Unknown'));
                                                                                                            }
                                                                                                        }}
                                                                                                        className="flex-1 py-1.5 bg-white border border-green-300 text-green-700 text-[10px] rounded hover:bg-green-100 flex items-center justify-center gap-1"
                                                                                                    >
                                                                                                        <ExternalLink className="w-3 h-3" /> 관리 시트 열기
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={async () => {
                                                                                                            if (!config.id) { alert('랜딩페이지 저장 후 이용 가능합니다.'); return; }
                                                                                                            if (!confirm('시트의 내용으로 현재 데이터를 덮어쓰시겠습니까?')) return;

                                                                                                            const res = await manageVirtualData(config.id, 'sync_data');
                                                                                                            if (res.result === 'success') {
                                                                                                                const headers = res.headers as string[];
                                                                                                                const rows = res.data as string[][];

                                                                                                                // 1. Update Columns
                                                                                                                const newCols = [...item.urgencyConfig.tickerConfig!.columns];
                                                                                                                // Ensure we enable enough columns if sheet has more
                                                                                                                headers.forEach((h, i) => {
                                                                                                                    if (i < 6) { // Max 6 defined in code usually
                                                                                                                        if (!newCols[i]) {
                                                                                                                            // Ticker usually has fixed 6 in data model? 
                                                                                                                            // checking data model... usually defined in const?
                                                                                                                            // Actually ApplicantListProps defines specific types. 
                                                                                                                            // But TickerConfig columns is array of {id, label...}
                                                                                                                        }
                                                                                                                        if (newCols[i]) {
                                                                                                                            newCols[i] = { ...newCols[i], label: h, isEnabled: true };
                                                                                                                        }
                                                                                                                    }
                                                                                                                });

                                                                                                                // 2. Update Data
                                                                                                                const newData = rows.map((r, i) => {
                                                                                                                    const rowObj: any = {};
                                                                                                                    newCols.forEach((c, cIdx) => {
                                                                                                                        rowObj[c.id] = r[cIdx] || '';
                                                                                                                    });
                                                                                                                    return rowObj;
                                                                                                                });

                                                                                                                updateDetailContent(idx, {
                                                                                                                    urgencyConfig: {
                                                                                                                        ...item.urgencyConfig!,
                                                                                                                        tickerConfig: {
                                                                                                                            ...item.urgencyConfig.tickerConfig!,
                                                                                                                            columns: newCols,
                                                                                                                            customData: newData
                                                                                                                        }
                                                                                                                    } as any
                                                                                                                });
                                                                                                                alert(`${rows.length}개의 데이터가 동기화되었습니다.`);
                                                                                                            } else {
                                                                                                                alert('동기화 실패: ' + (res.message || 'Unknown'));
                                                                                                            }
                                                                                                        }}
                                                                                                        className="flex-1 py-1.5 bg-green-600 text-white text-[10px] rounded hover:bg-green-700 flex items-center justify-center gap-1 font-bold"
                                                                                                    >
                                                                                                        <RefreshCw className="w-3 h-3" /> 데이터 가져오기
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Manual Input Fallback */}
                                                                                            <div className="space-y-2">
                                                                                                {item.urgencyConfig.tickerConfig.customData.map((row, rowIdx) => (
                                                                                                    <div key={rowIdx} className="bg-white border p-2 rounded relative group">
                                                                                                        <button
                                                                                                            onClick={() => {
                                                                                                                const newData = [...item.urgencyConfig.tickerConfig!.customData!];
                                                                                                                newData.splice(rowIdx, 1);
                                                                                                                updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: { ...item.urgencyConfig.tickerConfig!, customData: newData } } as any });
                                                                                                            }}
                                                                                                            className="absolute top-1 right-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                                        >
                                                                                                            <X className="w-3 h-3" />
                                                                                                        </button>
                                                                                                        <div className="grid grid-cols-2 gap-1 pr-4">
                                                                                                            {item.urgencyConfig.tickerConfig?.columns.filter(c => c.isEnabled).map((col) => (
                                                                                                                <div key={col.id}>
                                                                                                                    <label className="text-[9px] text-gray-400 block">{col.label}</label>
                                                                                                                    <input
                                                                                                                        type="text"
                                                                                                                        value={row[col.id] || ''}
                                                                                                                        onChange={(e) => {
                                                                                                                            const newData = [...item.urgencyConfig.tickerConfig!.customData!];
                                                                                                                            newData[rowIdx] = { ...row, [col.id]: e.target.value };
                                                                                                                            updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: { ...item.urgencyConfig.tickerConfig!, customData: newData } } as any });
                                                                                                                        }}
                                                                                                                        className="w-full border p-1 rounded text-xs"
                                                                                                                        placeholder={col.type === 'phone' ? '010-1234-5678' : col.label}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}
                                                                                                <button
                                                                                                    onClick={() => {
                                                                                                        const newData = [...(item.urgencyConfig.tickerConfig?.customData || [])];
                                                                                                        // Create empty row with keys
                                                                                                        const newRow: any = {};
                                                                                                        item.urgencyConfig.tickerConfig?.columns.forEach(c => newRow[c.id] = '');
                                                                                                        newData.push(newRow);
                                                                                                        updateDetailContent(idx, { urgencyConfig: { ...item.urgencyConfig!, tickerConfig: { ...item.urgencyConfig.tickerConfig!, customData: newData } } as any });
                                                                                                    }}
                                                                                                    className="w-full py-2 bg-blue-50 text-blue-600 font-bold rounded hover:bg-blue-100 text-xs flex items-center justify-center"
                                                                                                >
                                                                                                    <Plus className="w-3 h-3 mr-1" /> 데이터 추가
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <button
                                            onClick={() => detailImageInputRef.current?.click()}
                                            className="py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-bold text-xs flex items-center justify-center"
                                        >
                                            <Upload className="w-3 h-3 mr-1" /> 이미지 추가
                                        </button>
                                        <button
                                            onClick={() => handleAddDetailContent('', 'youtube')}
                                            className="py-2 border-2 border-red-100 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-xs flex items-center justify-center"
                                        >
                                            <Youtube className="w-4 h-4 mr-1" /> 유튜브 추가
                                        </button>
                                        <button
                                            onClick={() => handleAddDetailContent('', 'map')}
                                            className="py-2 border-2 border-green-100 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-bold text-xs flex items-center justify-center col-span-2"
                                        >
                                            <MapPin className="w-4 h-4 mr-1" /> 지도 추가
                                        </button>
                                        <button
                                            onClick={() => handleAddDetailContent('', 'banner')}
                                            className="py-2 border-2 border-purple-100 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-bold text-xs flex items-center justify-center col-span-2"
                                        >
                                            <Megaphone className="w-4 h-4 mr-1" /> 배너/이벤트영역 추가
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- FORM TAB --- */}
                        {activeTab === 'form' && (
                            <div className="space-y-6 animate-fade-in">

                                {/* 1. Form Presets (Dynamic) */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                                        <Palette className="w-4 h-4 text-blue-600" /> 폼 디자인 템플릿 (Presets)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(FORM_PRESETS).map(([key, preset]) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    // Merge preset styles
                                                    // Use 'updateNested' to update the whole style object or individual properties
                                                    // Since we want to overwrite style, we can try replacing the whole style object
                                                    // But we should preserve 'preset' key
                                                    const newStyle = { ...preset.style, preset: key };
                                                    updateNested(['formConfig', 'style'], newStyle);
                                                }}
                                                className={`p-3 border rounded-lg text-xs font-bold transition-all text-left flex flex-col gap-2
                                                    ${config.formConfig.style?.preset === key
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-600'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span>{preset.label}</span>
                                                    {config.formConfig.style?.preset === key && <CheckCircle className="w-4 h-4 text-blue-600" />}
                                                </div>

                                                {/* Mini Preview */}
                                                <div
                                                    className="w-full h-12 rounded flex flex-col justify-center items-center gap-1 border"
                                                    style={{
                                                        backgroundColor: preset.style.backgroundColor === 'transparent' ? '#eee' : preset.style.backgroundColor,
                                                        borderColor: preset.style.borderColor || 'transparent',
                                                        borderWidth: preset.style.borderWidth,
                                                        borderRadius: preset.style.borderRadius === '9999px' ? '12px' : preset.style.borderRadius
                                                    }}
                                                >
                                                    <div className="w-3/4 h-2 bg-gray-200 rounded-sm opacity-50"></div>
                                                    <div
                                                        className="w-1/2 h-3 text-[8px] flex items-center justify-center text-white"
                                                        style={{
                                                            backgroundColor: preset.style.buttonBackgroundColor,
                                                            color: preset.style.buttonTextColor,
                                                            borderRadius: preset.style.buttonRadius
                                                        }}
                                                    >
                                                        Button
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 text-right">
                                        * 템플릿 선택 시 색상/테두리 스타일이 일괄 변경됩니다.
                                    </p>
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

                                {/* Manual Design Section */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                                        <Palette className="w-4 h-4" /> 세부 디자인 수정 (선택)
                                    </h3>

                                    {/* Form Container Style */}
                                    <div className="mb-4">
                                        <h4 className="text-xs font-bold text-gray-700 mb-2">폼 컨테이너 스타일</h4>
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
                                                <label className="text-[10px] text-gray-500 block">테두리 두께</label>
                                                <input
                                                    type="text"
                                                    value={displaySizeValue(config.formConfig.style?.borderWidth)}
                                                    onChange={(e) => updateNested(['formConfig', 'style', 'borderWidth'], formatSizeValue(e.target.value))}
                                                    className="w-full border rounded p-1 text-xs"
                                                    placeholder="1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-500 block">모서리 둥글게</label>
                                                <input
                                                    type="text"
                                                    value={displaySizeValue(config.formConfig.style?.borderRadius)}
                                                    onChange={(e) => updateNested(['formConfig', 'style', 'borderRadius'], formatSizeValue(e.target.value))}
                                                    className="w-full border rounded p-1 text-xs"
                                                    placeholder="16"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Title Style */}
                                    <div className="mb-4 pt-4 border-t">
                                        <h4 className="text-xs font-bold text-gray-700 mb-2">폼 제목(무료 상담 신청) 스타일</h4>
                                        <div className="grid grid-cols-1 gap-2 mb-2">
                                            <div>
                                                <label className="text-[10px] text-gray-500 block">제목 텍스트</label>
                                                <input
                                                    type="text"
                                                    value={config.formConfig.title || ''}
                                                    onChange={(e) => updateNested(['formConfig', 'title'], e.target.value)}
                                                    className="w-full border rounded p-1 text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-500 block">서브 제목 텍스트</label>
                                                <input
                                                    type="text"
                                                    value={config.formConfig.subTitle || ''}
                                                    onChange={(e) => updateNested(['formConfig', 'subTitle'], e.target.value)}
                                                    className="w-full border rounded p-1 text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-gray-500 block">글자 색상</label>
                                                <div className="flex items-center gap-1">
                                                    <input type="color" value={config.formConfig.style?.titleColor || '#000000'} onChange={(e) => updateNested(['formConfig', 'style', 'titleColor'], e.target.value)} className="w-6 h-6 border rounded cursor-pointer p-0" />
                                                    <input type="text" value={config.formConfig.style?.titleColor || ''} onChange={(e) => updateNested(['formConfig', 'style', 'titleColor'], e.target.value)} className="flex-1 border rounded p-1 text-xs" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-500 block">글자 크기 (e.g. 1.5rem)</label>
                                                <input
                                                    type="text"
                                                    value={displaySizeValue(config.formConfig.style?.titleFontSize)}
                                                    onChange={(e) => updateNested(['formConfig', 'style', 'titleFontSize'], formatSizeValue(e.target.value))}
                                                    className="w-full border rounded p-1 text-xs"
                                                    placeholder="inherit"
                                                />
                                            </div>
                                            <div className="col-span-2 border rounded p-1">
                                                <FontPicker
                                                    label="제목 폰트"
                                                    value={config.formConfig.style?.titleFontFamily || ''}
                                                    onChange={(val) => updateNested(['formConfig', 'style', 'titleFontFamily'], val)}
                                                    globalSettings={globalSettings}
                                                    onSettingsChange={setGlobalSettings}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] text-gray-500 block">정렬</label>
                                                <select value={config.formConfig.style?.titleAlign || 'left'} onChange={(e) => updateNested(['formConfig', 'style', 'titleAlign'], e.target.value)} className="w-full border rounded p-1 text-xs">
                                                    <option value="left">왼쪽</option>
                                                    <option value="center">가운데</option>
                                                    <option value="right">오른쪽</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input Field Style */}
                                    <div className="pt-4 border-t mb-4">
                                        <h4 className="text-xs font-bold text-gray-700 mb-2">입력 필드 스타일</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            <div>
                                                <FontPicker
                                                    label="입력 필드 폰트"
                                                    value={config.formConfig.style?.inputFontFamily || ''}
                                                    onChange={(val) => updateNested(['formConfig', 'style', 'inputFontFamily'], val)}
                                                    globalSettings={globalSettings}
                                                    onSettingsChange={setGlobalSettings}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button Style */}
                                    <div className="pt-4 border-t">
                                        <h4 className="text-xs font-bold text-gray-700 mb-2">신청하기 버튼 스타일</h4>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <div className="grid grid-cols-1 gap-2 mb-2">
                                                <label className="text-[10px] text-gray-500 block">버튼 문구 수정</label>
                                                <input
                                                    type="text"
                                                    value={config.formConfig.submitButtonText}
                                                    onChange={(e) => updateNested(['formConfig', 'submitButtonText'], e.target.value)}
                                                    className="w-full border rounded p-2 text-sm"
                                                />
                                            </div>
                                            <ButtonStyleEditor label="버튼" mode="flat_form_button" />
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
                                                    <option value="email">이메일</option>
                                                    <option value="address">주소 검색 (Daum)</option>
                                                    <option value="date">날짜 선택</option>
                                                    <option value="time">시간 선택 (오전/오후 분리)</option>
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

                                            {/* Time Configuration */}
                                            {field.type === 'time' && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                                    <label className="text-xs font-bold text-blue-800 block mb-2">
                                                        시간 선택 설정 (시작/종료/간격)
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block">시작 시간</label>
                                                            <input
                                                                type="time"
                                                                value={field.timeConfig?.startTime || '09:00'}
                                                                onChange={(e) => {
                                                                    const newConfig = { ...field.timeConfig, startTime: e.target.value };
                                                                    updateField(idx, 'timeConfig', newConfig);
                                                                }}
                                                                className="w-full border p-1 rounded text-xs"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block">종료 시간</label>
                                                            <input
                                                                type="time"
                                                                value={field.timeConfig?.endTime || '18:00'}
                                                                onChange={(e) => {
                                                                    const newConfig = { ...field.timeConfig, endTime: e.target.value };
                                                                    updateField(idx, 'timeConfig', newConfig);
                                                                }}
                                                                className="w-full border p-1 rounded text-xs"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block">간격 (분)</label>
                                                            <select
                                                                value={field.timeConfig?.interval || 30}
                                                                onChange={(e) => {
                                                                    const newConfig = { ...field.timeConfig, interval: Number(e.target.value) };
                                                                    updateField(idx, 'timeConfig', newConfig);
                                                                }}
                                                                className="w-full border p-1 rounded text-xs"
                                                            >
                                                                <option value="10">10분</option>
                                                                <option value="15">15분</option>
                                                                <option value="30">30분</option>
                                                                <option value="60">1시간</option>
                                                            </select>
                                                        </div>
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

                        {/* --- LOCATION TAB (NEW) --- */}
                        {activeTab === 'location' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">오시는 길 (지도)</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs font-bold text-gray-700">섹션 사용</span>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                checked={config.location?.isShow ?? false}
                                                onChange={(e) => updateNested(['location', 'isShow'], e.target.checked)}
                                            />
                                            <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${(config.location?.isShow ?? false) ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                        </div>
                                    </label>
                                </div>

                                {(config.location?.isShow ?? false) && (
                                    <>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">섹션 제목</label>
                                                <input
                                                    type="text"
                                                    value={config.location?.title || ''}
                                                    onChange={(e) => updateNested(['location', 'title'], e.target.value)}
                                                    className="w-full border rounded p-2 text-sm"
                                                    placeholder="예: 오시는 길"
                                                />
                                            </div>
                                            <TextStyleEditor label="제목" stylePath={['location', 'titleStyle']} />

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">주소</label>
                                                <input
                                                    type="text"
                                                    value={config.location?.address || ''}
                                                    onChange={(e) => updateNested(['location', 'address'], e.target.value)}
                                                    className="w-full border rounded p-2 text-sm"
                                                    placeholder="예: 서울시 강남구..."
                                                />
                                            </div>
                                            <TextStyleEditor label="주소" stylePath={['location', 'addressStyle']} />

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">상세 주소 (선택)</label>
                                                <input
                                                    type="text"
                                                    value={config.location?.detailAddress || ''}
                                                    onChange={(e) => updateNested(['location', 'detailAddress'], e.target.value)}
                                                    className="w-full border rounded p-2 text-sm"
                                                    placeholder="예: 2층 201호"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
                                            <strong>지도 설정:</strong> 네이버/카카오 지도 API 연동 전에는 주소 텍스트만 표시되거나,
                                            관리자가 직접 상세페이지(Images) 탭에서 지도 스크린샷을 추가하는 것을 권장합니다.
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* --- SNS TAB --- */}
                        {activeTab === 'sns' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">SNS / 외부 링크</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs font-bold text-gray-700">활성화</span>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                checked={config.snsConfig?.isShow ?? false}
                                                onChange={(e) => updateNested(['snsConfig', 'isShow'], e.target.checked)}
                                            />
                                            <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${(config.snsConfig?.isShow ?? false) ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                        </div>
                                    </label>
                                </div>

                                {(config.snsConfig?.isShow ?? false) && (
                                    <div className="space-y-6">
                                        {/* Display Mode */}
                                        <div className="bg-gray-50 p-3 rounded border">
                                            <label className="text-xs font-bold text-gray-700 block mb-2">표시 방식</label>
                                            <div className="flex gap-2">
                                                {[
                                                    { id: 'floating', label: '플로팅 버튼 (화면 고정)' },
                                                    { id: 'block', label: '하단 고정 배너 (섹션)' }
                                                ].map(mode => (
                                                    <button
                                                        key={mode.id}
                                                        onClick={() => updateNested(['snsConfig', 'displayMode'], mode.id)}
                                                        className={`flex-1 py-2 px-3 rounded text-xs border ${config.snsConfig?.displayMode === mode.id ? 'bg-white border-blue-500 text-blue-600 font-bold shadow-sm' : 'bg-gray-100 border-transparent text-gray-500'}`}
                                                    >
                                                        {mode.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Position (Floating Only) */}
                                        {config.snsConfig?.displayMode !== 'block' && (
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">플로팅 위치</label>
                                                <select
                                                    value={config.snsConfig?.position || 'bottom-right'}
                                                    onChange={(e) => updateNested(['snsConfig', 'position'], e.target.value)}
                                                    className="w-full border rounded p-2 text-sm"
                                                >
                                                    <option value="bottom-right">오른쪽 하단</option>
                                                    <option value="bottom-left">왼쪽 하단</option>
                                                    <option value="side-right">오른쪽 사이드</option>
                                                    <option value="side-left">왼쪽 사이드</option>
                                                </select>
                                            </div>
                                        )}

                                        {/* Style Config */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-gray-500 block">아이콘 크기 (px)</label>
                                                <input
                                                    type="number"
                                                    value={config.snsConfig?.style?.iconSize || 48}
                                                    onChange={(e) => updateNested(['snsConfig', 'style', 'iconSize'], parseInt(e.target.value))}
                                                    className="w-full border rounded p-1 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-500 block">간격 (gap)</label>
                                                <input
                                                    type="number"
                                                    value={config.snsConfig?.style?.gap || 12}
                                                    onChange={(e) => updateNested(['snsConfig', 'style', 'gap'], parseInt(e.target.value))}
                                                    className="w-full border rounded p-1 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Dynamic Items List */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-700">SNS 링크 목록</label>
                                                <button
                                                    onClick={() => {
                                                        const newItem = { id: crypto.randomUUID(), type: 'custom', url: '', label: 'New Link' };
                                                        const currentItems = config.snsConfig?.items || [];
                                                        updateNested(['snsConfig', 'items'], [...currentItems, newItem]);
                                                    }}
                                                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-500"
                                                >
                                                    + 링크 추가
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {(config.snsConfig?.items || []).map((item, idx) => (
                                                    <div key={item.id || idx} className="border p-3 rounded-lg bg-white relative group">
                                                        <div className="flex justify-end mb-2">
                                                            <button
                                                                onClick={() => {
                                                                    const newItems = config.snsConfig?.items.filter((_, i) => i !== idx);
                                                                    updateNested(['snsConfig', 'items'], newItems);
                                                                }}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-[60px_1fr] gap-3">
                                                            {/* Icon Select/Upload */}
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border">
                                                                    {item.iconType === 'upload' && item.customIconUrl ? (
                                                                        <img src={item.customIconUrl} alt="icon" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-[9px] text-gray-400">{item.type}</span>
                                                                    )}
                                                                </div>
                                                                <select
                                                                    value={item.type}
                                                                    onChange={(e) => {
                                                                        const newType = e.target.value as any;
                                                                        const newItems = [...(config.snsConfig?.items || [])];
                                                                        newItems[idx] = { ...newItems[idx], type: newType };
                                                                        updateNested(['snsConfig', 'items'], newItems);
                                                                    }}
                                                                    className="w-full text-[9px] border rounded"
                                                                >
                                                                    <option value="instagram">인스타</option>
                                                                    <option value="youtube">유튜브</option>
                                                                    <option value="blog">블로그</option>
                                                                    <option value="kakao">카카오</option>
                                                                    <option value="custom">직접입력</option>
                                                                </select>

                                                                <label className="text-[8px] text-blue-600 cursor-pointer underline">
                                                                    아이콘 업로드
                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => {
                                                                        const newItems = [...(config.snsConfig?.items || [])];
                                                                        newItems[idx] = { ...newItems[idx], iconType: 'upload', customIconUrl: url };
                                                                        updateNested(['snsConfig', 'items'], newItems);
                                                                    })} />
                                                                </label>
                                                            </div>

                                                            {/* Inputs */}
                                                            <div className="space-y-2">
                                                                <input
                                                                    type="text"
                                                                    value={item.label || ''}
                                                                    onChange={(e) => {
                                                                        const newItems = [...(config.snsConfig?.items || [])];
                                                                        newItems[idx] = { ...newItems[idx], label: e.target.value };
                                                                        updateNested(['snsConfig', 'items'], newItems);
                                                                    }}
                                                                    className="w-full border rounded p-1 text-xs"
                                                                    placeholder="라벨 (툴팁)"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={item.url}
                                                                    onChange={(e) => {
                                                                        const newItems = [...(config.snsConfig?.items || [])];
                                                                        newItems[idx] = { ...newItems[idx], url: e.target.value };
                                                                        updateNested(['snsConfig', 'items'], newItems);
                                                                    }}
                                                                    className="w-full border rounded p-1 text-xs"
                                                                    placeholder="https://..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- FEATURES TAB (Smart Block) --- */}
                        {activeTab === 'features' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">주요 특징 (Animated)</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs font-bold text-gray-700">섹션 사용</span>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                checked={config.features?.isShow ?? false}
                                                onChange={(e) => updateNested(['features', 'isShow'], e.target.checked)}
                                            />
                                            <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${(config.features?.isShow ?? false) ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                        </div>
                                    </label>
                                </div>

                                {(config.features?.isShow ?? false) && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-1 block">섹션 제목</label>
                                            <input
                                                type="text"
                                                value={config.features?.title || ''}
                                                onChange={(e) => updateNested(['features', 'title'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-1 block">섹션 설명</label>
                                            <input
                                                type="text"
                                                value={config.features?.description || ''}
                                                onChange={(e) => updateNested(['features', 'description'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm"
                                            />
                                        </div>

                                        <div className="border-t pt-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-xs font-bold text-gray-700">특징 항목 리스트</h4>
                                                <button
                                                    onClick={() => {
                                                        const newItem = { id: crypto.randomUUID(), title: '새로운 특징', description: '설명을 입력하세요', animation: 'fade-up' };
                                                        const currentItems = config.features?.items || [];
                                                        updateNested(['features', 'items'], [...currentItems, newItem]);
                                                    }}
                                                    className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-500"
                                                >
                                                    + 항목 추가
                                                </button>
                                            </div>

                                            <div className="space-y-6">
                                                {(config.features?.items || []).map((item, idx) => (
                                                    <div key={item.id || idx} className="bg-white border rounded-lg p-4 shadow-sm relative">
                                                        <button
                                                            onClick={() => {
                                                                const newItems = config.features?.items.filter((_, i) => i !== idx);
                                                                updateNested(['features', 'items'], newItems);
                                                            }}
                                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>

                                                        <div className="flex flex-col gap-3">
                                                            {/* Image Upload */}
                                                            <div className="w-full aspect-video bg-gray-100 rounded border flex items-center justify-center overflow-hidden relative group">
                                                                {item.imageUrl ? (
                                                                    <img src={item.imageUrl} alt="feature" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">이미지 없음</span>
                                                                )}

                                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <label className="cursor-pointer text-white text-xs underline">
                                                                        이미지 업로드
                                                                        <input type="file" className="hidden" accept="image/*"
                                                                            onChange={(e) => handleImageUpload(e, (url) => {
                                                                                const newItems = [...(config.features?.items || [])];
                                                                                newItems[idx] = { ...newItems[idx], imageUrl: url };
                                                                                updateNested(['features', 'items'], newItems);
                                                                            })}
                                                                        />
                                                                    </label>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="text-[10px] text-gray-500 block">제목</label>
                                                                <input
                                                                    type="text"
                                                                    value={item.title}
                                                                    onChange={(e) => {
                                                                        const newItems = [...(config.features?.items || [])];
                                                                        newItems[idx] = { ...newItems[idx], title: e.target.value };
                                                                        updateNested(['features', 'items'], newItems);
                                                                    }}
                                                                    className="w-full border rounded p-1 text-sm font-bold"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-gray-500 block">설명</label>
                                                                <textarea
                                                                    value={item.description}
                                                                    onChange={(e) => {
                                                                        const newItems = [...(config.features?.items || [])];
                                                                        newItems[idx] = { ...newItems[idx], description: e.target.value };
                                                                        updateNested(['features', 'items'], newItems);
                                                                    }}
                                                                    className="w-full border rounded p-1 text-xs h-16 resize-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-gray-500 block">애니메이션 효과</label>
                                                                <select
                                                                    value={item.animation || 'fade-up'}
                                                                    onChange={(e) => {
                                                                        const newItems = [...(config.features?.items || [])];
                                                                        newItems[idx] = { ...newItems[idx], animation: e.target.value as any };
                                                                        updateNested(['features', 'items'], newItems);
                                                                    }}
                                                                    className="w-full border rounded p-1 text-xs"
                                                                >
                                                                    <option value="fade-up">위로 떠오르기 (Fade Up)</option>
                                                                    <option value="fade-in">서서히 나타나기 (Fade In)</option>
                                                                    <option value="slide-left">왼쪽에서 슬라이드</option>
                                                                    <option value="slide-right">오른쪽에서 슬라이드</option>
                                                                    <option value="zoom-in">확대되며 등장 (Zoom In)</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                        {/* --- SEO TAB (NEW) --- */}
                        {activeTab === 'seo' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-blue-600" /> 검색엔진 등록 설정
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded leading-relaxed border border-gray-100">
                                        네이버나 구글 서치콘솔에서 제공하는 <strong>사이트 소유권 확인 태그(Meta)</strong>를 입력하세요.
                                        <br />
                                        예시: <code>&lt;meta name="naver-site-verification" content="..." /&gt;</code>
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                                네이버 검색엔진 등록 메타(Meta) 태그
                                            </label>
                                            <input
                                                type="text"
                                                value={config.naverVerification || ''}
                                                onChange={(e) => updateNested(['naverVerification'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm font-mono text-gray-600 bg-gray-50 focus:bg-white transition-colors"
                                                placeholder='<meta name="naver-site-verification" ... />'
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                                구글 검색엔진 등록 메타(Meta) 태그
                                            </label>
                                            <input
                                                type="text"
                                                value={config.googleVerification || ''}
                                                onChange={(e) => updateNested(['googleVerification'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm font-mono text-gray-600 bg-gray-50 focus:bg-white transition-colors"
                                                placeholder='<meta name="google-site-verification" ... />'
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- LAYOUT TAB (NEW) --- */}
                        {activeTab === 'layout' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Layout Mode */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Layout className="w-4 h-4 text-blue-600" /> 레이아웃 모드
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => updateNested(['layoutMode'], 'mobile')}
                                            className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${config.layoutMode === 'mobile' || !config.layoutMode ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="w-8 h-12 bg-gray-200 mx-auto mb-2 rounded border border-gray-300"></div>
                                            <div className="text-xs font-bold">모바일 (기본)</div>
                                            <div className="text-[10px] text-gray-500">중앙 정렬 (최대 420px)</div>
                                        </div>
                                        <div
                                            onClick={() => updateNested(['layoutMode'], 'full')}
                                            className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${config.layoutMode === 'full' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="w-16 h-10 bg-gray-200 mx-auto mb-4 rounded border border-gray-300"></div>
                                            <div className="text-xs font-bold">풀스크린 (PC)</div>
                                            <div className="text-[10px] text-gray-500">화면 꽉 차게 표시</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Bar (GNB) */}
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Menu className="w-4 h-4 text-blue-600" /> 상단 네비게이션 (GNB)
                                        </h3>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="text-xs font-bold text-gray-700">사용</span>
                                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                                <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                    checked={config.navigation?.isShow || false}
                                                    onChange={(e) => updateNested(['navigation', 'isShow'], e.target.checked)}
                                                />
                                                <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${(config.navigation?.isShow || false) ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                            </div>
                                        </label>
                                    </div>

                                    {config.navigation?.isShow && (
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-2">
                                                <input type="checkbox" checked={config.navigation?.showHome || false} onChange={e => updateNested(['navigation', 'showHome'], e.target.checked)} />
                                                <span>홈 버튼 표시 (좌측 집 아이콘)</span>
                                            </label>
                                            {/* Style Config */}
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <label className="block text-gray-500 mb-1">배경색</label>
                                                    <div className="flex items-center gap-1">
                                                        <input type="color" className="w-6 h-6 border rounded cursor-pointer p-0"
                                                            value={config.navigation.backgroundColor || '#ffffff'}
                                                            onChange={(e) => updateNested(['navigation', 'backgroundColor'], e.target.value)}
                                                        />
                                                        <input type="text" className="full border rounded p-1"
                                                            value={config.navigation.backgroundColor || '#ffffff'}
                                                            onChange={(e) => updateNested(['navigation', 'backgroundColor'], e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-gray-500 mb-1">글자색</label>
                                                    <div className="flex items-center gap-1">
                                                        <input type="color" className="w-6 h-6 border rounded cursor-pointer p-0"
                                                            value={config.navigation.textColor || '#333333'}
                                                            onChange={(e) => updateNested(['navigation', 'textColor'], e.target.value)}
                                                        />
                                                        <input type="text" className="full border rounded p-1"
                                                            value={config.navigation.textColor || '#333333'}
                                                            onChange={(e) => updateNested(['navigation', 'textColor'], e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Menu Items */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xs font-bold text-gray-700">메뉴 항목</h4>
                                                    <button
                                                        onClick={() => updateNested(['navigation', 'items'], [...(config.navigation?.items || []), { label: '메뉴명', link: '#section-id' }])}
                                                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" />추가
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {(config.navigation?.items || []).map((item, idx) => (
                                                        <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded border">
                                                            <input type="text" className="w-1/3 border rounded p-1.5 text-xs"
                                                                placeholder="메뉴명"
                                                                value={item.label}
                                                                onChange={(e) => {
                                                                    const newItems = [...(config.navigation?.items || [])];
                                                                    newItems[idx].label = e.target.value;
                                                                    updateNested(['navigation', 'items'], newItems);
                                                                }}
                                                            />
                                                            <input type="text" className="flex-1 border rounded p-1.5 text-xs font-mono"
                                                                placeholder="#section-id 또는 URL"
                                                                value={item.link}
                                                                onChange={(e) => {
                                                                    const newItems = [...(config.navigation?.items || [])];
                                                                    newItems[idx].link = e.target.value;
                                                                    updateNested(['navigation', 'items'], newItems);
                                                                }}
                                                            />
                                                            <button onClick={() => {
                                                                const newItems = (config.navigation?.items || []).filter((_, i) => i !== idx);
                                                                updateNested(['navigation', 'items'], newItems);
                                                            }} className="text-gray-400 hover:text-red-500">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-2">
                                                    * 연결할 섹션 ID: #hero, #problem, #solution, #form 등
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- GALLERY TAB (NEW) --- */}
                        {activeTab === 'gallery' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Grid className="w-4 h-4 text-blue-600" /> 갤러리 섹션
                                        </h3>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="text-xs font-bold text-gray-700">사용</span>
                                            <input type="checkbox" className="toggle-checkbox"
                                                checked={config.gallery?.isShow || false}
                                                onChange={(e) => updateNested(['gallery', 'isShow'], e.target.checked)}
                                            />
                                        </label>
                                    </div>

                                    {config.gallery?.isShow && (
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                                <input type="checkbox" checked={config.gallery?.showOnMainPage !== false} onChange={e => updateNested(['gallery', 'showOnMainPage'], e.target.checked)} />
                                                <span>메인 페이지에 노출</span>
                                            </label>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">섹션 제목</label>
                                                <input type="text" className="w-full border rounded p-2 text-sm"
                                                    value={config.gallery.title || ''}
                                                    onChange={(e) => updateNested(['gallery', 'title'], e.target.value)}
                                                    placeholder="갤러리"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">설명 (선택)</label>
                                                <input type="text" className="w-full border rounded p-2 text-sm"
                                                    value={config.gallery.description || ''}
                                                    onChange={(e) => updateNested(['gallery', 'description'], e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">한 줄당 이미지 수</label>
                                                    <select className="w-full border rounded p-2 text-sm"
                                                        value={config.gallery.gridCols || 2}
                                                        onChange={(e) => updateNested(['gallery', 'gridCols'], parseInt(e.target.value))}
                                                    >
                                                        <option value="1">1개</option>
                                                        <option value="2">2개</option>
                                                        <option value="3">3개</option>
                                                        <option value="4">4개</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">간격 (Gap)</label>
                                                    <select className="w-full border rounded p-2 text-sm"
                                                        value={config.gallery.gap || 4}
                                                        onChange={(e) => updateNested(['gallery', 'gap'], parseInt(e.target.value))}
                                                    >
                                                        <option value="2">좁게 (2)</option>
                                                        <option value="4">보통 (4)</option>
                                                        <option value="8">넓게 (8)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Images List */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xs font-bold text-gray-700">이미지 목록</h4>
                                                    <button onClick={() => document.getElementById('gallery-upload')?.click()} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
                                                        <Upload className="w-3 h-3" /> 업로드
                                                    </button>
                                                    <input type="file" id="gallery-upload" className="hidden" accept="image/*"
                                                        onChange={(e) => handleImageUpload(e, (url) => updateNested(['gallery', 'images'], [...(config.gallery?.images || []), url]))}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(config.gallery?.images || []).map((img, idx) => (
                                                        <div key={idx} className="relative group aspect-square bg-gray-100 rounded overflow-hidden border">
                                                            <img src={img} alt="gallery" className="w-full h-full object-cover" />
                                                            <button onClick={() => {
                                                                const newImages = (config.gallery?.images || []).filter((_, i) => i !== idx);
                                                                updateNested(['gallery', 'images'], newImages);
                                                            }} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- BOARD TAB (NEW) --- */}
                        {activeTab === 'board' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <List className="w-4 h-4 text-blue-600" /> 게시판/공지사항 섹션
                                        </h3>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="text-xs font-bold text-gray-700">사용</span>
                                            <input type="checkbox" className="toggle-checkbox"
                                                checked={config.board?.isShow || false}
                                                onChange={(e) => updateNested(['board', 'isShow'], e.target.checked)}
                                            />
                                        </label>
                                    </div>

                                    {config.board?.isShow && (
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                                <input type="checkbox" checked={config.board?.showOnMainPage !== false} onChange={e => updateNested(['board', 'showOnMainPage'], e.target.checked)} />
                                                <span>메인 페이지에 노출</span>
                                            </label>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">게시판 제목</label>
                                                <input type="text" className="w-full border rounded p-2 text-sm"
                                                    value={config.board.title || ''}
                                                    onChange={(e) => updateNested(['board', 'title'], e.target.value)}
                                                    placeholder="공지사항"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">유형 (Type)</label>
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input type="radio" checked={config.board.type === 'list'} onChange={() => updateNested(['board', 'type'], 'list')} />
                                                        <span className="text-sm">리스트형</span>
                                                    </label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input type="radio" checked={config.board.type === 'accordion'} onChange={() => updateNested(['board', 'type'], 'accordion')} />
                                                        <span className="text-sm">아코디언 (FAQ)</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Items */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold text-gray-700">게시글 목록</h4>
                                                    <button onClick={() => updateNested(['board', 'items'], [...(config.board?.items || []), { id: crypto.randomUUID(), title: '새 글', date: new Date().toISOString().split('T')[0] }])} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
                                                        <Plus className="w-3 h-3" /> 추가
                                                    </button>
                                                </div>
                                                {(config.board?.items || []).map((item, idx) => (
                                                    <div key={item.id} className="bg-gray-50 border rounded p-3 relative space-y-2">
                                                        <button onClick={() => {
                                                            const newItems = (config.board?.items || []).filter((_, i) => i !== idx);
                                                            updateNested(['board', 'items'], newItems);
                                                        }} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                                                            <X className="w-4 h-4" />
                                                        </button>

                                                        <input type="text" className="w-full border rounded p-2 text-sm font-bold"
                                                            value={item.title}
                                                            onChange={(e) => {
                                                                const newItems = [...(config.board?.items || [])];
                                                                newItems[idx].title = e.target.value;
                                                                updateNested(['board', 'items'], newItems);
                                                            }}
                                                            placeholder="제목"
                                                        />

                                                        {config.board.type === 'accordion' && (
                                                            <textarea className="w-full border rounded p-2 text-sm h-20"
                                                                value={item.content || ''}
                                                                onChange={(e) => {
                                                                    const newItems = [...(config.board?.items || [])];
                                                                    newItems[idx].content = e.target.value;
                                                                    updateNested(['board', 'items'], newItems);
                                                                }}
                                                                placeholder="내용"
                                                            />
                                                        )}

                                                        <div className="flex gap-2">
                                                            <input type="text" className="w-1/3 border rounded p-1 text-xs text-gray-500"
                                                                value={item.category || ''}
                                                                onChange={(e) => {
                                                                    const newItems = [...(config.board?.items || [])];
                                                                    newItems[idx].category = e.target.value;
                                                                    updateNested(['board', 'items'], newItems);
                                                                }}
                                                                placeholder="카테고리"
                                                            />
                                                            <input type="date" className="w-1/3 border rounded p-1 text-xs text-gray-500"
                                                                value={item.date}
                                                                onChange={(e) => {
                                                                    const newItems = [...(config.board?.items || [])];
                                                                    newItems[idx].date = e.target.value;
                                                                    updateNested(['board', 'items'], newItems);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- SNS TAB (NEW) --- */}
                        {activeTab === 'sns' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Share2 className="w-4 h-4 text-blue-600" /> SNS 플로팅 바
                                        </h3>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="text-xs font-bold text-gray-700">사용</span>
                                            <input type="checkbox" className="toggle-checkbox"
                                                checked={config.snsConfig?.isShow || false}
                                                onChange={(e) => updateNested(['snsConfig', 'isShow'], e.target.checked)}
                                            />
                                        </label>
                                    </div>

                                    {config.snsConfig?.isShow && (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <label className="block text-xs font-bold text-gray-500 mb-2">표시 방식</label>
                                                <div className="flex gap-4">
                                                    <label className={`flex-1 p-3 border rounded-lg cursor-pointer flex flex-col items-center gap-2 ${config.snsConfig?.displayMode === 'floating' || !config.snsConfig?.displayMode ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white hover:bg-gray-50'}`}>
                                                        <input
                                                            type="radio"
                                                            name="snsDisplayMode"
                                                            className="hidden"
                                                            checked={config.snsConfig?.displayMode === 'floating' || !config.snsConfig?.displayMode}
                                                            onChange={() => updateNested(['snsConfig', 'displayMode'], 'floating')}
                                                        />
                                                        <Share2 className="w-5 h-5 text-blue-500" />
                                                        <span className="text-xs font-bold">플로팅 (화면 고정)</span>
                                                    </label>
                                                    <label className={`flex-1 p-3 border rounded-lg cursor-pointer flex flex-col items-center gap-2 ${config.snsConfig?.displayMode === 'block' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white hover:bg-gray-50'}`}>
                                                        <input
                                                            type="radio"
                                                            name="snsDisplayMode"
                                                            className="hidden"
                                                            checked={config.snsConfig?.displayMode === 'block'}
                                                            onChange={() => updateNested(['snsConfig', 'displayMode'], 'block')}
                                                        />
                                                        <Layout className="w-5 h-5 text-blue-500" />
                                                        <span className="text-xs font-bold">배너 (하단 고정)</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {(config.snsConfig?.displayMode === 'floating' || !config.snsConfig?.displayMode) && (
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">위치 (플로팅 모드)</label>
                                                    <select
                                                        value={config.snsConfig?.position || 'bottom-right'}
                                                        onChange={e => updateNested(['snsConfig', 'position'], e.target.value)}
                                                        className="w-full border rounded p-2 text-sm"
                                                    >
                                                        <option value="bottom-right">우측 하단</option>
                                                        <option value="bottom-left">좌측 하단</option>
                                                        <option value="side-right">우측 사이드</option>
                                                        <option value="side-left">좌측 사이드</option>
                                                    </select>
                                                </div>
                                            )}

                                            <div className="border-t border-gray-200 pt-4 space-y-3">
                                                <h4 className="text-xs font-bold text-gray-700">계정 설정</h4>

                                                {/* Kakao */}
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">카카오톡 채널 링크</label>
                                                    <input type="text" className="w-full border rounded p-2 text-xs"
                                                        value={config.snsConfig.kakao || ''}
                                                        onChange={(e) => updateNested(['snsConfig', 'kakao'], e.target.value)}
                                                        placeholder="http://pf.kakao.com/..."
                                                    />
                                                </div>

                                                {/* Naver Blog */}
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">네이버 블로그 링크</label>
                                                    <input type="text" className="w-full border rounded p-2 text-xs"
                                                        value={config.snsConfig.naverBlog || ''}
                                                        onChange={(e) => updateNested(['snsConfig', 'naverBlog'], e.target.value)}
                                                        placeholder="https://blog.naver.com/..."
                                                    />
                                                </div>

                                                {/* Instagram */}
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">인스타그램 링크</label>
                                                    <input type="text" className="w-full border rounded p-2 text-xs"
                                                        value={config.snsConfig.instagram || ''}
                                                        onChange={(e) => updateNested(['snsConfig', 'instagram'], e.target.value)}
                                                        placeholder="https://instagram.com/..."
                                                    />
                                                </div>

                                                {/* YouTube */}
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">유튜브 링크</label>
                                                    <input type="text" className="w-full border rounded p-2 text-xs"
                                                        value={config.snsConfig.youtube || ''}
                                                        onChange={(e) => updateNested(['snsConfig', 'youtube'], e.target.value)}
                                                        placeholder="https://youtube.com/..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                    </div>
                </div >

                {/* RIGHT: Live Preview Panel */}
                {/* ... Same as before ... */}
                <div className="lg:flex-1 w-full lg:h-full min-h-[900px] shrink-0 bg-gray-200 flex flex-col items-center justify-center relative overflow-hidden border-t-8 border-gray-300 lg:border-t-0">
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

                        <LandingPage previewConfig={config} isMobileView={previewMode === 'mobile'} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LandingEditor;
