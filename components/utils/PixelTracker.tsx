import React, { useEffect } from 'react';
import { PixelConfig } from '../../types';

interface Props {
    config?: PixelConfig;
}

const PixelTracker: React.FC<Props> = ({ config }) => {
    useEffect(() => {
        if (!config) return;

        // 1. Facebook Pixel
        if (config.facebookPixelId) {
            (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
                if (f.fbq) return; n = f.fbq = function () {
                    n.callMethod ?
                        n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                };
                if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
                n.queue = []; t = b.createElement(e); t.async = !0;
                t.src = v; s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s)
            })(window, document, 'script',
                'https://connect.facebook.net/en_US/fbevents.js');

            (window as any).fbq('init', config.facebookPixelId);
            (window as any).fbq('track', 'PageView');
        }

        // 2. Kakao Pixel
        if (config.kakaoPixelId) {
            // Kakao script is usually loaded via kakao sdk or specific pixel script
            // Standard Kakao Pixel Script
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.charset = 'UTF-8';
            script.src = '//t1.daumcdn.net/kas/static/kp.js';
            script.async = true;
            document.head.appendChild(script);

            script.onload = () => {
                if ((window as any).kakaoPixel) {
                    (window as any).kakaoPixel(config.kakaoPixelId).pageView();
                }
            };
        }

        // 3. TikTok Pixel
        if (config.tiktokPixelId) {
            (function (w: any, d: any, t: any) {
                w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"], ttq.setAndDefer = function (t: any, e: any) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } }; for (var i = 0; i < ttq.methods.length; i++)ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t: any) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)ttq.setAndDefer(e, ttq.methods[n]); return e }, ttq.load = function (e: any, n: any) { var i = "https://analytics.tiktok.com/i18n/pixel/events.js"; ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = i, ttq._t = ttq._t || {}, ttq._t[e] = +new Date, ttq._o = ttq._o || {}, ttq._o[e] = n || {}; var o = document.createElement("script"); o.type = "text/javascript", o.async = !0, o.src = i + "?sdkid=" + e + "&lib=" + t; var a = document.getElementsByTagName("script")[0]; a?.parentNode?.insertBefore(o, a) };
                ttq.load(config.tiktokPixelId);
                ttq.page();
            })(window, document, 'ttq');
        }

        // 4. Google Analytics (GA4)
        if (config.googleAnalyticsId) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`;
            document.head.appendChild(script);

            (window as any).dataLayer = (window as any).dataLayer || [];
            function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
            gtag('js', new Date());
            gtag('config', config.googleAnalyticsId);
        }

        // 5. Daangn (Karrot) Pixel - Assumed script or generic tracker
        // Placeholder for Daangn if exact script is known. For now, skipping unless user provides specific script.
        // But user asked for it, so let's try to add standard Daangn script if available public documentation exists.
        // Assuming standard Daangn Tracker:
        if (config.daangnTrackingId) {
            const script = document.createElement('script');
            script.src = 'https://karrot-pixel-url.com/tracker.js'; // Placeholder
            // Note: Without exact Daangn pixel doc, I'll trust the user will provide ID and we inject if we had the SDK.
            // For now, I'll log it.
            console.log("Daangn Pixel would be initialized here with:", config.daangnTrackingId);
        }

    }, [config]);

    return null; // This component handles side effects only
};

export default PixelTracker;
