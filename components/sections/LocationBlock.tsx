import React from 'react';
import { LocationSection } from '../../types';
import KakaoMap from '../KakaoMap';
import { MapPin } from 'lucide-react';

interface Props {
    data: LocationSection;
    isMobileView?: boolean;
}

const LocationBlock: React.FC<Props> = ({ data, isMobileView }) => {
    if (!data || !data.isShow) return null;

    return (
        <section className="py-20 px-4 bg-white" id="section-location">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <span className="inline-block p-3 rounded-full bg-blue-50 text-blue-600 mb-4">
                        <MapPin className="w-6 h-6" />
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{data.title}</h2>
                    <p className="text-xl text-gray-600">{data.address} {data.detailAddress}</p>
                </div>

                {data.showMap && (
                    <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                        <KakaoMap address={data.address} height="100%" />
                    </div>
                )}
            </div>
        </section>
    );
};

export default LocationBlock;
