import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LandingConfig, FormField, TextStyle, FloatingBanner, DetailContent, CustomFont, GlobalSettings, FormStyle } from '../../types';
import LandingPage from '../LandingPage';
import { saveLandingConfig, fetchLandingConfigById, uploadImageToDrive, fetchGlobalSettings, manageVirtualData } from '../../services/googleSheetService';
import { Save, Copy, ArrowLeft, Trash2, PlusCircle, Smartphone, Monitor, Image as ImageIcon, AlignLeft, CheckSquare, Upload, Type, Palette, ArrowUp, ArrowDown, Youtube, FileText, Megaphone, X, Plus, Layout, AlertCircle, Maximize, Globe, Share2, Anchor, Send, Loader2, CheckCircle, MapPin, Clock, MessageCircle, ExternalLink, RefreshCw, Menu, Grid, List, ListOrdered, Flag, Instagram, Star, Settings, Sparkles, Check, Activity, Database, ShieldCheck, Pencil, TriangleAlert, PlayCircle } from 'lucide-react';
import GoogleDrivePicker from '../../components/GoogleDrivePicker';
import { uploadImageToGithub, deployConfigsToGithub, getGithubToken, setGithubToken } from '../../services/githubService';
import { compressImage } from '../../utils/imageCompression';

import { GOOGLE_FONTS_LIST } from '../../utils/fontUtils';
import { SECURITY_PRESETS } from '../../components/SecurityFooter';
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
const CONTAINER_PRESETS = [
    { name: '표준 (Standard)', value: 'standard', style: { layout: 'standard', padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', maxWidth: '100%', mobileMaxWidth: '100%', mobilePadding: '1rem', gap: '1.5rem', hideBackground: false, borderColor: 'rgba(255, 255, 255, 0.1)' } },
    { name: '인라인 (Inline)', value: 'inline', style: { layout: 'inline', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(0, 0, 0, 0.3)', maxWidth: '90%', mobileMaxWidth: '85%', mobilePadding: '0.5rem', gap: '0.5rem', hideBackground: false, borderColor: 'rgba(255, 255, 255, 0.1)' } },
    { name: '컴팩트 (Compact)', value: 'compact', style: { layout: 'compact', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: 'rgba(0, 0, 0, 0.4)', maxWidth: '280px', mobileMaxWidth: '70%', mobilePadding: '0.5rem', gap: '0.75rem', hideBackground: false, borderColor: 'rgba(255, 255, 255, 0.15)' } },
    { name: '미니멀 (Minimal)', value: 'minimal', style: { layout: 'minimal', padding: '0.25rem', borderRadius: '0.5rem', backgroundColor: 'transparent', maxWidth: '240px', mobileMaxWidth: '60%', mobilePadding: '0.25rem', gap: '0.5rem', hideBackground: true, borderColor: 'transparent' } },
    { name: '카드 (Card)', value: 'card', style: { layout: 'card', padding: '1rem', borderRadius: '1.5rem', backgroundColor: '#ffffff', maxWidth: '300px', mobileMaxWidth: '75%', mobilePadding: '0.75rem', gap: '1rem', hideBackground: false, borderColor: 'transparent' } }
];

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
            buttonAlign: 'center',
            buttonAnimation: 'none'
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
            buttonAlign: 'center',
            buttonAnimation: 'none'
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
            buttonAlign: 'center',
            buttonAnimation: 'none'
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
    features: { isShow: false, title: '주요 특징', description: '우리 서비스의 특별한 점을 소개합니다.', items: [] },
    // NEW: AI 변제금 진단 챗봇 설정
    rehabChatConfig: {
        isEnabled: false,
        displayMode: 'floating',
        buttonText: 'AI 변제금 확인',
        buttonPosition: 'bottom-left',
        buttonColor: '#8B5CF6',
        characterName: '로이',
        characterImage: '', // NEW: Custom Character Image
        placement: {
            showAsFloating: true,
            showInHero: false,
            showInPopup: false,
            showInTopBanner: false,
            showInBottomBanner: false
        }
    }
};

// ... imports
import ImageManager from '../../components/admin/ImageManager';

// ... existing code

const LandingEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Main Config State
    const [config, setConfig] = useState<LandingConfig>(DEFAULT_CONFIG);

    // UI State
    const [activeTab, setActiveTab] = useState('hero');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
    const [deployStatus, setDeployStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [fontUploadTab, setFontUploadTab] = useState<'google' | 'file'>('google');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [inputGithubToken, setInputGithubToken] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isAdditionalDbEditing, setIsAdditionalDbEditing] = useState(false);

    // Global Settings
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({ customFonts: [], favoriteFonts: [] });

    // Image Manager State
    const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
    const [imagePickerCallback, setImagePickerCallback] = useState<((url: string) => void) | null>(null);

    const openImagePicker = (callback: (url: string) => void) => {
        setImagePickerCallback(() => callback);
        setIsImageManagerOpen(true);
    };

    // File input refs
    const heroBgInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const ogImageInputRef = useRef<HTMLInputElement>(null);
    const bannerImageInputRef = useRef<HTMLInputElement>(null);

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

                    // Console log for verification
                    console.log('✅ Config loaded:', {
                        id: sheetConfig.id,
                        hasExternalSheet: !!sheetConfig.additionalSheetConfig?.spreadsheetUrl,
                        sheetName: sheetConfig.additionalSheetConfig?.sheetName,
                        fieldMappingsCount: sheetConfig.additionalSheetConfig?.fieldMappings?.length || 0
                    });
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
        if (typeof window !== 'undefined') {
            alert('브라우저 임시 저장소에 저장되었습니다.');
        }
    };

    const handleSaveToSheet = async () => {
        // [Size Check] Google Sheets Cell Limit is ~50,000 chars.
        // We conservatively check for 45,000 to be safe.
        const configStr = JSON.stringify(config);
        if (configStr.length > 45000) {
            if (typeof window !== 'undefined') {
                alert(
                    '저장 용량을 초과했습니다! (현재: ' + (configStr.length / 1024).toFixed(2) + 'KB)\n\n' +
                    'Google Sheets에는 대용량 이미지(Base64)를 직접 저장할 수 없습니다.\n' +
                    '이미지 "업로드" 대신 "이미지 주소(URL)"를 입력해주세요.\n\n' +
                    '(팁: 이미지를 웹에 올린 후 주소를 복사해 붙여넣으세요.)'
                );
            }
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
                setHasUnsavedChanges(false);

                // Build detailed success message
                const savedFeatures = ['✅ 랜딩페이지 설정 저장 완료'];
                if (config.additionalSheetConfig?.spreadsheetUrl) {
                    const urlPreview = config.additionalSheetConfig.spreadsheetUrl.length > 50
                        ? config.additionalSheetConfig.spreadsheetUrl.substring(0, 50) + '...'
                        : config.additionalSheetConfig.spreadsheetUrl;
                    savedFeatures.push(`✅ 외부 시트: ${urlPreview}`);
                }
                if (config.additionalSheetConfig?.sheetName) {
                    savedFeatures.push(`✅ 시트 이름: ${config.additionalSheetConfig.sheetName}`);
                }
                if (config.additionalSheetConfig?.fieldMappings?.length) {
                    savedFeatures.push(`✅ 필드 매핑: ${config.additionalSheetConfig.fieldMappings.length}개`);
                }

                // Show detailed success alert
                if (savedFeatures.length > 1) {
                    if (typeof window !== 'undefined') {
                        alert('🎉 저장 완료!\n\n' + savedFeatures.join('\n'));
                    }
                }

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
                if (typeof window !== 'undefined') {
                    alert('저장이 완료되었으나 서버 확인이 지연되고 있습니다.\n잠시 후 다시 확인해주세요.');
                }
            }
        } else {
            setDeployStatus('error');
            if (typeof window !== 'undefined') {
                alert('저장에 실패했습니다. 네트워크 상태를 확인해주세요.');
            }
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

    // Image Helper: Upload to Github (Primary) or Drive (Fallback)
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
        const originalFile = e.target.files?.[0];
        if (originalFile) {
            // Check file size (GitHub API limit is 100MB, but let's keep it reasonable)
            if (originalFile.size > 10 * 1024 * 1024) {
                if (typeof window !== 'undefined') {
                    alert("파일 용량이 너무 큽니다. (10MB 제한)");
                }
                return;
            }

            // Determine Start 
            const ghToken = getGithubToken();

            if (!ghToken) {
                if (typeof window !== 'undefined') {
                    alert("이미지 업로드를 위해 GitHub 토큰 설정이 필요합니다.\n설정 창으로 이동합니다.");
                }
                setShowSettingsModal(true);
                // Clear input so user can try again after setting token
                e.target.value = '';
                return;
            }

            // Show loading cursor
            const prevCursor = document.body.style.cursor;
            document.body.style.cursor = 'wait';

            try {
                // Phase 10: Auto-Compression
                // alert("이미지를 최적화(압축) 중입니다..."); // Optional feedback
                const compressedFile = await compressImage(originalFile);

                // Direct Upload to GitHub
                const res = await uploadImageToGithub(compressedFile);
                if (res.success && res.url) {
                    callback(res.url);
                    // alert("GitHub 업로드 완료! (배포 후 적용됩니다)");
                } else {
                    if (typeof window !== 'undefined') {
                        alert(`GitHub 업로드 실패: ${res.message}`);
                    }
                }
            } catch (err) {
                console.error(err);
                if (typeof window !== 'undefined') {
                    alert("오류가 발생했습니다.");
                }
            } finally {
                document.body.style.cursor = prevCursor;
                // Clear input
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
                newStyle = { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: '1px', borderRadius: '16px', textColor: '#1f2937', buttonBackgroundColor: config.theme.primaryColor, buttonTextColor: '#ffffff', buttonRadius: '12px', buttonAnimation: 'none' };
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
            if (typeof window !== 'undefined') {
                alert("띠배너는 최대 5개까지 추가할 수 있습니다.");
            }
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
                const map: any = { backgroundColor: 'buttonBackgroundColor', textColor: 'buttonTextColor', borderRadius: 'buttonRadius', fontSize: 'buttonFontSize', width: 'buttonWidth', alignment: 'buttonAlign', fontFamily: 'buttonFontFamily', animation: 'buttonAnimation' };
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
                const map: any = { backgroundColor: 'buttonBackgroundColor', textColor: 'buttonTextColor', borderRadius: 'buttonRadius', fontSize: 'buttonFontSize', width: 'buttonWidth', alignment: 'buttonAlign', fontFamily: 'buttonFontFamily', animation: 'buttonAnimation' };
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
                    <div>
                        <label className="text-[10px] text-gray-500 block">정렬 (위치)</label>
                        <select value={getValue('alignment') || 'center'} onChange={e => updateStyle('alignment', e.target.value)} className="w-full border rounded p-1 text-xs">
                            <option value="left">왼쪽</option>
                            <option value="center">가운데</option>
                            <option value="right">오른쪽</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-1">버튼 배경 이미지</label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openImagePicker((url) => updateStyle('backgroundImage', url))}
                                className="flex-1 bg-white border rounded p-1.5 text-xs hover:bg-gray-50 flex items-center justify-center gap-1 text-gray-600"
                            >
                                <Upload className="w-3 h-3" /> 배경 이미지 업로드
                            </button>
                            {getValue('backgroundImage') && (
                                <button
                                    onClick={() => updateStyle('backgroundImage', '')}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded border"
                                    title="이미지 제거"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        {getValue('backgroundImage') && (
                            <div className="mt-2 w-full h-10 rounded border overflow-hidden bg-gray-100 relative group">
                                <img src={getValue('backgroundImage')} className="w-full h-full object-cover" alt="btn-bg" />
                            </div>
                        )}
                    </div>
                    <div className="col-span-2 border-t pt-2 mt-1">
                        <label className="text-xs font-bold text-blue-600 block mb-1">✨ 버튼 애니메이션 효과</label>
                        <select
                            value={getValue('animation') || 'none'}
                            onChange={e => updateStyle('animation', e.target.value)}
                            className="w-full border rounded p-2 text-xs bg-blue-50 text-blue-900 font-bold"
                        >
                            <option value="none">없음 (기본)</option>
                            <option value="pulse">Pulse (맥박)</option>
                            <option value="shimmer">Shimmer (빛 반사)</option>
                            <option value="bounce">Bounce (바운스)</option>
                            <option value="heartbeat">Heartbeat (빠른 심박)</option>
                            <option value="wiggle">Electric Wiggle (진동)</option>
                            <option value="hyper-shimmer">Hyper Shimmer (강렬한 빛 - 추천)</option>
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">* 돋보이는 애니메이션으로 전환율을 높여보세요.</p>
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

    // --- STEP BUILDER HELPERS ---
    const addStep = (type: 'intro' | 'content' | 'form' | 'outro') => {
        setConfig(prev => ({
            ...prev,
            steps: [
                ...(prev.steps || []),
                {
                    id: `s_${Date.now()}`,
                    type,
                    title: type === 'intro' ? '시작하기' : undefined, // Outro no longer has default title
                    buttonText: type === 'outro' ? '제출하기' : '다음',
                    fieldIds: type === 'form' ? [] : undefined,
                    contentId: type === 'content' ? '' : undefined,
                    showPrevButton: type !== 'intro',
                    prevButtonText: '이전'
                }
            ]
        }));
    };

    const removeStep = (index: number) => {
        setConfig(prev => ({
            ...prev,
            steps: (prev.steps || []).filter((_, i) => i !== index)
        }));
    };

    const updateStep = (index: number, updates: Partial<any>) => {
        setConfig(prev => {
            const newSteps = [...(prev.steps || [])];
            newSteps[index] = { ...newSteps[index], ...updates };
            return { ...prev, steps: newSteps };
        });
    };

    const moveStep = (index: number, direction: 'up' | 'down') => {
        setConfig(prev => {
            const newSteps = [...(prev.steps || [])];
            if (direction === 'up' && index > 0) {
                [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
            } else if (direction === 'down' && index < newSteps.length - 1) {
                [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
            }
            return { ...prev, steps: newSteps };
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
        <>
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
                        {/* Settings Button */}
                        <button
                            onClick={() => {
                                setInputGithubToken(getGithubToken() || '');
                                setShowSettingsModal(true);
                            }}
                            className="bg-gray-700 text-gray-300 p-2 rounded hover:bg-gray-600 transition-colors"
                            title="설정 (Settings)"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <button onClick={saveToLocal} className="flex items-center px-2 md:px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600">
                            <Save className="w-4 h-4 md:mr-1.5" />
                            <span className="hidden md:inline">임시 저장</span>
                        </button>
                        <button
                            onClick={async () => {
                                if (!confirm('현재 설정을 저장하고 배포하시겠습니까?\n(GitHub에 반영되며 약 1~2분 소요됩니다)')) return;

                                // Fix: Ensure local draft is saved first so it appears in the Dashboard list immediately
                                saveToLocal();

                                setDeployStatus('saving');
                                try {
                                    // 1. Save to Sheet (Backup)
                                    await handleSaveToSheet();

                                    // 2. Deploy to GitHub
                                    const res = await deployConfigsToGithub({ [config.id]: config });

                                    if (res.success) {
                                        setDeployStatus('success');
                                        alert('배포가 성공적으로 시작되었습니다!\n잠시 후 사이트가 업데이트됩니다.');
                                    } else {
                                        setDeployStatus('error');
                                        alert('배포 실패: ' + res.message);
                                    }
                                } catch (e) {
                                    console.error(e);
                                    setDeployStatus('error');
                                    alert('배포 중 오류가 발생했습니다.');
                                } finally {
                                    setTimeout(() => setDeployStatus('idle'), 3000);
                                }
                            }}
                            disabled={deployStatus === 'saving'}
                            className="flex items-center px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-sm md:w-32 justify-center disabled:opacity-50"
                        >
                            {deployStatus === 'saving' ? <><Loader2 className="w-3 h-3 md:mr-1.5 animate-spin" /> <span className="hidden md:inline">배포중...</span></> :
                                deployStatus === 'success' ? <><CheckCircle className="w-3 h-3 md:mr-1.5" /> <span className="hidden md:inline">배포완료!</span></> :
                                    deployStatus === 'error' ? <><AlertCircle className="w-3 h-3 md:mr-1.5" /> <span className="hidden md:inline">실패</span></> :
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
                                ...(config.template === 'dynamic_step' || (config.steps && config.steps.length > 0) ? [{ id: 'steps', label: '스텝 빌더', icon: <ListOrdered className="w-4 h-4 text-blue-600" /> }] : []),

                                { id: 'images', label: '상세', icon: <ImageIcon className="w-4 h-4" /> },
                                { id: 'gallery', label: '갤러리', icon: <Grid className="w-4 h-4" /> },
                                { id: 'board', label: '게시판', icon: <List className="w-4 h-4" /> },
                                { id: 'location', label: '위치', icon: <MapPin className="w-4 h-4" /> },
                                { id: 'form', label: '입력폼', icon: <CheckSquare className="w-4 h-4" /> },
                                { id: 'popup', label: '팝업', icon: <Megaphone className="w-4 h-4" /> },
                                { id: 'chat', label: '문의버튼', icon: <MessageCircle className="w-4 h-4" /> },
                                { id: 'sns', label: 'SNS/외부', icon: <Share2 className="w-4 h-4" /> },
                                { id: 'footer', label: '하단', icon: <Anchor className="w-4 h-4" /> },
                                { id: 'ai_chatbot', label: 'AI챗봇', icon: <Sparkles className="w-4 h-4" /> },
                                { id: 'pixel', label: '픽셀 관리', icon: <Activity className="w-4 h-4 text-green-600" /> },
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
                                    {/* 1. Global Toggle */}
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">팝업(Popup) 관리</h3>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="text-xs font-bold text-gray-700">팝업 사용</span>
                                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                                <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                    checked={config.popupConfig?.usePopup || false}
                                                    onChange={(e) => {
                                                        const newConfig = { ...config.popupConfig, usePopup: e.target.checked };
                                                        // Initialize if missing
                                                        if (!newConfig.items) newConfig.items = [];
                                                        if (!newConfig.pcStyle) newConfig.pcStyle = { width: 400, top: 100, left: 100, isCentered: true };
                                                        if (!newConfig.mobileStyle) newConfig.mobileStyle = { width: 300, top: 50, left: 20, isCentered: true };

                                                        updateNested(['popupConfig'], newConfig);
                                                    }}
                                                />
                                                <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${config.popupConfig?.usePopup ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                            </div>
                                        </label>
                                    </div>

                                    {config.popupConfig?.usePopup && (
                                        <>
                                            {/* 2. Popup Items List */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xs font-bold text-gray-700">팝업 목록 ({config.popupConfig.items.length})</h4>
                                                    <button
                                                        onClick={() => {
                                                            const newItems = [...(config.popupConfig.items || [])];
                                                            newItems.push({
                                                                id: crypto.randomUUID(),
                                                                imageUrl: '',
                                                                openInNewWindow: false,
                                                                startDate: new Date().toISOString().split('T')[0],
                                                                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                                            });
                                                            updateNested(['popupConfig', 'items'], newItems);
                                                        }}
                                                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 font-bold"
                                                    >
                                                        + 팝업 추가
                                                    </button>
                                                </div>

                                                {config.popupConfig.items.length === 0 && (
                                                    <div className="text-center py-8 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-400 text-xs">
                                                        등록된 팝업이 없습니다.
                                                    </div>
                                                )}

                                                {config.popupConfig.items.map((item, idx) => (
                                                    <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm relative group">
                                                        <button
                                                            onClick={() => {
                                                                const newItems = config.popupConfig.items.filter((_, i) => i !== idx);
                                                                updateNested(['popupConfig', 'items'], newItems);
                                                            }}
                                                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>

                                                        <div className="grid grid-cols-[120px_1fr] gap-4">
                                                            {/* Image */}
                                                            <div
                                                                className="h-32 bg-gray-100 rounded border flex items-center justify-center cursor-pointer hover:bg-gray-200 overflow-hidden relative"
                                                                onClick={() => openImagePicker((url) => {
                                                                    const newItems = [...config.popupConfig.items];
                                                                    newItems[idx].imageUrl = url;
                                                                    updateNested(['popupConfig', 'items'], newItems);
                                                                })}
                                                            >
                                                                {item.imageUrl ? (
                                                                    <img src={item.imageUrl} alt="popup" className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <div className="text-center text-gray-400">
                                                                        <Upload className="w-6 h-6 mx-auto mb-1" />
                                                                        <span className="text-[10px]">이미지 선택</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Config */}
                                                            <div className="space-y-2">
                                                                {/* Action Type Selector */}
                                                                <div>
                                                                    <label className="block text-[10px] text-gray-500 mb-1">클릭 동작</label>
                                                                    <div className="flex gap-1 mb-2">
                                                                        {[
                                                                            { id: 'link_url', label: '링크 이동' },
                                                                            { id: 'scroll_to_form', label: '폼 이동' },
                                                                            { id: 'open_rehab_chat', label: '채팅 팝업' }
                                                                        ].map(action => (
                                                                            <button
                                                                                key={action.id}
                                                                                onClick={() => {
                                                                                    const newItems = [...config.popupConfig.items];
                                                                                    newItems[idx].actionType = action.id as any;
                                                                                    updateNested(['popupConfig', 'items'], newItems);
                                                                                }}
                                                                                className={`flex-1 py-1 px-2 text-[10px] rounded border transition-colors ${(!item.actionType && action.id === 'link_url') || item.actionType === action.id
                                                                                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                                                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                                                                    }`}
                                                                            >
                                                                                {action.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Link URL Input (Only for link_url) */}
                                                                {(!item.actionType || item.actionType === 'link_url') && (
                                                                    <div className="space-y-2 p-2 bg-gray-50 rounded border border-gray-100">
                                                                        <div>
                                                                            <label className="block text-[10px] text-gray-500 mb-1">연결 링크 (Link URL)</label>
                                                                            <input
                                                                                type="text"
                                                                                value={item.linkUrl || ''}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...config.popupConfig.items];
                                                                                    newItems[idx].linkUrl = e.target.value;
                                                                                    updateNested(['popupConfig', 'items'], newItems);
                                                                                }}
                                                                                className="w-full border rounded p-1 text-xs bg-white"
                                                                                placeholder="https://..."
                                                                            />
                                                                        </div>
                                                                        <label className="flex items-center gap-1 text-xs text-gray-600">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={item.openInNewWindow}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...config.popupConfig.items];
                                                                                    newItems[idx].openInNewWindow = e.target.checked;
                                                                                    updateNested(['popupConfig', 'items'], newItems);
                                                                                }}
                                                                            />
                                                                            새 창에서 열기
                                                                        </label>
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                                                    <div>
                                                                        <label className="block text-[10px] text-gray-500 mb-1">게시 시작일</label>
                                                                        <input type="date"
                                                                            value={item.startDate || ''}
                                                                            onChange={(e) => {
                                                                                const newItems = [...config.popupConfig.items];
                                                                                newItems[idx].startDate = e.target.value;
                                                                                updateNested(['popupConfig', 'items'], newItems);
                                                                            }}
                                                                            className="w-full border rounded p-1 text-xs"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] text-gray-500 mb-1">게시 종료일</label>
                                                                        <input type="date"
                                                                            value={item.endDate || ''}
                                                                            onChange={(e) => {
                                                                                const newItems = [...config.popupConfig.items];
                                                                                newItems[idx].endDate = e.target.value;
                                                                                updateNested(['popupConfig', 'items'], newItems);
                                                                            }}
                                                                            className="w-full border rounded p-1 text-xs"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 3. Style & Options */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* PC Style */}
                                                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                                    <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1">
                                                        <Monitor className="w-3 h-3" /> PC 화면 설정
                                                    </h4>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs text-gray-600">가로 크기 (px)</label>
                                                            <input type="number"
                                                                value={config.popupConfig.pcStyle?.width || 400}
                                                                onChange={(e) => updateNested(['popupConfig', 'pcStyle', 'width'], parseInt(e.target.value))}
                                                                className="w-20 border rounded p-1 text-xs text-right"
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs text-gray-600">상단 여백 (Top)</label>
                                                            <input type="number"
                                                                value={config.popupConfig.pcStyle?.top || 100}
                                                                onChange={(e) => updateNested(['popupConfig', 'pcStyle', 'top'], parseInt(e.target.value))}
                                                                className="w-20 border rounded p-1 text-xs text-right"
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs text-gray-600">좌측 여백 (Left)</label>
                                                            <input type="number"
                                                                value={config.popupConfig.pcStyle?.left || 100}
                                                                disabled={config.popupConfig.pcStyle?.isCentered}
                                                                onChange={(e) => updateNested(['popupConfig', 'pcStyle', 'left'], parseInt(e.target.value))}
                                                                className="w-20 border rounded p-1 text-xs text-right disabled:bg-gray-100"
                                                            />
                                                        </div>
                                                        <label className="flex items-center gap-2 justify-end pt-1">
                                                            <input type="checkbox"
                                                                checked={config.popupConfig.pcStyle?.isCentered || false}
                                                                onChange={(e) => updateNested(['popupConfig', 'pcStyle', 'isCentered'], e.target.checked)}
                                                            />
                                                            <span className="text-xs font-bold text-blue-600">가로 중앙 정렬</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Mobile Style */}
                                                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                                    <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1">
                                                        <Smartphone className="w-3 h-3" /> 모바일 화면 설정
                                                    </h4>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs text-gray-600">가로 크기 (px)</label>
                                                            <input type="number"
                                                                value={config.popupConfig.mobileStyle?.width || 300}
                                                                onChange={(e) => updateNested(['popupConfig', 'mobileStyle', 'width'], parseInt(e.target.value))}
                                                                className="w-20 border rounded p-1 text-xs text-right"
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs text-gray-600">상단 여백 (Top)</label>
                                                            <input type="number"
                                                                value={config.popupConfig.mobileStyle?.top || 50}
                                                                onChange={(e) => updateNested(['popupConfig', 'mobileStyle', 'top'], parseInt(e.target.value))}
                                                                className="w-20 border rounded p-1 text-xs text-right"
                                                            />
                                                        </div>
                                                        <label className="flex items-center gap-2 justify-end pt-1">
                                                            <input type="checkbox"
                                                                checked={config.popupConfig.mobileStyle?.isCentered || false}
                                                                onChange={(e) => updateNested(['popupConfig', 'mobileStyle', 'isCentered'], e.target.checked)}
                                                            />
                                                            <span className="text-xs font-bold text-blue-600">가로 중앙 정렬 (권장)</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 4. Options */}
                                            <div className="bg-white border rounded p-3 space-y-3">
                                                <h4 className="text-xs font-bold text-gray-700">추가 옵션</h4>
                                                <div className="flex gap-6">
                                                    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                                        <input type="checkbox"
                                                            checked={config.popupConfig.showDoNotOpenToday}
                                                            onChange={(e) => updateNested(['popupConfig', 'showDoNotOpenToday'], e.target.checked)}
                                                            className="rounded text-blue-600"
                                                        />
                                                        '오늘 하루 보지 않기' 버튼 표시
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                                        <input type="checkbox"
                                                            checked={config.popupConfig.disableOverlay}
                                                            onChange={(e) => updateNested(['popupConfig', 'disableOverlay'], e.target.checked)}
                                                            className="rounded text-blue-600"
                                                        />
                                                        배경 어둡게 하기 (Overlay)
                                                    </label>
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

                                            {/* Animation & Custom Shape */}
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-2 text-xs font-bold text-blue-800 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={config.chatConfig?.isCustomShape || false}
                                                            onChange={(e) => updateNested(['chatConfig', 'isCustomShape'], e.target.checked)}
                                                        /> 커스텀 모양(PNG) 모드
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block mb-1">버튼 애니메이션</label>
                                                            <select
                                                                value={config.hero.ctaStyle?.animation || 'none'}
                                                                onChange={(e) => updateNested(['hero', 'ctaStyle', 'animation'], e.target.value)}
                                                                className="w-full border rounded p-1 text-xs"
                                                            >
                                                                <option value="none">없음</option>
                                                                <option value="pulse">맥박 뛰듯 (Pulse)</option>
                                                                <option value="bounce">통통 튀기 (Bounce)</option>
                                                                <option value="shimmer">빛 지나가기 (Shimmer)</option>
                                                                <option value="wiggle">좌우 흔들기 (Wiggle)</option>
                                                                <option value="heartbeat">두근두근 (Heartbeat)</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block mb-1">버튼 배경 이미지</label>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => openImagePicker((url) => updateNested(['hero', 'ctaStyle', 'backgroundImage'], url))}
                                                                    className="flex-1 bg-white border rounded p-1 text-xs hover:bg-gray-50 flex items-center justify-center gap-1"
                                                                >
                                                                    <Upload className="w-3 h-3" /> 업로드
                                                                </button>
                                                                {config.hero.ctaStyle?.backgroundImage && (
                                                                    <button
                                                                        onClick={() => updateNested(['hero', 'ctaStyle', 'backgroundImage'], '')}
                                                                        className="p-1 text-red-500 hover:bg-red-50 rounded border"
                                                                        title="이미지 제거"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {config.hero.ctaStyle?.backgroundImage && (
                                                                <div className="w-full h-8 mt-1 rounded border overflow-hidden bg-gray-100">
                                                                    <img src={config.hero.ctaStyle.backgroundImage} className="w-full h-full object-cover" alt="btn-bg" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-blue-800">애니메이션:</span>
                                                        <select
                                                            value={config.chatConfig?.animation || 'none'}
                                                            onChange={(e) => updateNested(['chatConfig', 'animation'], e.target.value)}
                                                            className="text-xs border rounded p-1 bg-white text-blue-900"
                                                        >
                                                            <option value="none">없음</option>
                                                            <option value="pulse">Pulse (맥박)</option>
                                                            <option value="shimmer">Shimmer (빛 반사)</option>
                                                            <option value="bounce">Bounce (바운스)</option>
                                                            <option value="heartbeat">Heartbeat (빠른 심박)</option>
                                                            <option value="wiggle">Electric Wiggle (진동)</option>
                                                            <option value="hyper-shimmer">Hyper Shimmer (강렬한 빛)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                {config.chatConfig?.isCustomShape && (
                                                    <p className="text-[10px] text-blue-600">
                                                        * '커스텀' 유형과 함께 사용하세요. 배경/테두리 없이 이미지만 표시됩니다. (투명 PNG 권장)
                                                    </p>
                                                )}
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
                                                            onClick={() => openImagePicker((url) => updateNested(['chatConfig', 'iconUrl'], url))}>
                                                            {config.chatConfig?.iconUrl ? (
                                                                <img src={config.chatConfig.iconUrl} alt="icon" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="text-center text-gray-400">
                                                                    {config.chatConfig?.type === 'custom' ? <Upload className="w-5 h-5 mx-auto" /> : <span className="text-[10px]">기본 아이콘</span>}
                                                                    <div className="mb-2">
                                                                        <label className="text-gray-400 text-[10px] block mb-1">버튼 배경 이미지</label>
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => openImagePicker((url) => updateNested(['chatConfig', 'buttonBackgroundImage'], url))}
                                                                                className="flex-1 bg-white border border-gray-600 rounded p-1 text-xs hover:bg-gray-700 flex items-center justify-center gap-1 text-gray-300"
                                                                            >
                                                                                <Upload className="w-3 h-3" /> 업로드
                                                                            </button>
                                                                            {config.chatConfig?.buttonBackgroundImage && (
                                                                                <button
                                                                                    onClick={() => updateNested(['chatConfig', 'buttonBackgroundImage'], '')}
                                                                                    className="px-2 border border-red-800 text-red-400 rounded hover:bg-red-900/20"
                                                                                >
                                                                                    <X className="w-3 h-3" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        {config.chatConfig?.buttonBackgroundImage && (
                                                                            <div className="mt-1 w-full h-8 rounded bg-gray-700 overflow-hidden relative">
                                                                                <img src={config.chatConfig.buttonBackgroundImage} className="w-full h-full object-cover opacity-80" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] text-gray-500 mb-1">말풍선 라벨 텍스트</label>
                                                            <input type="text"
                                                                value={config.chatConfig?.label || ''}
                                                                onChange={(e) => updateNested(['chatConfig', 'label'], e.target.value)}
                                                                className="w-full border rounded p-2 text-xs mb-2"
                                                                placeholder="예: 24시간 상담 가능"
                                                            />
                                                            <label className="flex items-center gap-1 text-[10px] text-gray-600 mb-2">
                                                                <input type="checkbox"
                                                                    checked={config.chatConfig?.showLabel || false}
                                                                    onChange={(e) => updateNested(['chatConfig', 'showLabel'], e.target.checked)}
                                                                /> 라벨 표시
                                                            </label>

                                                            {/* Label Style Config */}
                                                            {config.chatConfig?.showLabel && (
                                                                <div className="bg-gray-50 p-2 rounded border border-gray-200 space-y-2">
                                                                    <h5 className="text-[10px] font-bold text-gray-700">라벨 스타일</h5>
                                                                    <div className="flex gap-2">
                                                                        <div className="flex-1">
                                                                            <label className="block text-[10px] text-gray-500 mb-0.5">배경색</label>
                                                                            <div className="flex items-center gap-1">
                                                                                <input
                                                                                    type="color"
                                                                                    value={config.chatConfig?.labelStyle?.backgroundColor || '#ffffff'}
                                                                                    onChange={(e) => updateNested(['chatConfig', 'labelStyle', 'backgroundColor'], e.target.value)}
                                                                                    className="w-6 h-6 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                                                                />
                                                                                <span className="text-[10px] text-gray-400">{config.chatConfig?.labelStyle?.backgroundColor || '#ffffff'}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <label className="block text-[10px] text-gray-500 mb-0.5">글자색</label>
                                                                            <div className="flex items-center gap-1">
                                                                                <input
                                                                                    type="color"
                                                                                    value={config.chatConfig?.labelStyle?.textColor || '#1f2937'}
                                                                                    onChange={(e) => updateNested(['chatConfig', 'labelStyle', 'textColor'], e.target.value)}
                                                                                    className="w-6 h-6 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                                                                />
                                                                                <span className="text-[10px] text-gray-400">{config.chatConfig?.labelStyle?.textColor || '#1f2937'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <div className="w-16 shrink-0">
                                                                            <label className="block text-[10px] text-gray-500 mb-0.5">크기(px)</label>
                                                                            <input
                                                                                type="number"
                                                                                value={config.chatConfig?.labelStyle?.fontSize || 14}
                                                                                onChange={(e) => updateNested(['chatConfig', 'labelStyle', 'fontSize'], e.target.value)}
                                                                                className="w-full border rounded p-1 text-xs"
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <label className="block text-[10px] text-gray-500 mb-0.5">폰트</label>
                                                                            <FontPicker
                                                                                value={config.chatConfig?.labelStyle?.fontFamily || ''}
                                                                                onChange={(val) => updateNested(['chatConfig', 'labelStyle', 'fontFamily'], val)}
                                                                                globalSettings={globalSettings}
                                                                                onSettingsChange={setGlobalSettings}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
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

                                                    {/* Rehab Chatbot Image Settings */}
                                                    {false && (
                                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                                            <h4 className="text-xs font-bold text-gray-700 mb-2">AI 변제금 챗봇 스타일</h4>
                                                            <div className="mb-2">
                                                                <label className="text-gray-400 text-[10px] block mb-1">버튼 배경 이미지</label>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => openImagePicker((url) => updateNested(['rehabChatConfig', 'buttonBackgroundImage'], url))}
                                                                        className="flex-1 bg-white border border-gray-300 rounded p-1 text-xs hover:bg-gray-50 flex items-center justify-center gap-1 text-gray-600"
                                                                    >
                                                                        <Upload className="w-3 h-3" /> 업로드
                                                                    </button>
                                                                    {config.rehabChatConfig?.buttonBackgroundImage && (
                                                                        <button
                                                                            onClick={() => updateNested(['rehabChatConfig', 'buttonBackgroundImage'], '')}
                                                                            className="px-2 border border-red-200 text-red-400 rounded hover:bg-red-50"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {config.rehabChatConfig?.buttonBackgroundImage && (
                                                                    <div className="mt-1 w-full h-8 rounded bg-gray-100 overflow-hidden relative border">
                                                                        <img src={config.rehabChatConfig.buttonBackgroundImage} className="w-full h-full object-cover" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Interactive Block 프리셋 설정 */}
                                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                                <h5 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                                    <Sparkles className="w-3 h-3 text-purple-500" />
                                                                    Interactive Block (폼-혼합형)
                                                                </h5>

                                                                <label className="flex items-center gap-2 text-xs text-gray-700 mb-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={config.rehabChatConfig?.enableFormBlocks || false}
                                                                        onChange={(e) => updateNested(['rehabChatConfig', 'enableFormBlocks'], e.target.checked)}
                                                                        className="rounded text-purple-600"
                                                                    />
                                                                    Interactive Block 활성화
                                                                </label>

                                                                {config.rehabChatConfig?.enableFormBlocks && (
                                                                    <div className="space-y-3">
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {[
                                                                                { value: 'none', label: '없음', desc: '비활성화' },
                                                                                { value: 'basic', label: '기본', desc: '연락처 폼만' },
                                                                                { value: 'advanced', label: '고급', desc: '모든 블록' },
                                                                                { value: 'custom', label: '사용자 정의', desc: '직접 선택' }
                                                                            ].map(preset => (
                                                                                <button
                                                                                    key={preset.value}
                                                                                    onClick={() => updateNested(['rehabChatConfig', 'interactiveBlockPreset'], preset.value)}
                                                                                    className={`p-2 rounded border text-left text-xs ${config.rehabChatConfig?.interactiveBlockPreset === preset.value
                                                                                        ? 'border-purple-500 bg-purple-50'
                                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                                        }`}
                                                                                >
                                                                                    <div className="font-bold text-gray-800">{preset.label}</div>
                                                                                    <div className="text-[10px] text-gray-500">{preset.desc}</div>
                                                                                </button>
                                                                            ))}
                                                                        </div>

                                                                        {config.rehabChatConfig?.interactiveBlockPreset === 'custom' && (
                                                                            <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                                                                                {[
                                                                                    { key: 'useContactForm', label: '연락처 폼 블록' },
                                                                                    { key: 'useMultiSelect', label: '다중 선택 블록' },
                                                                                    { key: 'useDatePicker', label: '날짜 선택기' }
                                                                                ].map(option => (
                                                                                    <label key={option.key} className="flex items-center gap-2 text-xs">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={config.rehabChatConfig?.interactiveBlockConfig?.[option.key as 'useContactForm' | 'useMultiSelect' | 'useDatePicker'] || false}
                                                                                            onChange={(e) => updateNested(['rehabChatConfig', 'interactiveBlockConfig', option.key], e.target.checked)}
                                                                                            className="rounded text-purple-600"
                                                                                        />
                                                                                        {option.label}
                                                                                    </label>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
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

                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 mb-4">기본 설정</h3>
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
                                                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> 파비콘 (Favicon)</span>
                                                    <button onClick={() => openImagePicker((url) => updateNested(['favicon'], url))} className="text-blue-600 hover:underline flex items-center">
                                                        <Upload className="w-3 h-3 mr-1" /> 업로드
                                                    </button>
                                                </label>
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
                                                    <button onClick={() => openImagePicker((url) => updateNested(['ogImage'], url))} className="text-blue-600 hover:underline flex items-center">
                                                        <Upload className="w-3 h-3 mr-1" /> 업로드
                                                    </button>
                                                </label>
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

                                    {/* Template Selection */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                                            <Layout className="w-4 h-4" /> 템플릿 선택
                                        </h3>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 block">페이지 템플릿</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateNested(['template'], 'standard')}
                                                    className={`p-4 border-2 rounded-lg text-left transition-all min-h-[80px] flex flex-col justify-center ${(config.template || 'standard') === 'standard'
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="text-base font-bold text-gray-900">표준형 (Standard)</div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        일반 랜딩페이지 (스크롤형)
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        updateNested(['template'], 'dynamic_step');
                                                        // Initialize steps if empty
                                                        if (!config.steps || config.steps.length === 0) {
                                                            updateNested(['steps'], []);
                                                        }
                                                    }}
                                                    className={`p-4 border-2 rounded-lg text-left transition-all min-h-[80px] flex flex-col justify-center ${config.template === 'dynamic_step'
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="text-base font-bold text-gray-900">스텝형 (Dynamic Step)</div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        단계별 입력 폼 (페이지 전환)
                                                    </div>
                                                </button>

                                                {/* NEW: Chatbot Standalone Mode */}
                                                <button
                                                    type="button"
                                                    onClick={() => updateNested(['template'], 'chatbot')}
                                                    className={`p-4 border-2 rounded-lg text-left transition-all min-h-[80px] flex flex-col justify-center ${config.template === 'chatbot'
                                                        ? 'border-purple-600 bg-purple-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="text-base font-bold text-gray-900">AI 챗봇 전용</div>
                                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">NEW</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        랜딩페이지 없이 바로 챗봇 실행
                                                    </div>
                                                </button>
                                            </div>
                                            {config.template === 'dynamic_step' && (
                                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                                    💡 스텝 빌더 탭에서 단계를 구성할 수 있습니다.
                                                </div>
                                            )}
                                        </div>
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
                                                    <button onClick={() => openImagePicker((url) => updateNested(['hero', 'backgroundImage'], url))} className="text-blue-600 hover:underline flex items-center">
                                                        <Upload className="w-3 h-3 mr-1" /> 업로드
                                                    </button>
                                                </label>
                                                <input
                                                    type="text" value={config.hero.backgroundImage}
                                                    onChange={(e) => updateNested(['hero', 'backgroundImage'], e.target.value)}
                                                    className="w-full border rounded p-2 text-sm mb-2" placeholder="http://..."
                                                />
                                                {config.hero.backgroundImage && (
                                                    <img src={config.hero.backgroundImage} alt="Preview" className="w-full h-24 object-cover rounded border" />
                                                )}
                                            </div>
                                            <div className="mb-4 pt-2 border-t mt-2">
                                                <label className="text-xs font-bold text-gray-500 mb-1 flex justify-between">
                                                    배경 밝기 조절 (오버레이 투명도)
                                                    <span className="text-blue-600">{config.hero.overlayOpacity ?? 20}%</span>
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0" max="90" step="10"
                                                    value={config.hero.overlayOpacity ?? 20}
                                                    onChange={(e) => updateNested(['hero', 'overlayOpacity'], Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                                    <span>지우기 (0%)</span>
                                                    <span>어둡게 (90%)</span>
                                                </div>
                                            </div>
                                            <div className="mb-4 pt-2 border-t mt-2">
                                                <label className="text-xs font-bold text-gray-500 mb-1 flex justify-between">
                                                    텍스트 상하 위치 조절 (Vertical Align)
                                                    <span className="text-blue-600">{config.hero.verticalAlign ?? 0}</span>
                                                </label>
                                                <input
                                                    type="range"
                                                    min="-2" max="2" step="1"
                                                    value={config.hero.verticalAlign ?? 0}
                                                    onChange={(e) => updateNested(['hero', 'verticalAlign'], Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                                    <span>위로 (-2)</span>
                                                    <span>중앙 (0)</span>
                                                    <span>아래로 (+2)</span>
                                                </div>
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
                                                <div className="mb-3">
                                                    <label className="text-[10px] text-gray-500 block mb-1">등장 효과 (Animation)</label>
                                                    <select
                                                        value={config.hero.headlineEffect || 'none'}
                                                        onChange={(e) => updateNested(['hero', 'headlineEffect'], e.target.value)}
                                                        className="w-full border rounded p-2 text-sm bg-white mb-2"
                                                    >
                                                        <option value="none">효과 없음</option>
                                                        <option value="typewriter">타자기 (Typewriter)</option>
                                                        <option value="fadeIn">페이드 인 (Fade In)</option>
                                                        <option value="slideUp">위로 나타나기 (Slide Up)</option>
                                                        <option value="slideDown">아래로 나타나기 (Slide Down)</option>
                                                        <option value="blur">블러 효과 (Blur)</option>
                                                        <option value="bounce">바운스 (Bounce)</option>
                                                        <option value="scale">확대 효과 (Scale)</option>
                                                        <option value="glitch">글리치 (Glitch)</option>
                                                        <option value="wave">웨이브 (Wave)</option>
                                                    </select>

                                                    {/* Animation Controls - Only show if effect is selected */}
                                                    {config.hero.headlineEffect && config.hero.headlineEffect !== 'none' && (
                                                        <div className="bg-gray-50 p-2 rounded border space-y-2">
                                                            <div>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <label className="text-[10px] text-gray-500">지속 시간 (Duration)</label>
                                                                    <span className="text-[10px] font-mono text-blue-600">
                                                                        {((config.hero.headlineAnimationDuration || 1000) / 1000).toFixed(1)}s
                                                                    </span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    min="500"
                                                                    max="3000"
                                                                    step="100"
                                                                    value={config.hero.headlineAnimationDuration || 1000}
                                                                    onChange={(e) => updateNested(['hero', 'headlineAnimationDuration'], parseInt(e.target.value))}
                                                                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                                />
                                                            </div>
                                                            <div className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    id="anim-loop"
                                                                    checked={config.hero.headlineAnimationLoop || false}
                                                                    onChange={(e) => updateNested(['hero', 'headlineAnimationLoop'], e.target.checked)}
                                                                    className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                                />
                                                                <label htmlFor="anim-loop" className="ml-2 text-[10px] text-gray-600 cursor-pointer">
                                                                    무한 반복 (Infinite Loop)
                                                                </label>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
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
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">신청하기(CTA) 버튼설정</label>
                                                <div className="bg-gray-50 p-3 rounded-lg border mb-3 space-y-3">
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 block mb-1">버튼 문구</label>
                                                        <input
                                                            type="text"
                                                            value={config.hero.ctaText}
                                                            onChange={(e) => updateNested(['hero', 'ctaText'], e.target.value)}
                                                            className="w-full border rounded p-2 text-sm"
                                                            placeholder="예: 무료 상담 신청하기"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 block mb-1">버튼 동작</label>
                                                        <select
                                                            value={config.hero.ctaActionType || 'scroll_to_form'}
                                                            onChange={(e) => updateNested(['hero', 'ctaActionType'], e.target.value)}
                                                            className="w-full border rounded p-2 text-sm"
                                                        >
                                                            <option value="scroll_to_form">폼으로 스크롤 이동 (기본)</option>
                                                            <option value="link_url">URL 링크 이동</option>
                                                            <option value="open_rehab_chat">AI 챗봇 열기</option>
                                                        </select>
                                                    </div>
                                                    {config.hero.ctaActionType === 'link_url' && (
                                                        <div>
                                                            <input
                                                                type="text"
                                                                value={config.hero.ctaLinkUrl || ''}
                                                                onChange={(e) => updateNested(['hero', 'ctaLinkUrl'], e.target.value)}
                                                                className="w-full border rounded p-2 text-sm"
                                                                placeholder="https://example.com"
                                                            />
                                                            <p className="text-[10px] text-gray-400 mt-1">* http:// 또는 https:// 를 포함해 입력하세요.</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <ButtonStyleEditor label="CTA 버튼" stylePath={['hero', 'ctaStyle']} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'images' && (
                                <div className="space-y-6 animate-fade-in">

                                    {/* 1. Floating Banners */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <Flag className="w-4 h-4 text-orange-500" /> 상단/하단 고정 배너
                                            </h3>
                                            <button
                                                onClick={() => {
                                                    const newBanner = {
                                                        id: crypto.randomUUID(),
                                                        isShow: true,
                                                        text: '새로운 배너입니다.',
                                                        backgroundColor: '#1f2937',
                                                        textColor: '#ffffff',
                                                        position: 'top',
                                                        size: 'md'
                                                    } as FloatingBanner;
                                                    updateNested(['banners'], [...config.banners, newBanner]);
                                                }}
                                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-500 flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> 배너 추가
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {config.banners.map((banner, index) => (
                                                <div key={banner.id} className="border rounded-lg p-3 bg-gray-50 relative group">
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                const newBanners = config.banners.filter((_, i) => i !== index);
                                                                updateNested(['banners'], newBanners);
                                                            }}
                                                            className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <div className="flex gap-4 items-start">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex gap-2">
                                                                {!banner.isCustomShape ? (
                                                                    <>
                                                                        <input
                                                                            type="text"
                                                                            value={banner.text}
                                                                            onChange={(e) => {
                                                                                const newBanners = [...config.banners];
                                                                                newBanners[index].text = e.target.value;
                                                                                updateNested(['banners'], newBanners);
                                                                            }}
                                                                            className="flex-1 border rounded p-1.5 text-xs font-medium"
                                                                            placeholder="배너 문구 입력"
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <div className="flex-1 flex gap-1">
                                                                        <input
                                                                            type="text"
                                                                            value={banner.imageUrl || ''}
                                                                            onChange={(e) => {
                                                                                const newBanners = [...config.banners];
                                                                                newBanners[index].imageUrl = e.target.value;
                                                                                updateNested(['banners'], newBanners);
                                                                            }}
                                                                            className="flex-1 border rounded p-1.5 text-xs text-gray-500 bg-gray-50"
                                                                            placeholder="이미지 URL"
                                                                        />
                                                                        <button
                                                                            onClick={() => openImagePicker((url) => {
                                                                                const newBanners = [...config.banners];
                                                                                newBanners[index].imageUrl = url;
                                                                                updateNested(['banners'], newBanners);
                                                                            })}
                                                                            className="px-2 border rounded hover:bg-gray-50"
                                                                        >
                                                                            <Upload className="w-3 h-3 text-gray-500" />
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                <select
                                                                    value={banner.position || 'bottom'}
                                                                    onChange={(e) => {
                                                                        const newBanners = [...config.banners];
                                                                        newBanners[index].position = e.target.value as any;
                                                                        updateNested(['banners'], newBanners);
                                                                    }}
                                                                    className="border rounded p-1.5 text-xs w-20"
                                                                >
                                                                    <option value="top">상단</option>
                                                                    <option value="bottom">하단</option>
                                                                </select>
                                                                {!banner.isCustomShape && (
                                                                    <select
                                                                        value={banner.size || 'md'}
                                                                        onChange={(e) => {
                                                                            const newBanners = [...config.banners];
                                                                            newBanners[index].size = e.target.value as any;
                                                                            updateNested(['banners'], newBanners);
                                                                        }}
                                                                        className="border rounded p-1.5 text-xs w-20"
                                                                    >
                                                                        <option value="xs">매우 작게</option>
                                                                        <option value="sm">작게</option>
                                                                        <option value="md">보통</option>
                                                                        <option value="lg">크게</option>
                                                                        <option value="xl">매우 크게</option>
                                                                    </select>
                                                                )}
                                                            </div>

                                                            {/* Font Size Override (Optional) */}
                                                            {!banner.isCustomShape && (
                                                                <div className="mt-2">
                                                                    <label className="text-[10px] text-gray-500 block mb-1">
                                                                        커스텀 폰트 크기 (선택사항)
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={banner.fontSize || ''}
                                                                        onChange={(e) => {
                                                                            const newBanners = [...config.banners];
                                                                            newBanners[index].fontSize = e.target.value;
                                                                            updateNested(['banners'], newBanners);
                                                                        }}
                                                                        className="w-full border rounded p-1.5 text-xs"
                                                                        placeholder="예: 16px, 1.2rem (비워두면 크기 프리셋 사용)"
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Font Family Selector */}
                                                            {!banner.isCustomShape && (
                                                                <div className="mt-2">
                                                                    <FontPicker
                                                                        label="배너 폰트"
                                                                        value={banner.fontFamily || config.theme.fontConfig?.primaryFont || 'Noto Sans KR'}
                                                                        globalSettings={globalSettings}
                                                                        onSettingsChange={setGlobalSettings}
                                                                        onChange={(fontFamily) => {
                                                                            const newBanners = [...config.banners];
                                                                            newBanners[index].fontFamily = fontFamily;
                                                                            updateNested(['banners'], newBanners);
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}

                                                            <div className="flex justify-end mb-1">
                                                                <label className="text-[10px] flex items-center gap-1 text-gray-500 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={banner.isCustomShape || false}
                                                                        onChange={(e) => {
                                                                            const newBanners = [...config.banners];
                                                                            newBanners[index].isCustomShape = e.target.checked;
                                                                            updateNested(['banners'], newBanners);
                                                                        }}
                                                                    />
                                                                    이미지 배너 모드
                                                                </label>
                                                            </div>
                                                            <div className="flex gap-2 items-center">
                                                                <input
                                                                    type="color"
                                                                    value={banner.backgroundColor}
                                                                    onChange={(e) => {
                                                                        const newBanners = [...config.banners];
                                                                        newBanners[index].backgroundColor = e.target.value;
                                                                        updateNested(['banners'], newBanners);
                                                                    }}
                                                                    className="w-6 h-6 border rounded cursor-pointer p-0"
                                                                />
                                                                <input
                                                                    type="color"
                                                                    value={banner.textColor}
                                                                    onChange={(e) => {
                                                                        const newBanners = [...config.banners];
                                                                        newBanners[index].textColor = e.target.value;
                                                                        updateNested(['banners'], newBanners);
                                                                    }}
                                                                    className="w-6 h-6 border rounded cursor-pointer p-0"
                                                                />
                                                            </div>
                                                            {/* New: Banner Action Settings */}
                                                            <div className="flex flex-col gap-2 mt-2 border-t pt-2">
                                                                <label className="text-[10px] text-gray-500 font-bold">배너 클릭 동작</label>
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => {
                                                                            const newBanners = [...config.banners];
                                                                            newBanners[index].actionType = 'scroll_to_form';
                                                                            updateNested(['banners'], newBanners);
                                                                        }}
                                                                        className={`flex-1 py-1 px-2 text-[10px] rounded border ${(!banner.actionType || banner.actionType === 'scroll_to_form') ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500'}`}
                                                                    >
                                                                        폼 이동
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const newBanners = [...config.banners];
                                                                            newBanners[index].actionType = 'open_rehab_chat';
                                                                            updateNested(['banners'], newBanners);
                                                                        }}
                                                                        className={`flex-1 py-1 px-2 text-[10px] rounded border ${(banner.actionType === 'open_rehab_chat') ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500'}`}
                                                                    >
                                                                        채팅 팝업
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const newBanners = [...config.banners];
                                                                            newBanners[index].actionType = 'link_url';
                                                                            updateNested(['banners'], newBanners);
                                                                        }}
                                                                        className={`flex-1 py-1 px-2 text-[10px] rounded border ${(banner.actionType === 'link_url') ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500'}`}
                                                                    >
                                                                        링크 이동
                                                                    </button>
                                                                </div>
                                                                {banner.actionType === 'link_url' && (
                                                                    <input
                                                                        type="text"
                                                                        value={banner.linkUrl || ''}
                                                                        onChange={(e) => {
                                                                            const newBanners = [...config.banners];
                                                                            newBanners[index].linkUrl = e.target.value;
                                                                            updateNested(['banners'], newBanners);
                                                                        }}
                                                                        className="flex-1 border rounded p-1.5 text-xs text-gray-600"
                                                                        placeholder="링크 URL (예: https://...)"
                                                                    />
                                                                )}
                                                            </div>

                                                            <div className="flex gap-2 items-center text-[10px] text-gray-500 mt-2">
                                                                <label className="flex items-center gap-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={banner.isSliding || false}
                                                                        onChange={(e) => {
                                                                            const newBanners = [...config.banners];
                                                                            newBanners[index].isSliding = e.target.checked;
                                                                            updateNested(['banners'], newBanners);
                                                                        }}
                                                                    />
                                                                    흐르는 효과 (Marquee)
                                                                </label>
                                                                {banner.isSliding && (
                                                                    <label className="flex items-center gap-1 ml-2">
                                                                        속도:
                                                                        <input
                                                                            type="number"
                                                                            value={banner.slideSpeed || 15}
                                                                            onChange={(e) => {
                                                                                const newBanners = [...config.banners];
                                                                                newBanners[index].slideSpeed = parseInt(e.target.value);
                                                                                updateNested(['banners'], newBanners);
                                                                            }}
                                                                            className="w-10 border rounded px-1"
                                                                        />
                                                                        초
                                                                    </label>
                                                                )}
                                                            </div>

                                                            {/* NEW: Banner Animation Selector */}
                                                            <div className="mt-2">
                                                                <label className="text-[10px] text-gray-500 block mb-1">배너 애니메이션 효과</label>
                                                                <select
                                                                    value={banner.bannerAnimation || 'none'}
                                                                    onChange={(e) => {
                                                                        const newBanners = [...config.banners];
                                                                        newBanners[index].bannerAnimation = e.target.value as any;
                                                                        updateNested(['banners'], newBanners);
                                                                    }}
                                                                    className="w-full border rounded p-1.5 text-xs"
                                                                >
                                                                    <option value="none">없음</option>
                                                                    <option value="pulse">펄스 (확대/축소)</option>
                                                                    <option value="glow">글로우 (빛남)</option>
                                                                    <option value="bounce">바운스 (위아래)</option>
                                                                    <option value="shake">흔들림 (좌우)</option>
                                                                    <option value="blink">깜빡임</option>
                                                                    <option value="rubberBand">탄력 (고무줄)</option>
                                                                    <option value="wobble">와블 (흔들흔들)</option>
                                                                    <option value="shimmer">쉬머 (빛 반사)</option>
                                                                    <option value="swing">스윙 (매달림)</option>
                                                                    <option value="tada">짜잔 (강조)</option>
                                                                </select>
                                                            </div>

                                                            {/* NEW: Background Image Mode */}
                                                            {!banner.isCustomShape && (
                                                                <div className="mt-2 border-t pt-2">
                                                                    <label className="text-[10px] text-gray-500 block mb-1">배경 이미지 모드</label>
                                                                    <div className="flex gap-1">
                                                                        <input
                                                                            type="text"
                                                                            value={banner.backgroundImageUrl || ''}
                                                                            onChange={(e) => {
                                                                                const newBanners = [...config.banners];
                                                                                newBanners[index].backgroundImageUrl = e.target.value;
                                                                                updateNested(['banners'], newBanners);
                                                                            }}
                                                                            className="flex-1 border rounded p-1.5 text-xs text-gray-500"
                                                                            placeholder="배경 이미지 URL"
                                                                        />
                                                                        <button
                                                                            onClick={() => openImagePicker((url) => {
                                                                                const newBanners = [...config.banners];
                                                                                newBanners[index].backgroundImageUrl = url;
                                                                                updateNested(['banners'], newBanners);
                                                                            })}
                                                                            className="px-2 border rounded hover:bg-gray-50"
                                                                        >
                                                                            <Upload className="w-3 h-3 text-gray-500" />
                                                                        </button>
                                                                    </div>
                                                                    {banner.backgroundImageUrl && (
                                                                        <div className="mt-2">
                                                                            <label className="text-[10px] text-gray-500 flex items-center gap-2">
                                                                                투명도: {banner.backgroundImageOpacity ?? 100}%
                                                                            </label>
                                                                            <input
                                                                                type="range"
                                                                                min="0"
                                                                                max="100"
                                                                                value={banner.backgroundImageOpacity ?? 100}
                                                                                onChange={(e) => {
                                                                                    const newBanners = [...config.banners];
                                                                                    newBanners[index].backgroundImageOpacity = parseInt(e.target.value);
                                                                                    updateNested(['banners'], newBanners);
                                                                                }}
                                                                                className="w-full"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {config.banners.length === 0 && (
                                                <div className="text-center py-6 text-gray-400 text-xs border border-dashed rounded bg-gray-50">
                                                    등록된 배너가 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Detail Content Blocks */}
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 mt-8">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">상세 콘텐츠 관리</h3>
                                        <div className="flex gap-2">
                                            {/* Add Image using Integrated Manager */}
                                            <button
                                                onClick={() => openImagePicker((url) => {
                                                    const newItem: DetailContent = { id: crypto.randomUUID(), type: 'image', content: url, width: '100%' };
                                                    updateNested(['detailContent'], [...config.detailContent, newItem]);
                                                })}
                                                className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-all"
                                            >
                                                <ImageIcon className="w-3 h-3 text-blue-500" /> 이미지 추가
                                            </button>

                                            <button
                                                onClick={() => {
                                                    // Add Banner Block with Urgency support
                                                    const newItem: DetailContent = {
                                                        id: crypto.randomUUID(), type: 'banner', content: '이곳에 내용을 입력하세요.',
                                                        bannerStyle: { height: 'auto', backgroundColor: '#f3f4f6', textColor: '#000000', fontSize: '1.25rem', fontWeight: '400', textAlign: 'center', padding: '3rem', overlayOpacity: 0.5 },
                                                        urgencyConfig: { showCountdown: false, showTicker: false }
                                                    };
                                                    updateNested(['detailContent'], [...config.detailContent, newItem]);
                                                }}
                                                className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-all"
                                            >
                                                <Megaphone className="w-3 h-3 text-red-500" /> 텍스트/배너
                                            </button>

                                            <button
                                                onClick={() => {
                                                    const newItem: DetailContent = { id: crypto.randomUUID(), type: 'youtube', content: 'https://www.youtube.com/embed/...', width: '100%' };
                                                    updateNested(['detailContent'], [...config.detailContent, newItem]);
                                                }}
                                                className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-all"
                                            >
                                                <Youtube className="w-3 h-3 text-red-600" /> 유튜브
                                            </button>

                                            <button
                                                onClick={() => {
                                                    const newItem: DetailContent = { id: crypto.randomUUID(), type: 'map', content: '서울 강남구 테헤란로 123', width: '100%' };
                                                    updateNested(['detailContent'], [...config.detailContent, newItem]);
                                                }}
                                                className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-all"
                                            >
                                                <MapPin className="w-3 h-3 text-green-600" /> 지도
                                            </button>

                                            <button
                                                onClick={() => {
                                                    const newItem: DetailContent = { id: crypto.randomUUID(), type: 'features', content: '특징 블록', width: '100%' };
                                                    updateNested(['detailContent'], [...config.detailContent, newItem]);
                                                }}
                                                className="text-xs bg-white border border-purple-300 hover:bg-purple-50 text-purple-700 px-3 py-1.5 rounded flex items-center gap-1 transition-all"
                                            >
                                                <Sparkles className="w-3 h-3 text-purple-600" /> 특징 블록
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content List */}
                                    <div className="space-y-4">
                                        {config.detailContent.map((item, index) => (
                                            <div key={item.id} className="border rounded-lg bg-white shadow-sm overflow-hidden group hover:border-blue-400 transition-all">
                                                {/* Header / Toolbar */}
                                                <div className="bg-gray-50 border-b px-3 py-2 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                                        {item.type === 'image' && <ImageIcon className="w-3 h-3" />}
                                                        {item.type === 'banner' && <Megaphone className="w-3 h-3" />}
                                                        {item.type === 'youtube' && <Youtube className="w-3 h-3" />}
                                                        {item.type === 'map' && <MapPin className="w-3 h-3" />}
                                                        Block #{index + 1}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                if (index === 0) return;
                                                                const newContent = [...config.detailContent];
                                                                [newContent[index - 1], newContent[index]] = [newContent[index], newContent[index - 1]];
                                                                updateNested(['detailContent'], newContent);
                                                            }}
                                                            className="p-1 hover:bg-white rounded text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                                            disabled={index === 0}
                                                        >
                                                            <ArrowUp className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (index === config.detailContent.length - 1) return;
                                                                const newContent = [...config.detailContent];
                                                                [newContent[index + 1], newContent[index]] = [newContent[index], newContent[index + 1]];
                                                                updateNested(['detailContent'], newContent);
                                                            }}
                                                            className="p-1 hover:bg-white rounded text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                                            disabled={index === config.detailContent.length - 1}
                                                        >
                                                            <ArrowDown className="w-3 h-3" />
                                                        </button>
                                                        <div className="h-3 w-px bg-gray-300 mx-1"></div>
                                                        <button
                                                            onClick={() => {
                                                                if (!window.confirm('이 블록을 삭제하시겠습니까?')) return;
                                                                const newContent = config.detailContent.filter((_, i) => i !== index);
                                                                updateNested(['detailContent'], newContent);
                                                            }}
                                                            className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Body Editor */}
                                                <div className="p-4">
                                                    {/* IMAGE EDITOR */}
                                                    {item.type === 'image' && (
                                                        <div className="space-y-3">
                                                            <div className="flex gap-2">
                                                                <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0 overflow-hidden border">
                                                                    <img src={item.content} alt="Preview" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1 space-y-2">
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={item.content}
                                                                            onChange={(e) => {
                                                                                const newContent = [...config.detailContent];
                                                                                newContent[index].content = e.target.value;
                                                                                updateNested(['detailContent'], newContent);
                                                                            }}
                                                                            className="flex-1 border rounded p-1.5 text-xs font-mono text-gray-600 bg-gray-50"
                                                                        />
                                                                        {/* Upload Button connected to ImageManager */}
                                                                        <button
                                                                            onClick={() => openImagePicker((url) => {
                                                                                const newContent = [...config.detailContent];
                                                                                newContent[index].content = url;
                                                                                updateNested(['detailContent'], newContent);
                                                                            })}
                                                                            className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                                                                        >
                                                                            <Upload className="w-3 h-3" /> 변경
                                                                        </button>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] text-gray-400 block mb-1">너비 (Width)</label>
                                                                        <select
                                                                            value={item.width || '100%'}
                                                                            onChange={(e) => {
                                                                                const newContent = [...config.detailContent];
                                                                                newContent[index].width = e.target.value;
                                                                                updateNested(['detailContent'], newContent);
                                                                            }}
                                                                            className="w-full border rounded p-1.5 text-xs"
                                                                        >
                                                                            <option value="100%">100% (Full Width)</option>
                                                                            <option value="75%">75%</option>
                                                                            <option value="50%">50%</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* BANNER / TEXT & URGENCY EDITOR */}
                                                    {item.type === 'banner' && item.bannerStyle && (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="col-span-2">
                                                                    <label className="text-xs font-bold text-gray-500 block mb-1">텍스트 내용</label>
                                                                    <textarea
                                                                        value={item.content}
                                                                        onChange={(e) => {
                                                                            const newContent = [...config.detailContent];
                                                                            newContent[index].content = e.target.value;
                                                                            updateNested(['detailContent'], newContent);
                                                                        }}
                                                                    />
                                                                    <div className="flex gap-2 mt-1">
                                                                        <select
                                                                            value={item.bannerStyle.textAlign || 'center'}
                                                                            onChange={(e) => {
                                                                                const newContent = [...config.detailContent];
                                                                                if (newContent[index].bannerStyle) newContent[index].bannerStyle!.textAlign = e.target.value as any;
                                                                                updateNested(['detailContent'], newContent);
                                                                            }}
                                                                            className="border rounded p-1 text-[10px] w-20"
                                                                        >
                                                                            <option value="left">정렬: 좌측</option>
                                                                            <option value="center">정렬: 중앙</option>
                                                                            <option value="right">정렬: 우측</option>
                                                                        </select>
                                                                        <select
                                                                            value={item.bannerStyle.padding || '3rem'}
                                                                            onChange={(e) => {
                                                                                const newContent = [...config.detailContent];
                                                                                if (newContent[index].bannerStyle) newContent[index].bannerStyle!.padding = e.target.value;
                                                                                updateNested(['detailContent'], newContent);
                                                                            }}
                                                                            className="border rounded p-1 text-[10px] w-20"
                                                                        >
                                                                            <option value="1rem">여백: 좁게</option>
                                                                            <option value="3rem">여백: 보통</option>
                                                                            <option value="5rem">여백: 넓게</option>
                                                                            <option value="0">여백: 없음</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">배경색</label>
                                                                    <div className="flex gap-1">
                                                                        <input type="color" value={item.bannerStyle.backgroundColor} onChange={(e) => {
                                                                            const newContent = [...config.detailContent];
                                                                            if (newContent[index].bannerStyle) newContent[index].bannerStyle!.backgroundColor = e.target.value;
                                                                            updateNested(['detailContent'], newContent);
                                                                        }} className="w-6 h-6 border rounded cursor-pointer p-0" />
                                                                        <input type="text" value={item.bannerStyle.backgroundColor} onChange={(e) => {
                                                                            const newContent = [...config.detailContent];
                                                                            if (newContent[index].bannerStyle) newContent[index].bannerStyle!.backgroundColor = e.target.value;
                                                                            updateNested(['detailContent'], newContent);
                                                                        }} className="flex-1 border rounded p-1 text-xs" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">글자색</label>
                                                                    <div className="flex gap-1">
                                                                        <input type="color" value={item.bannerStyle.textColor} onChange={(e) => {
                                                                            const newContent = [...config.detailContent];
                                                                            if (newContent[index].bannerStyle) newContent[index].bannerStyle!.textColor = e.target.value;
                                                                            updateNested(['detailContent'], newContent);
                                                                        }} className="w-6 h-6 border rounded cursor-pointer p-0" />
                                                                        <input type="text" value={item.bannerStyle.textColor} onChange={(e) => {
                                                                            const newContent = [...config.detailContent];
                                                                            if (newContent[index].bannerStyle) newContent[index].bannerStyle!.textColor = e.target.value;
                                                                            updateNested(['detailContent'], newContent);
                                                                        }} className="flex-1 border rounded p-1 text-xs" />
                                                                    </div>
                                                                </div>
                                                                {/* Background Image for Banner */}
                                                                <div className="col-span-2">
                                                                    <label className="text-[10px] text-gray-500 block mb-1 flex justify-between">
                                                                        <span>배경 이미지 (Optional)</span>
                                                                        <button
                                                                            onClick={() => openImagePicker((url) => {
                                                                                const newContent = [...config.detailContent];
                                                                                if (newContent[index].bannerStyle) newContent[index].bannerStyle!.backgroundImage = url;
                                                                                updateNested(['detailContent'], newContent);
                                                                            })}
                                                                            className="text-blue-600 hover:underline flex items-center text-[10px]"
                                                                        >
                                                                            <Upload className="w-3 h-3 mr-1" /> 업로드
                                                                        </button>
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={item.bannerStyle.backgroundImage || ''}
                                                                        onChange={(e) => {
                                                                            const newContent = [...config.detailContent];
                                                                            if (newContent[index].bannerStyle) newContent[index].bannerStyle!.backgroundImage = e.target.value;
                                                                            updateNested(['detailContent'], newContent);
                                                                        }}
                                                                        className="w-full border rounded p-1 text-xs mb-1"
                                                                        placeholder="이미지 URL"
                                                                    />
                                                                    {item.bannerStyle.backgroundImage && (
                                                                        <img src={item.bannerStyle.backgroundImage} className="h-10 w-full object-cover rounded border" />
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Urgency Features */}
                                                            {/* Urgency Features */}
                                                            <div className="bg-orange-50 p-3 rounded border border-orange-100 mt-2">
                                                                <h4 className="text-xs font-bold text-orange-800 mb-2 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> 긴급성 유도 기능 (Urgency)
                                                                </h4>
                                                                <div className="flex gap-4 mb-3">
                                                                    <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={item.urgencyConfig?.showCountdown || false}
                                                                            onChange={(e) => {
                                                                                const newContent = [...config.detailContent];
                                                                                if (!newContent[index].urgencyConfig) newContent[index].urgencyConfig = { showCountdown: false, showTicker: false };
                                                                                newContent[index].urgencyConfig!.showCountdown = e.target.checked;
                                                                                updateNested(['detailContent'], newContent);
                                                                            }}
                                                                        />
                                                                        타이머 표시
                                                                    </label>
                                                                    <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={item.urgencyConfig?.showTicker || false}
                                                                            onChange={(e) => {
                                                                                const newContent = [...config.detailContent];
                                                                                if (!newContent[index].urgencyConfig) newContent[index].urgencyConfig = { showCountdown: false, showTicker: false };
                                                                                newContent[index].urgencyConfig!.showTicker = e.target.checked;
                                                                                updateNested(['detailContent'], newContent);
                                                                            }}
                                                                        />
                                                                        실시간 신청 현황(티커) 표시
                                                                    </label>
                                                                </div>

                                                                {/* Timer Config */}
                                                                {item.urgencyConfig?.showCountdown && (
                                                                    <div className="space-y-2 mb-3 border-t border-orange-200 pt-2">
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <div>
                                                                                <label className="text-[10px] text-gray-500 block">종료 일자 (YYYY-MM-DD)</label>
                                                                                <input
                                                                                    type="date"
                                                                                    value={item.urgencyConfig.countdownTarget?.split('T')[0] || ''}
                                                                                    onChange={(e) => {
                                                                                        const newContent = [...config.detailContent];
                                                                                        newContent[index].urgencyConfig!.countdownTarget = e.target.value + 'T23:59:59';
                                                                                        updateNested(['detailContent'], newContent);
                                                                                    }}
                                                                                    className="w-full border rounded p-1 text-xs"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-[10px] text-gray-500 block">상단 라벨</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.urgencyConfig.countdownLabel || ''}
                                                                                    onChange={(e) => {
                                                                                        const newContent = [...config.detailContent];
                                                                                        newContent[index].urgencyConfig!.countdownLabel = e.target.value;
                                                                                        updateNested(['detailContent'], newContent);
                                                                                    }}
                                                                                    className="w-full border rounded p-1 text-xs"
                                                                                    placeholder="이벤트 종료까지"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        {/* V3 Advanced Timer Styles (NEW) */}
                                                                        <div className="bg-purple-50 border border-purple-200 rounded p-2">
                                                                            <label className="text-[10px] font-bold text-purple-800 block mb-2">고급 타이머 스타일 (V3)</label>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <label className="text-[10px] text-gray-500 block mb-1">숫자 색상</label>
                                                                                    <div className="flex gap-1">
                                                                                        <input
                                                                                            type="color"
                                                                                            value={item.urgencyConfig.timerStyle?.digitColor || '#ff0000'}
                                                                                            onChange={(e) => {
                                                                                                const newContent = [...config.detailContent];
                                                                                                if (!newContent[index].urgencyConfig!.timerStyle) newContent[index].urgencyConfig!.timerStyle = {};
                                                                                                newContent[index].urgencyConfig!.timerStyle!.digitColor = e.target.value;
                                                                                                updateNested(['detailContent'], newContent);
                                                                                            }}
                                                                                            className="w-6 h-6 border rounded cursor-pointer p-0"
                                                                                        />
                                                                                        <input
                                                                                            type="text"
                                                                                            value={item.urgencyConfig.timerStyle?.digitColor || ''}
                                                                                            onChange={(e) => {
                                                                                                const newContent = [...config.detailContent];
                                                                                                if (!newContent[index].urgencyConfig!.timerStyle) newContent[index].urgencyConfig!.timerStyle = {};
                                                                                                newContent[index].urgencyConfig!.timerStyle!.digitColor = e.target.value;
                                                                                                updateNested(['detailContent'], newContent);
                                                                                            }}
                                                                                            className="flex-1 border rounded p-1 text-xs"
                                                                                            placeholder="#ff0000"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-end">
                                                                                    <label className="flex items-center gap-1 text-[10px] text-gray-700 cursor-pointer">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={item.urgencyConfig.timerStyle?.isTransparent || false}
                                                                                            onChange={(e) => {
                                                                                                const newContent = [...config.detailContent];
                                                                                                if (!newContent[index].urgencyConfig!.timerStyle) newContent[index].urgencyConfig!.timerStyle = {};
                                                                                                newContent[index].urgencyConfig!.timerStyle!.isTransparent = e.target.checked;
                                                                                                updateNested(['detailContent'], newContent);
                                                                                            }}
                                                                                        />
                                                                                        투명 배경 모드
                                                                                    </label>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Ticker Config (FIXED) */}
                                                                {item.urgencyConfig?.showTicker && (
                                                                    <div className="border-t border-orange-200 pt-2">
                                                                        <div className="mb-2">
                                                                            <label className="text-[10px] text-gray-500 block mb-1">메시지 템플릿 (가로 롤링형일 때)</label>
                                                                            <input
                                                                                type="text"
                                                                                value={item.urgencyConfig.tickerMessage || ''}
                                                                                onChange={(e) => {
                                                                                    const newContent = [...config.detailContent];
                                                                                    newContent[index].urgencyConfig!.tickerMessage = e.target.value;
                                                                                    updateNested(['detailContent'], newContent);
                                                                                }}
                                                                                className="w-full border rounded p-1 text-xs"
                                                                                placeholder="{name}님이 무료 상담을 신청하셨습니다."
                                                                            />
                                                                        </div>
                                                                        {/* Ticker Type Selection */}
                                                                        <div className="flex gap-2 text-[10px]">
                                                                            <label className="flex items-center gap-1">
                                                                                <input
                                                                                    type="radio"
                                                                                    checked={!item.urgencyConfig.tickerType || item.urgencyConfig.tickerType === 'horizontal'}
                                                                                    onChange={() => {
                                                                                        const newContent = [...config.detailContent];
                                                                                        newContent[index].urgencyConfig!.tickerType = 'horizontal';
                                                                                        updateNested(['detailContent'], newContent);
                                                                                    }}
                                                                                />
                                                                                가로 한줄 롤링
                                                                            </label>
                                                                            <label className="flex items-center gap-1">
                                                                                <input
                                                                                    type="radio"
                                                                                    checked={item.urgencyConfig.tickerType === 'vertical_list'}
                                                                                    onChange={() => {
                                                                                        const newContent = [...config.detailContent];
                                                                                        newContent[index].urgencyConfig!.tickerType = 'vertical_list';
                                                                                        updateNested(['detailContent'], newContent);
                                                                                    }}
                                                                                />
                                                                                세로 리스트형 (박스)
                                                                            </label>
                                                                        </div>

                                                                        {/* Vertical List Logic: Columns Config */}
                                                                        {item.urgencyConfig.tickerType === 'vertical_list' && (
                                                                            <div className="mt-2 bg-white border border-gray-200 rounded p-2">
                                                                                <label className="text-[10px] font-bold text-gray-600 block mb-1">표시할 정보 (컬럼)</label>
                                                                                <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500">
                                                                                    {['name', 'phone', 'text', 'debt', 'gender'].map(colId => {
                                                                                        const isChecked = item.urgencyConfig?.tickerConfig?.columns?.find(c => c.id === colId)?.isEnabled ?? (['name', 'phone'].includes(colId));
                                                                                        return (
                                                                                            <label key={colId} className="flex items-center gap-1">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={isChecked}
                                                                                                    onChange={(e) => {
                                                                                                        // Initialize tickerConfig if needed
                                                                                                        const newContent = [...config.detailContent];
                                                                                                        if (!newContent[index].urgencyConfig!.tickerConfig) {
                                                                                                            newContent[index].urgencyConfig!.tickerConfig = {
                                                                                                                mode: 'vertical_list',
                                                                                                                columns: [
                                                                                                                    { id: 'name', label: '이름', type: 'name', isEnabled: true, masking: true },
                                                                                                                    { id: 'phone', label: '연락처', type: 'phone', isEnabled: true, masking: true },
                                                                                                                    { id: 'text', label: '상담내용', type: 'text', isEnabled: false, masking: false },
                                                                                                                    { id: 'debt', label: '신청금액', type: 'debt', isEnabled: false, masking: false },
                                                                                                                    { id: 'gender', label: '성별', type: 'gender', isEnabled: false, masking: false },
                                                                                                                ]
                                                                                                            };
                                                                                                        }
                                                                                                        // Update specific col
                                                                                                        const cols = newContent[index].urgencyConfig!.tickerConfig!.columns.map(c =>
                                                                                                            c.id === colId ? { ...c, isEnabled: e.target.checked } : c
                                                                                                        );
                                                                                                        newContent[index].urgencyConfig!.tickerConfig!.columns = cols;
                                                                                                        updateNested(['detailContent'], newContent);
                                                                                                    }}
                                                                                                />
                                                                                                {colId === 'name' ? '이름' :
                                                                                                    colId === 'phone' ? '연락처' :
                                                                                                        colId === 'text' ? '내용' :
                                                                                                            colId === 'debt' ? '금액' : '성별'}
                                                                                            </label>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* YOUTUBE / MAP EDITOR */}
                                                    {(item.type === 'youtube' || item.type === 'map') && (
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 block mb-1">
                                                                {item.type === 'youtube' ? '유튜브 영상 URL' : '장소 주소'}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={item.content}
                                                                onChange={(e) => {
                                                                    const newContent = [...config.detailContent];
                                                                    newContent[index].content = e.target.value;
                                                                    updateNested(['detailContent'], newContent);
                                                                }}
                                                                className="w-full border rounded p-2 text-xs"
                                                                placeholder={item.type === 'youtube' ? 'https://youtu.be/...' : '서울시 강남구...'}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {config.detailContent.length === 0 && (
                                            <div className="text-center py-10 bg-gray-50 border border-dashed rounded-lg text-gray-400 text-sm">
                                                상세 콘텐츠가 비어있습니다.<br />
                                                위 버튼을 눌러 콘텐츠를 추가해주세요.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ... FORM TAB ... */}
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

                                    {/* Form Config Section */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">폼 설정</h3>

                                        {/* Layout Selector (NEW) */}
                                        <div className="mb-4 pb-4 border-b border-gray-100">
                                            <label className="text-xs font-bold text-gray-500 mb-2 block">폼 레이아웃</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => updateNested(['formConfig', 'layout'], 'vertical')}
                                                    className={`p-3 border-2 rounded-lg text-center transition-all ${(!config.formConfig.layout || config.formConfig.layout === 'vertical')
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                        }`}
                                                >
                                                    <div className="text-sm font-bold">세로형 (Vertical)</div>
                                                    <div className="text-[10px] text-gray-500 mt-1">필드가 세로로 나열</div>
                                                </button>
                                                <button
                                                    onClick={() => updateNested(['formConfig', 'layout'], 'grid')}
                                                    className={`p-3 border-2 rounded-lg text-center transition-all ${config.formConfig.layout === 'grid'
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                        }`}
                                                >
                                                    <div className="text-sm font-bold">그리드형 (Grid)</div>
                                                    <div className="text-[10px] text-gray-500 mt-1">2열 그리드 배치</div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mobile Template Selector (NEW) */}
                                        <div className="mb-4 pb-4 border-b border-gray-100">
                                            <label className="text-xs font-bold text-gray-500 mb-2 block">
                                                📱 모바일 폼 템플릿 (Mobile Only)
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => updateNested(['formConfig', 'mobileTemplate'], 'default')}
                                                    className={`p-2 border rounded-lg text-xs transition-all ${(!config.formConfig.mobileTemplate || config.formConfig.mobileTemplate === 'default')
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                        }`}
                                                >
                                                    <div className="font-bold">기본</div>
                                                    <div className="text-[9px] opacity-70 mt-0.5">현재 스타일</div>
                                                </button>
                                                <button
                                                    onClick={() => updateNested(['formConfig', 'mobileTemplate'], 'minimal')}
                                                    className={`p-2 border rounded-lg text-xs transition-all ${config.formConfig.mobileTemplate === 'minimal'
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                        }`}
                                                >
                                                    <div className="font-bold">미니멀</div>
                                                    <div className="text-[9px] opacity-70 mt-0.5">최소 공간</div>
                                                </button>
                                                <button
                                                    onClick={() => updateNested(['formConfig', 'mobileTemplate'], 'inline')}
                                                    className={`p-2 border rounded-lg text-xs transition-all ${config.formConfig.mobileTemplate === 'inline'
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                        }`}
                                                >
                                                    <div className="font-bold">인라인</div>
                                                    <div className="text-[9px] opacity-70 mt-0.5">가로배치</div>
                                                </button>
                                                <button
                                                    onClick={() => updateNested(['formConfig', 'mobileTemplate'], 'compact-grid')}
                                                    className={`p-2 border rounded-lg text-xs transition-all ${config.formConfig.mobileTemplate === 'compact-grid'
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                        }`}
                                                >
                                                    <div className="font-bold">그리드</div>
                                                    <div className="text-[9px] opacity-70 mt-0.5">2열</div>
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-2">
                                                💡 모바일에서만 선택한 템플릿이 적용됩니다.
                                            </p>
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

                                    {/* Sticky Bottom Form Settings (NEW) */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm relative overflow-hidden mb-4">
                                        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                            <ArrowDown className="w-24 h-24 text-blue-900" />
                                        </div>
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <ArrowDown className="w-4 h-4 text-blue-600" /> 하단 고정 폼 (Sticky Bottom)
                                                </h3>
                                                <p className="text-[10px] text-gray-400 mt-1">화면 하단에 항상 고정되어 따라다니는 간편 신청 폼입니다.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={config.stickyBottomForm?.isEnabled || false}
                                                    onChange={(e) => updateNested(['stickyBottomForm', 'isEnabled'], e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        {config.stickyBottomForm?.isEnabled && (
                                            <div className="space-y-3 relative z-10 animate-fade-in">
                                                {/* Display Settings */}
                                                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded border border-blue-100">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={config.stickyBottomForm?.showOnMobile !== false}
                                                            onChange={(e) => updateNested(['stickyBottomForm', 'showOnMobile'], e.target.checked)}
                                                            className="rounded text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-xs font-bold text-gray-700">모바일에서 표시</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={config.stickyBottomForm?.showOnPC !== false}
                                                            onChange={(e) => updateNested(['stickyBottomForm', 'showOnPC'], e.target.checked)}
                                                            className="rounded text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-xs font-bold text-gray-700">PC에서 표시</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer mt-2 pt-2 border-t border-blue-100 col-span-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={config.stickyBottomForm?.hideOriginalForm || false}
                                                            onChange={(e) => updateNested(['stickyBottomForm', 'hideOriginalForm'], e.target.checked)}
                                                            className="rounded text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-700">기존 본문 입력폼 숨기기</span>
                                                            <span className="text-[10px] text-gray-400">활성화 시 페이지 본문의 입력폼을 숨기고 하단 고정 폼만 사용합니다.</span>
                                                        </div>
                                                    </label>
                                                </div>

                                                {/* Field Selection */}
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">표시할 입력 항목 선택 (최대 3개 미만 권장)</label>
                                                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white min-h-[50px]">
                                                        {config.formConfig.fields.map(field => (
                                                            <label key={field.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all ${(config.stickyBottomForm?.fieldIds || ['name', 'phone']).includes(field.id)
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                                }`}>
                                                                <input
                                                                    type="checkbox"
                                                                    className="hidden"
                                                                    checked={(config.stickyBottomForm?.fieldIds || ['name', 'phone']).includes(field.id)}
                                                                    onChange={(e) => {
                                                                        const currentIds = config.stickyBottomForm?.fieldIds || ['name', 'phone'];
                                                                        let newIds;
                                                                        if (e.target.checked) {
                                                                            newIds = [...currentIds, field.id];
                                                                        } else {
                                                                            newIds = currentIds.filter(id => id !== field.id);
                                                                        }
                                                                        updateNested(['stickyBottomForm', 'fieldIds'], newIds);
                                                                    }}
                                                                />
                                                                {field.label}
                                                                {(config.stickyBottomForm?.fieldIds || ['name', 'phone']).includes(field.id) && <Check className="w-3 h-3 ml-1" />}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Mobile Row Configuration (New) */}
                                                {(config.stickyBottomForm?.showOnMobile !== false) && (
                                                    <div className="mt-3 p-3 border rounded-lg bg-orange-50 border-orange-100">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="text-xs font-bold text-orange-800 flex items-center gap-1">
                                                                <Layout className="w-3 h-3" /> 모바일 줄바꿈 설정 (수동)
                                                            </h4>
                                                            {(config.stickyBottomForm?.mobileRowConfig?.row1Fields?.length || 0) + (config.stickyBottomForm?.mobileRowConfig?.row2Fields?.length || 0) > 0 && (
                                                                <button
                                                                    onClick={() => updateNested(['stickyBottomForm', 'mobileRowConfig'], undefined)}
                                                                    className="text-[10px] text-gray-500 underline hover:text-orange-600"
                                                                >
                                                                    설정 초기화 (자동 배치)
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-orange-600/80 mb-3 leading-relaxed">
                                                            필드가 4개 이상일 때, 1/2번째 줄에 표시할 항목을 직접 지정할 수 있습니다.<br />
                                                            지정하지 않으면 자동으로 배치됩니다.
                                                        </p>

                                                        {/* Row 1 Config */}
                                                        <div className="mb-3">
                                                            <label className="text-[10px] text-gray-500 font-bold block mb-1">1번째 줄 표시 항목 (위)</label>
                                                            <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-white rounded border border-orange-200 border-dashed">
                                                                {config.formConfig.fields
                                                                    .filter(f => (config.stickyBottomForm?.fieldIds || ['name', 'phone']).includes(f.id))
                                                                    .map(field => {
                                                                        const isRow1 = config.stickyBottomForm?.mobileRowConfig?.row1Fields?.includes(field.id);
                                                                        return (
                                                                            <button
                                                                                key={`r1-${field.id}`}
                                                                                onClick={() => {
                                                                                    const currentConfig = config.stickyBottomForm?.mobileRowConfig || { row1Fields: [], row2Fields: [] };
                                                                                    let newRow1 = [...(currentConfig.row1Fields || [])];
                                                                                    let newRow2 = [...(currentConfig.row2Fields || [])];

                                                                                    if (isRow1) {
                                                                                        newRow1 = newRow1.filter(id => id !== field.id);
                                                                                    } else {
                                                                                        newRow1.push(field.id);
                                                                                        newRow2 = newRow2.filter(id => id !== field.id); // Remove from Row 2
                                                                                    }

                                                                                    updateNested(['stickyBottomForm', 'mobileRowConfig'], { row1Fields: newRow1, row2Fields: newRow2 });
                                                                                }}
                                                                                className={`px-2 py-1 rounded text-[10px] border transition-all ${isRow1
                                                                                    ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-sm'
                                                                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-orange-50'
                                                                                    }`}
                                                                            >
                                                                                {field.label}
                                                                            </button>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>

                                                        {/* Row 2 Config */}
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 font-bold block mb-1">2번째 줄 표시 항목 (아래)</label>
                                                            <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-white rounded border border-orange-200 border-dashed">
                                                                {config.formConfig.fields
                                                                    .filter(f => (config.stickyBottomForm?.fieldIds || ['name', 'phone']).includes(f.id))
                                                                    .map(field => {
                                                                        const isRow2 = config.stickyBottomForm?.mobileRowConfig?.row2Fields?.includes(field.id);
                                                                        return (
                                                                            <button
                                                                                key={`r2-${field.id}`}
                                                                                onClick={() => {
                                                                                    const currentConfig = config.stickyBottomForm?.mobileRowConfig || { row1Fields: [], row2Fields: [] };
                                                                                    let newRow1 = [...(currentConfig.row1Fields || [])];
                                                                                    let newRow2 = [...(currentConfig.row2Fields || [])];

                                                                                    if (isRow2) {
                                                                                        newRow2 = newRow2.filter(id => id !== field.id);
                                                                                    } else {
                                                                                        newRow2.push(field.id);
                                                                                        newRow1 = newRow1.filter(id => id !== field.id); // Remove from Row 1
                                                                                    }

                                                                                    updateNested(['stickyBottomForm', 'mobileRowConfig'], { row1Fields: newRow1, row2Fields: newRow2 });
                                                                                }}
                                                                                className={`px-2 py-1 rounded text-[10px] border transition-all ${isRow2
                                                                                    ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-sm'
                                                                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-orange-50'
                                                                                    }`}
                                                                            >
                                                                                {field.label}
                                                                            </button>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Style Settings */}
                                                <div className="p-3 border rounded-lg bg-gray-50/50">
                                                    <h4 className="text-xs font-bold text-gray-700 mb-2">디자인 커스텀</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {/* Background Color & Image */}
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block mb-1">배경색 / 이미지</label>
                                                            <div className="flex gap-1 items-center">
                                                                <input
                                                                    type="color"
                                                                    value={config.stickyBottomForm?.backgroundColor || '#1f2937'}
                                                                    onChange={(e) => updateNested(['stickyBottomForm', 'backgroundColor'], e.target.value)}
                                                                    className="w-8 h-8 border rounded cursor-pointer p-0 shrink-0"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={config.stickyBottomForm?.backgroundColor || ''}
                                                                    onChange={(e) => updateNested(['stickyBottomForm', 'backgroundColor'], e.target.value)}
                                                                    className="flex-1 border rounded p-1 text-xs uppercase min-w-0"
                                                                />
                                                                {/* Image Picker */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openImagePicker((url) => updateNested(['stickyBottomForm', 'backgroundImage'], url))}
                                                                    className={`shrink-0 w-8 h-8 border rounded flex items-center justify-center transition-colors ${config.stickyBottomForm?.backgroundImage ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}`}
                                                                    title="배경 이미지 설정"
                                                                >
                                                                    {config.stickyBottomForm?.backgroundImage ? (
                                                                        <div className="relative w-full h-full group">
                                                                            <img src={config.stickyBottomForm.backgroundImage} className="w-full h-full object-cover rounded-[3px]" alt="bg" />
                                                                            <div
                                                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    updateNested(['stickyBottomForm', 'backgroundImage'], '');
                                                                                }}
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <ImageIcon className="w-4 h-4 text-gray-400" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {/* Text Color */}
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block mb-1">글자색</label>
                                                            <div className="flex gap-1">
                                                                <input
                                                                    type="color"
                                                                    value={config.stickyBottomForm?.textColor || '#ffffff'}
                                                                    onChange={(e) => updateNested(['stickyBottomForm', 'textColor'], e.target.value)}
                                                                    className="w-8 h-8 border rounded cursor-pointer p-0"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={config.stickyBottomForm?.textColor || ''}
                                                                    onChange={(e) => updateNested(['stickyBottomForm', 'textColor'], e.target.value)}
                                                                    className="flex-1 border rounded p-1 text-xs uppercase"
                                                                />
                                                            </div>
                                                        </div>
                                                        {/* Button Color & Image */}
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block mb-1">버튼 배경색 / 이미지</label>
                                                            <div className="flex gap-1 items-center">
                                                                <input
                                                                    type="color"
                                                                    value={config.stickyBottomForm?.buttonColor || config.theme.primaryColor}
                                                                    onChange={(e) => updateNested(['stickyBottomForm', 'buttonColor'], e.target.value)}
                                                                    className="w-8 h-8 border rounded cursor-pointer p-0 shrink-0"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={config.stickyBottomForm?.buttonColor || ''}
                                                                    onChange={(e) => updateNested(['stickyBottomForm', 'buttonColor'], e.target.value)}
                                                                    className="flex-1 border rounded p-1 text-xs uppercase min-w-0"
                                                                />
                                                                {/* Image Picker */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openImagePicker((url) => updateNested(['stickyBottomForm', 'buttonImage'], url))}
                                                                    className={`shrink-0 w-8 h-8 border rounded flex items-center justify-center transition-colors ${config.stickyBottomForm?.buttonImage ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}`}
                                                                    title="버튼 이미지 설정"
                                                                >
                                                                    {config.stickyBottomForm?.buttonImage ? (
                                                                        <div className="relative w-full h-full group">
                                                                            <img src={config.stickyBottomForm.buttonImage} className="w-full h-full object-cover rounded-[3px]" alt="btn-bg" />
                                                                            <div
                                                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    updateNested(['stickyBottomForm', 'buttonImage'], '');
                                                                                }}
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <ImageIcon className="w-4 h-4 text-gray-400" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {/* Button Text Color */}
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 block mb-1">버튼 글자색</label>
                                                            <div className="flex gap-1">
                                                                <input
                                                                    type="color"
                                                                    value={config.stickyBottomForm?.buttonTextColor || '#ffffff'}
                                                                    onChange={(e) => updateNested(['stickyBottomForm', 'buttonTextColor'], e.target.value)}
                                                                    className="w-8 h-8 border rounded cursor-pointer p-0"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={config.stickyBottomForm?.buttonTextColor || ''}
                                                                    onChange={(e) => updateNested(['stickyBottomForm', 'buttonTextColor'], e.target.value)}
                                                                    className="flex-1 border rounded p-1 text-xs uppercase"
                                                                />
                                                            </div>
                                                        </div>
                                                        {/* Button Text Font */}
                                                        <div className="col-span-2">
                                                            <label className="text-[10px] text-gray-500 block mb-1">버튼 텍스트 폰트</label>
                                                            <FontPicker
                                                                label=""
                                                                value={config.stickyBottomForm?.buttonTextFont || ''}
                                                                onChange={(val) => updateNested(['stickyBottomForm', 'buttonTextFont'], val)}
                                                                globalSettings={globalSettings}
                                                                onSettingsChange={setGlobalSettings}
                                                            />
                                                        </div>
                                                        {/* Button Text Size */}
                                                        <div className="col-span-2">
                                                            <label className="text-[10px] text-gray-500 block mb-1">버튼 텍스트 크기</label>
                                                            <input
                                                                type="text"
                                                                value={config.stickyBottomForm?.buttonTextSize || ''}
                                                                onChange={(e) => updateNested(['stickyBottomForm', 'buttonTextSize'], e.target.value)}
                                                                placeholder="예: 14px, 1rem (비워두면 기본값)"
                                                                className="w-full border rounded p-2 text-sm"
                                                            />
                                                            <p className="text-[9px] text-gray-400 mt-1">권장: 모바일 12px~14px, PC 16px~18px</p>
                                                        </div>
                                                        {/* Button Animation */}
                                                        <div className="col-span-2">
                                                            <label className="text-[10px] text-gray-500 block mb-1">버튼 애니메이션 효과</label>
                                                            <select
                                                                value={config.stickyBottomForm?.buttonAnimation || 'none'}
                                                                onChange={(e) => updateNested(['stickyBottomForm', 'buttonAnimation'], e.target.value)}
                                                                className="w-full border rounded p-2 text-sm bg-gray-50"
                                                            >
                                                                <option value="none">없음 (기본)</option>
                                                                <option value="pulse">Pulse - 부드러운 맥박</option>
                                                                <option value="heartbeat">Heartbeat - 심장박동</option>
                                                                <option value="shimmer">Shimmer - 반짝임</option>
                                                                <option value="bounce">Bounce - 튀어오름</option>
                                                                <option value="wiggle">Wiggle - 좌우 흔들림</option>
                                                                <option value="glow">Glow - 빛나는 효과</option>
                                                                <option value="shake">Shake - 흔들림</option>
                                                            </select>
                                                            <p className="text-[9px] text-gray-400 mt-1">애니메이션은 사용자의 주목을 끌어 클릭률을 높입니다</p>
                                                        </div>
                                                        {/* Input Border Radius */}
                                                        <div className="col-span-2">
                                                            <label className="text-[10px] text-gray-500 block mb-1">입력 박스 곡률</label>
                                                            <div className="flex gap-2 items-center">
                                                                <input
                                                                    type="range"
                                                                    min="0"
                                                                    max="24"
                                                                    step="2"
                                                                    value={parseInt(config.stickyBottomForm?.inputBorderRadius || '12')}
                                                                    onChange={(e) => updateNested(['stickyBottomForm', 'inputBorderRadius'], `${e.target.value}px`)}
                                                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                                />
                                                                <span className="text-xs text-gray-600 w-12 text-center">
                                                                    {config.stickyBottomForm?.inputBorderRadius || '12px'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                                                                <span>각진 형태</span>
                                                                <span>둥근 형태</span>
                                                            </div>
                                                        </div>
                                                        {/* PC Layout Mode */}
                                                        <div className="col-span-2">
                                                            <label className="text-[10px] text-gray-500 block mb-1">PC 레이아웃</label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateNested(['stickyBottomForm', 'pcLayout'], 'stacked')}
                                                                    className={`p-2 text-xs rounded-lg border-2 transition-all ${(!config.stickyBottomForm?.pcLayout || config.stickyBottomForm?.pcLayout === 'stacked')
                                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                        }`}
                                                                >
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="flex gap-0.5 mx-auto">
                                                                            <div className="w-3 h-2 bg-gray-300 rounded-sm"></div>
                                                                            <div className="w-3 h-2 bg-gray-300 rounded-sm"></div>
                                                                        </div>
                                                                        <div className="w-4 h-2 bg-blue-400 rounded-sm mx-auto"></div>
                                                                    </div>
                                                                    <span className="block mt-1">세로 배치</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateNested(['stickyBottomForm', 'pcLayout'], 'wide')}
                                                                    className={`p-2 text-xs rounded-lg border-2 transition-all ${config.stickyBottomForm?.pcLayout === 'wide'
                                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                        }`}
                                                                >
                                                                    <div className="flex gap-1 items-center justify-center">
                                                                        <div className="flex gap-0.5">
                                                                            <div className="w-2 h-2 bg-gray-300 rounded-sm"></div>
                                                                            <div className="w-2 h-2 bg-gray-300 rounded-sm"></div>
                                                                            <div className="w-2 h-2 bg-gray-300 rounded-sm"></div>
                                                                        </div>
                                                                        <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                                                                    </div>
                                                                    <span className="block mt-1">가로 배치</span>
                                                                </button>
                                                            </div>
                                                            <p className="text-[9px] text-gray-400 mt-1">가로 배치: 버튼이 오른쪽에 배치되어 폼 높이가 낮아집니다</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Additional Sheet Configuration (NEW) */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm relative overflow-hidden mb-4">
                                        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                            <Database className="w-24 h-24 text-green-900" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <Database className="w-4 h-4 text-green-600" /> 추가 DB 전송 설정 (고객사 시트 등)
                                                </h3>
                                                {/* Status Badge */}
                                                {(config.additionalSheetConfig?.spreadsheetUrl || config.additionalSheetConfig?.sheetName) && !isAdditionalDbEditing && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> 저장됨
                                                    </span>
                                                )}
                                            </div>

                                            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                                                <p className="text-xs text-blue-800">
                                                    <strong>💡 기본 동작:</strong> 모든 DB는 자동으로 "Leads" 시트에 전체 필드가 저장됩니다.
                                                    <br /><br />
                                                    <strong>✨ 추가 전송:</strong> 특정 시트에 원하는 필드만 선택적으로 전송할 수 있습니다.
                                                </p>
                                            </div>

                                            {/* VIEW MODE: Show saved configuration summary */}
                                            {!isAdditionalDbEditing && (config.additionalSheetConfig?.spreadsheetUrl || config.additionalSheetConfig?.sheetName) ? (
                                                <div className="space-y-3">
                                                    {/* Saved Configuration Display */}
                                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                        <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1">
                                                            <ShieldCheck className="w-3 h-3" /> 현재 저장된 설정
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {config.additionalSheetConfig?.spreadsheetUrl && (
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-xs text-gray-500 whitespace-nowrap w-20">URL:</span>
                                                                    <span className="text-xs text-gray-700 font-mono bg-white px-2 py-1 rounded border truncate max-w-[200px]" title={config.additionalSheetConfig.spreadsheetUrl}>
                                                                        {config.additionalSheetConfig.spreadsheetUrl.length > 40
                                                                            ? config.additionalSheetConfig.spreadsheetUrl.slice(0, 40) + '...'
                                                                            : config.additionalSheetConfig.spreadsheetUrl}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {config.additionalSheetConfig?.sheetName && (
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-xs text-gray-500 whitespace-nowrap w-20">시트 이름:</span>
                                                                    <span className="text-xs text-gray-700 font-bold bg-white px-2 py-1 rounded border">
                                                                        {config.additionalSheetConfig.sheetName}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {config.additionalSheetConfig?.fieldMappings && config.additionalSheetConfig.fieldMappings.length > 0 && (
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-xs text-gray-500 whitespace-nowrap w-20">필드 매핑:</span>
                                                                    <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded border">
                                                                        {config.additionalSheetConfig.fieldMappings.length}개 설정됨
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('⚠️ 추가 DB 전송 설정을 수정하시겠습니까?\n\n잘못된 수정은 데이터 전송에 문제를 일으킬 수 있습니다.\n수정 후 반드시 "저장" 버튼을 눌러주세요.')) {
                                                                setIsAdditionalDbEditing(true);
                                                            }
                                                        }}
                                                        className="w-full py-3 px-4 bg-white border-2 border-yellow-400 rounded-lg text-sm font-bold text-yellow-700 hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Pencil className="w-4 h-4" /> 설정 수정하기
                                                    </button>
                                                    <p className="text-[10px] text-gray-400 text-center">
                                                        ⚠️ 수정 시 기존 데이터 전송 설정이 변경됩니다. 신중하게 수정해주세요.
                                                    </p>
                                                </div>
                                            ) : !isAdditionalDbEditing ? (
                                                /* NEW CONFIG: Show setup button */
                                                <button
                                                    onClick={() => setIsAdditionalDbEditing(true)}
                                                    className="w-full py-3 px-4 bg-green-50 border-2 border-green-300 border-dashed rounded-lg text-sm font-bold text-green-600 hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" /> 추가 DB 전송 설정하기
                                                </button>
                                            ) : (
                                                /* EDIT MODE: Show full editing interface */
                                                <div className="animate-fade-in">
                                                    {/* Cancel Edit Button */}
                                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-yellow-200 bg-yellow-50 -mx-4 -mt-2 px-4 py-3 rounded-t">
                                                        <span className="text-xs font-bold text-yellow-700 flex items-center gap-1">
                                                            <TriangleAlert className="w-4 h-4" /> 수정 모드
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                if (!hasUnsavedChanges || window.confirm('변경사항을 취소하시겠습니까?')) {
                                                                    setIsAdditionalDbEditing(false);
                                                                }
                                                            }}
                                                            className="text-xs px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                                                        >
                                                            수정 취소
                                                        </button>
                                                    </div>

                                                    {/* Spreadsheet URL Input */}
                                                    <label className="block mb-4">
                                                        <span className="text-xs font-medium text-gray-700 block mb-1">
                                                            스프레드시트 URL (선택사항)
                                                        </span>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={config.additionalSheetConfig?.spreadsheetUrl || ''}
                                                                onChange={(e) => {
                                                                    setConfig({
                                                                        ...config,
                                                                        additionalSheetConfig: {
                                                                            spreadsheetUrl: e.target.value,
                                                                            sheetName: config.additionalSheetConfig?.sheetName || '',
                                                                            fieldMappings: config.additionalSheetConfig?.fieldMappings || []
                                                                        }
                                                                    });
                                                                    setHasUnsavedChanges(true);
                                                                }}
                                                                placeholder="https://docs.google.com/spreadsheets/d/xxxxx"
                                                                className={`w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-green-300 focus:border-green-500 font-mono text-xs ${hasUnsavedChanges ? 'border-yellow-400 bg-yellow-50' : ''
                                                                    }`}
                                                            />
                                                            {hasUnsavedChanges && (
                                                                <span className="absolute right-3 top-2.5 text-xs text-yellow-600 font-semibold">
                                                                    ⚠️ 저장 필요
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            💡 비워두면 현재 스프레드시트 내 다른 탭으로 저장됩니다.
                                                            <br />
                                                            📌 다른 구글 계정의 스프레드시트 URL을 입력하면 해당 파일로 전송됩니다.
                                                            <br />
                                                            ⚠️ 외부 스프레드시트 사용 시 Apps Script 계정(beanhull@gmail.com)을 편집자로 추가해야 합니다.
                                                        </p>
                                                    </label>

                                                    {/* Sheet Name Input */}
                                                    <label className="block mb-4">
                                                        <span className="text-xs font-medium text-gray-700 block mb-1">추가 DB 전송 시트 이름</span>
                                                        <input
                                                            type="text"
                                                            value={config.additionalSheetConfig?.sheetName || ''}
                                                            onChange={(e) => {
                                                                setConfig({
                                                                    ...config,
                                                                    additionalSheetConfig: {
                                                                        spreadsheetUrl: config.additionalSheetConfig?.spreadsheetUrl || '',
                                                                        sheetName: e.target.value,
                                                                        fieldMappings: config.additionalSheetConfig?.fieldMappings || []
                                                                    }
                                                                });
                                                                setHasUnsavedChanges(true);
                                                            }}
                                                            placeholder="예: 고객사A_DB, DB수집"
                                                            className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-green-300 focus:border-green-500"
                                                        />
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            💡 스프레드시트 내 시트(탭) 이름을 입력하세요.
                                                        </p>
                                                    </label>

                                                    {/* Field Mapping Section */}
                                                    {(config.additionalSheetConfig?.spreadsheetUrl || config.additionalSheetConfig?.sheetName) && (
                                                        <div className="mt-4 p-3 bg-gray-50 rounded border animate-fade-in">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="text-xs font-semibold text-gray-700">필드 매핑 설정</h4>
                                                                <button
                                                                    onClick={() => {
                                                                        const mappings = config.additionalSheetConfig?.fieldMappings || [];
                                                                        setConfig({
                                                                            ...config,
                                                                            additionalSheetConfig: {
                                                                                ...config.additionalSheetConfig!,
                                                                                fieldMappings: [
                                                                                    ...mappings,
                                                                                    { sourceField: '', targetColumn: '' }
                                                                                ]
                                                                            }
                                                                        });
                                                                        setHasUnsavedChanges(true);
                                                                    }}
                                                                    className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                                                >
                                                                    + 필드 추가
                                                                </button>
                                                            </div>

                                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                                {(config.additionalSheetConfig?.fieldMappings || []).map((mapping, idx) => (
                                                                    <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border">
                                                                        <div className="flex-1">
                                                                            <label className="text-[10px] text-gray-600 block mb-1">원본 필드</label>
                                                                            <select
                                                                                value={mapping.sourceField}
                                                                                onChange={(e) => {
                                                                                    const newMappings = [...(config.additionalSheetConfig?.fieldMappings || [])];
                                                                                    newMappings[idx].sourceField = e.target.value;
                                                                                    setConfig({
                                                                                        ...config,
                                                                                        additionalSheetConfig: {
                                                                                            ...config.additionalSheetConfig!,
                                                                                            fieldMappings: newMappings
                                                                                        }
                                                                                    });
                                                                                    setHasUnsavedChanges(true);
                                                                                }}
                                                                                className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-green-300"
                                                                            >
                                                                                <option value="">선택...</option>
                                                                                <option value="Timestamp">접수일시 (Timestamp)</option>
                                                                                {config.formConfig.fields.map(field => (
                                                                                    <option key={field.id} value={field.id}>
                                                                                        {field.label}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </div>

                                                                        <div className="text-gray-400 text-sm pt-4">→</div>

                                                                        <div className="flex-1">
                                                                            <label className="text-[10px] text-gray-600 block mb-1">시트 열 이름</label>
                                                                            <input
                                                                                type="text"
                                                                                value={mapping.targetColumn}
                                                                                onChange={(e) => {
                                                                                    const newMappings = [...(config.additionalSheetConfig?.fieldMappings || [])];
                                                                                    newMappings[idx].targetColumn = e.target.value;
                                                                                    setConfig({
                                                                                        ...config,
                                                                                        additionalSheetConfig: {
                                                                                            ...config.additionalSheetConfig!,
                                                                                            fieldMappings: newMappings
                                                                                        }
                                                                                    });
                                                                                    setHasUnsavedChanges(true);
                                                                                }}
                                                                                placeholder="예: 고객명, 연락처"
                                                                                className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-green-300"
                                                                            />
                                                                        </div>

                                                                        <button
                                                                            onClick={() => {
                                                                                const newMappings = (config.additionalSheetConfig?.fieldMappings || [])
                                                                                    .filter((_, i) => i !== idx);
                                                                                setConfig({
                                                                                    ...config,
                                                                                    additionalSheetConfig: {
                                                                                        ...config.additionalSheetConfig!,
                                                                                        fieldMappings: newMappings
                                                                                    }
                                                                                });
                                                                                setHasUnsavedChanges(true);
                                                                            }}
                                                                            className="text-red-500 hover:bg-red-50 p-2 rounded transition mt-4"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {(!config.additionalSheetConfig?.fieldMappings ||
                                                                config.additionalSheetConfig.fieldMappings.length === 0) && (
                                                                    <div className="text-xs text-gray-500 text-center py-4 bg-white rounded border border-dashed">
                                                                        매핑을 추가하지 않으면 모든 필드가 원본 이름으로 전송됩니다.
                                                                    </div>
                                                                )}
                                                        </div>
                                                    )}

                                                    {/* Save Reminder */}
                                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                        <p className="text-xs text-green-700 flex items-center gap-1">
                                                            <Save className="w-4 h-4" />
                                                            <strong>수정 완료 후 상단의 "저장" 버튼을 눌러주세요.</strong>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* LeadMaster CRM Integration (NEW) */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm relative overflow-hidden mb-4">
                                        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                            <ExternalLink className="w-24 h-24 text-purple-900" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <ExternalLink className="w-4 h-4 text-purple-600" /> 리드마스터 CRM 연동
                                                </h3>
                                                {config.leadMasterConfig?.isEnabled && config.leadMasterConfig?.spreadsheetUrl && (
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> 활성화됨
                                                    </span>
                                                )}
                                            </div>

                                            <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-4">
                                                <p className="text-xs text-purple-800">
                                                    <strong>💡 리드마스터 연동:</strong> 이 랜딩페이지에서 수집된 고객 정보를 리드마스터 CRM에 자동으로 등록합니다.
                                                    <br /><br />
                                                    <strong>⚠️ 주의:</strong> 기존 구글시트 저장은 그대로 유지됩니다. 리드마스터는 추가 전송입니다.
                                                </p>
                                            </div>

                                            {/* Enable Toggle */}
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-4">
                                                <input
                                                    type="checkbox"
                                                    checked={config.leadMasterConfig?.isEnabled || false}
                                                    onChange={(e) => setConfig(prev => ({
                                                        ...prev,
                                                        leadMasterConfig: {
                                                            ...prev.leadMasterConfig,
                                                            isEnabled: e.target.checked,
                                                            spreadsheetUrl: prev.leadMasterConfig?.spreadsheetUrl || '',
                                                            landingId: prev.leadMasterConfig?.landingId || ''
                                                        }
                                                    }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <div>
                                                    <span className="text-sm font-bold text-gray-700">리드마스터 연동 활성화</span>
                                                    <p className="text-xs text-gray-500">활성화 시 폼 제출 데이터가 리드마스터로 전송됩니다</p>
                                                </div>
                                            </label>

                                            {/* Configuration Fields (shown when enabled) */}
                                            {config.leadMasterConfig?.isEnabled && (
                                                <div className="space-y-4 animate-fade-in">
                                                    {/* Spreadsheet URL */}
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-700 block mb-1">
                                                            리드마스터 스프레드시트 URL <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={config.leadMasterConfig?.spreadsheetUrl || ''}
                                                            onChange={(e) => setConfig(prev => ({
                                                                ...prev,
                                                                leadMasterConfig: {
                                                                    ...prev.leadMasterConfig!,
                                                                    isEnabled: true,
                                                                    spreadsheetUrl: e.target.value
                                                                }
                                                            }))}
                                                            placeholder="https://docs.google.com/spreadsheets/d/xxxxx/edit"
                                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            리드마스터 구글 스프레드시트 URL을 입력하세요 (시트에 직접 저장됩니다)
                                                        </p>
                                                    </div>

                                                    {/* Sheet Name */}
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-700 block mb-1">
                                                            시트 이름 (탭 이름)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={config.leadMasterConfig?.sheetName || ''}
                                                            onChange={(e) => setConfig(prev => ({
                                                                ...prev,
                                                                leadMasterConfig: {
                                                                    ...prev.leadMasterConfig!,
                                                                    sheetName: e.target.value
                                                                }
                                                            }))}
                                                            placeholder="Cases"
                                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            리드마스터 구글시트의 탭 이름입니다. 비워두면 기본 시트에 저장됩니다.
                                                        </p>
                                                    </div>

                                                    {/* Manager Name (담당자) */}
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-700 block mb-1">
                                                            담당자 이름
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={config.leadMasterConfig?.managerName || ''}
                                                            onChange={(e) => setConfig(prev => ({
                                                                ...prev,
                                                                leadMasterConfig: {
                                                                    ...prev.leadMasterConfig!,
                                                                    managerName: e.target.value
                                                                }
                                                            }))}
                                                            placeholder="홍길동"
                                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            리드마스터에서 배정될 담당자 이름입니다. 비워두면 담당자 없이 등록됩니다.
                                                        </p>
                                                    </div>

                                                    {/* Landing ID (Optional) */}
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-700 block mb-1">
                                                            랜딩 ID (선택)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={config.leadMasterConfig?.landingId || ''}
                                                            onChange={(e) => setConfig(prev => ({
                                                                ...prev,
                                                                leadMasterConfig: {
                                                                    ...prev.leadMasterConfig!,
                                                                    landingId: e.target.value
                                                                }
                                                            }))}
                                                            placeholder="my-landing-page"
                                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            리드마스터에서 유입경로를 식별하기 위한 ID입니다. 비워두면 기본값(landing-factory)이 사용됩니다.
                                                        </p>
                                                    </div>

                                                    {/* Save Reminder */}
                                                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                        <p className="text-xs text-purple-700 flex items-center gap-1">
                                                            <Save className="w-4 h-4" />
                                                            <strong>설정 완료 후 상단의 "저장" 버튼을 눌러주세요.</strong>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
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

                                                {/* New: Margin & Padding Controls */}
                                                <div className="col-span-2 pt-2 border-t border-gray-100">
                                                    <label className="text-[10px] text-gray-500 block mb-1">상하 여백 (Vertical Padding)</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="5"
                                                            step="1"
                                                            value={config.formConfig.containerStyle?.verticalPadding ?? 3}
                                                            onChange={(e) => updateNested(['formConfig', 'containerStyle', 'verticalPadding'], parseInt(e.target.value))}
                                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                        />
                                                        <span className="text-xs font-bold text-blue-600 w-12 text-right">
                                                            Lv.{config.formConfig.containerStyle?.verticalPadding ?? 3}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-[9px] text-gray-400 mt-1 px-1">
                                                        <span>0 (없음)</span>
                                                        <span>5 (최대)</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={config.formConfig.containerStyle?.removeContainerPadding || false}
                                                            onChange={(e) => updateNested(['formConfig', 'containerStyle', 'removeContainerPadding'], e.target.checked)}
                                                            className="rounded text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-700">좌우 컨테이너 여백 제거</span>
                                                            <span className="text-[10px] text-gray-400">체크 시 폼이 전체 너비로 확장됩니다 (모바일 풀사이즈용)</span>
                                                        </div>
                                                    </label>
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
                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                    <label className="text-[10px] text-gray-500 block mb-1">버튼 배경 이미지 (단색 대신 이미지 사용)</label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openImagePicker((url) => updateNested(['formConfig', 'style', 'buttonBackgroundImage'], url))}
                                                            className="flex-1 bg-white border rounded p-2 text-xs hover:bg-gray-50 flex items-center justify-center gap-1"
                                                        >
                                                            <Upload className="w-3 h-3" /> 이미지형 버튼 업로드
                                                        </button>
                                                        {config.formConfig.style?.buttonBackgroundImage && (
                                                            <button
                                                                onClick={() => updateNested(['formConfig', 'style', 'buttonBackgroundImage'], '')}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded border"
                                                                title="이미지 제거"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {config.formConfig.style?.buttonBackgroundImage && (
                                                        <div className="w-full h-10 mt-2 rounded border overflow-hidden bg-gray-100">
                                                            <img src={config.formConfig.style.buttonBackgroundImage} className="w-full h-full object-cover" alt="submit-btn-bg" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                    <label className="text-[10px] text-gray-500 block mb-1">버튼 텍스트 애니메이션</label>
                                                    <select
                                                        value={config.formConfig.style?.buttonTextEffect || 'none'}
                                                        onChange={(e) => updateNested(['formConfig', 'style', 'buttonTextEffect'], e.target.value)}
                                                        className="w-full border rounded p-2 text-sm bg-white mb-2"
                                                    >
                                                        <option value="none">효과 없음</option>
                                                        <option value="typewriter">타자기 (Typewriter)</option>
                                                        <option value="fadeIn">페이드 인 (Fade In)</option>
                                                        <option value="slideUp">위로 나타나기 (Slide Up)</option>
                                                        <option value="slideDown">아래로 나타나기 (Slide Down)</option>
                                                        <option value="blur">블러 효과 (Blur)</option>
                                                        <option value="bounce">바운스 (Bounce)</option>
                                                        <option value="scale">확대 효과 (Scale)</option>
                                                        <option value="glitch">글리치 (Glitch)</option>
                                                        <option value="wave">웨이브 (Wave)</option>
                                                    </select>

                                                    {config.formConfig.style?.buttonTextEffect && config.formConfig.style?.buttonTextEffect !== 'none' && (
                                                        <div className="bg-gray-100 p-2 rounded border border-gray-200 space-y-2">
                                                            <div>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <label className="text-[10px] text-gray-500">지속 시간 (Duration)</label>
                                                                    <span className="text-[10px] font-mono text-blue-600">
                                                                        {((config.formConfig.style?.buttonTextAnimationDuration || 1000) / 1000).toFixed(1)}s
                                                                    </span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    min="500"
                                                                    max="3000"
                                                                    step="100"
                                                                    value={config.formConfig.style?.buttonTextAnimationDuration || 1000}
                                                                    onChange={(e) => updateNested(['formConfig', 'style', 'buttonTextAnimationDuration'], parseInt(e.target.value))}
                                                                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                                                                />
                                                            </div>
                                                            <div className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    id="btn-anim-loop"
                                                                    checked={config.formConfig.style?.buttonTextAnimationLoop || false}
                                                                    onChange={(e) => updateNested(['formConfig', 'style', 'buttonTextAnimationLoop'], e.target.checked)}
                                                                    className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                                />
                                                                <label htmlFor="btn-anim-loop" className="ml-2 text-[10px] text-gray-600 cursor-pointer">
                                                                    무한 반복 (Infinite Loop)
                                                                </label>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <ButtonStyleEditor label="버튼" mode="flat_form_button" />
                                            </div>
                                        </div>
                                        {/* Security Badge Style */}
                                        <div className="pt-4 border-t mb-4">
                                            <h4 className="text-xs font-bold text-gray-700 mb-2">보안 배지 스타일 (Security Footer)</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {SECURITY_PRESETS.map((preset) => (
                                                    <button
                                                        key={preset.id}
                                                        onClick={() => updateNested(['formConfig', 'style', 'securityBadgeId'], preset.id)}
                                                        className={`p-2 border rounded flex items-center gap-2 text-xs transition-colors
                                                        ${config.formConfig.style?.securityBadgeId === preset.id
                                                                ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <preset.icon className="w-3 h-3 shrink-0" />
                                                        <span className="truncate">{preset.name}</span>
                                                    </button>
                                                ))}
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
                                                        <option value="checkbox">체크박스</option>
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

                                    {/* Success Message Settings (Moved) */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm border-2 border-blue-100 mt-4">
                                        <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-4">
                                            <CheckSquare className="w-4 h-4" /> 제출 후 동작 설정 (완료 메시지 / 페이지 이동 / 이메일 알림)
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

                                            <div className="pt-2 border-t border-dashed">
                                                <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                                                    <span className="font-bold">제출 후 페이지 이동 (선택)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={config.formConfig.redirectUrl || ''}
                                                    onChange={(e) => updateNested(['formConfig', 'redirectUrl'], e.target.value)}
                                                    className="w-full border rounded p-2 text-sm mb-1"
                                                    placeholder="https://example.com/thank-you (입력 시 자동 이동)"
                                                />
                                                <p className="text-[10px] text-gray-400">
                                                    * 입력하면 완료 메시지를 보여주고 설정된 시간 후 이동합니다.
                                                </p>
                                            </div>

                                            {config.formConfig.redirectUrl && (
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">이동 전 대기 시간 (초)</label>
                                                    <input
                                                        type="number"
                                                        value={config.formConfig.redirectDelay ?? 2}
                                                        onChange={(e) => updateNested(['formConfig', 'redirectDelay'], Number(e.target.value))}
                                                        className="w-20 border rounded p-2 text-sm"
                                                        min={0}
                                                        max={10}
                                                    />
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-dashed">
                                                <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                                                    <span className="font-bold">알림 이메일 설정 (선택)</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    value={config.formConfig.notificationEmail || ''}
                                                    onChange={(e) => updateNested(['formConfig', 'notificationEmail'], e.target.value)}
                                                    className="w-full border rounded p-2 text-sm mb-1"
                                                    placeholder="example@email.com (미입력 시 기본값 사용)"
                                                />
                                                <p className="text-[10px] text-gray-400">
                                                    * 입력하면 새 DB가 들어올 때 이 주소로 알림을 보냅니다.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                            }

                            {/* --- LOCATION TAB (NEW) --- */}
                            {/* --- STEP BUILDER TAB (NEW) --- */}
                            {
                                activeTab === 'steps' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                                            <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                                                <ListOrdered className="w-4 h-4" /> 스텝 빌더 (순서 편집)
                                            </h3>
                                            <p className="text-xs text-blue-700">
                                                인트로, 콘텐츠, 입력폼, 그리고 마지막 아웃트로까지 원하는 순서대로 배치하세요.<br />
                                                각 단계별로 버튼 디자인과 스타일을 변경할 수 있습니다.
                                            </p>
                                        </div>

                                        {/* ADD STEPS */}
                                        <div className="grid grid-cols-4 gap-2">
                                            <button onClick={() => addStep('intro')} className="py-3 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg text-xs font-bold text-gray-500 hover:text-blue-600 flex flex-col items-center gap-1 transition-all">
                                                <Smartphone className="w-4 h-4" />
                                                인트로(표지)
                                            </button>
                                            <button onClick={() => addStep('content')} className="py-3 border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 rounded-lg text-xs font-bold text-gray-500 hover:text-purple-600 flex flex-col items-center gap-1 transition-all">
                                                <ImageIcon className="w-4 h-4" />
                                                콘텐츠(설명)
                                            </button>
                                            <button onClick={() => addStep('outro')} className="py-3 border-2 border-dashed border-gray-300 hover:border-red-500 hover:bg-red-50 rounded-lg text-xs font-bold text-gray-500 hover:text-red-600 flex flex-col items-center gap-1 transition-all col-span-2">
                                                <Flag className="w-4 h-4" />
                                                아웃트로(완료)
                                            </button>
                                        </div>

                                        {/* STEP LIST */}
                                        <div className="space-y-3">
                                            {(!config.steps || config.steps.length === 0) && (
                                                <div className="text-center py-8 text-gray-400 text-xs border border-dashed rounded bg-gray-50">
                                                    추가된 스텝이 없습니다. 위 버튼을 눌러 스텝을 추가해주세요.
                                                </div>
                                            )}

                                            {(config.steps || []).map((step, idx) => (
                                                <div key={step.id} className="bg-white border rounded-lg shadow-sm overflow-hidden group">
                                                    {/* Step Header */}
                                                    <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded">STEP {idx + 1}</span>
                                                            <span className={`text-xs font-bold ${step.type === 'intro' ? 'text-blue-600' : step.type === 'content' ? 'text-purple-600' : step.type === 'form' ? 'text-green-600' : 'text-red-600'}`}>
                                                                {step.type === 'intro' ? '인트로 (표지)' : step.type === 'content' ? '콘텐츠 (상세내용)' : step.type === 'form' ? '입력폼 (질문)' : '아웃트로 (완료)'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => moveStep(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                                                                <ArrowUp className="w-3 h-3" />
                                                            </button>
                                                            <button onClick={() => moveStep(idx, 'down')} disabled={idx === (config.steps?.length || 0) - 1} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                                                                <ArrowDown className="w-3 h-3" />
                                                            </button>
                                                            <button onClick={() => removeStep(idx)} className="p-1 text-gray-400 hover:text-red-600 ml-2">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Step Body */}
                                                    <div className="p-4 space-y-4">

                                                        {/* --- Navigation Settings --- */}
                                                        <div className="border-b pb-4 mb-4">
                                                            <h4 className="text-xs font-bold text-gray-700 mb-2">버튼 및 네비게이션 설정</h4>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">다음(완료) 버튼 문구</label>
                                                                    <input
                                                                        type="text"
                                                                        value={step.buttonText || ''}
                                                                        onChange={(e) => updateStep(idx, { buttonText: e.target.value })}
                                                                        className="w-full border rounded p-2 text-xs"
                                                                        placeholder={step.type === 'outro' ? '제출하기' : '다음으로'}
                                                                    />
                                                                </div>
                                                                {step.type !== 'intro' && (
                                                                    <div>
                                                                        <label className="text-[10px] text-gray-500 block mb-1">이전 버튼</label>
                                                                        <div className="flex gap-2">
                                                                            <label className="flex items-center gap-1 cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={step.showPrevButton !== false}
                                                                                    onChange={(e) => updateStep(idx, { showPrevButton: e.target.checked })}
                                                                                    className="rounded text-blue-600"
                                                                                />
                                                                                <span className="text-xs text-gray-600">표시</span>
                                                                            </label>
                                                                            {step.showPrevButton !== false && (
                                                                                <input
                                                                                    type="text"
                                                                                    value={step.prevButtonText || '이전'}
                                                                                    onChange={(e) => updateStep(idx, { prevButtonText: e.target.value })}
                                                                                    className="flex-1 border rounded p-2 text-xs"
                                                                                    placeholder="이전"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Button Layout Settings */}
                                                            <div className="mt-3 bg-gray-50 p-2 rounded border border-gray-100">
                                                                <label className="text-[10px] text-gray-500 block mb-1 font-bold">버튼 레이아웃 / 배치 스타일</label>
                                                                <select
                                                                    value={step.buttonLayout || 'auto'}
                                                                    onChange={(e) => updateStep(idx, { buttonLayout: e.target.value as any })}
                                                                    className="w-full border rounded p-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                                                                >
                                                                    <option value="auto">기본 (자동)</option>
                                                                    <option value="full">꽉 차게 (Full Width)</option>
                                                                    <option value="asymmetric">비대칭 (이전 작게 / 다음 크게)</option>
                                                                    <option value="fixed_bottom">화면 하단 고정</option>
                                                                </select>
                                                            </div>

                                                            {/* Button Styling (Simple) */}
                                                            <div className="mt-2 bg-gray-50 p-2 rounded">
                                                                <details>
                                                                    <summary className="text-[10px] font-bold text-gray-500 cursor-pointer">버튼 디자인 상세 설정 (펼치기)</summary>
                                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                                        <div>
                                                                            <label className="text-[10px] text-gray-500 block">버튼 배경색</label>
                                                                            <div className="flex gap-2">
                                                                                <input type="color" value={step.buttonStyle?.backgroundColor || config.theme.primaryColor} onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, backgroundColor: e.target.value } })} className="h-8 w-8 cursor-pointer rounded border" />
                                                                                <input type="text" value={step.buttonStyle?.backgroundColor || ''} onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, backgroundColor: e.target.value } })} className="flex-1 border rounded text-xs px-2" placeholder="#..." />
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] text-gray-500 block">버튼 글자색</label>
                                                                            <div className="flex gap-2">
                                                                                <input type="color" value={step.buttonStyle?.textColor || '#ffffff'} onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, textColor: e.target.value } })} className="h-8 w-8 cursor-pointer rounded border" />
                                                                                <input type="text" value={step.buttonStyle?.textColor || ''} onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, textColor: e.target.value } })} className="flex-1 border rounded text-xs px-2" placeholder="#..." />
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] text-gray-500 block">폰트 크기</label>
                                                                            <input type="text" value={step.buttonStyle?.fontSize || ''} onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, fontSize: e.target.value } })} className="w-full border rounded p-1 text-xs" placeholder="예: 18px, 1.2rem" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] text-gray-500 block">둥글기 (px)</label>
                                                                            <input type="text" value={step.buttonStyle?.borderRadius || ''} onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, borderRadius: e.target.value } })} className="w-full border rounded p-1 text-xs" placeholder="예: 8px, 16px" />
                                                                        </div>
                                                                        <div className="col-span-2">
                                                                            <label className="text-[10px] text-gray-500 block">버튼 애니메이션 효과</label>
                                                                            <select
                                                                                value={step.buttonStyle?.animation || 'none'}
                                                                                onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, animation: e.target.value as any } })}
                                                                                className="w-full border rounded p-1 text-xs"
                                                                            >
                                                                                <option value="none">없음 (기본)</option>
                                                                                <option value="pulse">Pulse (맥박)</option>
                                                                                <option value="shimmer">Shimmer (빛 반사)</option>
                                                                                <option value="bounce">Bounce (바운스)</option>
                                                                                <option value="heartbeat">Heartbeat (빠른 심박)</option>
                                                                                <option value="wiggle">Electric Wiggle (진동)</option>
                                                                                <option value="hyper-shimmer">Hyper Shimmer (강렬한 빛 - 추천)</option>
                                                                            </select>
                                                                        </div>
                                                                        {/* Gradient Button Settings */}
                                                                        <div className="col-span-2 pt-2 border-t border-gray-200 mt-1">
                                                                            <label className="text-[10px] text-gray-500 block mb-1 font-bold">그라데이션 버튼 (선택 사항)</label>
                                                                            <div className="grid grid-cols-3 gap-2">
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-400 block">시작 색상</label>
                                                                                    <div className="flex gap-1">
                                                                                        <input type="color" value={step.buttonStyle?.gradientFrom || '#ffffff'} onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, gradientFrom: e.target.value } })} className="h-6 w-6 rounded cursor-pointer border" />
                                                                                        <input type="text" value={step.buttonStyle?.gradientFrom || ''} onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, gradientFrom: e.target.value } })} className="flex-1 border rounded text-[10px] px-1" placeholder="#..." />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-400 block">종료 색상</label>
                                                                                    <div className="flex gap-1">
                                                                                        <input type="color" value={step.buttonStyle?.gradientTo || '#ffffff'} onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, gradientTo: e.target.value } })} className="h-6 w-6 rounded cursor-pointer border" />
                                                                                        <input type="text" value={step.buttonStyle?.gradientTo || ''} onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, gradientTo: e.target.value } })} className="flex-1 border rounded text-[10px] px-1" placeholder="#..." />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-400 block">방향</label>
                                                                                    <select value={step.buttonStyle?.gradientDirection || 'to right'} onChange={(e) => updateStep(idx, { buttonStyle: { ...step.buttonStyle, gradientDirection: e.target.value } })} className="w-full border rounded text-[10px] py-1">
                                                                                        <option value="to right">→ (우측)</option>
                                                                                        <option value="to left">← (좌측)</option>
                                                                                        <option value="to bottom">↓ (하단)</option>
                                                                                        <option value="to top">↑ (상단)</option>
                                                                                        <option value="to bottom right">↘ (우하단)</option>
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </details>
                                                            </div>

                                                            {/* Text Styling (NEW) */}
                                                            <div className="mt-2 bg-blue-50/30 p-2 rounded border border-blue-100">
                                                                <details>
                                                                    <summary className="text-[10px] font-bold text-blue-600 cursor-pointer">텍스트 스타일 상세 설정 (펼치기)</summary>
                                                                    <div className="space-y-3 mt-2">
                                                                        {/* Headline Style */}
                                                                        <div className="p-2 bg-white rounded border border-blue-50">
                                                                            <label className="text-[10px] font-bold text-gray-600 block mb-1">헤드라인 (메인 타이틀)</label>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-400">글자색</label>
                                                                                    <input type="color" value={step.titleStyle?.color || '#ffffff'} onChange={(e) => updateStep(idx, { titleStyle: { ...step.titleStyle, color: e.target.value } })} className="w-full h-6 rounded cursor-pointer border" />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-400">크기 (Rem/Px)</label>
                                                                                    <input type="text" value={step.titleStyle?.fontSize || ''} onChange={(e) => updateStep(idx, { titleStyle: { ...step.titleStyle, fontSize: e.target.value } })} className="w-full border rounded px-1 text-[10px]" placeholder="3rem" />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-400">가중치 (Weight)</label>
                                                                                    <select value={step.titleStyle?.fontWeight || 'bold'} onChange={(e) => updateStep(idx, { titleStyle: { ...step.titleStyle, fontWeight: e.target.value } })} className="w-full border rounded text-[10px]">
                                                                                        <option value="normal">Normal</option>
                                                                                        <option value="medium">Medium</option>
                                                                                        <option value="semibold">SemiBold</option>
                                                                                        <option value="bold">Bold</option>
                                                                                        <option value="black">ExtraBold</option>
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                            {/* Gradient Text Settings */}
                                                                            <div className="pt-2 border-t border-gray-100 mt-2">
                                                                                <label className="text-[10px] font-bold text-gray-500 block mb-1">그라데이션 텍스트 (선택 사항)</label>
                                                                                <div className="grid grid-cols-3 gap-2">
                                                                                    <div>
                                                                                        <label className="text-[9px] text-gray-400 block">시작 색상</label>
                                                                                        <div className="flex gap-1">
                                                                                            <input type="color" value={step.titleStyle?.gradientFrom || '#ffffff'} onChange={(e) => updateStep(idx, { titleStyle: { ...step.titleStyle, gradientFrom: e.target.value } })} className="h-6 w-6 rounded cursor-pointer border" />
                                                                                            <input type="text" value={step.titleStyle?.gradientFrom || ''} onChange={(e) => updateStep(idx, { titleStyle: { ...step.titleStyle, gradientFrom: e.target.value } })} className="flex-1 border rounded text-[10px] px-1" placeholder="#..." />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[9px] text-gray-400 block">종료 색상</label>
                                                                                        <div className="flex gap-1">
                                                                                            <input type="color" value={step.titleStyle?.gradientTo || '#ffffff'} onChange={(e) => updateStep(idx, { titleStyle: { ...step.titleStyle, gradientTo: e.target.value } })} className="h-6 w-6 rounded cursor-pointer border" />
                                                                                            <input type="text" value={step.titleStyle?.gradientTo || ''} onChange={(e) => updateStep(idx, { titleStyle: { ...step.titleStyle, gradientTo: e.target.value } })} className="flex-1 border rounded text-[10px] px-1" placeholder="#..." />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[9px] text-gray-400 block">방향</label>
                                                                                        <select value={step.titleStyle?.gradientDirection || 'to right'} onChange={(e) => updateStep(idx, { titleStyle: { ...step.titleStyle, gradientDirection: e.target.value } })} className="w-full border rounded text-[10px] py-1">
                                                                                            <option value="to right">→ (우측)</option>
                                                                                            <option value="to left">← (좌측)</option>
                                                                                            <option value="to bottom">↓ (하단)</option>
                                                                                            <option value="to top">↑ (상단)</option>
                                                                                            <option value="to bottom right">↘ (우하단)</option>
                                                                                        </select>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* SubHeadline Style */}
                                                                        <div className="p-2 bg-white rounded border border-blue-50">
                                                                            <label className="text-[10px] font-bold text-gray-600 block mb-1">서브헤드라인 (배지/소제목)</label>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-400">글자색</label>
                                                                                    <input type="color" value={step.subtitleStyle?.color || '#93c5fd'} onChange={(e) => updateStep(idx, { subtitleStyle: { ...step.subtitleStyle, color: e.target.value } })} className="w-full h-6 rounded cursor-pointer border" />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-400">크기 (Rem/Px)</label>
                                                                                    <input type="text" value={step.subtitleStyle?.fontSize || ''} onChange={(e) => updateStep(idx, { subtitleStyle: { ...step.subtitleStyle, fontSize: e.target.value } })} className="w-full border rounded px-1 text-[10px]" placeholder="0.875rem" />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </details>
                                                            </div>
                                                        </div>

                                                        {/* TYPE: INTRO */}
                                                        {step.type === 'intro' && (
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">페이지 가로 전체 너비 (모든 페이지 공통)</label>
                                                                    <select
                                                                        value={step.maxWidth || 'lg'}
                                                                        onChange={(e) => updateStep(idx, { maxWidth: e.target.value as any })}
                                                                        className="w-full border rounded p-2 text-xs bg-white"
                                                                    >
                                                                        <option value="sm">작게 (sm - 384px)</option>
                                                                        <option value="md">보통 (md - 448px)</option>
                                                                        <option value="lg">넓게 (lg - 512px - 추천)</option>
                                                                        <option value="xl">엑스트라 (xl - 576px)</option>
                                                                        <option value="2xl">가로 넓게 (2xl - 672px)</option>
                                                                        <option value="full">꽉 차게 (Full)</option>
                                                                    </select>
                                                                    <p className="text-[9px] text-gray-400 mt-1">※ 인트로에서 설정한 너비가 전체 스텝에 동일하게 적용됩니다.</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">헤드라인 (타이틀)</label>
                                                                    <div className="flex flex-col gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={step.title || ''}
                                                                            onChange={(e) => updateStep(idx, { title: e.target.value })}
                                                                            className="w-full border rounded p-2 text-xs"
                                                                            placeholder="메인 타이틀 입력"
                                                                            disabled={step.hideTitle}
                                                                        />
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={step.hideTitle || false}
                                                                                onChange={(e) => updateStep(idx, { hideTitle: e.target.checked })}
                                                                                className="rounded text-blue-600"
                                                                            />
                                                                            <span className="text-xs text-gray-600">타이틀 숨기기 (배경/콘텐츠만 강조)</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">삽입할 인라인 콘텐츠 (Video/Image)</label>
                                                                    <select
                                                                        value={step.insertedContentId || ''}
                                                                        onChange={(e) => updateStep(idx, { insertedContentId: e.target.value })}
                                                                        className="w-full border rounded p-2 text-xs bg-gray-50 text-gray-900"
                                                                    >
                                                                        <option value="">(선택 안함)</option>
                                                                        {(config.detailContent || []).map((c, cIdx) => (
                                                                            <option key={`ins-${c.id || cIdx}`} value={c.id || ''}>
                                                                                {c.type.toUpperCase()} - {c.content?.substring(0, 20) || '(내용 없음)'}...
                                                                            </option>
                                                                        ))}
                                                                    </select>

                                                                    {step.insertedContentId && (
                                                                        <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                                            <h5 className="text-[11px] font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                                                <Layout className="w-3.5 h-3.5 text-blue-500" /> 반응형 미디어 사이즈 설정
                                                                            </h5>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div className="space-y-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                                                                                    <div className="flex items-center gap-1.5 mb-1">
                                                                                        <Monitor className="w-3 h-3 text-blue-600" />
                                                                                        <span className="text-[10px] font-bold text-blue-700">PC 버전</span>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                        <div>
                                                                                            <label className="text-[9px] text-gray-500 block mb-1">가로 너비</label>
                                                                                            <input type="text" value={step.mediaStyles?.pcWidth || '100%'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, pcWidth: e.target.value } })} className="w-full border rounded-md px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-blue-400 outline-none" placeholder="100% or px" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="text-[9px] text-gray-500 block mb-1">세로 높이</label>
                                                                                            <input type="text" value={step.mediaStyles?.pcHeight || 'auto'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, pcHeight: e.target.value } })} className="w-full border rounded-md px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-blue-400 outline-none" placeholder="auto or px" />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-3 bg-purple-50/50 p-3 rounded-lg border border-purple-100/50">
                                                                                    <div className="flex items-center gap-1.5 mb-1">
                                                                                        <Smartphone className="w-3 h-3 text-purple-600" />
                                                                                        <span className="text-[10px] font-bold text-purple-700">모바일 버전</span>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                        <div>
                                                                                            <label className="text-[9px] text-gray-500 block mb-1">가로 너비</label>
                                                                                            <input type="text" value={step.mediaStyles?.mobileWidth || '100%'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, mobileWidth: e.target.value } })} className="w-full border rounded-md px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-purple-400 outline-none" placeholder="100% or px" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="text-[9px] text-gray-500 block mb-1 text-purple-600 font-semibold">세로 높이 (권장: 400px 이상)</label>
                                                                                            <input type="text" value={step.mediaStyles?.mobileHeight || 'auto'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, mobileHeight: e.target.value } })} className="w-full border-2 border-purple-200 rounded-md px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-purple-400 outline-none" placeholder="600px" />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <p className="text-[9px] text-blue-500 mt-2 bg-blue-50 p-2 rounded-md italic">
                                                                                ※ 모바일은 세로를 길게(예: 500px~700px) 설정하면 가독성이 훨씬 좋아집니다. 크기 초과 시 자동 스크롤됩니다.
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* NEW: Feature Grid Editor */}
                                                                <div className="mt-4 bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                                                                    <h5 className="text-[11px] font-bold text-blue-800 mb-3 flex items-center gap-2">
                                                                        <Star className="w-3.5 h-3.5 fill-blue-500 text-blue-500" /> 특징/혜택 그리드 (Feature Grid)
                                                                    </h5>
                                                                    <div className="space-y-3">
                                                                        {(step.features || []).map((feature, fIdx) => (
                                                                            <div key={fIdx} className="bg-gray-50 p-2 rounded border flex flex-col gap-2">
                                                                                <div className="flex gap-2">
                                                                                    <div className="w-12">
                                                                                        <label className="text-[9px] text-gray-400 block mb-1">아이콘</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={feature.icon || ''}
                                                                                            onChange={(e) => {
                                                                                                const newFeatures = [...(step.features || [])];
                                                                                                newFeatures[fIdx] = { ...newFeatures[fIdx], icon: e.target.value };
                                                                                                updateStep(idx, { features: newFeatures });
                                                                                            }}
                                                                                            className="w-full border rounded p-1 text-center text-sm"
                                                                                            placeholder="✅"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <label className="text-[9px] text-gray-400 block mb-1">매인 텍스트</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={feature.text || ''}
                                                                                            onChange={(e) => {
                                                                                                const newFeatures = [...(step.features || [])];
                                                                                                newFeatures[fIdx] = { ...newFeatures[fIdx], text: e.target.value };
                                                                                                updateStep(idx, { features: newFeatures });
                                                                                            }}
                                                                                            className="w-full border rounded p-1 text-xs font-bold"
                                                                                            placeholder="예: 무료 견적"
                                                                                        />
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newFeatures = (step.features || []).filter((_, i) => i !== fIdx);
                                                                                            updateStep(idx, { features: newFeatures });
                                                                                        }}
                                                                                        className="self-end p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded"
                                                                                    >
                                                                                        <Trash2 className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                                <div>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={feature.subText || ''}
                                                                                        onChange={(e) => {
                                                                                            const newFeatures = [...(step.features || [])];
                                                                                            newFeatures[fIdx] = { ...newFeatures[fIdx], subText: e.target.value };
                                                                                            updateStep(idx, { features: newFeatures });
                                                                                        }}
                                                                                        className="w-full border rounded p-1 text-[10px] text-gray-500 bg-white"
                                                                                        placeholder="부가 설명 (선택 사항)"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        <button
                                                                            onClick={() => {
                                                                                const newFeatures = [...(step.features || []), { id: `feat_${Date.now()}`, text: '새로운 장점', icon: '✅' }];
                                                                                updateStep(idx, { features: newFeatures });
                                                                            }}
                                                                            className="w-full py-2 border border-dashed border-blue-300 text-blue-500 rounded text-xs hover:bg-blue-50 transition-colors"
                                                                        >
                                                                            + 특징 항목 추가
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <label className="text-[11px] font-bold text-gray-700 flex items-center gap-2">
                                                                            <CheckSquare className="w-3.5 h-3.5 text-green-600" /> 인트로에 삽입할 질문 선택
                                                                        </label>
                                                                        <span className="text-[9px] text-gray-400">(인라인 미디어 하단에 표시됨)</span>
                                                                    </div>
                                                                    <div className="bg-white border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto shadow-inner">
                                                                        {(config.formConfig.fields || []).map((field) => (
                                                                            <label key={field.id} className="flex items-center gap-3 p-2.5 hover:bg-blue-50/50 rounded-md cursor-pointer transition-colors group">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={(step.fieldIds || []).includes(field.id)}
                                                                                    onChange={(e) => {
                                                                                        const currentIds = step.fieldIds || [];
                                                                                        let newIds = e.target.checked
                                                                                            ? [...currentIds, field.id]
                                                                                            : currentIds.filter(id => id !== field.id);
                                                                                        updateStep(idx, { fieldIds: newIds });
                                                                                    }}
                                                                                    className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                                                                />
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[11px] font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">{field.label}</span>
                                                                                    <span className="text-[9px] text-gray-400">{field.type === 'select' ? '선택형' : field.type === 'radio' ? '객관식' : '주관식'}</span>
                                                                                </div>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                    {(step.fieldIds?.length || 0) > 0 && (
                                                                        <>
                                                                            <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                                                                <div>
                                                                                    <label className="text-[10px] font-bold text-gray-600 block mb-1">한 화면 노출 개수</label>
                                                                                    <select
                                                                                        value={step.formStyle?.fieldsPerPage || 0}
                                                                                        onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, fieldsPerPage: parseInt(e.target.value) } })}
                                                                                        className="w-full border rounded py-1.5 px-2 text-[10px] outline-none hover:border-blue-400 transition-colors"
                                                                                    >
                                                                                        <option value={0}>전체 표시</option>
                                                                                        <option value={1}>1개씩</option>
                                                                                        <option value={2}>2개씩</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div className="flex items-end">
                                                                                    <p className="text-[9px] text-gray-400 leading-tight">질문이 많을 경우 '1개씩' 설정을 권장합니다.</p>
                                                                                </div>
                                                                            </div>

                                                                            {/* 질문 스타일링 옵션 */}
                                                                            <details className="mt-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100 overflow-hidden">
                                                                                <summary className="text-[11px] font-bold text-purple-700 cursor-pointer p-3 flex items-center gap-2 hover:bg-purple-100/50 transition-colors">
                                                                                    <Palette className="w-3.5 h-3.5" /> 삽입 질문 스타일링 (고급)
                                                                                </summary>
                                                                                <div className="p-3 space-y-4 bg-white/80">
                                                                                    {/* NEW: Mobile Layout Preset Selector */}
                                                                                    <div className="mb-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                                                        <label className="text-[11px] font-bold text-blue-700 flex items-center gap-2 mb-2">
                                                                                            <Smartphone className="w-3.5 h-3.5" /> 모바일 레이아웃 템플릿
                                                                                        </label>
                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {CONTAINER_PRESETS.map(preset => (
                                                                                                <button
                                                                                                    key={preset.value}
                                                                                                    onClick={() => updateStep(idx, { questionContainerStyle: preset.style })}
                                                                                                    className="px-2.5 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-md text-[10px] hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm"
                                                                                                >
                                                                                                    {preset.name}
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* 컨테이너 스타일 (Manual Controls - Updated to use questionContainerStyle) */}
                                                                                    <div className="space-y-2">
                                                                                        <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1">📦 질문 영역 컨테이너 (상세)</label>
                                                                                        <div className="grid grid-cols-2 gap-2">
                                                                                            <div>
                                                                                                <label className="text-[9px] text-gray-500 block mb-1">배경색</label>
                                                                                                <div className="flex gap-1">
                                                                                                    <input type="color" value={step.questionContainerStyle?.backgroundColor || '#ffffff10'} onChange={(e) => updateStep(idx, { questionContainerStyle: { ...step.questionContainerStyle, backgroundColor: e.target.value } })} className="h-7 w-7 cursor-pointer rounded border" />
                                                                                                    <input type="text" value={step.questionContainerStyle?.backgroundColor || ''} onChange={(e) => updateStep(idx, { questionContainerStyle: { ...step.questionContainerStyle, backgroundColor: e.target.value } })} className="flex-1 border rounded text-[10px] px-2" placeholder="rgba(0,0,0,0.2)" />
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-[9px] text-gray-500 block mb-1">테두리색</label>
                                                                                                <div className="flex gap-1">
                                                                                                    <input type="color" value={step.questionContainerStyle?.borderColor || '#ffffff20'} onChange={(e) => updateStep(idx, { questionContainerStyle: { ...step.questionContainerStyle, borderColor: e.target.value } })} className="h-7 w-7 cursor-pointer rounded border" />
                                                                                                    <input type="text" value={step.questionContainerStyle?.borderColor || ''} onChange={(e) => updateStep(idx, { questionContainerStyle: { ...step.questionContainerStyle, borderColor: e.target.value } })} className="flex-1 border rounded text-[10px] px-2" placeholder="rgba(255,255,255,0.1)" />
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-[9px] text-gray-500 block mb-1">모서리 둥글기</label>
                                                                                                <input type="text" value={step.questionContainerStyle?.borderRadius || ''} onChange={(e) => updateStep(idx, { questionContainerStyle: { ...step.questionContainerStyle, borderRadius: e.target.value } })} className="w-full border rounded text-[10px] px-2 py-1" placeholder="16px" />
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-[9px] text-gray-500 block mb-1">내부 여백</label>
                                                                                                <input type="text" value={step.questionContainerStyle?.padding || ''} onChange={(e) => updateStep(idx, { questionContainerStyle: { ...step.questionContainerStyle, padding: e.target.value } })} className="w-full border rounded text-[10px] px-2 py-1" placeholder="24px" />
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* 질문 라벨 스타일 */}
                                                                                    <div className="space-y-2 pt-3 border-t border-gray-100">
                                                                                        <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1">🏷️ 질문 라벨</label>
                                                                                        <div className="grid grid-cols-3 gap-2">
                                                                                            <div>
                                                                                                <label className="text-[9px] text-gray-500 block mb-1">글자색</label>
                                                                                                <div className="flex gap-1">
                                                                                                    <input type="color" value={step.formStyle?.questionColor || '#374151'} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, questionColor: e.target.value } })} className="h-7 w-7 cursor-pointer rounded border" />
                                                                                                    <input type="text" value={step.formStyle?.questionColor || ''} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, questionColor: e.target.value } })} className="flex-1 border rounded text-[10px] px-1" placeholder="#374151" />
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-[9px] text-gray-500 block mb-1">글자 크기</label>
                                                                                                <select value={step.formStyle?.questionSize || 'md'} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, questionSize: e.target.value } })} className="w-full border rounded text-[10px] px-1 py-1.5">
                                                                                                    <option value="sm">작게</option>
                                                                                                    <option value="md">보통</option>
                                                                                                    <option value="xl">크게</option>
                                                                                                </select>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-[9px] text-gray-500 block mb-1">폰트</label>
                                                                                                <input type="text" value={step.formStyle?.questionFont || ''} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, questionFont: e.target.value } })} className="w-full border rounded text-[10px] px-1 py-1" placeholder="Pretendard" />
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* 입력창 스타일 */}
                                                                                    <div className="space-y-2 pt-3 border-t border-gray-100">
                                                                                        <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1">📝 입력창</label>
                                                                                        <div className="grid grid-cols-2 gap-2">
                                                                                            <div>
                                                                                                <label className="text-[9px] text-gray-500 block mb-1">배경색</label>
                                                                                                <div className="flex gap-1">
                                                                                                    <input type="color" value={step.formStyle?.answerBgColor || '#ffffff'} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, answerBgColor: e.target.value } })} className="h-7 w-7 cursor-pointer rounded border" />
                                                                                                    <input type="text" value={step.formStyle?.answerBgColor || ''} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, answerBgColor: e.target.value } })} className="flex-1 border rounded text-[10px] px-1" placeholder="#ffffff" />
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-[9px] text-gray-500 block mb-1">글자색</label>
                                                                                                <div className="flex gap-1">
                                                                                                    <input type="color" value={step.formStyle?.answerColor || '#000000'} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, answerColor: e.target.value } })} className="h-7 w-7 cursor-pointer rounded border" />
                                                                                                    <input type="text" value={step.formStyle?.answerColor || ''} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, answerColor: e.target.value } })} className="flex-1 border rounded text-[10px] px-1" placeholder="#000000" />
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-[9px] text-gray-500 block mb-1">테두리색</label>
                                                                                                <div className="flex gap-1">
                                                                                                    <input type="color" value={step.formStyle?.answerBorderColor || '#e5e7eb'} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, answerBorderColor: e.target.value } })} className="h-7 w-7 cursor-pointer rounded border" />
                                                                                                    <input type="text" value={step.formStyle?.answerBorderColor || ''} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, answerBorderColor: e.target.value } })} className="flex-1 border rounded text-[10px] px-1" placeholder="#e5e7eb" />
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-[9px] text-gray-500 block mb-1">폰트 / 크기</label>
                                                                                                <div className="flex gap-1">
                                                                                                    <input type="text" value={step.formStyle?.answerFont || ''} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, answerFont: e.target.value } })} className="flex-1 border rounded text-[10px] px-1 py-1" placeholder="폰트명" />
                                                                                                    <input type="text" value={step.formStyle?.answerFontSize || ''} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, answerFontSize: e.target.value } })} className="w-16 border rounded text-[10px] px-1 py-1" placeholder="1rem" />
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </details>

                                                                            {/* Field Overrides UI */}
                                                                            <details className="mt-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 overflow-hidden">
                                                                                <summary className="text-[11px] font-bold text-blue-700 cursor-pointer p-3 flex items-center gap-2 hover:bg-blue-100/50 transition-colors">
                                                                                    <Settings className="w-3.5 h-3.5" /> 질문 필드 상세 설정 (라벨/타입 변경)
                                                                                </summary>
                                                                                <div className="p-3 space-y-4 bg-white/80">
                                                                                    {(step.fieldIds || []).map(fId => {
                                                                                        const originalField = config.formConfig.fields.find(f => f.id === fId);
                                                                                        if (!originalField) return null;
                                                                                        const override = step.fieldOverrides?.[fId] || {};
                                                                                        return (
                                                                                            <div key={fId} className="bg-white border rounded-lg p-3 shadow-sm">
                                                                                                <div className="flex items-center justify-between mb-2">
                                                                                                    <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                                                        원본: {originalField.label} ({originalField.type})
                                                                                                    </span>
                                                                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                                                                        <input
                                                                                                            type="checkbox"
                                                                                                            checked={override.required ?? originalField.required}
                                                                                                            onChange={(e) => {
                                                                                                                const newOverrides = { ...step.fieldOverrides };
                                                                                                                newOverrides[fId] = { ...newOverrides[fId], required: e.target.checked };
                                                                                                                updateStep(idx, { fieldOverrides: newOverrides });
                                                                                                            }}
                                                                                                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                                                                                                        />
                                                                                                        <span className="text-[10px] font-medium text-gray-600">필수 입력</span>
                                                                                                    </label>
                                                                                                </div>
                                                                                                <div className="space-y-2">
                                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                                        <div>
                                                                                                            <label className="text-[9px] text-gray-500 block mb-1">라벨 변경</label>
                                                                                                            <input
                                                                                                                type="text"
                                                                                                                value={override.label || ''}
                                                                                                                placeholder={originalField.label}
                                                                                                                onChange={(e) => {
                                                                                                                    const newOverrides = { ...step.fieldOverrides };
                                                                                                                    newOverrides[fId] = { ...newOverrides[fId], label: e.target.value };
                                                                                                                    updateStep(idx, { fieldOverrides: newOverrides });
                                                                                                                }}
                                                                                                                className="w-full border rounded px-2 py-1.5 text-[10px]"
                                                                                                            />
                                                                                                        </div>
                                                                                                        <div>
                                                                                                            <label className="text-[9px] text-gray-500 block mb-1">변수 ID ({originalField.id})</label>
                                                                                                            <input
                                                                                                                type="text"
                                                                                                                value={override.placeholder || ''}
                                                                                                                placeholder={originalField.placeholder || '플레이스홀더'}
                                                                                                                onChange={(e) => {
                                                                                                                    const newOverrides = { ...step.fieldOverrides };
                                                                                                                    newOverrides[fId] = { ...newOverrides[fId], placeholder: e.target.value };
                                                                                                                    updateStep(idx, { fieldOverrides: newOverrides });
                                                                                                                }}
                                                                                                                className="w-full border rounded px-2 py-1.5 text-[10px]"
                                                                                                            />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                                        <div>
                                                                                                            <label className="text-[9px] text-gray-500 block mb-1">입력 타입 변경</label>
                                                                                                            <select
                                                                                                                value={override.type || ''}
                                                                                                                onChange={(e) => {
                                                                                                                    const newOverrides = { ...step.fieldOverrides };
                                                                                                                    const val = e.target.value;
                                                                                                                    if (val) {
                                                                                                                        newOverrides[fId] = { ...newOverrides[fId], type: val as any };
                                                                                                                    } else {
                                                                                                                        const { type, ...rest } = newOverrides[fId] || {};
                                                                                                                        newOverrides[fId] = rest;
                                                                                                                    }
                                                                                                                    updateStep(idx, { fieldOverrides: newOverrides });
                                                                                                                }}
                                                                                                                className="w-full border rounded px-2 py-1.5 text-[10px] bg-white"
                                                                                                            >
                                                                                                                <option value="">(원본 유지 - {originalField.type})</option>
                                                                                                                <option value="text">단답형 텍스트 (text)</option>
                                                                                                                <option value="textarea">장문형 텍스트 (textarea)</option>
                                                                                                                <option value="tel">전화번호 (tel)</option>
                                                                                                                <option value="email">이메일 (email)</option>
                                                                                                                <option value="number">숫자 (number)</option>
                                                                                                                <option value="select">선택형 (select)</option>
                                                                                                                <option value="radio">라디오 버튼 (radio)</option>
                                                                                                                <option value="checkbox">체크박스 (checkbox)</option>
                                                                                                                <option value="date">날짜 (date)</option>
                                                                                                                <option value="time">시간 (time)</option>
                                                                                                                <option value="address">주소 검색 (address)</option>
                                                                                                            </select>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    {['select', 'radio', 'checkbox'].includes(override.type || originalField.type) && (
                                                                                                        <div>
                                                                                                            <label className="text-[9px] text-gray-500 block mb-1">옵션 설정 (콤마로 구분)</label>
                                                                                                            <textarea
                                                                                                                value={override.options ? override.options.map((o: any) => o.value).join(', ') : ''}
                                                                                                                placeholder={originalField.options ? originalField.options.map(o => o.value).join(', ') : "예: 옵션1, 옵션2, 옵션3"}
                                                                                                                onChange={(e) => {
                                                                                                                    const newOverrides = { ...step.fieldOverrides };
                                                                                                                    const val = e.target.value;
                                                                                                                    const opts = val.split(',').map(s => {
                                                                                                                        const text = s.trim();
                                                                                                                        return { label: text, value: text };
                                                                                                                    }).filter(o => o.value);
                                                                                                                    newOverrides[fId] = { ...newOverrides[fId], options: opts };
                                                                                                                    updateStep(idx, { fieldOverrides: newOverrides });
                                                                                                                }}
                                                                                                                className="w-full border rounded px-2 py-1.5 text-[10px] h-16"
                                                                                                            />
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </details>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {/* NEW: Background Styling */}
                                                                <div className="mt-4 pt-4 border-t">
                                                                    <h5 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1">
                                                                        <Palette className="w-3 h-3" />
                                                                        인트로 배경 설정 (톤앤매너)
                                                                    </h5>
                                                                    <div className="space-y-3">
                                                                        {/* Background Color */}
                                                                        <div>
                                                                            <label className="text-[10px] text-gray-500 block mb-1">배경 색상</label>
                                                                            <div className="flex gap-2">
                                                                                <input
                                                                                    type="color"
                                                                                    value={step.backgroundColor || '#1f2937'}
                                                                                    onChange={(e) => updateStep(idx, { backgroundColor: e.target.value })}
                                                                                    className="h-8 w-8 cursor-pointer rounded border"
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    value={step.backgroundColor || ''}
                                                                                    onChange={(e) => updateStep(idx, { backgroundColor: e.target.value })}
                                                                                    className="flex-1 border rounded text-xs px-2"
                                                                                    placeholder="#1f2937 (기본 다크 그레이)"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Background Image */}
                                                                        <div>
                                                                            <label className="text-[10px] text-gray-500 block mb-1">배경 이미지</label>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setIsImageManagerOpen(true);
                                                                                    setImagePickerCallback(() => (url: string) => {
                                                                                        updateStep(idx, { backgroundImage: url });
                                                                                        setIsImageManagerOpen(false);
                                                                                    });
                                                                                }}
                                                                                className="w-full border rounded p-2 text-xs hover:bg-gray-50 flex items-center justify-center gap-2"
                                                                            >
                                                                                <ImageIcon className="w-3 h-3" />
                                                                                {step.backgroundImage ? '이미지 변경' : '이미지 선택'}
                                                                            </button>
                                                                            {step.backgroundImage && (
                                                                                <div className="mt-2 relative">
                                                                                    <img src={step.backgroundImage} className="w-full h-20 object-cover rounded border" alt="Background" />
                                                                                    <button
                                                                                        onClick={() => updateStep(idx, { backgroundImage: undefined })}
                                                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                                                    >
                                                                                        <X className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Overlay Opacity */}
                                                                        <div>
                                                                            <label className="text-[10px] text-gray-500 block mb-1">
                                                                                오버레이 투명도: {step.backgroundOverlay ?? 60}%
                                                                            </label>
                                                                            <input
                                                                                type="range"
                                                                                min="0"
                                                                                max="100"
                                                                                value={step.backgroundOverlay ?? 60}
                                                                                onChange={(e) => updateStep(idx, { backgroundOverlay: parseInt(e.target.value) })}
                                                                                className="w-full"
                                                                            />
                                                                            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                                                                                <span>밝음 (0%)</span>
                                                                                <span>어두움 (100%)</span>
                                                                            </div>
                                                                        </div>

                                                                        <p className="text-[10px] text-blue-600 bg-blue-50 p-2 rounded">
                                                                            💡 인트로 배경은 콘텐츠/아웃트로 페이지에도 자동 적용됩니다 (톤앤매너 통일)
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* TYPE: OUTRO */}
                                                        {step.type === 'outro' && (
                                                            <div className="mt-4 border-t pt-4">
                                                                <label className="text-[10px] text-gray-500 block mb-1">삽입할 인라인 콘텐츠 (Video/Image)</label>
                                                                <select
                                                                    value={step.insertedContentId || ''}
                                                                    onChange={(e) => updateStep(idx, { insertedContentId: e.target.value })}
                                                                    className="w-full border rounded p-2 text-xs bg-gray-50 text-gray-900"
                                                                >
                                                                    <option value="">(선택 안함)</option>
                                                                    {(config.detailContent || []).map((c, cIdx) => (
                                                                        <option key={`ins-outro-${c.id || cIdx}`} value={c.id || ''}>
                                                                            {c.type.toUpperCase()} - {c.content?.substring(0, 20) || '(내용 없음)'}...
                                                                        </option>
                                                                    ))}
                                                                </select>

                                                                {step.insertedContentId && (
                                                                    <div className="mt-3 bg-white border border-red-100 rounded-xl p-4 shadow-sm">
                                                                        <h5 className="text-[11px] font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                                            <Layout className="w-3.5 h-3.5 text-red-500" /> 반응형 미디어 사이즈 설정 (아웃트로)
                                                                        </h5>
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                                    <Monitor className="w-3 h-3 text-gray-600" />
                                                                                    <span className="text-[10px] font-bold text-gray-700">PC 버전</span>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    <div>
                                                                                        <label className="text-[9px] text-gray-500 block mb-1">가로 너비</label>
                                                                                        <input type="text" value={step.mediaStyles?.pcWidth || '100%'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, pcWidth: e.target.value } })} className="w-full border rounded-md px-2 py-1.5 text-[10px]" placeholder="100%" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[9px] text-gray-500 block mb-1">세로 높이</label>
                                                                                        <input type="text" value={step.mediaStyles?.pcHeight || 'auto'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, pcHeight: e.target.value } })} className="w-full border rounded-md px-2 py-1.5 text-[10px]" placeholder="auto" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-3 bg-red-50/50 p-3 rounded-lg border border-red-100/50">
                                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                                    <Smartphone className="w-3 h-3 text-red-600" />
                                                                                    <span className="text-[10px] font-bold text-red-700">모바일 버전</span>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    <div>
                                                                                        <label className="text-[9px] text-gray-500 block mb-1">가로 너비</label>
                                                                                        <input type="text" value={step.mediaStyles?.mobileWidth || '100%'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, mobileWidth: e.target.value } })} className="w-full border rounded-md px-2 py-1.5 text-[10px]" placeholder="100%" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[9px] text-gray-500 block mb-1 text-red-600 font-semibold">세로 높이</label>
                                                                                        <input type="text" value={step.mediaStyles?.mobileHeight || 'auto'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, mobileHeight: e.target.value } })} className="w-full border-2 border-red-200 rounded-md px-2 py-1.5 text-[10px]" placeholder="600px" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <label className="text-[11px] font-bold text-gray-700 flex items-center gap-2">
                                                                            <CheckSquare className="w-3.5 h-3.5 text-red-600" /> 아웃트로에 삽입할 질문 선택
                                                                        </label>
                                                                        <span className="text-[9px] text-gray-400">(질문이 많을 경우 여기에 모아서 표시 가능)</span>
                                                                    </div>
                                                                    <div className="bg-white border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto shadow-inner">
                                                                        {(config.formConfig.fields || []).map((field) => (
                                                                            <label key={field.id} className="flex items-center gap-3 p-2.5 hover:bg-red-50/50 rounded-md cursor-pointer transition-colors group">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={(step.fieldIds || []).includes(field.id)}
                                                                                    onChange={(e) => {
                                                                                        const currentIds = step.fieldIds || [];
                                                                                        let newIds = e.target.checked
                                                                                            ? [...currentIds, field.id]
                                                                                            : currentIds.filter(id => id !== field.id);
                                                                                        updateStep(idx, { fieldIds: newIds });
                                                                                    }}
                                                                                    className="w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500"
                                                                                />
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[11px] font-semibold text-gray-700 group-hover:text-red-700 transition-colors">{field.label}</span>
                                                                                    <span className="text-[9px] text-gray-400">{field.type}</span>
                                                                                </div>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                    {(step.fieldIds?.length || 0) > 0 && (
                                                                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                                                            <label className="text-[10px] font-bold text-gray-600 block mb-1">질문 배치 설정</label>
                                                                            <select
                                                                                value={step.formStyle?.fieldsPerPage || 0}
                                                                                onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, fieldsPerPage: parseInt(e.target.value) } })}
                                                                                className="w-full border rounded py-1.5 px-2 text-[10px] outline-none hover:border-red-400 transition-colors"
                                                                            >
                                                                                <option value={0}>전체 표시</option>
                                                                                <option value={1}>1개씩</option>
                                                                                <option value={2}>2개씩</option>
                                                                            </select>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Policy/Terms Agreement Style Settings */}
                                                                <details className="mt-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 overflow-hidden">
                                                                    <summary className="text-[11px] font-bold text-orange-700 cursor-pointer p-3 flex items-center gap-2 hover:bg-orange-100/50 transition-colors">
                                                                        📜 약관 동의 영역 스타일링 (모바일 최적화)
                                                                    </summary>
                                                                    <div className="p-3 space-y-4 bg-white/80">
                                                                        {/* Container Style */}
                                                                        <div className="space-y-2">
                                                                            <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1">📦 약관 동의 컨테이너</label>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-500 block mb-1">배경색</label>
                                                                                    <div className="flex gap-1">
                                                                                        <input type="color" value={step.policyStyle?.backgroundColor || '#f9fafb'} onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, backgroundColor: e.target.value } })} className="h-7 w-7 cursor-pointer rounded border" />
                                                                                        <input type="text" value={step.policyStyle?.backgroundColor || ''} onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, backgroundColor: e.target.value } })} className="flex-1 border rounded text-[10px] px-2" placeholder="rgba(255,255,255,0.05)" />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-500 block mb-1">테두리색</label>
                                                                                    <div className="flex gap-1">
                                                                                        <input type="color" value={step.policyStyle?.borderColor || '#f3f4f6'} onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, borderColor: e.target.value } })} className="h-7 w-7 cursor-pointer rounded border" />
                                                                                        <input type="text" value={step.policyStyle?.borderColor || ''} onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, borderColor: e.target.value } })} className="flex-1 border rounded text-[10px] px-2" placeholder="rgba(255,255,255,0.1)" />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-500 block mb-1">모서리 둥글기</label>
                                                                                    <input type="text" value={step.policyStyle?.borderRadius || ''} onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, borderRadius: e.target.value } })} className="w-full border rounded text-[10px] px-2 py-1" placeholder="1rem" />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-500 block mb-1">내부 여백</label>
                                                                                    <input type="text" value={step.policyStyle?.padding || ''} onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, padding: e.target.value } })} className="w-full border rounded text-[10px] px-2 py-1" placeholder="1.5rem" />
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Size Control */}
                                                                        <div className="space-y-2 pt-3 border-t border-gray-100">
                                                                            <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1">📐 크기 조정 (모바일 대응)</label>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-500 block mb-1">최대 높이</label>
                                                                                    <input type="text" value={step.policyStyle?.containerMaxHeight || ''} onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, containerMaxHeight: e.target.value } })} className="w-full border rounded text-[10px] px-2 py-1" placeholder="예: 200px, 50vh" />
                                                                                    <p className="text-[8px] text-gray-400 mt-0.5">설정 시 스크롤 지원</p>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-orange-600 font-semibold block mb-1">📱 모바일 전용 패딩</label>
                                                                                    <input type="text" value={step.policyStyle?.mobilePadding || ''} onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, mobilePadding: e.target.value } })} className="w-full border-2 border-orange-200 rounded text-[10px] px-2 py-1" placeholder="예: 0.75rem" />
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Typography */}
                                                                        <div className="space-y-2 pt-3 border-t border-gray-100">
                                                                            <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1">🔤 글꼴 및 레이아웃</label>
                                                                            <div className="grid grid-cols-3 gap-2">
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-500 block mb-1">헤더 글자 크기</label>
                                                                                    <input type="text" value={step.policyStyle?.labelFontSize || ''} onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, labelFontSize: e.target.value } })} className="w-full border rounded text-[10px] px-2 py-1" placeholder="1rem" />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-500 block mb-1">항목 글자 크기</label>
                                                                                    <input type="text" value={step.policyStyle?.itemFontSize || ''} onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, itemFontSize: e.target.value } })} className="w-full border rounded text-[10px] px-2 py-1" placeholder="0.875rem" />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] text-gray-500 block mb-1">항목 간격</label>
                                                                                    <input type="text" value={step.policyStyle?.itemGap || ''} onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, itemGap: e.target.value } })} className="w-full border rounded text-[10px] px-2 py-1" placeholder="0.5rem" />
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Hide Background Toggle */}
                                                                        <div className="pt-3 border-t border-gray-100">
                                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={step.policyStyle?.hideBackground || false}
                                                                                    onChange={(e) => updateStep(idx, { policyStyle: { ...step.policyStyle, hideBackground: e.target.checked } })}
                                                                                    className="rounded text-orange-600 focus:ring-orange-500"
                                                                                />
                                                                                <span className="text-[10px] font-medium text-gray-700">배경 숨기기 (투명 모드)</span>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </details>
                                                            </div>
                                                        )}

                                                        {/* TYPE: CONTENT */}
                                                        {step.type === 'content' && (
                                                            <div>
                                                                <label className="text-[10px] text-gray-500 block mb-1">연결할 상세 콘텐츠 선택</label>
                                                                <select
                                                                    value={step.contentId || ''}
                                                                    onChange={(e) => updateStep(idx, { contentId: e.target.value })}
                                                                    className="w-full border rounded p-2 text-xs bg-purple-50"
                                                                >
                                                                    <option value="">콘텐츠를 선택하세요</option>
                                                                    {(config.detailContent || []).map((c, cIdx) => (
                                                                        <option key={c.id || cIdx} value={c.id || ''}>
                                                                            {c.type.toUpperCase()} - {c.content?.substring(0, 20) || '(내용 없음)'}...
                                                                        </option>
                                                                    ))}
                                                                </select>

                                                                {step.contentId && (
                                                                    <div className="mt-3 bg-white border border-purple-100 rounded-xl p-4 shadow-sm">
                                                                        <h5 className="text-[11px] font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                                            <Layout className="w-3.5 h-3.5 text-purple-500" /> 반응형 미디어 사이즈 설정 (콘텐츠)
                                                                        </h5>
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                                    <Monitor className="w-3 h-3 text-gray-600" />
                                                                                    <span className="text-[10px] font-bold text-gray-700">PC 버전</span>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    <div>
                                                                                        <label className="text-[9px] text-gray-500 block mb-1">가로 너비</label>
                                                                                        <input type="text" value={step.mediaStyles?.pcWidth || '100%'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, pcWidth: e.target.value } })} className="w-full border rounded-md px-2 py-1.5 text-[10px]" placeholder="100%" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[9px] text-gray-400 block mb-1">세로 높이</label>
                                                                                        <input type="text" value={step.mediaStyles?.pcHeight || 'auto'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, pcHeight: e.target.value } })} className="w-full border rounded-md px-2 py-1.5 text-[10px]" placeholder="auto" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-3 bg-purple-50/50 p-3 rounded-lg border border-purple-100/50">
                                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                                    <Smartphone className="w-3 h-3 text-purple-600" />
                                                                                    <span className="text-[10px] font-bold text-purple-700">모바일 버전</span>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    <div>
                                                                                        <label className="text-[9px] text-gray-500 block mb-1">가로 너비</label>
                                                                                        <input type="text" value={step.mediaStyles?.mobileWidth || '100%'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, mobileWidth: e.target.value } })} className="w-full border rounded-md px-2 py-1.5 text-[10px]" placeholder="100%" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[9px] text-gray-500 block mb-1 text-purple-600 font-semibold">세로 높이</label>
                                                                                        <input type="text" value={step.mediaStyles?.mobileHeight || 'auto'} onChange={(e) => updateStep(idx, { mediaStyles: { ...step.mediaStyles, mobileHeight: e.target.value } })} className="w-full border-2 border-purple-200 rounded-md px-2 py-1.5 text-[10px]" placeholder="600px" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <label className="text-[11px] font-bold text-gray-700 flex items-center gap-2">
                                                                            <CheckSquare className="w-3.5 h-3.5 text-purple-600" /> 콘텐츠에 삽입할 질문 선택
                                                                        </label>
                                                                        <span className="text-[9px] text-gray-400">(상세 정보 하단에 질문 표시)</span>
                                                                    </div>
                                                                    <div className="bg-white border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto shadow-inner">
                                                                        {(config.formConfig.fields || []).map((field) => (
                                                                            <label key={field.id} className="flex items-center gap-3 p-2.5 hover:bg-purple-50/50 rounded-md cursor-pointer transition-colors group">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={(step.fieldIds || []).includes(field.id)}
                                                                                    onChange={(e) => {
                                                                                        const currentIds = step.fieldIds || [];
                                                                                        let newIds = e.target.checked
                                                                                            ? [...currentIds, field.id]
                                                                                            : currentIds.filter(id => id !== field.id);
                                                                                        updateStep(idx, { fieldIds: newIds });
                                                                                    }}
                                                                                    className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500"
                                                                                />
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[11px] font-semibold text-gray-700 group-hover:text-purple-700 transition-colors">{field.label}</span>
                                                                                    <span className="text-[9px] text-gray-400">{field.type}</span>
                                                                                </div>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                    {(step.fieldIds?.length || 0) > 0 && (
                                                                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                                                            <label className="text-[10px] font-bold text-gray-600 block mb-1">질문 배치 설정</label>
                                                                            <select
                                                                                value={step.formStyle?.fieldsPerPage || 0}
                                                                                onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, fieldsPerPage: parseInt(e.target.value) } })}
                                                                                className="w-full border rounded py-1.5 px-2 text-[10px] outline-none hover:border-purple-400 transition-colors"
                                                                            >
                                                                                <option value={0}>전체 표시</option>
                                                                                <option value={1}>1개씩</option>
                                                                                <option value={2}>2개씩</option>
                                                                            </select>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* TYPE: FORM */}
                                                        {step.type === 'form' && (
                                                            <div className="space-y-3">
                                                                {/* NEW: Top Content Editor used in Lawjd2 */}
                                                                <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-3">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <label className="text-[11px] font-bold text-green-800 flex items-center gap-2">
                                                                            <Layout className="w-3.5 h-3.5" /> 폼 상단 콘텐츠 (Top Content)
                                                                        </label>
                                                                        {step.topContent && (
                                                                            <button
                                                                                onClick={() => updateStep(idx, { topContent: undefined })}
                                                                                className="text-[9px] text-red-500 hover:text-red-700 underline"
                                                                            >
                                                                                삭제
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {!step.topContent ? (
                                                                        <div className="grid grid-cols-4 gap-2">
                                                                            {['text', 'image', 'youtube', 'video'].map(t => (
                                                                                <button
                                                                                    key={t}
                                                                                    onClick={() => updateStep(idx, {
                                                                                        topContent: {
                                                                                            id: `top_${Date.now()}`,
                                                                                            type: t as any,
                                                                                            content: ''
                                                                                        }
                                                                                    })}
                                                                                    className="py-2 bg-white border border-green-200 rounded text-[10px] text-green-700 hover:bg-green-100 transition-colors"
                                                                                >
                                                                                    {t === 'text' ? '텍스트/HTML' : t === 'image' ? '이미지' : t === 'youtube' ? '유튜브' : '비디오'}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1">
                                                                                <span className="font-bold uppercase text-green-600">{step.topContent.type}</span> 선택됨
                                                                            </div>

                                                                            {step.topContent.type === 'text' && (
                                                                                <textarea
                                                                                    value={step.topContent.content}
                                                                                    onChange={(e) => updateStep(idx, { topContent: { ...step.topContent!, content: e.target.value } })}
                                                                                    className="w-full border rounded p-2 text-xs h-20"
                                                                                    placeholder="여기에 텍스트나 HTML 태그를 입력하세요"
                                                                                />
                                                                            )}

                                                                            {(step.topContent.type === 'image' || step.topContent.type === 'video' || step.topContent.type === 'youtube') && (
                                                                                <div className="flex gap-2">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={step.topContent.content}
                                                                                        onChange={(e) => updateStep(idx, { topContent: { ...step.topContent!, content: e.target.value } })}
                                                                                        className="flex-1 border rounded p-2 text-xs"
                                                                                        placeholder={step.topContent.type === 'youtube' ? 'YouTube URL 입력' : '미디어 URL 입력'}
                                                                                    />
                                                                                    {step.topContent.type === 'image' && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setIsImageManagerOpen(true);
                                                                                                setImagePickerCallback(() => (url: string) => {
                                                                                                    updateStep(idx, { topContent: { ...step.topContent!, content: url } });
                                                                                                    setIsImageManagerOpen(false);
                                                                                                });
                                                                                            }}
                                                                                            className="p-2 bg-white border rounded text-xs hover:bg-gray-50"
                                                                                        >
                                                                                            <ImageIcon className="w-4 h-4 text-gray-500" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">페이지당 질문 개수</label>
                                                                    <select
                                                                        value={step.formStyle?.fieldsPerPage ?? 2}
                                                                        onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, fieldsPerPage: parseInt(e.target.value) } })}
                                                                        className="w-full border rounded p-2 text-xs"
                                                                    >
                                                                        <option value={1}>1개씩 (페이지당 한 질문)</option>
                                                                        <option value={2}>2개씩 (기본)</option>
                                                                        <option value={3}>3개씩</option>
                                                                        <option value={0}>한 페이지에 모두 표시</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">상단 타이틀 (선택)</label>
                                                                    <input
                                                                        type="text"
                                                                        value={step.title || ''}
                                                                        onChange={(e) => updateStep(idx, { title: e.target.value })}
                                                                        className="w-full border rounded p-2 text-xs"
                                                                        placeholder="질문 그룹 제목"
                                                                    />
                                                                </div>

                                                                <div className="bg-gray-50 p-2 rounded">
                                                                    <label className="text-[10px] text-gray-500 block mb-1">표시할 입력 항목 선택</label>
                                                                    <div className="bg-white border rounded p-2 space-y-1 max-h-40 overflow-y-auto">
                                                                        {(config.formConfig.fields || []).map((field) => (
                                                                            <label key={field.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={(step.fieldIds || []).includes(field.id)}
                                                                                    onChange={(e) => {
                                                                                        const currentIds = step.fieldIds || [];
                                                                                        let newIds = e.target.checked
                                                                                            ? [...currentIds, field.id]
                                                                                            : currentIds.filter(id => id !== field.id);
                                                                                        updateStep(idx, { fieldIds: newIds });
                                                                                    }}
                                                                                    className="rounded text-green-600 focus:ring-green-500"
                                                                                />
                                                                                <span className="text-xs text-gray-700">{field.label} ({field.type})</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Form Styling */}
                                                                <div className="bg-green-50 p-2 rounded">
                                                                    <details>
                                                                        <summary className="text-[10px] font-bold text-green-700 cursor-pointer">질문/답변 디자인 설정 (펼치기)</summary>
                                                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                                                            <div>
                                                                                <label className="text-[10px] text-gray-500 block">질문 글자 크기</label>
                                                                                <select
                                                                                    value={step.formStyle?.questionSize || 'lg'} // default 
                                                                                    onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, questionSize: e.target.value } })}
                                                                                    className="w-full border rounded text-xs p-1"
                                                                                >
                                                                                    <option value="sm">작게</option>
                                                                                    <option value="base">보통</option>
                                                                                    <option value="lg">크게 (기본)</option>
                                                                                    <option value="xl">매우 크게</option>
                                                                                </select>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-[10px] text-gray-500 block">질문 글자색</label>
                                                                                <input type="color" value={step.formStyle?.questionColor || '#374151'} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, questionColor: e.target.value } })} className="w-full h-8 cursor-pointer rounded border" />
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-[10px] text-gray-500 block">답변(버튼) 배경</label>
                                                                                <div className="flex gap-2">
                                                                                    <input type="color" value={step.formStyle?.answerBgColor || '#ffffff'} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, answerBgColor: e.target.value } })} className="h-8 w-8 cursor-pointer rounded border" />
                                                                                    <input type="color" value={step.formStyle?.answerColor || '#000000'} onChange={(e) => updateStep(idx, { formStyle: { ...step.formStyle, answerColor: e.target.value } })} className="h-8 w-8 cursor-pointer rounded border" title="글자색" />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </details>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* TYPE: OUTRO */}
                                                        {step.type === 'outro' && (
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">상단 타이틀 (선택)</label>
                                                                    <input
                                                                        type="text"
                                                                        value={step.title || ''}
                                                                        onChange={(e) => updateStep(idx, { title: e.target.value })}
                                                                        className="w-full border rounded p-2 text-xs"
                                                                        placeholder="마무리 메시지 제목"
                                                                    />
                                                                </div>

                                                                <div className="bg-red-50 p-3 rounded">
                                                                    <label className="text-xs font-bold text-red-700 block mb-2">약관 동의 설정</label>
                                                                    <div className="space-y-2">
                                                                        {[
                                                                            { key: 'showPrivacy', label: '개인정보 수집 및 이용 동의' },
                                                                            { key: 'showTerms', label: '이용약관 동의' },
                                                                            { key: 'showMarketing', label: '마케팅 정보 수신 동의' },
                                                                            { key: 'showThirdParty', label: '제3자 정보 제공 동의' }
                                                                        ].map((policy) => (
                                                                            <label key={policy.key} className="flex items-center gap-2 cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={!!(step.policyConfig as any)?.[policy.key]}
                                                                                    onChange={(e) => updateStep(idx, {
                                                                                        policyConfig: { ...step.policyConfig, [policy.key]: e.target.checked }
                                                                                    })}
                                                                                    className="rounded text-red-600 focus:ring-red-500"
                                                                                />
                                                                                <span className="text-xs text-gray-700">{policy.label}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-500 mt-2">
                                                                        * 체크된 항목은 제출 전 필수(또는 선택) 동의를 받습니다.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            }

                            {
                                activeTab === 'location' && (
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
                                )
                            }



                            {/* --- FEATURES TAB (Smart Block) --- */}
                            {
                                activeTab === 'features' && (
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

                                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                                                            <button
                                                                                onClick={() => openImagePicker((url) => {
                                                                                    const newItems = [...(config.features?.items || [])];
                                                                                    newItems[idx] = { ...newItems[idx], imageUrl: url };
                                                                                    updateNested(['features', 'items'], newItems);
                                                                                })}
                                                                                className="cursor-pointer text-white text-xs underline bg-transparent border-none hover:text-blue-300"
                                                                            >
                                                                                이미지 업로드
                                                                            </button>
                                                                            {item.imageUrl && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newItems = [...(config.features?.items || [])];
                                                                                        newItems[idx] = { ...newItems[idx], imageUrl: '' };
                                                                                        updateNested(['features', 'items'], newItems);
                                                                                    }}
                                                                                    className="text-red-300 text-xs underline hover:text-red-400"
                                                                                >
                                                                                    삭제
                                                                                </button>
                                                                            )}
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

                                                {/* NEW: Slide Banner Section */}
                                                <div className="border-t pt-4 mt-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                                            🖼️ 슬라이드 배너 (자동 롤링)
                                                        </h4>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <span className="text-[10px] text-gray-500">사용</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={config.features?.slideBanner?.isShow ?? false}
                                                                onChange={(e) => updateNested(['features', 'slideBanner', 'isShow'], e.target.checked)}
                                                                className="rounded text-purple-600 focus:ring-purple-500"
                                                            />
                                                        </label>
                                                    </div>

                                                    {config.features?.slideBanner?.isShow && (
                                                        <div className="space-y-3 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                            {/* Image List */}
                                                            <div>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <label className="text-[10px] text-gray-600 font-bold">배너 이미지 (최대 10개)</label>
                                                                    <span className="text-[10px] text-gray-400">
                                                                        {config.features?.slideBanner?.images?.length || 0}/10
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-2 flex-wrap">
                                                                    {(config.features?.slideBanner?.images || []).map((img, imgIdx) => (
                                                                        <div key={imgIdx} className="relative group w-16 h-12 rounded border overflow-hidden bg-gray-100">
                                                                            <img src={img} alt={`slide-${imgIdx}`} className="w-full h-full object-cover" />
                                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newImages = (config.features?.slideBanner?.images || []).filter((_, i) => i !== imgIdx);
                                                                                        updateNested(['features', 'slideBanner', 'images'], newImages);
                                                                                    }}
                                                                                    className="text-red-400 hover:text-red-300"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {(config.features?.slideBanner?.images?.length || 0) < 10 && (
                                                                        <button
                                                                            onClick={() => openImagePicker((url) => {
                                                                                const currentImages = config.features?.slideBanner?.images || [];
                                                                                if (currentImages.length < 10) {
                                                                                    updateNested(['features', 'slideBanner', 'images'], [...currentImages, url]);
                                                                                }
                                                                            })}
                                                                            className="w-16 h-12 rounded border-2 border-dashed border-purple-300 flex items-center justify-center text-purple-400 hover:border-purple-500 hover:text-purple-600 transition-colors"
                                                                        >
                                                                            <Plus className="w-5 h-5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Settings */}
                                                            <div className="grid grid-cols-3 gap-3">
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={config.features?.slideBanner?.autoSlide ?? true}
                                                                        onChange={(e) => updateNested(['features', 'slideBanner', 'autoSlide'], e.target.checked)}
                                                                        className="rounded text-purple-600 focus:ring-purple-500"
                                                                    />
                                                                    <span className="text-[10px] text-gray-600">자동 슬라이드</span>
                                                                </label>
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">슬라이드 간격</label>
                                                                    <select
                                                                        value={config.features?.slideBanner?.intervalMs || 3000}
                                                                        onChange={(e) => updateNested(['features', 'slideBanner', 'intervalMs'], parseInt(e.target.value))}
                                                                        className="w-full border rounded p-1 text-[10px]"
                                                                    >
                                                                        <option value={2000}>2초</option>
                                                                        <option value={3000}>3초 (기본)</option>
                                                                        <option value={4000}>4초</option>
                                                                        <option value={5000}>5초</option>
                                                                        <option value={7000}>7초</option>
                                                                        <option value={10000}>10초</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">배너 높이</label>
                                                                    <select
                                                                        value={config.features?.slideBanner?.height || 'auto'}
                                                                        onChange={(e) => updateNested(['features', 'slideBanner', 'height'], e.target.value)}
                                                                        className="w-full border rounded p-1 text-[10px]"
                                                                    >
                                                                        <option value="auto">자동 (비율유지)</option>
                                                                        <option value="xs">아주 작게 (150px)</option>
                                                                        <option value="sm">작게 (200px)</option>
                                                                        <option value="md">보통 (300px)</option>
                                                                        <option value="lg">크게 (400px)</option>
                                                                        <option value="xl">아주 크게 (500px)</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            {/* Gap Settings */}
                                                            <div className="mt-3">
                                                                <label className="text-[10px] text-gray-500 block mb-1">컨테이너 여백</label>
                                                                <select
                                                                    value={config.features?.slideBanner?.gap ?? 3}
                                                                    onChange={(e) => updateNested(['features', 'slideBanner', 'gap'], parseInt(e.target.value))}
                                                                    className="w-full border rounded p-1 text-[10px]"
                                                                >
                                                                    <option value={0}>없음 (0px)</option>
                                                                    <option value={1}>아주 좁게 (8px)</option>
                                                                    <option value={2}>좁게 (16px)</option>
                                                                    <option value={3}>보통 (24px)</option>
                                                                    <option value={4}>넓게 (32px)</option>
                                                                    <option value={5}>아주 넓게 (48px)</option>
                                                                </select>
                                                            </div>

                                                            {/* Indicator Color */}
                                                            <div className="mt-3">
                                                                <label className="text-[10px] text-gray-500 block mb-1">인디케이터 색상</label>
                                                                <div className="flex gap-2 items-center">
                                                                    <input
                                                                        type="color"
                                                                        value={config.features?.slideBanner?.indicatorColor || '#ffffff'}
                                                                        onChange={(e) => updateNested(['features', 'slideBanner', 'indicatorColor'], e.target.value)}
                                                                        className="w-8 h-8 rounded border cursor-pointer"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={config.features?.slideBanner?.indicatorColor || '#ffffff'}
                                                                        onChange={(e) => updateNested(['features', 'slideBanner', 'indicatorColor'], e.target.value)}
                                                                        className="flex-1 border rounded p-1 text-[10px]"
                                                                        placeholder="#ffffff"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <p className="text-[9px] text-gray-400 mt-2">
                                                                * 이미지가 자동으로 오른쪽으로 슬라이드됩니다. 사용자가 화살표나 스와이프로 넘길 수도 있습니다.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            }



                            {/* --- FOOTER TAB (NEW) --- */}
                            {
                                activeTab === 'footer' && (
                                    <div className="space-y-6 animate-fade-in">

                                        {/* Footer Images */}
                                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <ImageIcon className="w-4 h-4 text-green-600" /> 하단 이미지
                                                    <button
                                                        onClick={() => openImagePicker((url) => addFooterImage(url))}
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
                                )
                            }
                            {/* --- SEO TAB (NEW) --- */}
                            {
                                activeTab === 'seo' && (
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
                                )
                            }

                            {/* --- LAYOUT TAB (NEW) --- */}
                            {
                                activeTab === 'layout' && (
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
                                )
                            }

                            {/* --- GALLERY TAB (NEW) --- */}
                            {
                                activeTab === 'gallery' && (
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
                                                    {/* Layout Selector (NEW) */}
                                                    <div className="mb-3">
                                                        <label className="text-xs font-bold text-gray-500 mb-2 block">레이아웃 스타일</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                onClick={() => updateNested(['gallery', 'layout'], 'grid-2')}
                                                                className={`p-2 border rounded text-xs transition-all ${(!config.gallery.layout || config.gallery.layout.startsWith('grid'))
                                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                                    }`}
                                                            >
                                                                그리드 (Grid)
                                                            </button>
                                                            <button
                                                                onClick={() => updateNested(['gallery', 'layout'], 'masonry')}
                                                                className={`p-2 border rounded text-xs transition-all ${config.gallery.layout === 'masonry'
                                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                                    }`}
                                                            >
                                                                메이슨리 (Masonry)
                                                            </button>
                                                        </div>
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
                                                            <button onClick={() => openImagePicker((url) => updateNested(['gallery', 'images'], [...(config.gallery?.images || []), url]))} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
                                                                <Upload className="w-3 h-3" /> 업로드
                                                            </button>
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
                                )
                            }

                            {/* --- BOARD TAB (NEW) --- */}
                            {
                                activeTab === 'board' && (
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
                                )
                            }

                            {/* --- SNS TAB (NEW) --- */}
                            {
                                activeTab === 'sns' && (
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

                                                    {/* Icon Size & Gap Controls (NEW) */}
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 mb-2 block">아이콘 크기 (px)</label>
                                                            <input
                                                                type="range"
                                                                min="24"
                                                                max="64"
                                                                step="4"
                                                                value={config.snsConfig?.style?.iconSize || 40}
                                                                onChange={(e) => updateNested(['snsConfig', 'style', 'iconSize'], parseInt(e.target.value))}
                                                                className="w-full"
                                                            />
                                                            <div className="text-center text-xs text-gray-600 mt-1 font-mono">
                                                                {config.snsConfig?.style?.iconSize || 40}px
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 mb-2 block">아이콘 간격 (px)</label>
                                                            <input
                                                                type="range"
                                                                min="4"
                                                                max="24"
                                                                step="2"
                                                                value={config.snsConfig?.style?.gap || 12}
                                                                onChange={(e) => updateNested(['snsConfig', 'style', 'gap'], parseInt(e.target.value))}
                                                                className="w-full"
                                                            />
                                                            <div className="text-center text-xs text-gray-600 mt-1 font-mono">
                                                                {config.snsConfig?.style?.gap || 12}px
                                                            </div>
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

                                                    <div className="border-t border-gray-200 pt-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-xs font-bold text-gray-700">SNS 링크 목록 ({config.snsConfig?.items?.length || 0}/5)</h4>
                                                            <button
                                                                onClick={() => {
                                                                    const currentItems = config.snsConfig?.items || [];
                                                                    if (currentItems.length >= 5) {
                                                                        alert('최대 5개까지만 추가 가능합니다.');
                                                                        return;
                                                                    }
                                                                    updateNested(['snsConfig', 'items'], [
                                                                        ...currentItems,
                                                                        { id: crypto.randomUUID(), type: 'custom', url: '', label: '' }
                                                                    ]);
                                                                }}
                                                                className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs hover:bg-blue-100 font-bold"
                                                            >
                                                                <Plus className="w-3 h-3" /> 추가
                                                            </button>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {config.snsConfig?.items?.map((item, idx) => (
                                                                <div key={item.id} className="bg-white border rounded p-3 relative group space-y-3">
                                                                    <button
                                                                        onClick={() => {
                                                                            const newItems = config.snsConfig!.items!.filter((_, i) => i !== idx);
                                                                            updateNested(['snsConfig', 'items'], newItems);
                                                                        }}
                                                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>

                                                                    <div className="flex gap-3">
                                                                        {/* Icon Preview / Upload */}
                                                                        <div className="w-16 h-16 shrink-0 bg-gray-100 rounded-full border flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 relative"
                                                                            onClick={() => {
                                                                                openImagePicker((url) => {
                                                                                    const newItems = [...config.snsConfig!.items!];
                                                                                    newItems[idx] = { ...newItems[idx], customIconUrl: url };
                                                                                    updateNested(['snsConfig', 'items'], newItems);
                                                                                });
                                                                            }}
                                                                        >
                                                                            {item.customIconUrl ? (
                                                                                <img src={item.customIconUrl} alt="Icon" className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="text-center text-gray-400">
                                                                                    {item.type === 'custom' ? <Upload className="w-4 h-4 mx-auto" /> :
                                                                                        item.type === 'kakao' ? <MessageCircle className="w-6 h-6 text-yellow-400 fill-current" /> :
                                                                                            item.type === 'instagram' ? <Instagram className="w-6 h-6 text-pink-500" /> :
                                                                                                item.type === 'youtube' ? <Youtube className="w-6 h-6 text-red-500" /> :
                                                                                                    <Globe className="w-6 h-6 text-green-500" />
                                                                                    }
                                                                                </div>
                                                                            )}
                                                                            <input
                                                                                type="file"
                                                                                id={`sns-icon-${item.id}`}
                                                                                className="hidden"
                                                                                accept="image/*"
                                                                                onChange={(e) => handleImageUpload(e, (url) => {
                                                                                    const newItems = [...config.snsConfig!.items!];
                                                                                    newItems[idx] = { ...newItems[idx], customIconUrl: url };
                                                                                    updateNested(['snsConfig', 'items'], newItems);
                                                                                })}
                                                                            />
                                                                        </div>

                                                                        <div className="flex-1 space-y-2">
                                                                            {/* Type Select */}
                                                                            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                                                                                {['kakao', 'blog', 'instagram', 'youtube', 'custom'].map(t => (
                                                                                    <button
                                                                                        key={t}
                                                                                        onClick={() => {
                                                                                            const newItems = [...config.snsConfig!.items!];
                                                                                            newItems[idx] = { ...newItems[idx], type: t as any };
                                                                                            updateNested(['snsConfig', 'items'], newItems);
                                                                                        }}
                                                                                        className={`px-2 py-1 rounded text-[10px] font-bold border whitespace-nowrap ${item.type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                                                                    >
                                                                                        {t === 'kakao' ? '카카오' : t === 'blog' ? '블로그' : t === 'instagram' ? '인스타' : t === 'youtube' ? '유튜브' : '커스텀'}
                                                                                    </button>
                                                                                ))}
                                                                            </div>

                                                                            <input
                                                                                type="text"
                                                                                className="w-full border rounded p-1.5 text-xs"
                                                                                placeholder="링크 URL (https://...)"
                                                                                value={item.url || ''}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...config.snsConfig!.items!];
                                                                                    newItems[idx] = { ...newItems[idx], url: e.target.value };
                                                                                    updateNested(['snsConfig', 'items'], newItems);
                                                                                }}
                                                                            />

                                                                            <input
                                                                                type="text"
                                                                                className="w-full border rounded p-1.5 text-xs"
                                                                                placeholder="라벨 (툴팁 텍스트)"
                                                                                value={item.label || ''}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...config.snsConfig!.items!];
                                                                                    newItems[idx] = { ...newItems[idx], label: e.target.value };
                                                                                    updateNested(['snsConfig', 'items'], newItems);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!config.snsConfig?.items || config.snsConfig.items.length === 0) && (
                                                                <div className="text-center py-6 text-gray-400 text-xs bg-gray-50 rounded border border-dashed">
                                                                    등록된 링크가 없습니다. '추가' 버튼을 눌러보세요.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            }


                            {/* --- PIXEL TAB (NEW) --- */}
                            {activeTab === 'pixel' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                        <h3 className="text-sm font-bold text-blue-800 mb-1">픽셀(Pixel) 관리</h3>
                                        <p className="text-xs text-blue-600">페이스북, 카카오, 구글, 틱톡 등에 유입 전환 확인에 활용되는 픽셀을 설정합니다.</p>
                                    </div>

                                    {/* FACEBOOK */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-blue-600 rounded text-center text-white flex items-center justify-center font-bold">f</div>
                                            페이스북 (Facebook)
                                        </h3>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">픽셀 ID (Pixel ID)</label>
                                            <input type="text"
                                                value={config.pixelConfig?.facebookPixelId || ''}
                                                onChange={(e) => updateNested(['pixelConfig', 'facebookPixelId'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm"
                                                placeholder="예: 123456789012345"
                                            />
                                            <div className="text-[10px] text-gray-400">
                                                * 페이스북 이벤트 관리자에서 ID를 확인하세요.
                                            </div>
                                        </div>
                                    </div>

                                    {/* KAKAO */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-yellow-400 rounded text-center text-black flex items-center justify-center font-bold">K</div>
                                            카카오 (Kakao)
                                        </h3>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">픽셀 ID</label>
                                            <input type="text"
                                                value={config.pixelConfig?.kakaoPixelId || ''}
                                                onChange={(e) => updateNested(['pixelConfig', 'kakaoPixelId'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm"
                                                placeholder="예: 1234567890"
                                            />
                                        </div>
                                    </div>

                                    {/* GOOGLE ADS */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-blue-500 rounded text-center text-white flex items-center justify-center font-bold">G</div>
                                            구글 애드워즈 (Google Ads)
                                        </h3>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">이벤트 ID / 전환 ID (AW-XXXX)</label>
                                            <input type="text"
                                                value={config.pixelConfig?.googleAdsEventId || ''}
                                                onChange={(e) => updateNested(['pixelConfig', 'googleAdsEventId'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm"
                                                placeholder="예: AW-123456789/AbCdEfGhIjKlMn"
                                            />
                                        </div>
                                    </div>

                                    {/* GOOGLE ANALYTICS */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-orange-500 rounded text-center text-white flex items-center justify-center font-bold">G</div>
                                            구글 애널리틱스 (GA4)
                                        </h3>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">측정 ID (Measurement ID)</label>
                                            <input type="text"
                                                value={config.pixelConfig?.googleAnalyticsId || ''}
                                                onChange={(e) => updateNested(['pixelConfig', 'googleAnalyticsId'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm"
                                                placeholder="예: G-XXXXXXXXXX"
                                            />
                                        </div>
                                    </div>


                                    {/* TIKTOK */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-black rounded text-center text-white flex items-center justify-center font-bold">T</div>
                                            틱톡 (TikTok)
                                        </h3>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">픽셀 ID</label>
                                            <input type="text"
                                                value={config.pixelConfig?.tiktokPixelId || ''}
                                                onChange={(e) => updateNested(['pixelConfig', 'tiktokPixelId'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm"
                                                placeholder="TikTok Pixel ID 입력"
                                            />
                                        </div>
                                    </div>

                                    {/* DAANGN */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-orange-600 rounded text-center text-white flex items-center justify-center font-bold">D</div>
                                            당근마켓 (Daangn)
                                        </h3>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">추적 ID</label>
                                            <input type="text"
                                                value={config.pixelConfig?.daangnTrackingId || ''}
                                                onChange={(e) => updateNested(['pixelConfig', 'daangnTrackingId'], e.target.value)}
                                                className="w-full border rounded p-2 text-sm"
                                                placeholder="당근마켓 추적 코드 ID 입력"
                                            />
                                        </div>
                                    </div>

                                    {/* OTHER SETTINGS (UTM) */}
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b">기타 설정</h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <label className="text-sm font-bold text-gray-700">UTM 측정 사용 유무</label>
                                                    <div className="group relative cursor-help">
                                                        <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-200 transition-colors">? UTM이 궁금하신가요?</span>
                                                        <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                                            UTM(Urchin Tracking Module)은 사용자가 어떤 링크를 통해 들어왔는지 추적하는 파라미터입니다. (예: utm_source=instagram)
                                                            <div className="absolute bottom-[-4px] left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed">
                                                    마케팅 추적 코드(UTM)를 기록하고 마케팅 통계를 활성화합니다.<br />
                                                    UTM 통계는 <b>접속통계 → 마케팅 통계</b>에서 확인 가능합니다.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer"
                                                    checked={config.pixelConfig?.utmTracking || false}
                                                    onChange={(e) => updateNested(['pixelConfig', 'utmTracking'], e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                <span className="ml-3 text-sm font-bold text-gray-700">{config.pixelConfig?.utmTracking ? 'ON' : 'OFF'}</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- AI CHATBOT TAB (NEW) --- */}
                            {
                                activeTab === 'ai_chatbot' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <MessageCircle className="w-4 h-4 text-purple-600" /> AI 변제금 진단 챗봇
                                                </h3>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <span className="text-xs font-bold text-gray-700">사용</span>
                                                    <input type="checkbox" className="toggle-checkbox"
                                                        checked={config.rehabChatConfig?.isEnabled || false}
                                                        onChange={(e) => updateNested(['rehabChatConfig', 'isEnabled'], e.target.checked)}
                                                    />
                                                </label>
                                            </div>

                                            {config.rehabChatConfig?.isEnabled && (
                                                <div className="space-y-4">
                                                    {/* NEW: 플로팅 버튼 표시 토글 */}
                                                    <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded border border-blue-100">
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-700">플로팅 버튼 표시</div>
                                                            <div className="text-[10px] text-gray-500 mt-0.5">체크 해제 시 버튼은 숨겨지고 팝업 기능만 활성화됩니다.</div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" className="sr-only peer"
                                                                checked={!config.rehabChatConfig?.hideFloatingButton}
                                                                onChange={(e) => updateNested(['rehabChatConfig', 'hideFloatingButton'], !e.target.checked)}
                                                            />
                                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>

                                                    {/* 버튼 텍스트 */}
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 mb-1 block">버튼 텍스트</label>
                                                        <input type="text" className="w-full border rounded p-2 text-sm"
                                                            value={config.rehabChatConfig?.buttonText || 'AI 변제금 확인'}
                                                            onChange={(e) => updateNested(['rehabChatConfig', 'buttonText'], e.target.value)}
                                                            placeholder="AI 변제금 확인"
                                                        />
                                                    </div>

                                                    {/* 버튼 색상 & 크기 */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 mb-1 block">버튼 색상</label>
                                                            <input type="color" className="w-full h-10 border rounded cursor-pointer"
                                                                value={config.rehabChatConfig?.buttonColor || '#8B5CF6'}
                                                                onChange={(e) => updateNested(['rehabChatConfig', 'buttonColor'], e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">모바일 크기</label>
                                                                    <select className="w-full border rounded p-2 text-sm"
                                                                        value={config.rehabChatConfig?.buttonStyle?.mobileSize || config.rehabChatConfig?.buttonStyle?.buttonSize || 'md'}
                                                                        onChange={(e) => updateNested(['rehabChatConfig', 'buttonStyle', 'mobileSize'], e.target.value)}
                                                                    >
                                                                        <option value="sm">Small (작게)</option>
                                                                        <option value="md">Medium (보통)</option>
                                                                        <option value="lg">Large (크게)</option>
                                                                        <option value="xl">XL (아주 크게)</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">PC 크기</label>
                                                                    <select className="w-full border rounded p-2 text-sm"
                                                                        value={config.rehabChatConfig?.buttonStyle?.pcSize || config.rehabChatConfig?.buttonStyle?.buttonSize || 'md'}
                                                                        onChange={(e) => updateNested(['rehabChatConfig', 'buttonStyle', 'pcSize'], e.target.value)}
                                                                    >
                                                                        <option value="sm">Small (작게)</option>
                                                                        <option value="md">Medium (보통)</option>
                                                                        <option value="lg">Large (크게)</option>
                                                                        <option value="xl">XL (아주 크게)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* NEW: 캐릭터 설정 */}
                                                    <div className="bg-white border rounded p-3 space-y-3">
                                                        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                                            <MessageCircle className="w-3 h-3 text-purple-600" /> 캐릭터 설정
                                                        </h4>

                                                        {/* 캐릭터 이름 */}
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 mb-1 block">캐릭터 이름</label>
                                                            <input type="text" className="w-full border rounded p-2 text-sm"
                                                                value={config.rehabChatConfig?.characterName || '로이'}
                                                                onChange={(e) => updateNested(['rehabChatConfig', 'characterName'], e.target.value)}
                                                                placeholder="예: 로이"
                                                            />
                                                        </div>

                                                        {/* 캐릭터 이미지 */}
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 mb-1 block">캐릭터 아바타 (이미지)</label>
                                                            <div className="flex gap-2 items-center">
                                                                <button
                                                                    onClick={() => openImagePicker((url) => updateNested(['rehabChatConfig', 'characterImage'], url))}
                                                                    className="flex-1 bg-white border border-gray-300 rounded p-2 text-xs hover:bg-gray-100 flex items-center justify-center gap-1 text-gray-600"
                                                                >
                                                                    <Upload className="w-3 h-3" /> 이미지 업로드
                                                                </button>
                                                                {config.rehabChatConfig?.characterImage && (
                                                                    <div className="relative w-8 h-8 rounded overflow-hidden border group">
                                                                        <img src={config.rehabChatConfig.characterImage} alt="Avatar" className="w-full h-full object-cover" />
                                                                        <button
                                                                            onClick={() => updateNested(['rehabChatConfig', 'characterImage'], '')}
                                                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <X className="w-2 h-2" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 mt-1">
                                                                * 이미지를 설정하지 않으면 기본 아이콘이 표시됩니다.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* NEW: 챗봇 인트로 설정 */}
                                                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded p-3 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-bold text-purple-700 flex items-center gap-1">
                                                                <PlayCircle className="w-3 h-3" /> 인트로(Intro) 설정
                                                            </h4>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" className="sr-only peer"
                                                                    checked={config.rehabChatConfig?.introConfig?.useIntro || false}
                                                                    onChange={(e) => updateNested(['rehabChatConfig', 'introConfig', 'useIntro'], e.target.checked)}
                                                                />
                                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                                            </label>
                                                        </div>

                                                        {config.rehabChatConfig?.introConfig?.useIntro && (
                                                            <div className="space-y-3">
                                                                <div className="flex gap-2">
                                                                    {/* 미디어 타입 선택 */}
                                                                    <div className="flex bg-white rounded border p-1">
                                                                        {[
                                                                            { id: 'image', label: '이미지', icon: <ImageIcon className="w-3 h-3" /> },
                                                                            { id: 'youtube', label: '유튜브/영상', icon: <Youtube className="w-3 h-3" /> }
                                                                        ].map(type => (
                                                                            <button
                                                                                key={type.id}
                                                                                onClick={() => updateNested(['rehabChatConfig', 'introConfig', 'mediaType'], type.id)}
                                                                                className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded ${config.rehabChatConfig?.introConfig?.mediaType === type.id ? 'bg-purple-100 text-purple-700 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
                                                                            >
                                                                                {type.icon} {type.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {config.rehabChatConfig?.introConfig?.mediaType === 'image' ? (
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] text-gray-500 block">인트로 이미지</label>
                                                                        <div className="flex gap-2 items-center">
                                                                            <button
                                                                                onClick={() => openImagePicker((url) => updateNested(['rehabChatConfig', 'introConfig', 'mediaUrl'], url))}
                                                                                className="flex-1 bg-white border border-gray-300 rounded p-2 text-xs hover:bg-gray-100 flex items-center justify-center gap-1 text-gray-600"
                                                                            >
                                                                                <Upload className="w-3 h-3" /> 업로드
                                                                            </button>
                                                                            {config.rehabChatConfig?.introConfig?.mediaUrl && (
                                                                                <button
                                                                                    onClick={() => updateNested(['rehabChatConfig', 'introConfig', 'mediaUrl'], '')}
                                                                                    className="px-2 py-2 border border-red-300 text-red-500 rounded hover:bg-red-50"
                                                                                >
                                                                                    <X className="w-3 h-3" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        {config.rehabChatConfig?.introConfig?.mediaUrl && (
                                                                            <div className="mt-1 w-full h-24 rounded bg-gray-100 overflow-hidden relative border">
                                                                                <img src={config.rehabChatConfig.introConfig.mediaUrl} className="w-full h-full object-cover" alt="인트로" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] text-gray-500 block">유튜브/비디오 URL</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border rounded p-2 text-xs"
                                                                            placeholder="https://youtu.be/..."
                                                                            value={config.rehabChatConfig?.introConfig?.mediaUrl || ''}
                                                                            onChange={(e) => updateNested(['rehabChatConfig', 'introConfig', 'mediaUrl'], e.target.value)}
                                                                        />
                                                                        <p className="text-[10px] text-gray-400">유튜브 링크 또는 mp4 파일 URL을 입력하세요.</p>
                                                                    </div>
                                                                )}

                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] text-gray-500 block">인트로 메시지 (선택)</label>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full border rounded p-2 text-xs"
                                                                        placeholder="예: AI 변제금 진단을 시작합니다."
                                                                        value={config.rehabChatConfig?.introConfig?.message || ''}
                                                                        onChange={(e) => updateNested(['rehabChatConfig', 'introConfig', 'message'], e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 🆕 버튼 배경 이미지 */}
                                                    <div className="bg-gray-50 border rounded p-3 space-y-3">
                                                        <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                                            <ImageIcon className="w-3 h-3" /> 버튼 배경 이미지
                                                        </h4>
                                                        <div className="flex gap-2 items-center">
                                                            <button
                                                                onClick={() => openImagePicker((url) => updateNested(['rehabChatConfig', 'buttonBackgroundImage'], url))}
                                                                className="flex-1 bg-white border border-gray-300 rounded p-2 text-xs hover:bg-gray-100 flex items-center justify-center gap-1"
                                                            >
                                                                <Upload className="w-3 h-3" /> 이미지 선택
                                                            </button>
                                                            {config.rehabChatConfig?.buttonBackgroundImage && (
                                                                <button
                                                                    onClick={() => updateNested(['rehabChatConfig', 'buttonBackgroundImage'], '')}
                                                                    className="px-2 py-2 border border-red-300 text-red-500 rounded hover:bg-red-50"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {config.rehabChatConfig?.buttonBackgroundImage && (
                                                            <div className="w-full h-16 rounded bg-gray-200 overflow-hidden">
                                                                <img src={config.rehabChatConfig.buttonBackgroundImage} className="w-full h-full object-cover" alt="버튼 배경" />
                                                            </div>
                                                        )}
                                                        <p className="text-[10px] text-gray-400">버튼 배경에 표시될 이미지를 설정합니다.</p>
                                                    </div>

                                                    {/* 🆕 버튼 텍스트 스타일 */}
                                                    <div className="bg-purple-50 border border-purple-100 rounded p-3 space-y-3">
                                                        <h4 className="text-xs font-bold text-purple-700 flex items-center gap-1">
                                                            <Type className="w-3 h-3" /> 버튼 텍스트 스타일
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[10px] text-gray-500 mb-1">글자 색상</label>
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="color"
                                                                        value={config.rehabChatConfig?.buttonStyle?.textColor || '#ffffff'}
                                                                        onChange={(e) => updateNested(['rehabChatConfig', 'buttonStyle', 'textColor'], e.target.value)}
                                                                        className="w-8 h-8 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                                                    />
                                                                    <span className="text-[10px] text-gray-400">{config.rehabChatConfig?.buttonStyle?.textColor || '#ffffff'}</span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-gray-500 mb-1">글자 크기</label>
                                                                <select
                                                                    value={config.rehabChatConfig?.buttonStyle?.fontSize || '14px'}
                                                                    onChange={(e) => updateNested(['rehabChatConfig', 'buttonStyle', 'fontSize'], e.target.value)}
                                                                    className="w-full border rounded p-1.5 text-xs"
                                                                >
                                                                    <option value="12px">12px (작게)</option>
                                                                    <option value="14px">14px (기본)</option>
                                                                    <option value="16px">16px (중간)</option>
                                                                    <option value="18px">18px (크게)</option>
                                                                    <option value="20px">20px (아주 크게)</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[10px] text-gray-500 mb-1">글자 굵기</label>
                                                                <select
                                                                    value={config.rehabChatConfig?.buttonStyle?.fontWeight || 'bold'}
                                                                    onChange={(e) => updateNested(['rehabChatConfig', 'buttonStyle', 'fontWeight'], e.target.value)}
                                                                    className="w-full border rounded p-1.5 text-xs"
                                                                >
                                                                    <option value="normal">보통</option>
                                                                    <option value="500">약간 굵게 (500)</option>
                                                                    <option value="600">중간 굵게 (600)</option>
                                                                    <option value="bold">굵게 (bold)</option>
                                                                    <option value="800">아주 굵게 (800)</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-gray-500 mb-1">폰트</label>
                                                                <FontPicker
                                                                    value={config.rehabChatConfig?.buttonStyle?.fontFamily || ''}
                                                                    onChange={(val) => updateNested(['rehabChatConfig', 'buttonStyle', 'fontFamily'], val)}
                                                                    globalSettings={globalSettings}
                                                                    onSettingsChange={setGlobalSettings}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>


                                                    {/* 버튼 위치 */}
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 mb-1 block">버튼 위치</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {(['bottom-left', 'bottom-right', 'top-left', 'top-right'] as const).map((pos) => (
                                                                <button
                                                                    key={pos}
                                                                    onClick={() => updateNested(['rehabChatConfig', 'buttonPosition'], pos)}
                                                                    className={`p-2 border rounded text-xs transition-all ${config.rehabChatConfig?.buttonPosition === pos
                                                                        ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                                        }`}
                                                                >
                                                                    {pos === 'bottom-left' ? '하단 좌측' : pos === 'bottom-right' ? '하단 우측' : pos === 'top-left' ? '상단 좌측' : '상단 우측'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* 표시 위치 */}
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 mb-2 block">표시 위치 (복수 선택 가능)</label>
                                                        <div className="space-y-2">
                                                            <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded border">
                                                                <input type="checkbox"
                                                                    checked={config.rehabChatConfig?.placement?.showAsFloating || false}
                                                                    onChange={(e) => updateNested(['rehabChatConfig', 'placement', 'showAsFloating'], e.target.checked)}
                                                                />
                                                                <span className="text-sm">플로팅 버튼 (화면 고정)</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded border">
                                                                <input type="checkbox"
                                                                    checked={config.rehabChatConfig?.placement?.showInHero || false}
                                                                    onChange={(e) => updateNested(['rehabChatConfig', 'placement', 'showInHero'], e.target.checked)}
                                                                />
                                                                <span className="text-sm">히어로 섹션 삽입</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded border">
                                                                <input type="checkbox"
                                                                    checked={config.rehabChatConfig?.placement?.showInPopup || false}
                                                                    onChange={(e) => updateNested(['rehabChatConfig', 'placement', 'showInPopup'], e.target.checked)}
                                                                />
                                                                <span className="text-sm">팝업 내 삽입</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* AI 캐릭터 이름 */}
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 mb-1 block">AI 캐릭터 이름</label>
                                                        <input type="text" className="w-full border rounded p-2 text-sm"
                                                            value={config.rehabChatConfig?.characterName || '로이'}
                                                            onChange={(e) => updateNested(['rehabChatConfig', 'characterName'], e.target.value)}
                                                            placeholder="로이"
                                                        />
                                                    </div>

                                                    {/* 🆕 챗봇 템플릿 설정 */}
                                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4 space-y-4">
                                                        <h4 className="text-sm font-bold text-purple-700 flex items-center gap-2">
                                                            🎨 채팅창 디자인 템플릿
                                                        </h4>

                                                        {/* 템플릿 선택 */}
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-600 mb-2 block">템플릿 선택</label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {[
                                                                    { id: 'classic', name: '클래식', emoji: '💼', color: '#334155' },
                                                                    { id: 'messenger', name: '메신저', emoji: '💬', color: '#0ea5e9' },
                                                                    { id: 'minimal', name: '미니멀', emoji: '⬜', color: '#18181b' },
                                                                    { id: 'gradient', name: '그라데이션', emoji: '🌈', color: '#8b5cf6' },
                                                                    { id: 'bot', name: '봇 스타일', emoji: '🤖', color: '#10b981' },
                                                                    { id: 'sidebar', name: '사이드바', emoji: '📌', color: '#ef4444' },
                                                                    { id: 'modern', name: '모던', emoji: '✨', color: '#6366f1' },
                                                                    { id: 'bubble', name: '버블', emoji: '🫧', color: '#ec4899' },
                                                                    { id: 'corporate', name: '기업용', emoji: '🏢', color: '#1e40af' },
                                                                    { id: 'neon', name: '네온', emoji: '⚡', color: '#06b6d4' }
                                                                ].map((tpl) => (
                                                                    <button
                                                                        key={tpl.id}
                                                                        onClick={() => updateNested(['rehabChatConfig', 'templateId'], tpl.id)}
                                                                        className={`p-2 border rounded-lg text-xs transition-all flex items-center gap-2 ${(config.rehabChatConfig?.templateId || 'classic') === tpl.id
                                                                            ? 'border-purple-500 bg-purple-100 text-purple-800 font-bold ring-1 ring-purple-500'
                                                                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                                            }`}
                                                                    >
                                                                        <span>{tpl.emoji}</span>
                                                                        <span>{tpl.name}</span>
                                                                        <div
                                                                            className="w-4 h-4 rounded-full ml-auto border border-gray-300"
                                                                            style={{ backgroundColor: tpl.color }}
                                                                        />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* 테마 모드 */}
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-600 mb-2 block">테마 모드</label>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => updateNested(['rehabChatConfig', 'themeMode'], 'light')}
                                                                    className={`flex-1 p-3 border rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${config.rehabChatConfig?.themeMode === 'light'
                                                                        ? 'border-yellow-400 bg-yellow-50 text-yellow-800 font-bold'
                                                                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    ☀️ 라이트
                                                                </button>
                                                                <button
                                                                    onClick={() => updateNested(['rehabChatConfig', 'themeMode'], 'dark')}
                                                                    className={`flex-1 p-3 border rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${(config.rehabChatConfig?.themeMode || 'dark') === 'dark'
                                                                        ? 'border-slate-600 bg-slate-800 text-white font-bold'
                                                                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    🌙 다크
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* 커스텀 색상 (선택사항) */}
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-600 mb-2 block">커스텀 색상 (선택사항)</label>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="text-center">
                                                                    <label className="text-[10px] text-gray-500 block mb-1">메인 색상</label>
                                                                    <input
                                                                        type="color"
                                                                        value={config.rehabChatConfig?.customColors?.primary || '#3b82f6'}
                                                                        onChange={(e) => updateNested(['rehabChatConfig', 'customColors', 'primary'], e.target.value)}
                                                                        className="w-full h-8 rounded cursor-pointer border"
                                                                    />
                                                                </div>
                                                                <div className="text-center">
                                                                    <label className="text-[10px] text-gray-500 block mb-1">보조 색상</label>
                                                                    <input
                                                                        type="color"
                                                                        value={config.rehabChatConfig?.customColors?.secondary || '#f1f5f9'}
                                                                        onChange={(e) => updateNested(['rehabChatConfig', 'customColors', 'secondary'], e.target.value)}
                                                                        className="w-full h-8 rounded cursor-pointer border"
                                                                    />
                                                                </div>
                                                                <div className="text-center">
                                                                    <label className="text-[10px] text-gray-500 block mb-1">포인트</label>
                                                                    <input
                                                                        type="color"
                                                                        value={config.rehabChatConfig?.customColors?.accent || '#60a5fa'}
                                                                        onChange={(e) => updateNested(['rehabChatConfig', 'customColors', 'accent'], e.target.value)}
                                                                        className="w-full h-8 rounded cursor-pointer border"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => updateNested(['rehabChatConfig', 'customColors'], undefined)}
                                                                className="mt-2 text-xs text-gray-500 underline hover:text-gray-700"
                                                            >
                                                                커스텀 색상 초기화
                                                            </button>
                                                        </div>

                                                        {/* 채팅창 폰트 */}
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-600 mb-2 block">채팅창 폰트</label>
                                                            <FontPicker
                                                                value={config.rehabChatConfig?.chatFontFamily || ''}
                                                                onChange={(val) => updateNested(['rehabChatConfig', 'chatFontFamily'], val)}
                                                                globalSettings={globalSettings}
                                                                onSettingsChange={setGlobalSettings}
                                                            />
                                                            <p className="text-[10px] text-gray-400 mt-1">채팅창 내 모든 텍스트에 적용됩니다.</p>
                                                        </div>
                                                    </div>


                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            }


                        </div >
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
                            className={`bg-white shadow-2xl transition-all duration-300 overflow-auto no-scrollbar border-[8px] border-gray-800 rounded-[2rem] relative transform
                    ${previewMode === 'mobile' ? 'w-[375px] h-[812px]' : 'w-full h-full rounded-none border-none'}
                `}
                        >
                            {previewMode === 'mobile' && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-xl z-50"></div>
                            )}

                            <LandingPage previewConfig={config} isMobileView={previewMode === 'mobile'} />
                        </div>
                    </div>

                </div >
            </div >


            {/* Settings Modal */}
            {
                showSettingsModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                        <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">설정 (Settings)</h3>
                                <button onClick={() => setShowSettingsModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">GitHub Personal Access Token</label>
                                    <input
                                        type="password"
                                        placeholder="ghp_..."
                                        className="w-full border rounded p-2 text-sm font-mono bg-gray-50"
                                        value={inputGithubToken}
                                        onChange={(e) => setInputGithubToken(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        * 'repo' 권한이 있는 토큰이 필요합니다.
                                        <br />
                                        * 이 토큰은 브라우저에만 저장되며 서버로 전송되지 않습니다.
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setGithubToken(inputGithubToken);
                                        alert('토큰이 저장되었습니다.');
                                        setShowSettingsModal(false);
                                    }}
                                    className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800"
                                >
                                    저장하기
                                </button>

                                <hr className="my-4" />

                                <div className="text-center">
                                    <p className="text-xs text-gray-400">Ver: 1.2.0 (High Performance Architecture)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <ImageManager
                isOpen={isImageManagerOpen}
                onClose={() => setIsImageManagerOpen(false)}
                onSelect={(url) => { if (imagePickerCallback) imagePickerCallback(url); }}
                globalSettings={globalSettings}
            />
        </>
    );
};

export default LandingEditor;



