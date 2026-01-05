import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import LANDING_CONFIGS_JSON from '../data/landingConfigs.json';
import { LandingConfig, FloatingBanner, HeroSection, DetailContent as DetailContentType } from '../types';
import LeadForm from '../components/LeadForm';
import { Check, Star, Shield, Clock, ThumbsUp, ArrowRight } from 'lucide-react';
import { logVisit, fetchLandingConfigById } from '../services/googleSheetService';
import KakaoMap from '../components/KakaoMap';
import BannerBlock from '../components/inline/BannerBlock';
import PopupContainer from '../components/popup/PopupContainer';
import ChatButton from '../components/floating/ChatButton';
import NavigationBar from '../components/sections/NavigationBar';
import GalleryBlock from '../components/sections/GalleryBlock';
import BoardBlock from '../components/sections/BoardBlock';
import LocationBlock from '../components/sections/LocationBlock'; // New
import SNSFloatingBar from '../components/floating/SNSFloatingBar';
import SNSBlock from '../components/sections/SNSBlock'; // New
import SmartFeatureBlock from '../components/sections/SmartFeatureBlock';

const LANDING_CONFIGS = LANDING_CONFIGS_JSON as Record<string, LandingConfig>;
import { generateGoogleFontUrl, GOOGLE_FONTS_LIST } from '../utils/fontUtils';

interface Props {
  previewConfig?: LandingConfig;
  isMobileView?: boolean;
  viewMode?: 'all' | 'gallery' | 'board';
}

