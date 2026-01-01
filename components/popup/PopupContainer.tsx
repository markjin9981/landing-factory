import React, { useState, useEffect } from 'react';
import { PopupConfig, PopupItem } from '../../types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PopupContainerProps {
    config?: PopupConfig;
    landingId: string;
    isPreview?: boolean;
    forceMobile?: boolean;
}

const PopupContainer: React.FC<PopupContainerProps> = ({ config, landingId, isPreview = false, forceMobile = false }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeItems, setActiveItems] = useState<PopupItem[]>([]);

    // 1. Check Visibility & Active Items
    useEffect(() => {
        if (isPreview) return; // Preview handled via derived state

        if (!config || !config.usePopup || !config.items || config.items.length === 0) {
            setIsVisible(false);
            return;
        }

        // Check "Don't show today"
        if (config.showDoNotOpenToday) {
            const today = new Date().toISOString().split('T')[0];
            const hiddenKey = `landing_popup_hidden_${landingId}_${today}`;
            if (localStorage.getItem(hiddenKey)) {
                setIsVisible(false);
                return;
            }
        }

        // Filter valid items by date
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const valid = config.items.filter(item => {
            if (item.startDate && item.startDate > todayStr) return false;
            if (item.endDate && item.endDate < todayStr) return false;
            return true;
        });

        if (valid.length > 0) {
            setActiveItems(valid);
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [config, landingId, isPreview]);

    // DERIVED STATE: Use config.items directly in Preview to avoid State Sync Lag
    const effectiveItems = isPreview ? (config?.items || []) : activeItems;

    // 2. Responsive Check
    useEffect(() => {
        if (isPreview) return;

        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [isPreview]);

    // 3. Auto-play
    useEffect(() => {
        if (!isVisible && !isPreview) return; // Only stop if not visible AND not preview (Preview is always visible)
        if (!config?.autoPlay || effectiveItems.length <= 1) return;

        const intervalMs = (config.autoPlayInterval || 3) * 1000;
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % effectiveItems.length);
        }, intervalMs);

        return () => clearInterval(timer);
    }, [isVisible, isPreview, config?.autoPlay, config?.autoPlayInterval, effectiveItems.length]);

    // Logic: In Production, hide if !isVisible or no items. In Preview, always show (unless 0 items -> Placeholder)
    if (!isPreview && (!isVisible || effectiveItems.length === 0)) return null;

    // Ensure index is valid (in case items changed)
    const safeIndex = currentIndex >= effectiveItems.length ? 0 : currentIndex;
    const currentItem = effectiveItems[safeIndex];

    // NOTE: In Preview, valid `isMobile` detection is hard without explicit prop.
    // If the user toggle "Mobile Preview" in Editor, the iframe width changes. `matchMedia` inside iframe works.
    // If it's just a div, `matchMedia` finds PC.
    // Let's assume standard behavior for now.
    const effectiveIsMobile = forceMobile || isMobile;
    const styleConfig = effectiveIsMobile ? config!.mobileStyle : config!.pcStyle;

    // Default styles if missing
    const containerStyle: React.CSSProperties = {
        position: isPreview ? 'absolute' : 'fixed',
        zIndex: isPreview ? 100 : 50, // Higher Z-Index for Preview
        width: `${styleConfig?.width || 300}px`,
        top: `${styleConfig?.top || 100}px`,
        left: `${styleConfig?.left || 50}px`,
        backgroundColor: 'transparent',
    };

    // PREVIEW HELPER: If no items, show a placeholder
    if (isPreview && effectiveItems.length === 0) {
        return (
            <div style={{ ...containerStyle, height: '200px' }} className="bg-gray-100 border-2 border-dashed border-gray-400 flex flex-col items-center justify-center text-gray-500 rounded-lg shadow-xl">
                <span className="text-2xl mb-2">🚫</span>
                <p className="text-sm font-bold">팝업 없음</p>
                <p className="text-xs">팝업 목록에 항목을 추가해주세요.</p>
            </div>
        );
    }

    // If mobile and values are not set, center it by default?
    // Or users might want absolute control. Let's assume absolute control from config.
    // However, if left is -1 (example of uninitialized), we might default.
    // Let's stick to config values.

    const handleClose = (doNotShowToday: boolean) => {
        setIsVisible(false);
        if (doNotShowToday && config?.showDoNotOpenToday) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`landing_popup_hidden_${landingId}_${today}`, 'true');
        }
    };

    const handleImageClick = () => {
        if (currentItem.linkUrl) {
            if (currentItem.openInNewWindow) {
                window.open(currentItem.linkUrl, '_blank');
            } else {
                window.location.href = currentItem.linkUrl;
            }
        }
    };

    const nextSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev + 1) % effectiveItems.length);
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev - 1 + effectiveItems.length) % effectiveItems.length);
    };

    return (
        <div style={containerStyle} className="shadow-2xl rounded-lg overflow-hidden flex flex-col bg-white border border-gray-200">
            {/* Image Area */}
            <div className="relative w-full h-full cursor-pointer group" onClick={handleImageClick}>
                {currentItem.imageUrl ? (
                    <img
                        src={currentItem.imageUrl}
                        alt="Popup"
                        className="w-full h-auto object-cover block"
                        style={{ maxHeight: '80vh' }}
                    />
                ) : (
                    <div className="w-full h-40 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-xs">이미지 없음</p>
                        <p className="text-[10px] text-gray-300">이미지를 업로드하세요</p>
                    </div>
                )}

                {/* Navigation Arrows (only if multiple) */}
                {effectiveItems.length > 1 && (
                    <>
                        <button
                            onClick={prevSlide}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        {/* Dots */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {effectiveItems.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Footer Control Area */}
            <div className="bg-gray-900 text-white text-xs py-2 px-3 flex justify-between items-center">
                {config?.showDoNotOpenToday ? (
                    <label className="flex items-center gap-1 cursor-pointer hover:text-gray-200">
                        <input type="checkbox" onChange={(e) => {
                            if (e.target.checked) handleClose(true);
                        }} />
                        오늘 하루 보지 않기
                    </label>
                ) : (
                    <span /> /* Spacer */
                )}

                <button
                    onClick={() => handleClose(false)}
                    className="font-bold border-b border-transparent hover:border-white transition-colors"
                >
                    <X className="w-4 h-4 inline-block mr-1" />
                    닫기
                </button>
            </div>
        </div>
    );
};

export default PopupContainer;
