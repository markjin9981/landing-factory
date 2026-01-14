import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FeatureSlideBannerProps {
    images: string[];
    autoSlide?: boolean;
    intervalMs?: number;
}

const FeatureSlideBanner: React.FC<FeatureSlideBannerProps> = ({
    images,
    autoSlide = true,
    intervalMs = 3000
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto slide effect
    useEffect(() => {
        if (!autoSlide || images.length <= 1 || isHovered) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, intervalMs);

        return () => clearInterval(timer);
    }, [autoSlide, intervalMs, images.length, isHovered]);

    // Touch handlers for swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const minSwipeDistance = 50;

        if (Math.abs(distance) > minSwipeDistance) {
            if (distance > 0) {
                // Swiped left - go next
                goNext();
            } else {
                // Swiped right - go prev
                goPrev();
            }
        }
    };

    const goNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const goPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    if (!images || images.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-2xl bg-gray-100"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Image Container */}
            <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((img, idx) => (
                    <div key={idx} className="w-full flex-shrink-0">
                        <img
                            src={img}
                            alt={`Slide ${idx + 1}`}
                            className="w-full h-auto object-cover"
                            style={{ aspectRatio: '16/9' }}
                        />
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        style={{ opacity: isHovered ? 1 : 0.5 }}
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        style={{ opacity: isHovered ? 1 : 0.5 }}
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                </>
            )}

            {/* Indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToSlide(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                                    ? 'bg-white w-4'
                                    : 'bg-white/50 hover:bg-white/80'
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Auto-slide indicator */}
            {autoSlide && images.length > 1 && !isHovered && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-black/40 rounded text-white text-[10px]">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
};

export default FeatureSlideBanner;
