import React, { useEffect, useRef, useState } from 'react';
import { FeatureSection, FeatureItem } from '../../types';

interface Props {
    data: FeatureSection;
    isMobileView?: boolean;
}

const SmartFeatureBlock: React.FC<Props> = ({ data, isMobileView }) => {
    if (!data || !data.isShow) return null;

    return (
        <section className="py-20 bg-gray-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16 animate-fade-in">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{data.title}</h2>
                    {data.description && <p className="text-gray-600 max-w-2xl mx-auto">{data.description}</p>}
                </div>

                <div className="space-y-24">
                    {data.items.map((item, idx) => (
                        <FeatureRow key={item.id || idx} item={item} index={idx} isMobileView={isMobileView} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const FeatureRow: React.FC<{ item: FeatureItem; index: number; isMobileView?: boolean }> = ({ item, index, isMobileView }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Toggle layout direction for visual variety (Left Image vs Right Image)
    const isEven = index % 2 === 0;

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Trigger once
                }
            },
            { threshold: 0.2 } // Trigger when 20% visible
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    // Animation Classes
    const getAnimClass = () => {
        if (!isVisible) return 'opacity-0 translate-y-10'; // Hidden state

        switch (item.animation) {
            case 'slide-left': return 'opacity-100 translate-x-0 animate-slide-in-left';
            case 'slide-right': return 'opacity-100 translate-x-0 animate-slide-in-right';
            case 'zoom-in': return 'opacity-100 scale-100 animate-zoom-in';
            case 'fade-in': return 'opacity-100 animate-fade-in';
            case 'fade-up': default: return 'opacity-100 translate-y-0 transition-all duration-700 ease-out';
        }
    };

    // Layout Logic: Force vertical if isMobileView is true, otherwise use responsive md:flex-row
    const containerClasses = isMobileView
        ? "flex flex-col items-center gap-8"
        : "flex flex-col md:flex-row items-center gap-8 md:gap-16";

    const imageWrapperClasses = isMobileView
        ? "w-full"
        : `w-full md:w-1/2 ${isEven ? 'md:order-1' : 'md:order-2'}`;

    const textWrapperClasses = isMobileView
        ? "w-full text-center"
        : `w-full md:w-1/2 ${isEven ? 'md:order-2' : 'md:order-1'}`;

    return (
        <div
            ref={ref}
            className={`${containerClasses} transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}`}
        >
            {/* Image Side */}
            <div className={imageWrapperClasses}>
                {item.imageUrl ? (
                    <div className={`rounded-2xl overflow-hidden shadow-2xl transform transition-transform duration-700 hover:scale-[1.02] ${isVisible ? 'scale-100' : 'scale-95'}`}>
                        <img src={item.imageUrl} alt={item.title} className="w-full h-auto object-cover" />
                    </div>
                ) : (
                    <div className="w-full aspect-video bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}
            </div>

            {/* Text Side */}
            <div className={textWrapperClasses}>
                <h3 className={`font-bold mb-6 text-gray-900 leading-tight ${isMobileView ? 'text-2xl' : 'text-2xl md:text-3xl'}`}>
                    {item.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
                    {item.description}
                </p>
            </div>
        </div>
    );
};


export default SmartFeatureBlock;
