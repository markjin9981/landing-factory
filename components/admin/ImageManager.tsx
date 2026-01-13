
import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, ExternalLink, Trash2, Check, RefreshCw, Cloud } from 'lucide-react';
import { uploadImageToGithub, fetchGithubImages, deleteGithubImage, GithubImage } from '../../services/githubService';
import { uploadImageToDrive } from '../../services/googleSheetService';
import { uploadToImgbb } from '../../services/imgbbService';
import { uploadToCloudinary, getCloudinaryLibrary, saveCloudinaryImageToLibrary, removeCloudinaryImageFromLibrary, CloudinaryImage } from '../../services/cloudinaryService';
import GoogleDrivePicker from '../GoogleDrivePicker';
import { GlobalSettings } from '../../types';

interface ImageManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    globalSettings?: GlobalSettings | null;
}

type Tab = 'upload' | 'github_gallery' | 'cloudinary' | 'cloudinary_gallery' | 'drive' | 'imgbb' | 'url';

const ImageManager: React.FC<ImageManagerProps> = ({ isOpen, onClose, onSelect, globalSettings }) => {
    const [activeTab, setActiveTab] = useState<Tab>('upload');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // GitHub Gallery State
    const [galleryImages, setGalleryImages] = useState<GithubImage[]>([]);
    const [galleryLoading, setGalleryLoading] = useState(false);

    // Cloudinary Gallery State
    const [cloudinaryImages, setCloudinaryImages] = useState<CloudinaryImage[]>([]);

    // External URL State
    const [externalUrl, setExternalUrl] = useState('');

    useEffect(() => {
        if (isOpen && activeTab === 'github_gallery') {
            loadGithubGallery();
        }
        if (isOpen && activeTab === 'cloudinary_gallery') {
            loadCloudinaryGallery();
        }
    }, [isOpen, activeTab]);

    const loadGithubGallery = async () => {
        setGalleryLoading(true);
        const images = await fetchGithubImages();
        setGalleryImages(images);
        setGalleryLoading(false);
    };

    const loadCloudinaryGallery = () => {
        const images = getCloudinaryLibrary();
        setCloudinaryImages(images);
    };

    const handleGithubDelete = async (image: GithubImage) => {
        if (!window.confirm('정말로 이 이미지를 GitHub 저장소에서 삭제하시겠습니까? (복구 불가)')) return;
        setGalleryLoading(true);
        const success = await deleteGithubImage(image.path, image.sha);
        if (success) {
            await loadGithubGallery();
        } else {
            alert('삭제 실패');
        }
        setGalleryLoading(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'github' | 'imgbb' | 'cloudinary') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            if (target === 'github') {
                const res = await uploadImageToGithub(file);
                if (res.success && res.url) {
                    onSelect(res.url);
                    onClose();
                } else {
                    setError(res.message || 'GitHub Upload Failed');
                }
            } else if (target === 'imgbb') {
                const apiKey = globalSettings?.imgbbApiKey;
                if (!apiKey) {
                    setError('ImgBB API Key가 설정되지 않았습니다. 설정 > 전역 설정에서 키를 입력해주세요.');
                    setLoading(false);
                    return;
                }
                const res = await uploadToImgbb(file, apiKey);
                if (res.success && res.url) {
                    onSelect(res.url);
                    onClose();
                } else {
                    setError(res.message || 'ImgBB Upload Failed');
                }
            } else if (target === 'cloudinary') {
                const cloudName = globalSettings?.cloudinaryCloudName;
                const uploadPreset = globalSettings?.cloudinaryUploadPreset;
                if (!cloudName || !uploadPreset) {
                    setError('Cloudinary 설정이 필요합니다. 설정 > 이미지 호스팅에서 Cloud Name과 Upload Preset을 입력해주세요.');
                    setLoading(false);
                    return;
                }
                const res = await uploadToCloudinary(file, { cloudName, uploadPreset });
                if (res.success && res.url) {
                    // Save to local library
                    saveCloudinaryImageToLibrary({
                        public_id: res.publicId || '',
                        url: res.url,
                        secure_url: res.url,
                        format: file.name.split('.').pop() || 'jpg',
                        width: 0,
                        height: 0,
                        created_at: new Date().toISOString(),
                        bytes: file.size,
                    });
                    onSelect(res.url);
                    onClose();
                } else {
                    setError(res.message || 'Cloudinary Upload Failed');
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Upload Error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        이미지 관리자
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-white">
                    {[
                        { id: 'upload', label: 'GitHub 업로드' },
                        { id: 'github_gallery', label: 'GitHub 갤러리' },
                        { id: 'cloudinary', label: 'Cloudinary' },
                        { id: 'cloudinary_gallery', label: 'Cloudinary 갤러리' },
                        { id: 'imgbb', label: 'ImgBB' },
                        { id: 'drive', label: '구글 드라이브' },
                        { id: 'url', label: '직접 입력' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                    {activeTab === 'upload' && (
                        <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-xl bg-white p-8">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8 text-blue-500" />
                            </div>
                            <p className="text-gray-600 mb-2 font-medium">GitHub 저장소에 이미지 업로드</p>
                            <p className="text-xs text-gray-400 mb-6">최적화된 이미지를 권장합니다 (3MB 이하)</p>

                            <label className={`px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {loading ? '업로드 중...' : '파일 선택'}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'github')} disabled={loading} />
                            </label>
                            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        </div>
                    )}

                    {activeTab === 'github_gallery' && (
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-gray-500">public/uploads 폴더의 이미지</p>
                                <button onClick={loadGithubGallery} className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                                    <RefreshCw className="w-3 h-3" /> 새로고침
                                </button>
                            </div>

                            {galleryLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                </div>
                            ) : galleryImages.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-gray-400">
                                    이미지가 없습니다.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {galleryImages.map((img) => (
                                        <div key={img.sha} className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden border hover:border-blue-500 transition-colors">
                                            <img src={img.download_url} alt={img.name} className="w-full h-full object-cover" />

                                            {/* Actions Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                <button
                                                    onClick={() => { onSelect(img.download_url); onClose(); }}
                                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 w-20"
                                                >
                                                    선택
                                                </button>
                                                <button
                                                    onClick={() => handleGithubDelete(img)}
                                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 w-20 flex items-center justify-center gap-1"
                                                >
                                                    <Trash2 className="w-3 h-3" /> 삭제
                                                </button>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate px-2">
                                                {img.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'cloudinary' && (
                        <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-xl bg-white p-8">
                            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                <Cloud className="w-8 h-8 text-orange-500" />
                            </div>
                            <p className="text-gray-600 mb-2 font-medium">Cloudinary CDN에 업로드</p>
                            <p className="text-xs text-gray-400 mb-6">빠른 글로벌 CDN / 자동 이미지 최적화</p>

                            {(!globalSettings?.cloudinaryCloudName || !globalSettings?.cloudinaryUploadPreset) && (
                                <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded mb-4 text-center">
                                    주의: 설정 메뉴에서 Cloudinary Cloud Name과 Upload Preset을 먼저 등록해야 합니다.
                                </div>
                            )}

                            <label className={`px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer flex items-center gap-2 ${loading || !globalSettings?.cloudinaryCloudName || !globalSettings?.cloudinaryUploadPreset ? 'opacity-50 pointer-events-none' : ''}`}>
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {loading ? '업로드 중...' : '파일 선택'}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cloudinary')} disabled={loading || !globalSettings?.cloudinaryCloudName || !globalSettings?.cloudinaryUploadPreset} />
                            </label>
                            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        </div>
                    )}

                    {activeTab === 'cloudinary_gallery' && (
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-gray-500">Cloudinary 업로드 이미지 (로컬 라이브러리)</p>
                                <button onClick={loadCloudinaryGallery} className="text-xs flex items-center gap-1 text-orange-600 hover:underline">
                                    <RefreshCw className="w-3 h-3" /> 새로고침
                                </button>
                            </div>

                            {cloudinaryImages.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-gray-400">
                                    업로드한 이미지가 없습니다.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {cloudinaryImages.map((img) => (
                                        <div key={img.public_id} className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden border hover:border-orange-500 transition-colors">
                                            <img src={img.secure_url} alt={img.public_id} className="w-full h-full object-cover" />

                                            {/* Actions Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                <button
                                                    onClick={() => { onSelect(img.secure_url); onClose(); }}
                                                    className="px-3 py-1 bg-orange-600 text-white text-xs rounded-full hover:bg-orange-700 w-20"
                                                >
                                                    선택
                                                </button>
                                                <button
                                                    onClick={() => { removeCloudinaryImageFromLibrary(img.public_id); loadCloudinaryGallery(); }}
                                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 w-20 flex items-center justify-center gap-1"
                                                >
                                                    <Trash2 className="w-3 h-3" /> 삭제
                                                </button>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate px-2">
                                                {img.format.toUpperCase()} · {Math.round(img.bytes / 1024)}KB
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'imgbb' && (
                        <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-xl bg-white p-8">
                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                                <ExternalLink className="w-8 h-8 text-purple-500" />
                            </div>
                            <p className="text-gray-600 mb-2 font-medium">ImgBB 서버에 업로드 (대용량)</p>
                            <p className="text-xs text-gray-400 mb-6">최대 32MB / 무제한 트래픽 (API 키 필요)</p>

                            {!globalSettings?.imgbbApiKey && (
                                <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded mb-4 text-center">
                                    주의: 설정 메뉴에서 ImgBB API Key를 먼저 등록해야 합니다.
                                </div>
                            )}

                            <label className={`px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-2 ${loading || !globalSettings?.imgbbApiKey ? 'opacity-50 pointer-events-none' : ''}`}>
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {loading ? '업로드 중...' : '파일 선택'}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'imgbb')} disabled={loading || !globalSettings.imgbbApiKey} />
                            </label>
                            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        </div>
                    )}

                    {activeTab === 'drive' && (
                        <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl p-8">
                            <GoogleDrivePicker
                                onSelect={(url) => { onSelect(url); onClose(); }}
                                buttonText="구글 드라이브 열기"
                                className="px-6 py-3 bg-white border border-gray-300 shadow-sm rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
                            />
                            <p className="text-gray-400 text-xs mt-4">구글 계정 로그인이 필요합니다.</p>
                        </div>
                    )}

                    {activeTab === 'url' && (
                        <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl p-8">
                            <div className="w-full max-w-sm space-y-4">
                                <label className="block text-sm font-medium text-gray-700">이미지 URL 직접 입력</label>
                                <input
                                    type="text"
                                    value={externalUrl}
                                    onChange={(e) => setExternalUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                    onClick={() => { if (externalUrl) { onSelect(externalUrl); onClose(); } }}
                                    className="w-full py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageManager;
