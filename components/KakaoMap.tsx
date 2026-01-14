import React, { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { fetchGlobalSettings } from '../services/googleSheetService';

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
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeMap = () => {
            if (!address || !window.kakao?.maps) return;

            window.kakao.maps.load(() => {
                const geocoder = new window.kakao.maps.services.Geocoder();

                geocoder.addressSearch(address, function (result: any, status: any) {
                    if (status === window.kakao.maps.services.Status.OK) {
                        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                        const mapOption = { center: coords, level: 3 };

                        if (mapContainer.current) {
                            const map = new window.kakao.maps.Map(mapContainer.current, mapOption);
                            const marker = new window.kakao.maps.Marker({ map: map, position: coords });

                            if (placeName) {
                                const infowindow = new window.kakao.maps.InfoWindow({
                                    content: `<div style="width:150px;text-align:center;padding:6px 0;">${placeName}</div>`
                                });
                                infowindow.open(map, marker);
                            }

                            // Re-layout map (fix for hidden container issues)
                            setTimeout(() => map.relayout(), 100);
                        }
                        setIsLoaded(true);
                    }
                });
            });
        };

        const loadKakaoScript = async () => {
            // Already loaded
            if (window.kakao && window.kakao.maps) {
                initializeMap();
                return;
            }

            // Check if script tag exists (loading in progress)
            const existingScript = document.getElementById('kakao-map-script');
            if (existingScript) {
                existingScript.addEventListener('load', initializeMap);
                return;
            }

            try {
                const settings = await fetchGlobalSettings();
                if (!settings?.kakaoApiKey) {
                    setError('API Key 미설정');
                    return;
                }

                const script = document.createElement('script');
                script.id = 'kakao-map-script';
                script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${settings.kakaoApiKey}&libraries=services&autoload=false`;
                script.onload = () => initializeMap();
                script.onerror = () => setError('스크립트 로드 실패');
                document.head.appendChild(script);
            } catch (err) {
                console.error("Failed to load global settings", err);
                setError('설정 로드 실패');
            }
        };

        if (address) {
            loadKakaoScript();
        }

        return () => {
            const script = document.getElementById('kakao-map-script');
            // Don't remove script on unmount as other maps might need it, 
            // but remove listener if we added one (complex to track, ignoring for simplicity)
        };
    }, [address, placeName]);

    return (
        <div className="w-full relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200" style={{ width, height }}>
            <div id="map" ref={mapContainer} className="w-full h-full"></div>

            {/* Loading / Error States */}
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm bg-gray-50 bg-opacity-80 z-10">
                    <div className="text-center p-4">
                        {error ? (
                            <>
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                                <p className="font-bold text-red-500">{error}</p>
                                <p className="text-xs text-gray-400 mt-1">관리자 설정에서 Kakao API 키를 확인하세요.</p>
                            </>
                        ) : (
                            <>
                                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-bounce" />
                                <p>지도를 불러오는 중...</p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default KakaoMap;
