import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LandingConfig, FormField, TextStyle, FloatingBanner } from '../../types';
import LandingPage from '../LandingPage';
import { saveLandingConfig, fetchLandingConfigById } from '../../services/googleSheetService';
import { Save, Copy, ArrowLeft, Trash2, PlusCircle, Smartphone, Monitor, Image as ImageIcon, AlignLeft, CheckSquare, Upload, Type, Palette, ArrowUp, ArrowDown, Youtube, FileText, Megaphone, X, Plus, Layout, AlertCircle, Maximize, Globe, Share2, Anchor, Send, Loader2, CheckCircle } from 'lucide-react';

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
  trust: { reviews: [], stats: [] },
  formConfig: { 
      title: '무료 상담 신청', 
      subTitle: '', 
      submitButtonText: '신청하기', 
      submitSuccessTitle: '신청이 완료되었습니다!',
      submitSuccessMessage: '담당자가 내용을 확인 후 최대한 빠르게 연락드리겠습니다.',
      position: 'bottom',
      layout: 'vertical',
      fields: [{id: 'name', label: '이름', type: 'text', required: true}, {id: 'phone', label: '연락처', type: 'tel', required: true}],
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

  const heroBgInputRef = useRef<HTMLInputElement>(null);
  const detailImageInputRef = useRef<HTMLInputElement>(null);
  const bannerImageInputRef = useRef<HTMLInputElement>(null);
  const footerImageInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadConfig = async (configId: string) => {
      // First, check local drafts for unsaved changes
      const stored = localStorage.getItem('landing_drafts');
      const drafts = stored ? JSON.parse(stored) : {};
      if (drafts[configId]) {
        console.log("Loading from local draft...");
        setConfig(drafts[configId]);
        return;
      }
      
      // If no draft, fetch from Google Sheets
      console.log("Fetching from Google Sheets...");
      const fetchedConfig = await fetchLandingConfigById(configId);
      if (fetchedConfig) {
        setConfig(fetchedConfig);
      }
    };

    if (id) {
      loadConfig(id);
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
      alert('브라우저 임시 저장소에 저장되었습니다.\n실제 사이트에 반영하려면 [저장 및 배포] 버튼을 눌러주세요.');
  };
  
  const handleDeploy = async () => {
    setDeployStatus('saving');
    const success = await saveLandingConfig(config);
    if(success) {
        setDeployStatus('success');
        // Clear local draft after successful deploy
        const stored = localStorage.getItem('landing_drafts');
        const drafts = stored ? JSON.parse(stored) : {};
        delete drafts[config.id];
        localStorage.setItem('landing_drafts', JSON.stringify(drafts));
    } else {
        setDeployStatus('error');
    }

    setTimeout(() => setDeployStatus('idle'), 3000);
  };

  const updateNested = (path: string[], value: any) => {
    setConfig(prev => {
        const next = JSON.parse(JSON.stringify(prev)); // Deep copy
        let current: any = next;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) current[path[i]] = {};
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        return next;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => callback(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const applyFormPreset = (type: 'default' | 'dark' | 'pastel' | 'border' | 'grid') => {
      let newStyle = { ...config.formConfig.style };
      let newLayout: 'vertical' | 'grid' = config.formConfig.layout === 'grid' ? 'grid' : 'vertical';

      switch(type) {
          case 'default': newStyle = { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: '1px', borderRadius: '16px', textColor: '#1f2937', buttonBackgroundColor: config.theme.primaryColor, buttonTextColor: '#ffffff', buttonRadius: '12px' }; break;
          case 'dark': newStyle = { backgroundColor: '#1e40af', borderColor: '#1e3a8a', borderWidth: '0px', borderRadius: '24px', textColor: '#ffffff', buttonBackgroundColor: '#dc2626', buttonTextColor: '#ffffff', buttonRadius: '50px' }; break;
          case 'pastel': newStyle = { backgroundColor: '#f0f9ff', borderColor: '#bae6fd', borderWidth: '1px', borderRadius: '12px', textColor: '#0c4a6e', buttonBackgroundColor: '#3b82f6', buttonTextColor: '#ffffff', buttonRadius: '8px' }; break;
          case 'border': newStyle = { backgroundColor: '#fff7ed', borderColor: '#ea580c', borderWidth: '4px', borderRadius: '4px', textColor: '#431407', buttonBackgroundColor: '#ea580c', buttonTextColor: '#ffffff', buttonRadius: '4px' }; break;
          case 'grid': newLayout = newLayout === 'grid' ? 'vertical' : 'grid'; break;
      }
      setConfig(prev => ({ ...prev, formConfig: { ...prev.formConfig, style: newStyle, layout: newLayout }}));
  };
  
  const addBanner = () => setConfig(p => ({ ...p, banners: [...(p.banners || []), { id: `b_${Date.now()}`, isShow: true, text: "새로운 띠배너", backgroundColor: "#1e293b", textColor: "#fff", position: "bottom", size: "md" }] }));
  const updateBanner = (i: number, k: keyof FloatingBanner, v: any) => setConfig(p => { const n = [...(p.banners || [])]; n[i] = { ...n[i], [k]: v }; return { ...p, banners: n } });
  const removeBanner = (i: number) => setConfig(p => ({ ...p, banners: (p.banners || []).filter((_, idx) => idx !== i) }));
  const addProblemPoint = () => setConfig(p => ({ ...p, problem: { ...p.problem, points: [...p.problem.points, "새 문제점"] } }));
  const updateProblemPoint = (i: number, v: string) => setConfig(p => { const n = [...p.problem.points]; n[i] = v; return { ...p, problem: { ...p.problem, points: n } } });
  const removeProblemPoint = (i: number) => setConfig(p => ({ ...p, problem: { ...p.problem, points: p.problem.points.filter((_, idx) => idx !== i) } }));
  const addSolutionFeature = () => setConfig(p => ({ ...p, solution: { ...p.solution, features: [...p.solution.features, { title: "새 특징", desc: "설명" }] } }));
  const updateSolutionFeature = (i: number, k: 'title' | 'desc', v: string) => setConfig(p => { const n = [...p.solution.features]; n[i] = { ...n[i], [k]: v }; return { ...p, solution: { ...p.solution, features: n } } });
  const removeSolutionFeature = (i: number) => setConfig(p => ({ ...p, solution: { ...p.solution, features: p.solution.features.filter((_, idx) => idx !== i) } }));
  const updateField = (i: number, k: keyof FormField, v: any) => setConfig(p => { const n = [...p.formConfig.fields]; n[i] = { ...n[i], [k]: v }; return { ...p, formConfig: { ...p.formConfig, fields: n } } });
  const removeField = (i: number) => setConfig(p => ({ ...p, formConfig: { ...p.formConfig, fields: p.formConfig.fields.filter((_, idx) => idx !== i) } }));
  const addFieldOption = (fIdx: number) => setConfig(p => { const nF = [...p.formConfig.fields]; const cO = nF[fIdx].options || []; nF[fIdx] = { ...nF[fIdx], options: [...cO, { label: "", value: "" }] }; return { ...p, formConfig: { ...p.formConfig, fields: nF } } });
  const updateFieldOption = (fIdx: number, oIdx: number, k: 'label' | 'value', v: string) => setConfig(p => { const nF = [...p.formConfig.fields]; const nO = [...(nF[fIdx].options || [])]; nO[oIdx] = { ...nO[oIdx], [k]: v }; nF[fIdx] = { ...nF[fIdx], options: nO }; return { ...p, formConfig: { ...p.formConfig, fields: nF } } });
  const removeFieldOption = (fIdx: number, oIdx: number) => setConfig(p => { const nF = [...p.formConfig.fields]; const nO = (nF[fIdx].options || []).filter((_, i) => i !== oIdx); nF[fIdx] = { ...nF[fIdx], options: nO }; return { ...p, formConfig: { ...p.formConfig, fields: nF } } });
  const addDetailImage = (url: string) => setConfig(p => ({ ...p, detailImages: [...(p.detailImages || []), url] }));
  const addYoutube = () => { const u = prompt("유튜브 링크 입력"); if (u) addDetailImage(u) };
  const updateDetailImage = (i: number, v: string) => setConfig(p => { const n = [...(p.detailImages || [])]; n[i] = v; return { ...p, detailImages: n } });
  const removeDetailImage = (i: number) => setConfig(p => ({ ...p, detailImages: (p.detailImages || []).filter((_, idx) => idx !== i) }));
  const moveDetailImage = (i: number, d: 'up' | 'down') => setConfig(p => { const n = [...(p.detailImages || [])]; if (d === 'up' && i > 0) { [n[i], n[i - 1]] = [n[i - 1], n[i]] } else if (d === 'down' && i < n.length - 1) { [n[i], n[i + 1]] = [n[i + 1], n[i]] } return { ...p, detailImages: n } });
  const addFooterImage = (url: string) => setConfig(p => ({ ...p, footer: { ...p.footer!, images: [...(p.footer?.images || []), url] } }));
  const removeFooterImage = (i: number) => setConfig(p => ({ ...p, footer: { ...p.footer!, images: (p.footer?.images || []).filter((_, idx) => idx !== i) } }));
  const moveFooterImage = (i: number, d: 'left' | 'right') => setConfig(p => { const n = [...(p.footer?.images || [])]; if (d === 'left' && i > 0) { [n[i], n[i - 1]] = [n[i - 1], n[i]] } else if (d === 'right' && i < n.length - 1) { [n[i], n[i + 1]] = [n[i + 1], n[i]] } return { ...p, footer: { ...p.footer!, images: n } } });

  const TextStyleEditor = ({ label, stylePath }: { label: string, stylePath: string[] }) => {
      const getValue = (key: keyof TextStyle) => {let c:any=config;for(const p of stylePath){if(!c)return;c=c[p]}return c?c[key]:undefined};
      const updateStyle = (key: keyof TextStyle, val: any) => updateNested([...stylePath, key], val);
      return (<div className="bg-gray-50 p-3 rounded-lg border"><div className="flex items-center gap-2 mb-2"><Type className="w-4 h-4 text-gray-500"/><span className="text-xs font-bold text-gray-700">{label} 디자인</span></div><div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] text-gray-500 block">크기</label><input type="text" value={getValue('fontSize')||''} onChange={e=>updateStyle('fontSize',e.target.value)} className="w-full border rounded p-1 text-xs"/></div><div><label className="text-[10px] text-gray-500 block">굵기</label><select value={getValue('fontWeight')||'400'} onChange={e=>updateStyle('fontWeight',e.target.value)} className="w-full border rounded p-1 text-xs"><option value="400">보통</option><option value="700">굵게</option><option value="800">아주 굵게</option></select></div><div><label className="text-[10px] text-gray-500 block">색상</label><div className="flex items-center gap-1"><input type="color" value={getValue('color')||'#000'} onChange={e=>updateStyle('color',e.target.value)} className="w-6 h-6 border rounded cursor-pointer p-0"/><input type="text" value={getValue('color')||''} onChange={e=>updateStyle('color',e.target.value)} className="flex-1 border rounded p-1 text-xs"/></div></div><div><label className="text-[10px] text-gray-500 block">정렬</label><select value={getValue('textAlign')||'left'} onChange={e=>updateStyle('textAlign',e.target.value)} className="w-full border rounded p-1 text-xs"><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option></select></div></div></div>)
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col font-sans overflow-hidden">
      <header className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-700 rounded-full text-white transition"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-white font-bold flex items-center gap-2">랜딩페이지 에디터<span className="text-xs font-mono bg-gray-700 px-2 py-0.5 rounded text-gray-300">ID: {config.id}</span></h1>
        </div>
        <div className="flex gap-2">
            <button onClick={saveToLocal} className="flex items-center px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600">
                <Save className="w-3 h-3 mr-1.5" />임시 저장
            </button>
            <button onClick={handleDeploy} disabled={deployStatus === 'saving'} className="flex items-center px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-sm w-32 justify-center disabled:opacity-50">
                {deployStatus === 'saving' ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin"/> 저장중...</> :
                 deployStatus === 'success' ? <><CheckCircle className="w-3 h-3 mr-1.5"/> 저장완료!</> :
                 deployStatus === 'error' ? <><AlertCircle className="w-3 h-3 mr-1.5"/> 저장실패</> :
                 <><Send className="w-3 h-3 mr-1.5" />저장 및 배포</>
                }
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full lg:w-[450px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-10 relative">
            <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto no-scrollbar">
                {[ { id: 'basic', label: '기본', icon: <AlignLeft className="w-4 h-4" /> }, { id: 'hero', label: '상단', icon: <ImageIcon className="w-4 h-4" /> }, { id: 'images', label: '상세', icon: <ImageIcon className="w-4 h-4" /> }, { id: 'form', label: '입력폼', icon: <CheckSquare className="w-4 h-4" /> }, { id: 'text', label: '텍스트', icon: <AlignLeft className="w-4 h-4" /> }, { id: 'footer', label: '하단', icon: <Anchor className="w-4 h-4" /> }, ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${ activeTab === tab.id ? 'bg-white text-blue-600 border-blue-600' : 'text-gray-500 hover:bg-gray-100 border-transparent' }`}>{tab.icon}{tab.label}</button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {activeTab === 'basic' && <div className="space-y-4 animate-fade-in"><h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">기본 설정</h3><div><label className="text-xs font-bold text-gray-500 mb-1 block">페이지 ID</label><input type="text" value={config.id} onChange={(e) => updateNested(['id'], e.target.value)} className="w-full border rounded p-2 text-sm bg-gray-50" /></div><div><label className="text-xs font-bold text-gray-500 mb-1 block">페이지 제목 (Title)</label><input type="text" value={config.title} onChange={(e) => updateNested(['title'], e.target.value)} className="w-full border rounded p-2 text-sm" /></div><div><label className="text-xs font-bold text-gray-500 mb-1 block">검색 키워드 (Meta Keywords)</label><input type="text" value={config.keywords || ''} onChange={(e) => updateNested(['keywords'], e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="예: 개인회생, 파산면책 (콤마로 구분)"/></div><div className="bg-gray-50 p-3 rounded-lg border border-gray-200"><h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1"><Globe className="w-3 h-3" /> 아이콘 & SNS 공유 이미지</h4><div className="mb-3"><label className="text-[10px] text-gray-500 block mb-1 flex justify-between">파비콘 (탭 아이콘)<button onClick={() => faviconInputRef.current?.click()} className="text-blue-600 hover:underline flex items-center"><Upload className="w-3 h-3 mr-1" /> 업로드</button></label><input type="file" ref={faviconInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => updateNested(['favicon'], url))}/><div className="flex gap-2 items-center"><input type="text" value={config.favicon || ''} onChange={(e) => updateNested(['favicon'], e.target.value)} className="w-full border rounded p-1 text-xs bg-white" placeholder="URL 입력"/><img src={config.favicon} alt="icon" className="w-8 h-8 rounded border p-0.5 bg-white" /></div></div><div className="mb-3"><label className="text-[10px] text-gray-500 block mb-1 flex justify-between"><span className="flex items-center gap-1"><Share2 className="w-3 h-3"/> SNS 썸네일</span><button onClick={() => ogImageInputRef.current?.click()} className="text-blue-600 hover:underline flex items-center"><Upload className="w-3 h-3 mr-1"/>업로드</button></label><input type="file" ref={ogImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => updateNested(['ogImage'], url))}/><div className="space-y-2"><input type="text" value={config.ogImage || ''} onChange={(e) => updateNested(['ogImage'], e.target.value)} className="w-full border rounded p-1 text-xs bg-white" placeholder="URL 입력"/>{config.ogImage && (<div className="w-full h-24 bg-gray-100 rounded border overflow-hidden"><img src={config.ogImage} alt="OG" className="w-full h-full object-cover"/></div>)}</div></div><div className="mb-2"><label className="text-[10px] text-gray-500 block mb-1">SNS 공유 제목</label><input type="text" value={config.ogTitle || ''} onChange={(e) => updateNested(['ogTitle'], e.target.value)} className="w-full border rounded p-1 text-xs bg-white" placeholder={config.title}/></div><div className="mb-2"><label className="text-[10px] text-gray-500 block mb-1">SNS 공유 설명</label><textarea value={config.ogDescription || ''} onChange={(e) => updateNested(['ogDescription'], e.target.value)} className="w-full border rounded p-1 text-xs bg-white h-16 resize-none" placeholder={config.hero.subHeadline}/></div></div><div className="grid grid-cols-2 gap-2 mt-2"><div><label className="text-xs font-bold text-gray-500 mb-1 block">메인 컬러</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={config.theme.primaryColor} onChange={(e) => updateNested(['theme', 'primaryColor'], e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none" /><span className="text-xs font-mono">{config.theme.primaryColor}</span></div></div></div></div>}
                {activeTab === 'hero' && <div className="space-y-4 animate-fade-in"><h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">상단 히어로 섹션</h3><div><label className="text-xs font-bold text-gray-500 mb-1 flex justify-between">배경 이미지<button onClick={() => heroBgInputRef.current?.click()} className="text-blue-600 hover:underline flex items-center"><Upload className="w-3 h-3 mr-1" /> 업로드</button></label><input type="file" ref={heroBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => updateNested(['hero', 'backgroundImage'], url))}/><input type="text" value={config.hero.backgroundImage} onChange={(e) => updateNested(['hero', 'backgroundImage'], e.target.value)} className="w-full border rounded p-2 text-sm mb-2" placeholder="http://..."/><img src={config.hero.backgroundImage} alt="Preview" className="w-full h-24 object-cover rounded border" /></div><div><label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Maximize className="w-3 h-3"/>섹션 크기</label><select value={config.hero.size||'md'} onChange={(e)=>updateNested(['hero','size'],e.target.value)} className="w-full border rounded p-2 text-sm"><option value="xs">아주 작게</option><option value="sm">작게</option><option value="md">보통</option><option value="lg">크게</option><option value="xl">아주 크게</option></select></div><div className="border-t pt-4"><label className="text-xs font-bold text-gray-500 mb-1 block">메인 헤드카피</label><textarea value={config.hero.headline} onChange={(e) => updateNested(['hero', 'headline'], e.target.value)} className="w-full border rounded p-2 text-sm h-16 resize-none mb-2"/><TextStyleEditor label="헤드카피" stylePath={['hero', 'headlineStyle']} /></div><div className="border-t pt-4"><label className="text-xs font-bold text-gray-500 mb-1 block">서브 카피</label><textarea value={config.hero.subHeadline} onChange={(e) => updateNested(['hero', 'subHeadline'], e.target.value)} className="w-full border rounded p-2 text-sm h-16 resize-none mb-2"/><TextStyleEditor label="서브카피" stylePath={['hero', 'subHeadlineStyle']} /></div></div>}
                {activeTab === 'images' && <div className="space-y-6 animate-fade-in"><div className="bg-white border rounded-lg p-4 shadow-sm mb-6"><h3 className="text-sm font-bold text-gray-900 flex items-center justify-between mb-4"><span className="flex items-center gap-2"><Megaphone className="w-4 h-4 text-blue-500"/> 띠 배너 관리</span><button onClick={addBanner} disabled={(config.banners||[]).length>=5} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-500 disabled:opacity-50">+ 추가</button></h3><div className="space-y-4">{(config.banners||[]).map((b,i)=><div key={b.id} className="border p-3 rounded-lg bg-gray-50 relative"><div className="flex justify-between items-center mb-2 pb-2 border-b"><span className="text-xs font-bold text-gray-500">배너 #{i+1}</span><div className="flex gap-2 items-center"><label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={b.isShow} onChange={e=>updateBanner(i,'isShow',e.target.checked)}/>노출</label><button onClick={()=>removeBanner(i)} className="text-red-500"><Trash2 className="w-3 h-3"/></button></div></div>{b.isShow&&<div className="space-y-2"><div className="flex gap-2"><div className="flex-1"><label className="text-[10px] text-gray-500 block">위치</label><select value={b.position} onChange={e=>updateBanner(i,'position',e.target.value)} className="w-full text-xs border rounded p-1"><option value="top">상단</option><option value="bottom">하단</option></select></div><div className="flex-1"><label className="text-[10px] text-gray-500 block">크기</label><select value={b.size||'md'} onChange={e=>updateBanner(i,'size',e.target.value)} className="w-full text-xs border rounded p-1"><option value="xs">아주 작게</option><option value="sm">작게</option><option value="md">보통</option><option value="lg">크게</option><option value="xl">아주 크게</option></select></div></div><div className="flex gap-2"><div className="flex-1"><label className="text-[10px] text-gray-500 block">배경색</label><div className="flex items-center gap-1"><input type="color" value={b.backgroundColor} onChange={e=>updateBanner(i,'backgroundColor',e.target.value)} className="w-4 h-4 p-0"/><input type="text" value={b.backgroundColor} onChange={e=>updateBanner(i,'backgroundColor',e.target.value)} className="w-full text-xs border rounded p-1"/></div></div><div className="flex-1"><label className="text-[10px] text-gray-500 block">글자색</label><div className="flex items-center gap-1"><input type="color" value={b.textColor} onChange={e=>updateBanner(i,'textColor',e.target.value)} className="w-4 h-4 p-0"/><input type="text" value={b.textColor} onChange={e=>updateBanner(i,'textColor',e.target.value)} className="w-full text-xs border rounded p-1"/></div></div></div><div><label className="text-[10px] text-gray-500 block">문구</label><input type="text" value={b.text} onChange={e=>updateBanner(i,'text',e.target.value)} className="w-full text-xs border rounded p-1"/></div><div><label className="text-[10px] text-gray-500 block flex justify-between">이미지 URL<button onClick={()=>{bannerImageInputRef.current?.setAttribute('data-banner-index',i.toString());bannerImageInputRef.current?.click()}} className="text-blue-600">업로드</button></label><input type="text" value={b.imageUrl||''} onChange={e=>updateBanner(i,'imageUrl',e.target.value)} className="w-full text-xs border rounded p-1"/></div><div><label className="text-[10px] text-gray-500 block">링크 URL</label><input type="text" value={b.linkUrl||''} onChange={e=>updateBanner(i,'linkUrl',e.target.value)} className="w-full text-xs border rounded p-1" placeholder="비우면 폼으로 이동"/></div></div>}</div>)}{(config.banners||[]).length===0&&<div className="text-center py-4 text-xs text-gray-400 border-dashed border rounded">배너 없음</div>}</div><input type="file" ref={bannerImageInputRef} className="hidden" accept="image/*" onChange={e=>handleImageUpload(e,url=>{const i=bannerImageInputRef.current?.getAttribute('data-banner-index');if(i)updateBanner(parseInt(i),'imageUrl',url)})}/></div><div><h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> 상세 이미지</h3><div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 mb-4 border"><strong>TIP:</strong> 이미지(GIF 포함) 또는 유튜브 링크를 순서대로 배치하세요.</div><input type="file" ref={detailImageInputRef} className="hidden" accept="image/*" onChange={e=>{handleImageUpload(e,addDetailImage);if(detailImageInputRef.current)detailImageInputRef.current.value=''}}/><div className="space-y-3">{(config.detailImages||[]).map((img,i)=><div key={i} className="bg-white border p-2 rounded-lg flex gap-3 items-center"><div className="flex flex-col gap-1"><button onClick={()=>moveDetailImage(i,'up')} disabled={i===0} className="p-1 text-gray-400 disabled:opacity-30"><ArrowUp className="w-3 h-3"/></button><button onClick={()=>moveDetailImage(i,'down')} disabled={i===(config.detailImages?.length||0)-1} className="p-1 text-gray-400 disabled:opacity-30"><ArrowDown className="w-3 h-3"/></button></div><div className="w-16 h-12 bg-gray-100 rounded shrink-0 border flex items-center justify-center">{img.includes('youtu')?<Youtube className="w-6 h-6 text-red-600"/>:<img src={img} className="w-full h-full object-cover"/>}</div><div className="flex-1 min-w-0"><input type="text" value={img} onChange={e=>updateDetailImage(i,e.target.value)} className="w-full border rounded p-1 text-xs"/></div><button onClick={()=>removeDetailImage(i)} className="p-2 text-gray-400"><Trash2 className="w-4 h-4"/></button></div>)}</div><div className="grid grid-cols-2 gap-2 mt-4"><button onClick={()=>detailImageInputRef.current?.click()} className="py-2 bg-gray-800 text-white rounded-lg font-bold text-xs flex items-center justify-center"><Upload className="w-3 h-3 mr-1"/>이미지/GIF</button><button onClick={addYoutube} className="py-2 border-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs flex items-center justify-center"><Youtube className="w-4 h-4 mr-1"/>유튜브</button></div></div></div>}
                {activeTab === 'form' && <div className="space-y-6 animate-fade-in"><div className="bg-white border rounded-lg p-4 shadow-sm"><h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4"><Palette className="w-4 h-4 text-blue-600"/>폼 디자인 템플릿</h3><div className="grid grid-cols-2 gap-3"><button onClick={()=>applyFormPreset('default')} className="border rounded p-2 text-xs text-left"><div className="font-bold mb-1">⚪ 기본형</div><div className="w-full h-8 bg-white border rounded"></div></button><button onClick={()=>applyFormPreset('dark')} className="border rounded p-2 text-xs text-left"><div className="font-bold mb-1">🔵 다크모드</div><div className="w-full h-8 bg-blue-900 rounded"></div></button><button onClick={()=>applyFormPreset('pastel')} className="border rounded p-2 text-xs text-left"><div className="font-bold mb-1">🎨 파스텔</div><div className="w-full h-8 bg-sky-50 border rounded"></div></button><button onClick={()=>applyFormPreset('border')} className="border rounded p-2 text-xs text-left"><div className="font-bold mb-1">🟧 테두리 강조</div><div className="w-full h-8 bg-white border-2 border-orange-500 rounded"></div></button><button onClick={()=>applyFormPreset('grid')} className="col-span-2 border rounded p-2 text-xs text-left"><div className="font-bold mb-1">🔳 2열 배치 (PC)</div><div className="w-full h-8 bg-white border rounded flex gap-1 p-1"><div className="flex-1 bg-gray-100 rounded"></div><div className="flex-1 bg-gray-100 rounded"></div></div></button></div></div><div className="bg-white border rounded-lg p-4 shadow-sm"><h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4"><Layout className="w-4 h-4"/>폼 위치 설정</h3><div><label className="text-xs text-gray-500 block mb-1">폼 노출 위치</label><select value={config.formConfig.position||'bottom'} onChange={e=>updateNested(['formConfig','position'],e.target.value)} className="w-full border rounded p-2 text-sm"><option value="bottom">페이지 하단</option><option value="after_hero">상단 바로 아래</option></select></div></div><div className="bg-white border rounded-lg p-4 shadow-sm"><h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4"><CheckSquare className="w-4 h-4"/>제출 완료 메시지</h3><div className="space-y-3"><div><label className="text-xs text-gray-500 block mb-1">완료 제목</label><input type="text" value={config.formConfig.submitSuccessTitle||''} onChange={e=>updateNested(['formConfig','submitSuccessTitle'],e.target.value)} className="w-full border rounded p-2 text-sm"/></div><div><label className="text-xs text-gray-500 block mb-1">완료 상세 메시지</label><textarea value={config.formConfig.submitSuccessMessage||''} onChange={e=>updateNested(['formConfig','submitSuccessMessage'],e.target.value)} className="w-full border rounded p-2 text-sm h-20 resize-none"/></div></div></div><div className="bg-white border rounded-lg p-4 shadow-sm"><h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">정책 설정</h3>{
([
{ key: 'showPrivacyPolicy', contentKey: 'privacyPolicyContent', label: '개인정보 수집 이용' },
{ key: 'showThirdPartyConsent', contentKey: 'thirdPartyConsentContent', label: '제3자 정보 제공' },
{ key: 'showMarketingConsent', contentKey: 'marketingConsentContent', label: '광고성 정보 수신' },
{ key: 'showTerms', contentKey: 'termsContent', label: '이용약관' },
] as const).map(p => <div key={p.key} className="mb-4 border-b pb-4 last:border-0"><div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-gray-700">{p.label}</span><label className="flex items-center gap-2 cursor-pointer"><span className="text-[10px] text-gray-400">{config.formConfig[p.key]?'표시':'숨김'}</span><input type="checkbox" checked={config.formConfig[p.key]} onChange={e=>updateNested(['formConfig',p.key],e.target.checked)} className="w-4 h-4 accent-blue-600"/></label></div>{config.formConfig[p.key]&&<textarea placeholder={`${p.label} 전문 입력`} value={(config.formConfig as any)[p.contentKey]||''} onChange={e=>updateNested(['formConfig',p.contentKey],e.target.value)} className="w-full border rounded p-2 text-xs h-20"/>}</div>)}</div><div className="space-y-3 pt-4 border-t"><h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">입력 항목 관리</h3>{config.formConfig.fields.map((f,i)=><div key={i} className="border p-3 rounded-lg bg-white shadow-sm relative"><button onClick={()=>removeField(i)} className="absolute top-2 right-2 text-gray-300"><Trash2 className="w-4 h-4"/></button><div className="flex gap-2 mb-2 pr-6"><input type="text" value={f.label} onChange={e=>updateField(i,'label',e.target.value)} className="flex-1 border p-1 rounded text-sm" placeholder="항목명"/><select value={f.type} onChange={e=>updateField(i,'type',e.target.value)} className="border p-1 rounded text-xs"><option value="text">단문</option><option value="textarea">장문</option><option value="tel">연락처</option><option value="select">선택박스</option><option value="radio">라디오</option></select></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={f.required} onChange={e=>updateField(i,'required',e.target.checked)}/>필수항목</label>{(f.type==='select'||f.type==='radio')&&<div className="mt-3 p-3 bg-gray-50 rounded border"><div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-gray-500">옵션 관리</label><button onClick={()=>addFieldOption(i)} className="text-xs text-blue-600"><Plus className="w-3 h-3 mr-1"/>추가</button></div><div className="space-y-2">{f.options?.map((o,oi)=><div key={oi} className="flex gap-2 items-center"><div className="flex-1 grid grid-cols-2 gap-2"><input type="text" placeholder="라벨" value={o.label} onChange={e=>updateFieldOption(i,oi,'label',e.target.value)} className="border p-1 rounded text-xs"/><input type="text" placeholder="값" value={o.value} onChange={e=>updateFieldOption(i,oi,'value',e.target.value)} className="border p-1 rounded text-xs"/></div><button onClick={()=>removeFieldOption(i,oi)} className="text-gray-400 p-1"><X className="w-3 h-3"/></button></div>)}{(!f.options||f.options.length===0)&&<p className="text-xs text-gray-400 text-center py-2">옵션 없음</p>}</div></div></div>)}<button onClick={()=>setConfig(p=>({...p,formConfig:{...p.formConfig,fields:[...p.formConfig.fields,{id:`f${Date.now()}`,label:'새 항목',type:'text',required:true}]}}))} className="w-full py-2 border-2 border-dashed rounded-lg text-sm font-bold hover:border-blue-400">+ 입력 항목 추가</button></div></div>}
                {activeTab === 'text' && <div className="space-y-6 animate-fade-in"><div className="bg-yellow-50 p-3 rounded border text-xs text-yellow-800">상세 이미지를 사용할 경우, 아래 텍스트 섹션의 제목을 비우면 표시되지 않습니다.</div><div className="space-y-3"><h3 className="text-sm font-bold uppercase">문제 제기 섹션</h3><input type="text" value={config.problem.title} onChange={e=>updateNested(['problem','title'],e.target.value)} className="w-full border p-2 rounded" placeholder="제목 (비우면 숨김)"/><textarea value={config.problem.description} onChange={e=>updateNested(['problem','description'],e.target.value)} className="w-full border p-2 rounded h-20" placeholder="설명"/><div className="bg-gray-50 p-3 rounded border"><label className="text-xs font-bold flex justify-between">문제점 리스트<button onClick={addProblemPoint} className="text-blue-600"><Plus className="w-3 h-3 mr-1"/>추가</button></label><div className="space-y-2 mt-2">{config.problem.points.map((p,i)=><div key={i} className="flex gap-2"><input type="text" value={p} onChange={e=>updateProblemPoint(i,e.target.value)} className="flex-1 border p-1 rounded text-xs"/><button onClick={()=>removeProblemPoint(i)} className="text-gray-400 p-1"><X className="w-3 h-3"/></button></div>)}</div></div></div><div className="space-y-3 border-t pt-4"><h3 className="text-sm font-bold uppercase">해결책 섹션</h3><input type="text" value={config.solution.title} onChange={e=>updateNested(['solution','title'],e.target.value)} className="w-full border p-2 rounded" placeholder="제목 (비우면 숨김)"/><textarea value={config.solution.description} onChange={e=>updateNested(['solution','description'],e.target.value)} className="w-full border p-2 rounded h-20" placeholder="설명"/><div className="bg-gray-50 p-3 rounded border"><label className="text-xs font-bold flex justify-between">특징 리스트 (3개 권장)<button onClick={addSolutionFeature} className="text-blue-600"><Plus className="w-3 h-3 mr-1"/>추가</button></label><div className="space-y-3 mt-2">{config.solution.features.map((f,i)=><div key={i} className="bg-white border p-2 rounded relative"><button onClick={()=>removeSolutionFeature(i)} className="absolute top-2 right-2 text-gray-300"><X className="w-3 h-3"/></button><div className="mb-1"><input type="text" value={f.title} onChange={e=>updateSolutionFeature(i,'title',e.target.value)} className="w-full border-b p-1 text-xs" placeholder="특징 제목"/></div><div><textarea value={f.desc} onChange={e=>updateSolutionFeature(i,'desc',e.target.value)} className="w-full p-1 text-xs resize-none h-12" placeholder="특징 설명"/></div></div>)}</div></div></div></div>}
                {activeTab === 'footer' && <div className="space-y-6 animate-fade-in"><div className="bg-white border rounded-lg p-4 shadow-sm"><div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-green-600"/>하단 이미지<button onClick={()=>footerImageInputRef.current?.click()} className="ml-2 w-6 h-6 bg-green-600 text-white rounded flex items-center justify-center"><Plus className="w-4 h-4"/></button></h3><div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded-full border"><span className="text-[10px] font-bold text-blue-600">표시</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={config.footer?.isShow||false} onChange={e=>updateNested(['footer','isShow'],e.target.checked)}/><div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 peer-checked:bg-blue-600"></div></label></div></div><input type="file" ref={footerImageInputRef} className="hidden" accept="image/*" onChange={e=>{handleImageUpload(e,addFooterImage);if(footerImageInputRef.current)footerImageInputRef.current.value=''}}/><div className="flex gap-2 overflow-x-auto pb-2 min-h-[80px]">{(config.footer?.images||[]).map((img,i)=><div key={i} className="relative group shrink-0 w-20 h-16 bg-gray-100 rounded border flex items-center justify-center overflow-hidden"><img src={img} alt="Footer" className="w-full h-full object-contain"/><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1"><button onClick={()=>moveFooterImage(i,'left')} className="text-white p-0.5"><ArrowLeft className="w-3 h-3"/></button><button onClick={()=>removeFooterImage(i)} className="text-white p-0.5"><X className="w-4 h-4"/></button><button onClick={()=>moveFooterImage(i,'right')} className="text-white p-0.5"><ArrowUp className="w-3 h-3 rotate-90"/></button></div></div>)}{(config.footer?.images?.length===0)&&<div className="w-full text-center text-xs text-gray-400 py-4 bg-gray-50 rounded border-dashed border">이미지 없음</div>}</div></div><div className="bg-white border rounded-lg p-4 shadow-sm"><h3 className="text-sm font-bold text-gray-900 mb-3">카피라이트 문구</h3><div className="flex gap-2 mb-2 p-1 bg-gray-50 border rounded text-xs items-center"><select value={config.footer?.copyrightStyle?.fontSize||'0.75rem'} onChange={e=>updateNested(['footer','copyrightStyle','fontSize'],e.target.value)} className="border rounded p-1"><option value="0.75rem">작게</option><option value="0.875rem">보통</option><option value="1rem">크게</option></select><label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={config.footer?.copyrightStyle?.fontWeight==='700'} onChange={e=>updateNested(['footer','copyrightStyle','fontWeight'],e.target.checked?'700':'400')}/>굵게</label><select value={config.footer?.copyrightStyle?.textAlign||'center'} onChange={e=>updateNested(['footer','copyrightStyle','textAlign'],e.target.value)} className="border rounded p-1 ml-auto"><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option></select></div><textarea value={config.footer?.copyrightText||''} onChange={e=>updateNested(['footer','copyrightText'],e.target.value)} className="w-full border rounded p-3 text-sm h-24 font-mono" placeholder="© 2025 Company Name."/><button onClick={()=>updateNested(['footer','copyrightText'],DEFAULT_CONFIG.footer?.copyrightText)} className="text-xs text-gray-400 underline mt-2">기본 문구 가져오기</button></div></div>}
            </div>
        </div>
        <div className="flex-1 bg-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-4 flex gap-2 bg-white p-1 rounded-lg shadow-lg z-20">
                <button onClick={() => setPreviewMode('mobile')} className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}><Smartphone className="w-5 h-5" /></button>
                <button onClick={() => setPreviewMode('desktop')} className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}><Monitor className="w-5 h-5" /></button>
             </div>
             <div className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden no-scrollbar border-[8px] border-gray-800 rounded-[2rem] relative transform ${previewMode === 'mobile' ? 'w-[375px] h-[812px]' : 'w-full h-full rounded-none border-none'}`}>  
                {previewMode === 'mobile' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-xl z-50"></div>}
                <LandingPage previewConfig={config} />
             </div>
        </div>
      </div>
    </div>
  );
};

export default LandingEditor;