import React, { useState } from 'react';
import { GallerySection } from '../../types';
import { X, ZoomIn } from 'lucide-react';

interface Props {
    data: GallerySection;
    isMobileView?: boolean;
}

const GalleryBlock: React.FC<Props> = ({ data, isMobileView }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (!data.isShow || !data.images || data.images.length === 0) return null;

    // Layout Logic
    const getGridCols = () => {
        if (isMobileView) return 'grid-cols-2';
        return `md:grid-cols-${data.gridCols || 3} grid-cols-2`;
    };

    const gapClass = `gap-${data.gap || 4}`;

    return (
        <section className="py-16 px-4 bg-white" id="section-gallery">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{data.title}</h2>
                    {data.description && <p className="text-gray-500">{data.description}</p>}
                </div>

                <div className={`grid ${getGridCols()} ${gapClass}`}>
                    {data.images.map((img, idx) => (
                        <div
                            key={idx}
                            className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-all"
                            onClick={() => setSelectedImage(img)}
                        >
                            <img
                                src={img}
                                alt={`Gallery ${idx}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ZoomIn className="text-white w-8 h-8 drop-shadow-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Fullsize"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()} // Prevent close on image click
                    />
                </div>
            )}
        </section>
    );
};

export default GalleryBlock;
