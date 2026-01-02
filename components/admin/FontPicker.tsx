import React, { useState, useEffect, useRef } from 'react';
import { uploadImageToDrive, saveGlobalSettings, syncFontsFromDrive } from '../../services/googleSheetService';
import { Type, Star, Search, Plus, Trash2, Check, Upload, Loader2 as Loader, ArrowDown, RefreshCw } from 'lucide-react';
import { GOOGLE_FONTS_LIST } from '../../utils/fontUtils';
import { CustomFont, GlobalSettings } from '../../types';

interface FontPickerProps {
    value: string;
    onChange: (fontFamily: string) => void;
    globalSettings: GlobalSettings;
    onSettingsChange: (newSettings: GlobalSettings) => void;
    label?: string;
}

const FontPicker: React.FC<FontPickerProps> = ({ value, onChange, globalSettings, onSettingsChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);
    const [syncing, setSyncing] = useState(false); // New state for sync
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleFavorite = (e: React.MouseEvent, fontFamily: string) => {
        e.stopPropagation();
        const currentFavorites = globalSettings.favoriteFonts || [];
        const newFavorites = currentFavorites.includes(fontFamily)
            ? currentFavorites.filter(f => f !== fontFamily)
            : [...currentFavorites, fontFamily];

        const newSettings = { ...globalSettings, favoriteFonts: newFavorites };
        onSettingsChange(newSettings);
        saveGlobalSettings(newSettings); // Auto-save
    };

    const handleSync = async () => {
        setSyncing(true);
        const driveFonts = await syncFontsFromDrive();

        // [Fix] Full Sync: Drive is the source of truth.
        // We replace the local list with the list from Drive.
        // This ensures deleted fonts are removed from the list.

        if (driveFonts.length === 0) {
            // Check if we previously had fonts, if so, we should probably clear them?
            // Yes, if Drive is empty, local should be empty too.
            if ((globalSettings.customFonts || []).length > 0) {
                const newSettings = { ...globalSettings, customFonts: [] };
                onSettingsChange(newSettings);
                await saveGlobalSettings(newSettings);
                alert("구글 드라이브에 폰트가 없어 로컬 목록을 초기화했습니다.");
            } else {
                alert("구글 드라이브 폴더에서 폰트를 찾지 못했습니다.");
            }
            setSyncing(false);
            return;
        }

        const newSettings = { ...globalSettings, customFonts: driveFonts };
        onSettingsChange(newSettings);
        await saveGlobalSettings(newSettings);

        alert(`동기화 완료! 총 ${driveFonts.length}개의 폰트를 로드했습니다.`);
        setSyncing(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fontName = prompt("폰트의 표시 이름을 입력해주세요 (예: 우리 회사 폰트)");
        if (!fontName) return;

        setUploading(true);
        // Upload to specific folder 'Landing-factory font'
        const url = await uploadImageToDrive(file, 'Landing-factory font');
        setUploading(false);

        if (!url) return;

        // Determine format from filename
        let format = 'truetype';
        if (file.name.toLowerCase().endsWith('.woff2')) format = 'woff2';
        else if (file.name.toLowerCase().endsWith('.woff')) format = 'woff';
        else if (file.name.toLowerCase().endsWith('.otf')) format = 'opentype';

        const newFont: CustomFont = {
            id: crypto.randomUUID(),
            name: fontName,
            family: fontName.replace(/\s+/g, ''), // Simple sanitization
            source: 'file',
            url: url,
            format: format
        };

        const newSettings = {
            ...globalSettings,
            customFonts: [...(globalSettings.customFonts || []), newFont]
        };
        onSettingsChange(newSettings);
        saveGlobalSettings(newSettings);

        // Auto-select new font
        onChange(newFont.family);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const deleteCustomFont = (e: React.MouseEvent, fontId: string) => {
        e.stopPropagation();
        if (!confirm("정말 이 폰트를 삭제하시겠습니까? (이 폰트를 사용하는 페이지가 있다면 깨질 수 있습니다.)")) return;

        const newSettings = {
            ...globalSettings,
            customFonts: globalSettings.customFonts.filter(f => f.id !== fontId)
        };
        onSettingsChange(newSettings);
        saveGlobalSettings(newSettings);
    };

    // Filter Logic
    const filteredGoogle = GOOGLE_FONTS_LIST.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Create logic to sort favorites to top
    const allFonts = [
        ...(globalSettings.customFonts || []).map(f => ({ ...f, type: 'custom' })),
        ...GOOGLE_FONTS_LIST.map(f => ({ ...f, type: 'google' }))
    ];

    const isFav = (fam: string) => (globalSettings.favoriteFonts || []).includes(fam);

    // Filter by search
    const searchedFonts = allFonts.filter(f =>
        (f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Grouping
    const favoriteList = searchedFonts.filter(f => isFav(f.family));
    const customList = searchedFonts.filter(f => !isFav(f.family) && f.type === 'custom');
    const googleList = searchedFonts.filter(f => !isFav(f.family) && f.type === 'google');

    const getFontDisplayName = (fam: string) => {
        const found = allFonts.find(f => f.family === fam);
        return found ? found.name : (fam || '기본 폰트');
    };

    // Keep it simple: Render a flat list with headers inside
    // OR render separate blocks. 
    // Implementation below uses separate blocks inside the scroller.

    return (
        <div className="relative" ref={dropdownRef}>
            {label && <label className="text-[10px] text-gray-500 block mb-1">{label}</label>}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full border rounded p-2 text-xs bg-white flex items-center justify-between hover:border-blue-400 transition-colors"
                style={{ fontFamily: value }}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Type className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{getFontDisplayName(value)}</span>
                </div>
                <ArrowDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 w-64 bg-white border rounded-lg shadow-xl mt-1 max-h-[400px] flex flex-col animate-fade-in">
                    {/* Search & Upload Header */}
                    <div className="p-2 border-b bg-gray-50 rounded-t-lg sticky top-0 z-10 space-y-2">
                        <div className="relative">
                            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="폰트 검색..."
                                className="w-full pl-7 p-1.5 text-xs border rounded focus:outline-none focus:border-blue-500"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white p-1.5 rounded text-xs hover:bg-blue-700 transition"
                                disabled={uploading || syncing}
                            >
                                {uploading ? <Loader className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                {uploading ? '업로드...' : '새 폰트'}
                            </button>
                            <button
                                onClick={handleSync}
                                className="w-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded border border-gray-200 hover:bg-gray-200 transition"
                                title="구글 드라이브와 폰트 동기화"
                                disabled={uploading || syncing}
                            >
                                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".woff2,.woff,.ttf"
                            onChange={handleUpload}
                        />
                    </div>

                    {/* Font List */}

                    <div className="overflow-y-auto flex-1 p-1">

                        {/* Favorites */}
                        {favoriteList.length > 0 && (
                            <div className="mb-2">
                                <div className="text-[10px] font-bold text-gray-400 px-2 py-1 flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 즐겨찾기 (Top 5)
                                </div>
                                {favoriteList.slice(0, 5).map((font: any) => (
                                    <FontItem
                                        key={`fav-${font.family}`}
                                        font={font}
                                        isSelected={value === font.family}
                                        isFavorite={true}
                                        onSelect={() => { onChange(font.family); setIsOpen(false); }}
                                        onToggleFavorite={(e: any) => toggleFavorite(e, font.family)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Custom Fonts */}
                        <div className="mb-2">
                            <div className="text-[10px] font-bold text-gray-400 px-2 py-1">내 폰트</div>
                            {customList.length === 0 && <div className="text-[10px] text-gray-300 px-2 italic">검색 결과 없음</div>}
                            {customList.map((font: any) => (
                                <FontItem
                                    key={font.id}
                                    font={font}
                                    isSelected={value === font.family}
                                    isFavorite={false}
                                    onSelect={() => { onChange(font.family); setIsOpen(false); }}
                                    onToggleFavorite={(e: any) => toggleFavorite(e, font.family)}
                                    onDelete={(e: any) => deleteCustomFont(e, font.id)}
                                />
                            ))}
                        </div>

                        {/* Google Fonts */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 px-2 py-1">구글 폰트</div>
                            {googleList.map((font: any) => (
                                <FontItem
                                    key={font.family}
                                    font={font}
                                    isSelected={value === font.family}
                                    isFavorite={false}
                                    onSelect={() => { onChange(font.family); setIsOpen(false); }}
                                    onToggleFavorite={(e: any) => toggleFavorite(e, font.family)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FontItem = ({ font, isSelected, isFavorite, onSelect, onToggleFavorite, onDelete }: any) => (
    <div
        onClick={onSelect}
        className={`
            flex items-center justify-between p-2 rounded cursor-pointer group
            ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}
        `}
    >
        <div className="flex flex-col truncate mr-2 overflow-hidden w-full">
            <span className="text-xs font-medium truncate" style={{ fontFamily: font.family }}>{font.name}</span>
            <span className="text-[10px] text-gray-400 truncate opacity-75">{font.category || 'Custom'}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
            <button
                onClick={onToggleFavorite}
                className={`p-1 rounded-full hover:bg-gray-200 ${isFavorite ? 'text-yellow-400' : 'text-gray-300 opacity-0 group-hover:opacity-100'} transition-all`}
            >
                <Star className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            {onDelete && (
                <button
                    onClick={onDelete}
                    className="p-1 rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}
            {isSelected && <Check className="w-3 h-3 text-blue-600 ml-1" />}
        </div>
    </div>
);

export default FontPicker;