const LandingPage: React.FC<Props> = ({ previewConfig, isMobileView = false, viewMode = 'all' }) => {
  const { id } = useParams<{ id: string }>();

  // 1. Initial State
  const initialConfig = id ? LANDING_CONFIGS[id] : null;
  const [dynamicConfig, setDynamicConfig] = useState<LandingConfig | null>(initialConfig);
  const [loading, setLoading] = useState(!initialConfig && !previewConfig);

  useEffect(() => {
    if (!previewConfig && id) {
      const fetchConfig = async () => {
        if (!initialConfig) setLoading(true);
        const fetched = await fetchLandingConfigById(id);
        if (fetched) setDynamicConfig(fetched);
        setLoading(false);
      };
      fetchConfig();
    }
  }, [id, previewConfig]);

  let rawConfig: LandingConfig | undefined = previewConfig || dynamicConfig || initialConfig;

  if (!rawConfig && id && !loading) {
    rawConfig = LANDING_CONFIGS[id];
    if (!rawConfig) {
      try {
        const stored = localStorage.getItem('landing_drafts');
        if (stored) {
          const drafts = JSON.parse(stored);
          rawConfig = drafts[id];
        }
      } catch (e) {
        console.error("Failed to load draft config", e);
      }
    }
  }

  // Handle migration fallback
  let config: LandingConfig | undefined = rawConfig;
  if (rawConfig && !rawConfig.banners && (rawConfig as any).banner) {
    config = { ...rawConfig, banners: [(rawConfig as any).banner] };
    if (config.banners[0]) config.banners[0].id = 'legacy_banner';
  } else if (rawConfig && !rawConfig.banners) {
    config = { ...rawConfig, banners: [] };
  }

  // Runtime Safety
  if (config) {
    if (!config.hero) config.hero = { headline: '내용 없음', subHeadline: '', ctaText: '신청하기', size: 'md' } as any;
    if (!config.problem) config.problem = { title: '', description: '', points: [] };
    if (!config.solution) config.solution = { title: '', description: '', features: [] };
    if (!config.trust) config.trust = { reviews: [], stats: [] };
    if (!config.formConfig) config.formConfig = { title: '', fields: [], style: {} } as any;
    if (!config.theme) config.theme = { primaryColor: '#0ea5e9', secondaryColor: '#0f172a', fontConfig: { primaryFont: 'Inter', source: 'google' }, customFonts: [] };
    if (!config.theme.customFonts) config.theme.customFonts = [];
  }

  const isPreview = !!previewConfig;
  const visitLogged = useRef(false);

  useEffect(() => {
    if (config) {
      const effectiveOgTitle = config.ogTitle || config.title;
      const effectiveOgDesc = config.ogDescription || config.hero.subHeadline || config.title;
      document.title = config.title;

      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', effectiveOgDesc);

      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', effectiveOgTitle);

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', effectiveOgDesc);
    }

    if (!previewConfig) window.scrollTo(0, 0);

    if (!isPreview && id && !visitLogged.current) {
      // Visit logging logic ... 
      visitLogged.current = true;
      logVisit({ landing_id: id, ip: 'Unknown', device: 'PC', os: 'Unknown', browser: 'Unknown', referrer: document.referrer });
    }
  }, [config, previewConfig, id]);

  // Font Effect - Simplified for this full-file write
  useEffect(() => {
    if (config?.theme?.customFonts) {
      let styleTag = document.getElementById('custom-font-styles');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'custom-font-styles';
        document.head.appendChild(styleTag);
      }
      const fontFaceRules = config.theme.customFonts.map(font => `
          @font-face {
            font-family: '${font.family}';
            src: url('${font.url}') format('${font.format || 'woff2'}');
            font-display: swap;
          }
        `).join('\n');
      styleTag.textContent = fontFaceRules;
    }
  }, [config?.theme?.customFonts]);

  // Standard Font Load
  useEffect(() => {
    if (!config) return;
    // ... Simplified standard font loading logic ...
    const usedFonts = new Set<string>();
    const collectRef = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) { obj.forEach(collectRef); return; }
      for (const key in obj) {
        if (key === 'fontFamily' && typeof obj[key] === 'string' && obj[key]) usedFonts.add(obj[key]);
        else if (typeof obj[key] === 'object') collectRef(obj[key]);
      }
    };
    collectRef(config);

    const presetFontsToLoad = Array.from(usedFonts).filter(f => !['sans-serif', 'serif'].includes(f));
    if (presetFontsToLoad.length > 0) {
      const url = `https://fonts.googleapis.com/css2?family=${presetFontsToLoad.map(f => f.replace(/\s+/g, '+')).join('&family=')}&display=swap`;
      if (!document.getElementById('dynamic-google-fonts')) {
        const link = document.createElement('link'); link.id = 'dynamic-google-fonts'; link.rel = 'stylesheet'; link.href = url;
        document.head.appendChild(link);
      }
    }
  }, [config]);


  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!config) return <div className="min-h-screen flex items-center justify-center">404 Not Found</div>;

  const { hero, problem, solution, trust, formConfig, theme, detailContent, banners, footer,
    layoutMode = 'mobile', navigation, gallery, board, snsConfig, location, features
  } = config;

  const formPosition = formConfig.position || 'bottom';
  const topBanners = banners.filter(b => b.isShow && b.position === 'top');
  const bottomBanners = banners.filter(b => b.isShow && (b.position === 'bottom' || !b.position));

  // --- Layout Logic ---
  const isFullLayout = layoutMode === 'full';

  // View Modes & Visibility Logic
  const isMainView = viewMode === 'all';
  const isGalleryView = viewMode === 'gallery' || (isMainView && gallery?.showOnMainPage !== false);
  const isBoardView = viewMode === 'board' || (isMainView && board?.showOnMainPage !== false);
  // Location is always on main unless we add viewMode for it later, currently assuming Main Page section
  const isLocationView = isMainView;

  const contentWrapperClass = isFullLayout ? 'max-w-7xl mx-auto px-4 md:px-8' : 'max-w-4xl mx-auto px-4';
  const heroContainerClass = isFullLayout ? 'w-full' : 'max-w-4xl mx-auto';
  const sectionBgClass = isFullLayout ? 'w-full px-0' : 'max-w-4xl mx-auto px-4';

  const getSizeStyles = (size: FloatingBanner['size'] = 'md') => {
    switch (size) {
      case 'xs': return { py: 'py-1', text: 'text-xs', imgHeight: 'max-h-8', approxHeight: 2.0 };
      case 'sm': return { py: 'py-2', text: 'text-sm', imgHeight: 'max-h-12', approxHeight: 2.5 };
      case 'lg': return { py: 'py-4', text: 'text-lg', imgHeight: 'max-h-24', approxHeight: 4.5 };
      case 'xl': return { py: 'py-6', text: 'text-xl', imgHeight: 'max-h-32', approxHeight: 6.0 };
      case 'md': default: return { py: 'py-3', text: 'text-base', imgHeight: 'max-h-16', approxHeight: 3.5 };
    }
  };

  const getHeroPadding = (size: HeroSection['size'] = 'md') => {
    switch (size) {
      case '3xs': return 'py-8';
      case '2xs': return 'py-12';
      case 'xs': return 'py-16';
      case 'sm': return 'py-20';
      case 'lg': return 'py-32';
      case 'xl': return 'py-40';
      case '2xl': return 'py-48';
      case '3xl': return 'py-64';
      case 'md': default: return 'py-24';
    }
  };

  const getCTAWidth = (width?: string) => width === 'full' ? '100%' : '16rem';

  const getTotalApproxHeight = (bannerList: FloatingBanner[]) => {
    return bannerList.reduce((acc, b) => acc + getSizeStyles(b.size).approxHeight, 0);
  };
  const bottomPaddingRem = getTotalApproxHeight(bottomBanners);

  const scrollToForm = () => {
    const formElement = document.getElementById('lead-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const renderDetailContent = (item: DetailContentType, index: number) => {
    if (item.type === 'banner') return <BannerBlock key={item.id || index} data={item} />;
    if (item.type === 'map') return <div key={index} className="w-full mb-4"><KakaoMap address={item.content} height="400px" /></div>;
    if (item.type === 'youtube') return <div key={index} className="w-full aspect-video mb-4"><iframe src={item.content} className="w-full h-full" /></div>;

    const widthClass = item.width === '100%' || !item.width ? (isFullLayout ? 'max-w-5xl' : 'max-w-4xl') : 'w-full';
    return <img key={index} src={item.content} className={`block mx-auto mb-0 h-auto ${widthClass}`} />;
  };

  const FormComponent = () => (
    <section id="lead-form" className={`py-20 bg-gray-50 ${isFullLayout ? 'w-full' : 'max-w-4xl mx-auto px-4'}`}>
      <div className={isFullLayout ? 'max-w-3xl mx-auto' : 'w-full'}>
        <LeadForm config={formConfig} landingId={config.id} themeColor={theme.primaryColor} pageTitle={config.title} />
      </div>
    </section>
  );

  const getTextStyle = (style?: any, defaults?: any) => ({
    fontSize: style?.fontSize || defaults?.fontSize,
    fontWeight: style?.fontWeight || defaults?.fontWeight,
    color: style?.color || defaults?.color,
    textAlign: style?.textAlign || defaults?.textAlign,
    letterSpacing: style?.letterSpacing || defaults?.letterSpacing,
    fontFamily: style?.fontFamily || defaults?.fontFamily,
  });

  const BannerItem = ({ banner }: { banner: FloatingBanner }) => {
    const styles = getSizeStyles(banner.size);
    return (
      <a href={banner.linkUrl || "#lead-form"} className="block shadow-lg relative bg-gray-900 text-white" style={{ backgroundColor: banner.backgroundColor, color: banner.textColor }}>
        <div className={`p-3 text-center ${styles.text}`}>{banner.text}</div>
      </a>
    );
  };

  const safeFooter = footer || { isShow: false, images: [], copyrightText: '' };


  return (
    <div className={`font-sans text-gray-900 bg-white ${isPreview ? 'h-full relative overflow-hidden' : 'min-h-screen'}`}>

      {/* Navigation Bar (New) */}
      {navigation && <NavigationBar config={navigation} siteTitle={config.title} isMobileView={isMobileView} landingId={config.id} />}

      <div
        className={isPreview ? "h-full overflow-y-auto" : ""}
        style={{ paddingBottom: bottomBanners.length > 0 ? `${bottomPaddingRem}rem` : '0' }}
      >
        {topBanners.length > 0 && (
          <div className={`sticky top-0 z-50 mx-auto flex flex-col shadow-xl ${isFullLayout ? 'w-full' : 'max-w-4xl'}`}>
            {topBanners.map(b => <BannerItem key={b.id} banner={b} />)}
          </div>
        )}

        {/* 1. Hero Section */}
        <div id="section-hero">
          {(hero.isShow ?? true) && isMainView && (
            <section className={`relative bg-gray-900 text-white overflow-hidden mx-auto ${heroContainerClass} px-4 ${getHeroPadding(hero.size)}`}>
              <div className="absolute inset-0 z-0 opacity-20">
                {hero.backgroundImage && <img src={hero.backgroundImage} alt="Background" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/50"></div>
              </div>
              <div className="relative z-10 w-full text-center">
                <h1 className="mb-6 leading-tight break-keep" style={getTextStyle(hero.headlineStyle, { fontSize: '3.75rem', fontWeight: '800', color: 'white' })}>
                  {hero.headline}
                </h1>
                <p className="mb-10 max-w-2xl mx-auto break-keep opacity-90" style={getTextStyle(hero.subHeadlineStyle, { fontSize: '1.25rem' })}>
                  {hero.subHeadline}
                </p>
                <button onClick={scrollToForm} className="px-8 py-4 font-bold rounded-full bg-blue-500 text-white hover:scale-105 transition-transform" style={{ backgroundColor: hero.ctaStyle?.backgroundColor || theme.primaryColor, color: hero.ctaStyle?.textColor || 'white' }}>
                  {hero.ctaText}
                </button>
              </div>
            </section>
          )}
        </div>

        {formPosition === 'after_hero' && isMainView && <FormComponent />}

        {detailContent && detailContent.length > 0 && isMainView && (
          <section className={`w-full bg-white mx-auto flex flex-col items-center ${isFullLayout ? 'max-w-7xl px-4 py-10' : 'max-w-4xl py-0'}`}>
            {detailContent.map((item, idx) => renderDetailContent(item, idx))}
          </section>
        )}

        {/* 2. Problem Section */}
        {problem.title && isMainView && (
          <section id="section-problem" className={`py-20 ${sectionBgClass}`} style={{ backgroundColor: problem.backgroundColor || '#f9fafb' }}>
            <div className={contentWrapperClass}>
              <div className="text-center mb-12">
                <h2 className="mb-4 text-3xl font-bold">{problem.title}</h2>
                <p className="text-gray-600">{problem.description}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-3xl mx-auto">
                <ul className="space-y-6">
                  {problem.points.map((pt, i) => <li key={i} className="flex gap-4"><span className="text-red-500 font-bold">!</span>{pt}</li>)}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 3. Solution Section */}
        {solution.title && isMainView && (
          <section id="section-solution" className={`py-20 ${sectionBgClass}`} style={{ backgroundColor: solution.backgroundColor || '#ffffff' }}>
            <div className={contentWrapperClass}>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">{solution.title}</h2>
                <p className="text-gray-600">{solution.description}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {solution.features.map((f, i) => (
                  <div key={i} className="p-6 rounded-xl border border-gray-100 text-center">
                    <h3 className="font-bold text-xl mb-2">{f.title}</h3>
                    <p className="text-gray-500">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Smart Feature Block (Animated) - New Phase 3 */}
        {features && features.isShow && isMainView && (
          <div className={isFullLayout ? 'w-full' : 'max-w-4xl mx-auto'}>
            <SmartFeatureBlock data={features} />
          </div>
        )}

        {/* Gallery */}
        {gallery && gallery.isShow && isGalleryView && (
          <div className={isFullLayout ? 'w-full bg-white' : 'max-w-4xl mx-auto'}>
            <GalleryBlock data={gallery} isMobileView={isMobileView || isPreview} />
          </div>
        )}

        {/* Board */}
        {board && board.isShow && isBoardView && (
          <div className={isFullLayout ? 'w-full bg-gray-50' : 'max-w-4xl mx-auto'}>
            <BoardBlock data={board} isMobileView={isMobileView || isPreview} />
          </div>
        )}

        {/* Location (New) */}
        {location && location.isShow && isLocationView && (
          <div className={isFullLayout ? 'w-full bg-white' : 'max-w-4xl mx-auto'}>
            <LocationBlock data={location} isMobileView={isMobileView || isPreview} />
          </div>
        )}

        {/* Trust/Reviews */}
        {(trust.reviews?.length > 0 || trust.stats?.length > 0) && isMainView && (
          <section className={`py-20 ${sectionBgClass}`} style={{ backgroundColor: trust.backgroundColor || '#111827', color: trust.textColor || '#ffffff' }}>
            <div className={contentWrapperClass}>
              {trust.stats && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-8 mb-16 border-b border-gray-800 pb-12">
                  {trust.stats.map((stat, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: theme.primaryColor }}>{stat.value}</div>
                      <div className="opacity-60 font-medium uppercase tracking-wider text-sm break-keep">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                {trust.reviews?.map((review, idx) => (
                  <div key={idx} className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                    <div className="flex text-yellow-400 mb-3">{[...Array(review.rating || 5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}</div>
                    <p className="opacity-90 mb-4 italic">"{review.text}"</p>
                    <div className="font-bold">- {review.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Location Section (New Phase 3) */}
        {location && location.isShow && isLocationView && (
          <div className={isFullLayout ? 'w-full' : 'max-w-4xl mx-auto'}>
            <LocationBlock data={location} />
          </div>
        )}

        {(formPosition === 'bottom' || !formPosition) && isMainView && <FormComponent />}

        {/* SNS Block Mode (New) */}
        {snsConfig && snsConfig.displayMode === 'block' && isMainView && (
          <div className={isFullLayout ? 'w-full' : 'max-w-4xl mx-auto'}>
            <SNSBlock config={snsConfig} />
          </div>
        )}

        {safeFooter.isShow && (
          <footer className="bg-white border-t border-gray-200 max-w-4xl mx-auto pb-12 pt-8">
            <div className="text-center px-4">
              {safeFooter.images?.map((img, i) => <img key={i} src={img} className="max-w-full h-auto mx-auto mb-4" />)}
              <p className="text-sm text-gray-400 whitespace-pre-line">{safeFooter.copyrightText}</p>
            </div>
          </footer>
        )}

      </div>

      {
        bottomBanners.length > 0 && (
          <div className={`${isPreview ? 'absolute bottom-0 w-full' : 'fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl'} z-50 flex flex-col-reverse shadow-xl-up`}>
            {bottomBanners.map(b => <BannerItem key={b.id} banner={b} />)}
          </div>
        )
      }

      {config.popupConfig && <PopupContainer config={config.popupConfig} landingId={config.id} isPreview={isPreview} forceMobile={isMobileView} />}
      {config.chatConfig && <ChatButton config={config.chatConfig} isPreview={isPreview} />}

      {/* SNS Floating Bar (New) */}
      {snsConfig && <SNSFloatingBar config={snsConfig} isMobileView={isMobileView || isPreview} />}

    </div >
  );
};

export default LandingPage;