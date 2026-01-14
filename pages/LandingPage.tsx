import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import LANDING_CONFIGS_JSON from '../data/landingConfigs.json';
import { LandingConfig, FloatingBanner, HeroSection, DetailContent as DetailContentType } from '../types';
import LeadForm from '../components/LeadForm';
import { Check, Star, Shield, Clock, ThumbsUp, ArrowRight } from 'lucide-react';
import { logVisit, fetchLandingConfigById, fetchGlobalSettings } from '../services/googleSheetService';
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
import { generateGoogleFontUrl, GOOGLE_FONTS_LIST } from '../utils/fontUtils';
import RehabChatButton from '../components/rehab/RehabChatButton';
import StickyBottomForm from '../components/StickyBottomForm';

const LANDING_CONFIGS = LANDING_CONFIGS_JSON as unknown as Record<string, LandingConfig>;

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

  // AI Chat Popup State - Must be at the top to maintain hook order
  const [isRehabChatOpen, setIsRehabChatOpen] = useState(false);

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

      // --- Favicon Update ---
      if (config.favicon) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.setAttribute('rel', 'icon');
          document.head.appendChild(link);
        }
        link.setAttribute('href', config.favicon);
      }
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
      const existingLink = document.getElementById('dynamic-google-fonts') as HTMLLinkElement;
      if (existingLink) {
        if (existingLink.href !== url) existingLink.href = url;
      } else {
        const link = document.createElement('link');
        link.id = 'dynamic-google-fonts';
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
      }
    }
  }, [config]);


  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!config) return <div className="min-h-screen flex items-center justify-center">404 Not Found</div>;

  // New: Dynamic Step Template Route
  if (config.template === 'dynamic_step') {
    const handleDynamicSubmit = async (data: any) => {
      // Re-use logic or call service
      if (!isPreview && id) {
        await import('../services/googleSheetService').then(({ submitLead }) => {
          return submitLead(data);
        });

        // Conversion tracking logic from LeadForm if needed
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'generate_lead', {
            'event_category': 'engagement',
            'event_label': id
          });
        }
      } else {
        console.log("Submit mocked (preview): ", data);
        await new Promise(r => setTimeout(r, 1000));
      }
    };

    // Dynamic Import to bundle split
    const DynamicStepTemplate = React.lazy(() => import('../components/templates/DynamicStep/DynamicStepTemplate'));

    return (
      <React.Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Template...</div>}>
        <DynamicStepTemplate config={config} onSubmit={handleDynamicSubmit} />
      </React.Suspense>
    );
  }

  const { hero, formConfig, theme, detailContent, banners, footer,
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

  const getHeroVerticalPadding = (size: HeroSection['size'] = 'md', align: number = 0) => {
    const basePaddingMap: Record<string, number> = {
      '3xs': 2, '2xs': 3, 'xs': 4, 'sm': 5,
      'md': 6, 'lg': 8, 'xl': 10, '2xl': 12, '3xl': 16
    };
    const baseRem = basePaddingMap[size] || 6;

    // Shift logic: -2 (Top) means less top padding, more bottom padding.
    // Factor: 0.25 per step -> Max 50% shift for +/- 2
    const topFactor = 1 + (align * 0.25); // -2 => 0.5, +2 => 1.5
    const bottomFactor = 1 - (align * 0.25); // -2 => 1.5, +2 => 0.5

    return {
      paddingTop: `${baseRem * topFactor}rem`,
      paddingBottom: `${baseRem * bottomFactor}rem`
    };
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

  // Advanced Interaction Handlers
  const handleHeroCtaClick = () => {
    const action = hero.ctaActionType || 'scroll_to_form';
    if (action === 'open_rehab_chat') {
      setIsRehabChatOpen(true);
    } else if (action === 'link_url' && hero.ctaLinkUrl) {
      if (hero.ctaLinkUrl.startsWith('http')) {
        window.open(hero.ctaLinkUrl, '_blank');
      } else {
        window.location.href = hero.ctaLinkUrl;
      }
    } else {
      scrollToForm();
    }
  };

  const handleBannerClick = (e: React.MouseEvent, banner: FloatingBanner) => {
    const action = banner.actionType || 'scroll_to_form';

    // Determine if we should prevent default link behavior
    // If it's a simple link, we might let <a> tag handle it, but for custom logic:
    if (action === 'open_rehab_chat') {
      e.preventDefault();
      setIsRehabChatOpen(true);
    } else if (action === 'scroll_to_form') {
      e.preventDefault();
      scrollToForm();
    }
    // If action is 'link_url', we let the <a> tag handle it (href is set)
  };

  const renderDetailContent = (item: DetailContentType, index: number) => {
    if (item.type === 'banner') return <BannerBlock key={item.id || index} data={item} />;
    if (item.type === 'map') return <div key={index} className="w-full mb-4"><KakaoMap address={item.content} height="400px" /></div>;
    if (item.type === 'youtube') return <div key={index} className="w-full aspect-video mb-4"><iframe src={item.content} className="w-full h-full" /></div>;

    const widthClass = item.width === '100%' || !item.width ? (isFullLayout ? 'max-w-5xl' : 'max-w-4xl') : 'w-full';
    return <img key={index} src={item.content} className={`block mx-auto mb-0 h-auto ${widthClass} max-w-full`} />;
  };

  // Gap Scale Mapping
  const GAP_MAP: Record<number, string> = {
    0: '0',
    1: '2rem',
    2: '3rem',
    3: '5rem', // default
    4: '8rem',
    5: '12rem'
  };

  const FormComponent = () => {
    // Form Container Style logic
    const vPadding = config.formConfig.containerStyle?.verticalPadding ?? 3;

    const containerStyle = {
      paddingTop: GAP_MAP[vPadding],
      paddingBottom: GAP_MAP[vPadding]
    };

    const removePadding = config.formConfig.containerStyle?.removeContainerPadding;

    return (
      <section
        id="lead-form"
        className={`bg-gray-50 ${isFullLayout ? 'w-full' : (removePadding ? 'max-w-4xl mx-auto' : 'max-w-4xl mx-auto px-4')}`}
        style={containerStyle}
      >
        <div className={isFullLayout ? 'max-w-3xl mx-auto' : 'w-full'}>
          <LeadForm
            config={formConfig}
            landingId={config.id}
            themeColor={theme.primaryColor}
            pageTitle={config.title}
            isMobileView={isMobileView}
          />
        </div>
      </section>
    );
  };

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

    // Sliding Logic
    const isSliding = banner.isSliding;
    const animationStyle = isSliding ? {
      animationDuration: `${banner.slideSpeed || 15}s`,
      width: '100%',
    } : {};

    // Animation Class - Support both button animation and banner-specific animation
    const animClass = banner.animation ? `animate-btn-${banner.animation}` : '';
    const bannerAnimClass = banner.bannerAnimation && banner.bannerAnimation !== 'none'
      ? `animate-banner-${banner.bannerAnimation}`
      : '';

    // Custom Shape Mode (PNG Image Only)
    if (banner.isCustomShape && banner.imageUrl) {
      // Determine href based on action
      const customHref = banner.actionType === 'link_url' ? (banner.linkUrl || '#') : '#lead-form';

      return (
        <a
          href={customHref}
          onClick={(e) => handleBannerClick(e, banner)}
          className={`block relative transition-transform hover:scale-105 ${animClass} ${bannerAnimClass}`}
        >
          <img
            src={banner.imageUrl}
            alt={banner.text}
            className="w-full h-auto object-contain mx-auto"
            style={{
              maxWidth: banner.size === 'xs' ? '100px' :
                banner.size === 'sm' ? '150px' :
                  banner.size === 'lg' ? '300px' :
                    banner.size === 'xl' ? '400px' : '220px' // md default
            }}
          />
        </a>
      );
    }

    // Check if using background image mode
    const hasBackgroundImage = !!banner.backgroundImageUrl;
    const bgOpacity = banner.backgroundImageOpacity ?? 100;

    // Determine href based on action
    const href = banner.actionType === 'link_url' ? (banner.linkUrl || '#') : '#lead-form';

    return (
      <a
        href={href}
        onClick={(e) => handleBannerClick(e, banner)}
        className={`block shadow-lg relative overflow-hidden ${animClass} ${bannerAnimClass}`}
        style={{
          backgroundColor: hasBackgroundImage ? 'transparent' : banner.backgroundColor,
          color: banner.textColor,
          cursor: 'pointer'
        }}
      >
        {/* Background image layer */}
        {hasBackgroundImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${banner.backgroundImageUrl})`,
                opacity: bgOpacity / 100
              }}
            />
            {/* Color overlay for text visibility - use backgroundColor as fallback */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: banner.backgroundColor,
                opacity: 0.3
              }}
            />
          </>
        )}
        <div
          className={`p-3 text-center ${styles.text} ${isSliding ? 'animate-marquee' : ''} relative z-10`}
          style={{
            ...animationStyle,
            fontSize: banner.fontSize || undefined,
            fontFamily: banner.fontFamily,
            fontWeight: banner.fontWeight || '600',
          }}
        >
          {banner.text}
        </div>
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
            <section
              className={`relative bg-gray-900 text-white overflow-hidden mx-auto ${heroContainerClass} px-4`}
              style={getHeroVerticalPadding(hero.size, hero.verticalAlign ?? 0)}
            >
              <div className="absolute inset-0 z-0">
                {hero.backgroundImage && <img src={hero.backgroundImage} alt="Background" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black" style={{ opacity: (hero.overlayOpacity ?? 20) / 100 }}></div>
              </div>
              <div className="relative z-10 w-full text-center">
                <h1 className="mb-6 leading-tight break-keep" style={getTextStyle(hero.headlineStyle, { fontSize: '3.75rem', fontWeight: '800', color: 'white' })}>
                  {hero.headline}
                </h1>
                <p className="mb-10 max-w-2xl mx-auto break-keep opacity-90" style={getTextStyle(hero.subHeadlineStyle, { fontSize: '1.25rem' })}>
                  {hero.subHeadline}
                </p>
                {/* CTA Button */}
                <div style={{ display: 'flex', justifyContent: hero.ctaStyle?.alignment === 'left' ? 'flex-start' : (hero.ctaStyle?.alignment === 'right' ? 'flex-end' : 'center') }}>
                  <button
                    onClick={handleHeroCtaClick}
                    className={`font-bold transition-transform hover:scale-105 ${hero.ctaStyle?.animation ? `animate-btn-${hero.ctaStyle.animation}` : ''}`}
                    style={{
                      backgroundColor: hero.ctaStyle?.backgroundColor || theme.primaryColor,
                      color: hero.ctaStyle?.textColor || 'white',
                      fontSize: hero.ctaStyle?.fontSize || '1.125rem',
                      borderRadius: hero.ctaStyle?.borderRadius || '9999px',
                      fontFamily: hero.ctaStyle?.fontFamily,
                      width: hero.ctaStyle?.width === 'full' ? '100%' :
                        (hero.ctaStyle?.width === 'xs' ? '128px' :
                          (hero.ctaStyle?.width === 'sm' ? '192px' :
                            (hero.ctaStyle?.width === 'md' ? '256px' :
                              (hero.ctaStyle?.width === 'lg' ? '320px' :
                                (hero.ctaStyle?.width === 'xl' ? '384px' : 'auto'))))),
                      padding: '1rem 2rem',
                      ...(hero.ctaStyle?.backgroundImage ? {
                        backgroundImage: `url(${hero.ctaStyle.backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        border: 'none', // Remove border if image is used
                        color: hero.ctaStyle.textColor || 'white' // Ensure text is visible
                      } : (hero.ctaStyle?.animation === 'shimmer' ? {
                        '--btn-bg': hero.ctaStyle?.backgroundColor || theme.primaryColor,
                        '--btn-shine': 'rgba(255,255,255,0.4)'
                      } : {}))
                    } as React.CSSProperties}
                  >
                    {hero.ctaText}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        {formPosition === 'after_hero' && isMainView && !(config.stickyBottomForm?.isEnabled && config.stickyBottomForm?.hideOriginalForm) && <FormComponent />}

        {detailContent && detailContent.length > 0 && isMainView && (
          <section className={`w-full bg-white mx-auto flex flex-col items-center ${isFullLayout ? 'max-w-7xl px-4 py-10' : 'max-w-4xl py-0'}`}>
            {detailContent.map((item, idx) => renderDetailContent(item, idx))}
          </section>
        )}





        {/* Smart Feature Block (Animated) - New Phase 3 */}
        {features && features.isShow && isMainView && (
          <div className={isFullLayout ? 'w-full' : 'max-w-4xl mx-auto'}>
            <SmartFeatureBlock data={features} isMobileView={isMobileView} />
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



        {(formPosition === 'bottom' || !formPosition) && isMainView && !(config.stickyBottomForm?.isEnabled && config.stickyBottomForm?.hideOriginalForm) && <FormComponent />}



        {safeFooter.isShow && (
          <footer className="bg-white border-t border-gray-200 max-w-4xl mx-auto pb-12 pt-8">
            <div className="text-center px-4">
              {safeFooter.images?.map((img, i) => <img key={i} src={img} className="max-w-full h-auto mx-auto mb-4" />)}
              <p className="text-sm text-gray-400 whitespace-pre-line">{safeFooter.copyrightText}</p>
            </div>
          </footer>
        )}

      </div>

      {/* NEW: Sticky Bottom Form */}
      {config.stickyBottomForm?.isEnabled && (
        <StickyBottomForm
          config={config.stickyBottomForm}
          formConfig={formConfig}
          landingId={config.id}
          themeColor={theme.primaryColor}
          isMobileView={isMobileView}
        />
      )}

      {
        bottomBanners.length > 0 && (
          <div className={`${isPreview ? 'absolute bottom-0 w-full' : (isFullLayout ? 'fixed bottom-0 left-0 w-full' : 'fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl')} z-50 flex flex-col-reverse shadow-xl-up`}>
            {bottomBanners.map(b => <BannerItem key={b.id} banner={b} />)}
          </div>
        )
      }

      {config.popupConfig && (
        <PopupContainer
          config={config.popupConfig}
          landingId={config.id}
          isPreview={isPreview}
          forceMobile={isMobileView}
          onScrollToForm={scrollToForm}
          onOpenChat={() => setIsRehabChatOpen(true)}
        />
      )}
      {config.chatConfig && <ChatButton config={config.chatConfig} isPreview={isPreview} />}

      {/* SNS Floating Bar (New) */}
      {snsConfig && <SNSFloatingBar config={snsConfig} isMobileView={isMobileView || isPreview} />}

      {/* AI 변제금 진단 챗봇 */}
      {config.rehabChatConfig?.isEnabled && (
        <RehabChatButton
          config={config.rehabChatConfig}
          // Lifting State for shared control
          isOpen={isRehabChatOpen}
          onOpen={() => setIsRehabChatOpen(true)}
          onClose={() => setIsRehabChatOpen(false)}
        />
      )}

    </div >
  );
};

export default LandingPage;