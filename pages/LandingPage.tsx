
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

const LANDING_CONFIGS = LANDING_CONFIGS_JSON as Record<string, LandingConfig>;
import { generateGoogleFontUrl } from '../utils/fontUtils';

interface Props {
  previewConfig?: LandingConfig; // Optional prop for Live Preview
  isMobileView?: boolean;
}

const LandingPage: React.FC<Props> = ({ previewConfig, isMobileView = false }) => {
  const { id } = useParams<{ id: string }>();

  // 1. Initial State: Try to load from "Hardcoded Configs" (Instant)
  // This eliminates the loading spinner for known IDs
  const initialConfig = id ? LANDING_CONFIGS[id] : null;

  const [dynamicConfig, setDynamicConfig] = useState<LandingConfig | null>(initialConfig);
  // Show loading only if we DON'T have an initial config (and it's not a preview)
  const [loading, setLoading] = useState(!initialConfig && !previewConfig);

  // Logic Updated: 
  // 1. Priority: Preview Config (Editor Live View)
  // 2. Secondary: Dynamic Config (Fetched/Cached)
  // 3. Tertiary: Initial/Hardcoded Config (Legacy Fallback)

  // Only fetch if no previewConfig and id exists
  useEffect(() => {
    if (!previewConfig && id) {
      const fetchConfig = async () => {
        // If we didn't have initial config, we are showing a spinner, so keep it.
        // If we DID have initial config, we are showing content, so DON'T show spinner (background update).
        if (!initialConfig) setLoading(true);

        const fetched = await fetchLandingConfigById(id);

        if (fetched) {
          // Only update if data is different (simple check) or if we didn't have it
          // For now, just update to ensure freshness (React handles diffing)
          setDynamicConfig(fetched);
        }

        setLoading(false);
      };
      fetchConfig();
    }
  }, [id, previewConfig]);

  let rawConfig: LandingConfig | undefined = previewConfig || dynamicConfig || initialConfig;

  if (!rawConfig && id && !loading) { // If not loaded yet, try fallback
    // 3. Try Hardcoded
    rawConfig = LANDING_CONFIGS[id];

    // 4. Try LocalStorage (Drafts)
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

  // Handle migration fallback: if config is old and has 'banner', map it to 'banners'
  let config: LandingConfig | undefined = rawConfig;

  if (rawConfig && !rawConfig.banners && (rawConfig as any).banner) {
    // Runtime migration for old configs
    config = {
      ...rawConfig,
      banners: [(rawConfig as any).banner]
    };
    if (config.banners[0]) config.banners[0].id = 'legacy_banner';
  } else if (rawConfig && !rawConfig.banners) {
    config = { ...rawConfig, banners: [] };
  }

  const isPreview = !!previewConfig;
  const visitLogged = useRef(false);

  useEffect(() => {
    if (config) {
      // Calculate effective values for SEO
      // 1. Title: Browser Tab uses 'title'. SNS uses 'ogTitle' OR fallback to 'title'.
      const effectiveOgTitle = config.ogTitle || config.title;
      // 2. Description: SNS/Meta uses 'ogDescription' OR fallback to 'hero.subHeadline' OR 'title'.
      const effectiveOgDesc = config.ogDescription || config.hero.subHeadline || config.title;

      // 1. Update Document Title (Browser Tab)
      document.title = config.title;

      // 2. Update Meta Description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', effectiveOgDesc);

      // 3. Update Meta Keywords (SEO)
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', config.keywords || '');

      // 4. Update Open Graph Title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', effectiveOgTitle);

      // 5. Update Open Graph Description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', effectiveOgDesc);

      // 6. Update Favicon (Dynamic)
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = config.favicon || '/favicon.ico';

      // 7. Update Open Graph Image (Dynamic)
      const ogImageMeta = document.querySelector('meta[property="og:image"]');
      if (ogImageMeta) ogImageMeta.setAttribute('content', config.ogImage || '/og-image.png');

      // 8. Update Twitter Card Tags
      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute('content', effectiveOgTitle);

      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute('content', effectiveOgDesc);

      const twImageMeta = document.querySelector('meta[name="twitter:image"]');
      if (twImageMeta) twImageMeta.setAttribute('content', config.ogImage || '/og-image.png');
    }

    // Only scroll to top if not in preview mode to avoid jumping
    if (!previewConfig) {
      window.scrollTo(0, 0);
    }

    // --- VISIT TRACKING LOGIC ---
    // Only track if not in preview mode and haven't logged yet
    if (!isPreview && id && !visitLogged.current) {
      // ... existing logic ...
    }
  }, [config, previewConfig, id]);

  // --- SEPARATE EFFECT FOR FONTS ---
  // Isolate this to ensure it runs specifically when fonts change
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
            src: url('${font.url}') format('${font.url.endsWith('.woff2') ? 'woff2' : font.url.endsWith('.woff') ? 'woff' : 'truetype'}');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
        `).join('\n');

      styleTag.textContent = fontFaceRules;
    }
  }, [config?.theme?.customFonts]);

  // --- GOOGLE FONTS LOADING ---
  useEffect(() => {
    if (!config) return;

    const usedFonts = new Set<string>();
    // Recursively find all 'fontFamily' keys in the config
    const collectRef = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(collectRef);
        return;
      }
      for (const key in obj) {
        if (key === 'fontFamily' && typeof obj[key] === 'string' && obj[key]) {
          usedFonts.add(obj[key]);
        } else if (typeof obj[key] === 'object') {
          collectRef(obj[key]);
        }
      }
    };
    collectRef(config);

    // Filter out custom fonts and system fonts
    const customFamilies = new Set((config.theme?.customFonts || []).map(f => f.family));
    const systemFonts = ['sans-serif', 'serif', 'monospace', 'inherit', 'initial', '', 'Arial', 'Helvetica', 'Times New Roman'];

    const googleFontsToLoad = Array.from(usedFonts).filter(f =>
      !customFamilies.has(f) &&
      !systemFonts.includes(f) &&
      !f.includes(',') // Exclude fallback stacks
    );

    if (googleFontsToLoad.length > 0) {
      // Generate URL: family=Roboto:wght@300;400;700;800&family=Open+Sans...
      const families = googleFontsToLoad.map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;700;800`).join('&');
      const url = `https://fonts.googleapis.com/css2?${families}&display=swap`;

      let link = document.getElementById('dynamic-google-fonts') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = 'dynamic-google-fonts';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      if (link.href !== url) {
        link.href = url;
      }
    }
  }, [config]); // Re-run when config structure changes

  // --- VISIT & SCROLL EFFECT ---
  useEffect(() => {
    // Only scroll to top if not in preview mode to avoid jumping
    if (!previewConfig) {
      window.scrollTo(0, 0);
    }

    // --- VISIT TRACKING LOGIC ---
    // Only track if not in preview mode and haven't logged yet
    if (!isPreview && id && !visitLogged.current) {
      visitLogged.current = true; // Prevent double logging in React.StrictMode

      const trackVisit = async () => {
        // 1. Get IP (Client-side)
        let ip = 'Unknown';
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          ip = data.ip;
        } catch (e) { console.warn('Failed to fetch IP'); }

        // 2. Parse User Agent (Simple)
        const ua = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

        let os = 'Unknown';
        if (ua.indexOf("Win") !== -1) os = "Windows";
        if (ua.indexOf("Mac") !== -1) os = "MacOS";
        if (ua.indexOf("Linux") !== -1) os = "Linux";
        if (ua.indexOf("Android") !== -1) os = "Android";
        if (ua.indexOf("like Mac") !== -1) os = "iOS";

        let browser = 'Unknown';
        if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
        else if (ua.indexOf("Safari") !== -1) browser = "Safari";
        else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
        else if (ua.indexOf("MSIE") !== -1 || !!(document as any).documentMode) browser = "IE";

        // 3. Get Referrer
        const referrer = document.referrer || (window.location.href.includes('fbclid') ? 'Facebook/Insta' : 'Direct');

        logVisit({
          landing_id: id,
          ip,
          device: isMobile ? 'Mobile' : 'PC',
          os,
          browser,
          referrer
        });
      };
      trackVisit();
    }
  }, [config, previewConfig, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 text-sm">페이지 불러오는 중...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-gray-600 mb-8">존재하지 않는 페이지입니다.</p>
        {(id) && (
          <div className="text-xs text-red-400 bg-red-50 p-4 rounded mb-4 max-w-md text-left">
            <p className="font-bold mb-1">디버깅 정보:</p>
            <p>ID: {id}</p>
            <p>서버 연동: {loading ? '로딩 중...' : '완료'}</p>
            <p>Google Apps Script 연동을 확인해주세요.</p>
          </div>
        )}
        <Link to="/" className="text-blue-600 hover:underline">홈으로 돌아가기</Link>
        <div className="mt-4 text-xs text-gray-400">
          (Tip: 에디터에서 '임시 저장'한 페이지는 해당 브라우저에서만 확인 가능합니다.)
        </div>
      </div>
    );
  }

  const { hero, problem, solution, trust, formConfig, theme, detailContent, banners, footer } = config;
  const formPosition = formConfig.position || 'bottom'; // Default to bottom

  const topBanners = banners.filter(b => b.isShow && b.position === 'top');
  const bottomBanners = banners.filter(b => b.isShow && (b.position === 'bottom' || !b.position));

  // --- Size Logic Helpers ---
  const getSizeStyles = (size: FloatingBanner['size'] = 'md') => {
    switch (size) {
      case 'xs': return { py: 'py-1', text: 'text-xs', imgHeight: 'max-h-8', approxHeight: 2.0 }; // ~32px
      case 'sm': return { py: 'py-2', text: 'text-sm', imgHeight: 'max-h-12', approxHeight: 2.5 }; // ~40px
      case 'lg': return { py: 'py-4', text: 'text-lg', imgHeight: 'max-h-24', approxHeight: 4.5 }; // ~72px
      case 'xl': return { py: 'py-6', text: 'text-xl', imgHeight: 'max-h-32', approxHeight: 6.0 }; // ~96px
      case 'md':
      default: return { py: 'py-3', text: 'text-base', imgHeight: 'max-h-16', approxHeight: 3.5 }; // ~56px
    }
  };

  const getHeroPadding = (size: HeroSection['size'] = 'md') => {
    switch (size) {
      case '3xs': return 'py-4';
      case '2xs': return 'py-8';
      case 'xs': return 'py-12';
      case 'sm': return 'py-16';
      case 'lg': return 'py-32';
      case 'xl': return 'py-40';
      case '2xl': return 'py-48';
      case '3xl': return 'py-64';
      case 'md': default: return 'py-24';
    }
  };

  const getCTAWidth = (width?: string) => {
    switch (width) {
      case 'xs': return '8rem'; // 128px
      case 'sm': return '12rem'; // 192px
      case 'md': return '16rem'; // 256px
      case 'lg': return '20rem'; // 320px
      case 'xl': return '24rem'; // 384px
      case 'full': return '100%';
      case 'auto': default: return 'auto';
    }
  };

  // Calculate approximate padding for body to avoid overlap
  const getTotalApproxHeight = (bannerList: FloatingBanner[]) => {
    return bannerList.reduce((acc, b) => acc + getSizeStyles(b.size).approxHeight, 0);
  };


  const bottomPaddingRem = getTotalApproxHeight(bottomBanners);


  const scrollToForm = () => {
    const formElement = document.getElementById('lead-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper to render Detail Content (Image, YouTube, Map)
  const renderDetailContent = (item: DetailContentType, index: number) => {
    // 0. Banner (New)
    if (item.type === 'banner') {
      return <BannerBlock key={item.id || index} data={item} />;
    }

    // 1. YouTube
    if (item.type === 'youtube') {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = item.content.match(youtubeRegex);
      const videoId = match ? match[1] : '';

      if (!videoId) return null;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const shouldAutoPlay = item.autoPlay && !isMobile;
      const muteParam = shouldAutoPlay ? '&mute=1' : '';
      const autoplayParam = shouldAutoPlay ? '&autoplay=1' : '';

      const widthClass = item.videoSize === 'sm' ? 'max-w-md' : item.videoSize === 'lg' ? 'max-w-5xl' : item.videoSize === 'full' ? 'w-full' : 'max-w-3xl';

      return (
        <div key={item.id || index} className={`w-full mx-auto aspect-video mb-4 ${widthClass}`}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?rel=0${autoplayParam}${muteParam}`}
            title={`Video ${index}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="block rounded-lg shadow-lg"
          ></iframe>
        </div>
      );
    }

    // 2. Map
    if (item.type === 'map') {
      const widthClass = item.mapSize === 'sm' ? 'max-w-md' : item.mapSize === 'lg' ? 'max-w-5xl' : item.mapSize === 'full' ? 'w-full' : 'max-w-3xl';
      return (
        <div key={item.id || index} className={`w-full mx-auto mb-4 ${widthClass}`}>
          <KakaoMap
            address={item.content}
            placeName={item.mapPlaceName}
            height="400px"
            width="100%"
          />
        </div>
      );
    }

    // 3. Image (Default)
    const widthClass = item.width === '100%' || !item.width ? 'max-w-4xl' : 'w-full';
    return (
      <img
        key={item.id || index}
        src={item.content}
        alt={`Detail ${index + 1}`}
        className={`w-full h-auto block mx-auto mb-0 ${widthClass}`}
        loading="lazy"
      />
    );
  };

  const FormComponent = () => (
    <section id="lead-form" className="py-20 px-4 bg-gray-50 max-w-4xl mx-auto">
      <div className="w-full">
        <LeadForm
          config={formConfig}
          landingId={config.id}
          themeColor={theme.primaryColor}
          pageTitle={config.title} // Pass Global Page Title
        />
      </div>
    </section>
  );

  const BannerItem = ({ banner }: { banner: FloatingBanner }) => {
    const styles = getSizeStyles(banner.size);

    return (
      <a
        href={banner.linkUrl || "#lead-form"}
        onClick={(e) => {
          if (!banner.linkUrl) {
            e.preventDefault();
            scrollToForm();
          }
        }}
        className={`block shadow-lg items-center justify-center animate-fade-in-up overflow-hidden relative group transition-opacity hover:opacity-95`}
        style={{
          backgroundColor: banner.imageUrl ? 'transparent' : banner.backgroundColor,
          color: banner.textColor,
          cursor: 'pointer',
        }}
      >
        <div
          className={`w-full max-w-4xl mx-auto flex items-center justify-center relative ${styles.py} ${styles.text} ${banner.imageUrl ? 'p-0' : ''}`}
          style={{ fontSize: banner.fontSize }}
        >
          {banner.imageUrl ? (
            <img src={banner.imageUrl} alt="Banner" className={`w-full h-auto ${styles.imgHeight} object-cover block`} />
          ) : (
            <>
              <span className="mr-2">📢</span>
              <span className="font-bold">{banner.text}</span>
              <ArrowRight className="w-4 h-4 ml-2 inline-block" />
            </>
          )}
        </div>
      </a>
    );
  };

  // Safe fallback for footer
  const safeFooter = footer || { isShow: false, images: [], copyrightText: '' };

  // Helper for inline text styles
  const getTextStyle = (style?: any, defaults?: any) => ({
    fontSize: style?.fontSize || defaults?.fontSize,
    fontWeight: style?.fontWeight || defaults?.fontWeight,
    color: style?.color || defaults?.color,
    textAlign: style?.textAlign || defaults?.textAlign,
    letterSpacing: style?.letterSpacing || defaults?.letterSpacing,
    fontFamily: style?.fontFamily || defaults?.fontFamily,
  });

  return (
    <div className={`font-sans text-gray-900 bg-white ${isPreview ? 'h-full relative overflow-hidden' : 'min-h-screen'}`}>

      {/* Main Content Wrapper - Internal scroll for Preview, standard flow for Live */}
      <div
        className={isPreview ? "h-full overflow-y-auto" : ""}
        style={{
          paddingBottom: bottomBanners.length > 0 ? `${bottomPaddingRem}rem` : '0'
        }}
      >

        {/* Top Banners Container - Sticky within flow */}
        {topBanners.length > 0 && (
          <div className="sticky top-0 z-50 w-full max-w-4xl mx-auto flex flex-col shadow-xl">
            {topBanners.map(b => <BannerItem key={b.id} banner={b} />)}
          </div>
        )}

        {/* 1. Hero Section */}
        <section
          className={`relative bg-gray-900 text-white px-4 overflow-hidden max-w-4xl mx-auto ${getHeroPadding(hero.size)}`}
        >
          <div className="absolute inset-0 z-0 opacity-20">
            {hero.backgroundImage && <img src={hero.backgroundImage} alt="Background" className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/50"></div>
          </div>

          <div className="relative z-10 w-full text-center">
            {/* Removed 'Limited Offer' Badge as per user request */}

            <h1
              className="mb-6 leading-tight break-keep"
              style={getTextStyle(hero.headlineStyle, { fontSize: '3.75rem', fontWeight: '800', color: 'white', textAlign: 'center', letterSpacing: '-0.025em' })}
            >
              {hero.headline}
            </h1>
            <p
              className="mb-10 max-w-2xl mx-auto break-keep"
              style={getTextStyle(hero.subHeadlineStyle, { fontSize: '1.25rem', fontWeight: '400', color: '#d1d5db', textAlign: 'center' })}
            >
              {hero.subHeadline}
            </p>
            <div style={{ textAlign: (hero.ctaStyle?.alignment || 'center') as any, marginTop: '2.5rem' }}>
              <button
                onClick={scrollToForm}
                className="inline-flex items-center px-8 py-4 font-bold transition-transform transform hover:scale-105 shadow-lg shadow-blue-500/30 justify-center"
                style={{
                  backgroundColor: hero.ctaStyle?.backgroundColor || theme.primaryColor,
                  color: hero.ctaStyle?.textColor || 'white',
                  fontSize: hero.ctaStyle?.fontSize || '1.125rem',
                  borderRadius: hero.ctaStyle?.borderRadius || '9999px',
                  width: getCTAWidth(hero.ctaStyle?.width),
                }}
              >
                {hero.ctaText || '신청하기'}
                {(!hero.ctaStyle || !hero.ctaStyle.width || hero.ctaStyle.width === 'auto') && <ArrowRight className="ml-2 w-5 h-5" />}
              </button>
            </div>
          </div>
        </section>

        {/* FORM POSITION: After Hero */}
        {formPosition === 'after_hero' && <FormComponent />}

        {/* Detail Content Section */}
        {detailContent && detailContent.length > 0 && (
          <section className="w-full bg-white max-w-4xl mx-auto flex flex-col items-center">
            {detailContent.map((item, idx) => renderDetailContent(item, idx))}
          </section>
        )}



        {/* 2. Problem Section */}
        {problem.title && (
          <section className="py-20 px-4 max-w-4xl mx-auto w-full" style={{ backgroundColor: problem.backgroundColor || '#f9fafb' }}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="mb-4 break-keep" style={getTextStyle(problem.titleStyle, { fontSize: '1.875rem', fontWeight: '700', color: '#111827' })}>
                  {problem.title}
                </h2>
                <p className="break-keep" style={getTextStyle(problem.descriptionStyle, { fontSize: '1.125rem', fontWeight: '400', color: '#4b5563' })}>
                  {problem.description}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <ul className="space-y-6">
                  {problem.points.map((point, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mt-1 mr-4">
                        <span className="text-red-500 font-bold">!</span>
                      </div>
                      <span className="break-keep" style={getTextStyle(problem.pointStyle, { fontSize: '1.125rem', fontWeight: '500', color: '#1f2937' })}>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 3. Solution Section */}
        {solution.title && (
          <section className="py-20 px-4 max-w-4xl mx-auto w-full" style={{ backgroundColor: solution.backgroundColor || '#ffffff' }}>
            <div className="w-full mx-auto">
              <div className="text-center mb-16">
                <h2 className="mb-4 break-keep" style={getTextStyle(solution.titleStyle, { fontSize: '1.875rem', fontWeight: '700', color: '#111827' })}>
                  <span className="border-b-4 border-opacity-30" style={{ borderColor: theme.primaryColor }}>
                    {solution.title}
                  </span>
                </h2>
                <p className="break-keep" style={getTextStyle(solution.descriptionStyle, { fontSize: '1.125rem', fontWeight: '400', color: '#4b5563' })}>{solution.description}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {solution.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="text-center p-6 transition-colors duration-300"
                    style={{
                      backgroundColor: solution.cardStyle?.backgroundColor || 'transparent',
                      borderRadius: solution.cardStyle?.borderRadius || '0.75rem',
                      border: solution.cardStyle?.borderWidth ? `${solution.cardStyle.borderWidth} solid ${solution.cardStyle.borderColor || '#e5e7eb'}` : 'none',
                      color: solution.cardStyle?.textColor || 'inherit',
                      boxShadow: solution.cardStyle?.shadow ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none'
                    }}
                  >
                    <div
                      className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 text-white text-2xl shadow-lg"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      {idx + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-3 break-keep">{feature.title}</h3>
                    <p className="opacity-80 leading-relaxed break-keep">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. Trust Section (Social Proof) - Hide if no reviews */}
        {trust.reviews.length > 0 && (
          <section className="py-20 px-4 max-w-4xl mx-auto w-full" style={{ backgroundColor: trust.backgroundColor || '#111827', color: trust.textColor || '#ffffff' }}>
            <div className="w-full mx-auto">
              {/* Stats */}
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

              {/* Reviews */}
              <div className="grid md:grid-cols-2 gap-6">
                {trust.reviews.map((review, idx) => (
                  <div key={idx} className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                    <div className="flex text-yellow-400 mb-3">
                      {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                    <p className="opacity-90 mb-4 italic break-keep">"{review.text}"</p>
                    <div className="font-bold">- {review.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FORM POSITION: Bottom (Default) */}
        {(formPosition === 'bottom' || !formPosition) && <FormComponent />}

        {/* --- Footer Section (NEW) --- */}
        {safeFooter.isShow && (
          <footer className="bg-white border-t border-gray-200 max-w-4xl mx-auto pb-12">
            <div>
              {safeFooter.images && safeFooter.images.length > 0 && (
                <div className="flex flex-col items-center">
                  {safeFooter.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Footer ${idx}`}
                      className="w-full max-w-[896px] h-auto block"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
              {safeFooter.copyrightText && (
                <div
                  className="whitespace-pre-line px-4 mt-8"
                  style={getTextStyle(safeFooter.copyrightStyle, { fontSize: '0.75rem', fontWeight: '400', color: '#9ca3af', textAlign: 'center' })}
                >
                  {safeFooter.copyrightText}
                </div>
              )}
            </div>
          </footer>
        )}

      </div> {/* End Padding Wrapper */}

      {/* Bottom Banners Container */}
      {bottomBanners.length > 0 && (
        <div className={`${isPreview ? 'absolute bottom-0 w-full' : 'fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl'} z-50 flex flex-col-reverse shadow-xl-up`}>
          {bottomBanners.map(b => <BannerItem key={b.id} banner={b} />)}
        </div>
      )}

      {/* Render Popup Container */}
      {config.popupConfig && <PopupContainer config={config.popupConfig} landingId={config.id} isPreview={isPreview} forceMobile={isMobileView} />}

      {/* Render Chat Button */}
      {config.chatConfig && <ChatButton config={config.chatConfig} isPreview={isPreview} />}
    </div>
  );
};

export default LandingPage;