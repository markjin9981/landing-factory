import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

declare global {
    interface Window {
        kakao: any;
    }
}

interface KakaoMapProps {
    address: string;
    placeName?: string;
    width?: string;
    height?: string;
}

const KakaoMap: React.FC<KakaoMapProps> = ({ address, placeName, width = '100%', height = '400px' }) => {
    const mapContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check if Kakao script is loaded
        if (!window.kakao || !window.kakao.maps) {
            console.warn("Kakao Maps SDK not loaded");
            return;
        }

        if (!address) return;

        window.kakao.maps.load(() => {
            const geocoder = new window.kakao.maps.services.Geocoder();

            geocoder.addressSearch(address, function (result: any, status: any) {
                if (status === window.kakao.maps.services.Status.OK) {
                    const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

                    const mapOption = {
                        center: coords,
                        level: 3
                    };

                    const map = new window.kakao.maps.Map(mapContainer.current, mapOption);
                    const marker = new window.kakao.maps.Marker({
                        map: map,
                        position: coords
                    });

                    if (placeName) {
                        const infowindow = new window.kakao.maps.InfoWindow({
                            content: `<div style="width:150px;text-align:center;padding:6px 0;">${placeName}</div>`
                        });
                        infowindow.open(map, marker);
                    }

                    // Allow map to resize properly
                    setTimeout(() => map.relayout(), 100);
                }
            });
        });
    }, [address, placeName]);

    return (
        <div className="w-full relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200" style={{ width, height }}>
            <div id="map" ref={mapContainer} className="w-full h-full"></div>
            {!window.kakao && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm bg-gray-50 bg-opacity-80">
                    <div className="text-center">
                        <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>지도 로딩 중...</p>
                        <p className="text-xs text-gray-400 mt-1">(카카오 API 키 확인 필요)</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KakaoMap;
