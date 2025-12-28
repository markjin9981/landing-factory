import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LANDING_CONFIGS } from '../data/landingConfigs';
import { LandingConfig, FloatingBanner, HeroSection } from '../types';
import LeadForm from '../components/LeadForm';
import { Check, Star, Shield, Clock, ThumbsUp, ArrowRight } from 'lucide-react';
import { logVisit, fetchLandingConfigById } from '../services/googleSheetService';

interface Props {
  previewConfig?: LandingConfig; // Optional prop for Live Preview
}

const LandingPage: React.FC<Props> = ({ previewConfig }) => {
  const { id } = useParams<{ id: string }>();
  const [dynamicConfig, setDynamicConfig] = useState<LandingConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Logic Updated: 
  // 1. Priority: Preview Config (Editor Live View)
  // 2. Secondary: Dynamic Config (Fetched from Sheet)
  // 3. Tertiary: Hardcoded Config (Legacy Fallback)
  // 4. Quaternary: LocalStorage Drafts (Local Testing)

  // Only fetch if no previewConfig and id exists
  useEffect(() => {
    if (!previewConfig && id) {
      const fetchConfig = async () => {
        // 1. Try fetching from Server (Sheet)
        setLoading(true);
        const fetched = await fetchLandingConfigById(id);
        if (fetched) {
          setDynamicConfig(fetched);
        }
        setLoading(false);
      };
      fetchConfig();
    }
  }, [id, previewConfig]);

  let rawConfig: LandingConfig | undefined = previewConfig || dynamicConfig;

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

  const { hero, problem, solution, trust, formConfig, theme, detailImages, banners, footer } = config;
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
      case 'xs': return 'py-12';
      case 'sm': return 'py-16';
      case 'lg': return 'py-32';
      case 'xl': return 'py-40';
      case 'md': default: return 'py-24';
    }
  };

  // Calculate approximate padding for body to avoid overlap
  const getTotalApproxHeight = (bannerList: FloatingBanner[]) => {
    return bannerList.reduce((acc, b) => acc + getSizeStyles(b.size).approxHeight, 0);
  };

  const topPaddingRem = getTotalApproxHeight(topBanners);
  const bottomPaddingRem = getTotalApproxHeight(bottomBanners);


  const scrollToForm = () => {
    const formElement = document.getElementById('lead-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper to detect and render YouTube
  const renderDetailItem = (url: string, index: number) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);

    if (match && match[1]) {
      const videoId = match[1];
      return (
        <div key={index} className="w-full max-w-4xl mx-auto aspect-video mb-0">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={`Detail Video ${index}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="block"
          ></iframe>
        </div>
      );
    } else {
      return (
        <img
          key={index}
          src={url}
          alt={`Detail ${index + 1}`}
          className="w-full h-auto block max-w-4xl mx-auto"
          loading="lazy"
        />
      );
    }
  };

  const FormComponent = () => (
    <section id="lead-form" className="py-20 px-4 bg-gray-50 max-w-4xl mx-auto">
      <div className="w-full">
        <LeadForm config={formConfig} landingId={config.id} themeColor={theme.primaryColor} />
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
        <div className={`w-full max-w-4xl mx-auto flex items-center justify-center relative ${styles.py} ${styles.text} ${banner.imageUrl ? 'p-0' : ''}`}>
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

  return (
    <div className={`font-sans text-gray-900 bg-white ${isPreview ? 'h-full relative overflow-hidden' : 'min-h-screen'}`}>

      {/* Top Banners Container */}
      {topBanners.length > 0 && (
        <div className={`${isPreview ? 'absolute top-0 w-full' : 'fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl'} z-50 flex flex-col shadow-xl`}>
          {topBanners.map(b => <BannerItem key={b.id} banner={b} />)}
        </div>
      )}

      {/* Main Content Wrapper - Internal scroll for Preview, standard flow for Live */}
      <div
        className={isPreview ? "h-full overflow-y-auto" : ""}
        style={{
          paddingTop: topBanners.length > 0 ? `${topPaddingRem}rem` : '0',
          paddingBottom: bottomBanners.length > 0 ? `${bottomPaddingRem}rem` : '0'
        }}
      >

        {/* 1. Hero Section */}
        <section
          className={`relative bg-gray-900 text-white px-4 overflow-hidden max-w-4xl mx-auto ${getHeroPadding(hero.size)}`}
        >
          <div className="absolute inset-0 z-0 opacity-20">
            {hero.backgroundImage && <img src={hero.backgroundImage} alt="Background" className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/50"></div>
          </div>

          <div className="relative z-10 w-full text-center">
            <span
              className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-wider uppercase rounded-full bg-white/10 text-white/90 border border-white/20"
            >
              Limited Offer
            </span>
            <h1
              className="mb-6 leading-tight break-keep"
              style={{
                fontSize: hero.headlineStyle?.fontSize || '3.75rem',
                fontWeight: hero.headlineStyle?.fontWeight || '800',
                color: hero.headlineStyle?.color || 'white',
                textAlign: hero.headlineStyle?.textAlign || 'center',
                letterSpacing: hero.headlineStyle?.letterSpacing || '-0.025em',
              }}
            >
              {hero.headline}
            </h1>
            <p
              className="mb-10 max-w-2xl mx-auto break-keep"
              style={{
                fontSize: hero.subHeadlineStyle?.fontSize || '1.25rem',
                fontWeight: hero.subHeadlineStyle?.fontWeight || '400',
                color: hero.subHeadlineStyle?.color || '#d1d5db',
                textAlign: hero.subHeadlineStyle?.textAlign || 'center',
                letterSpacing: hero.subHeadlineStyle?.letterSpacing || 'normal',
              }}
            >
              {hero.subHeadline}
            </p>
            <button
              onClick={scrollToForm}
              className="inline-flex items-center px-8 py-4 rounded-full text-lg font-bold transition-transform transform hover:scale-105 shadow-lg shadow-blue-500/30"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {hero.ctaText}
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </section>

        {/* FORM POSITION: After Hero */}
        {formPosition === 'after_hero' && <FormComponent />}

        {/* Detail Images / Video Section */}
        {detailImages && detailImages.length > 0 && (
          <section className="w-full bg-white max-w-4xl mx-auto">
            {detailImages.map((imgUrl, idx) => renderDetailItem(imgUrl, idx))}
          </section>
        )}

        {/* 2. Problem Section (Hide if empty title) */}
        {problem.title && (
          <section className="py-20 bg-gray-50 px-4 max-w-4xl mx-auto w-full">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 break-keep">
                  {problem.title}
                </h2>
                <p className="text-lg text-gray-600 break-keep">
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
                      <span className="text-lg text-gray-800 font-medium break-keep">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 3. Solution Section (Hide if empty title) */}
        {solution.title && (
          <section className="py-20 px-4 max-w-4xl mx-auto w-full">
            <div className="w-full mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4 break-keep">
                  <span className="border-b-4 border-opacity-30" style={{ borderColor: theme.primaryColor }}>
                    {solution.title}
                  </span>
                </h2>
                <p className="text-gray-600 break-keep">{solution.description}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {solution.features.map((feature, idx) => (
                  <div key={idx} className="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors duration-300">
                    <div
                      className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 text-white text-2xl shadow-lg"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      {idx + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-3 break-keep">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed break-keep">
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
          <section className="py-20 bg-gray-900 text-white px-4 max-w-4xl mx-auto w-full">
            <div className="w-full mx-auto">
              {/* Stats */}
              {trust.stats && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-8 mb-16 border-b border-gray-800 pb-12">
                  {trust.stats.map((stat, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: theme.primaryColor }}>{stat.value}</div>
                      <div className="text-gray-400 font-medium uppercase tracking-wider text-sm break-keep">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviews */}
              <div className="grid md:grid-cols-2 gap-6">
                {trust.reviews.map((review, idx) => (
                  <div key={idx} className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex text-yellow-400 mb-3">
                      {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                    <p className="text-gray-300 mb-4 italic break-keep">"{review.text}"</p>
                    <div className="font-bold text-white">- {review.name}</div>
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
                    />
                  ))}
                </div>
              )}
              {safeFooter.copyrightText && (
                <div
                  className="whitespace-pre-line px-4 mt-8"
                  style={{
                    fontSize: safeFooter.copyrightStyle?.fontSize || '0.75rem',
                    fontWeight: safeFooter.copyrightStyle?.fontWeight || '400',
                    color: safeFooter.copyrightStyle?.color || '#9ca3af',
                    textAlign: safeFooter.copyrightStyle?.textAlign || 'center',
                  }}
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

      {/* Sticky Mobile CTA (Fallback if no bottom banners and no footer override) */}
      {/* We removed the default fallback footer since we now have a configurable footer section */}
    </div>
  );
};

export default LandingPage;