import React, { useState, useEffect } from 'react';
import { GlobalSettings } from '../../types';
import { fetchGlobalSettings, saveGlobalSettings } from '../../services/googleSheetService';
import { RehabPolicyConfig, DEFAULT_POLICY_CONFIG_2026, POLICY_CONFIG_BY_YEAR, /* getPolicyForYear, */ CourtTrait } from '../../config/PolicyConfig';
import { Save, Upload, Download, RefreshCw, FileText, Plus, Trash2, Edit2, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

const PolicyManager: React.FC = () => {
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Year Selection
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [yearConfigs, setYearConfigs] = useState<Record<number, RehabPolicyConfig>>(POLICY_CONFIG_BY_YEAR);

    // Helper to get current config
    const previewConfig = yearConfigs[selectedYear] || POLICY_CONFIG_BY_YEAR[selectedYear];

    // Config Updater
    const setPreviewConfig = (newConfig: RehabPolicyConfig) => {
        setYearConfigs(prev => ({
            ...prev,
            [selectedYear]: newConfig
        }));
    };

    // Court Edit State
    const [isEditingCourt, setIsEditingCourt] = useState(false);
    const [newCourt, setNewCourt] = useState<Partial<CourtTrait>>({
        name: '',
        allow24Months: false,
        spousePropertyRate: 0.5,
        investLossInclude: false,
        description: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        const settings = await fetchGlobalSettings();
        if (settings) {
            setGlobalSettings(settings);

            // Load saved configs if available
            if (settings.rehabPolicyConfigs) {
                // Merge saved configs with default configs to ensure all years exist
                setYearConfigs({
                    ...POLICY_CONFIG_BY_YEAR,
                    ...settings.rehabPolicyConfigs
                });
            } else if (settings.policyConfig) {
                // Migrate old single config to 2026 (or baseYear)
                const oldConfig = settings.policyConfig as unknown as RehabPolicyConfig;
                setYearConfigs({
                    ...POLICY_CONFIG_BY_YEAR,
                    [oldConfig.baseYear || 2026]: oldConfig
                });
            }
        }
        setIsLoading(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });

            // 0. 영문 -> 한글 그룹명 매핑
            const ENGLISH_TO_KOREAN_GROUP: Record<string, string> = {
                'Seoul': '서울특별시',
                'Overcrowded': '과밀억제권역',
                'Metro': '광역시기준',
                'Others': '그외'
            };

            // 1. 관할 법원 매핑 (첫번째 시트 가정)
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            const data = XLSX.utils.sheet_to_json(ws) as any[];

            // 데이터 구조 파싱 logic
            // 예상 컬럼: 지역명, 관할법원, 지역그룹
            const regionToCourtMap: Record<string, string> = {};
            const regionToGroupMap: Record<string, string> = {};

            let courtCount = 0;
            data.forEach(row => {
                const region = row['지역명'] || row['Region'];
                const court = row['관할법원'] || row['Court'];
                let group = row['지역그룹'] || row['Group'];

                // 영문 그룹명 -> 한글로 변환
                if (group && ENGLISH_TO_KOREAN_GROUP[group]) {
                    group = ENGLISH_TO_KOREAN_GROUP[group];
                }

                if (region && court) {
                    regionToCourtMap[region] = court;
                    courtCount++;
                }
                if (region && group) {
                    regionToGroupMap[region] = group;
                }
            });

            // 2. 보증금 면제 기준 등은 두번째 시트에서?
            let depositExemptions = { ...DEFAULT_POLICY_CONFIG_2026.depositExemptions };

            if (wb.SheetNames.length > 1) {
                const wsName2 = wb.SheetNames[1];
                const ws2 = wb.Sheets[wsName2];
                const exemptData = XLSX.utils.sheet_to_json(ws2) as any[];

                // 예상 컬럼: 그룹명, 공제한도, 공제액
                exemptData.forEach(row => {
                    let group = row['지역그룹'] || row['Group'];
                    // 영문 그룹명 -> 한글로 변환
                    if (group && ENGLISH_TO_KOREAN_GROUP[group]) {
                        group = ENGLISH_TO_KOREAN_GROUP[group];
                    }

                    const limit = row['보증금상한'] || row['Limit'];
                    const deduct = row['공제금액'] || row['Deduct'];

                    if (group && limit !== undefined && deduct !== undefined) {
                        depositExemptions[group] = { limit: Number(limit), deduct: Number(deduct) };
                    }
                });
            }

            // Clean up any remaining English keys (just in case)
            Object.keys(ENGLISH_TO_KOREAN_GROUP).forEach(engKey => {
                delete depositExemptions[engKey];
            });

            // 새로운 Config 생성 (preserve court traits)
            if (previewConfig) {
                const newConfig: RehabPolicyConfig = {
                    ...previewConfig,
                    regionToCourtMap,
                    regionToGroupMap,
                    depositExemptions
                };
                setPreviewConfig(newConfig);
                alert(`파일 로드 완료!\n- 지역 매핑: ${courtCount}건\n- 정책 설정을 저장해야 적용됩니다.`);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleSave = async () => {
        if (!globalSettings) return;
        setIsSaving(true);

        const newSettings: GlobalSettings = {
            ...globalSettings,
            rehabPolicyConfigs: yearConfigs
        };

        const success = await saveGlobalSettings(newSettings);
        if (success) {
            setGlobalSettings(newSettings);
            alert('정책 설정이 저장되었습니다.');
        } else {
            alert('저장에 실패했습니다.');
        }
        setIsSaving(false);
    };

    const downloadTemplate = () => {
        // 엑셀 템플릿 생성 및 다운로드
        const ws1 = XLSX.utils.json_to_sheet([
            { '지역명': '서울', '관할법원': '서울회생법원', '지역그룹': '서울특별시' },
            { '지역명': '용인', '관할법원': '수원회생법원', '지역그룹': '과밀억제권역' },
            { '지역명': '부산', '관할법원': '부산회생법원', '지역그룹': '광역시기준' },
        ]);
        const ws2 = XLSX.utils.json_to_sheet([
            { '지역그룹': '서울특별시', '보증금상한': 170000000, '공제금액': 57000000 },
            { '지역그룹': '과밀억제권역', '보증금상한': 150000000, '공제금액': 50000000 },
            { '지역그룹': '광역시기준', '보증금상한': 88000000, '공제금액': 29000000 },
            { '지역그룹': '그외', '보증금상한': 78000000, '공제금액': 26000000 },
        ]);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws1, '법원매핑');
        XLSX.utils.book_append_sheet(wb, ws2, '보증금공제');

        XLSX.writeFile(wb, '정책설정_템플릿.xlsx');
    };

    // --- Court Management Logic ---

    const handleDeleteCourt = (courtName: string) => {
        if (!previewConfig) return;
        if (!confirm(`정말 '${courtName}' 설정을 삭제하시겠습니까?`)) return;

        const newTraits = { ...previewConfig.courtTraits };
        delete newTraits[courtName];

        setPreviewConfig({
            ...previewConfig,
            courtTraits: newTraits
        });
    };

    const handleAddCourt = () => {
        if (!previewConfig || !newCourt.name) return alert('법원명을 입력해주세요.');
        // if (previewConfig.courtTraits[newCourt.name]) return alert('이미 존재하는 법원명입니다.'); // Remove strictly blocking check

        const trait: CourtTrait = {
            name: newCourt.name,
            allow24Months: newCourt.allow24Months || false,
            spousePropertyRate: newCourt.spousePropertyRate || 0,
            investLossInclude: newCourt.investLossInclude || false,
            processingMonths: newCourt.processingMonths || 5.0,
            description: newCourt.description || ''
        };

        setPreviewConfig({
            ...previewConfig,
            courtTraits: {
                ...previewConfig.courtTraits,
                [trait.name]: trait
            }
        });
        setIsEditingCourt(false);
        setNewCourt({ name: '', allow24Months: false, spousePropertyRate: 0.5, investLossInclude: false, description: '' });
    };

    const handleEditCourt = (trait: CourtTrait) => {
        setNewCourt({ ...trait });
        setIsEditingCourt(true);
    };

    if (isLoading) return <div className="p-8 text-center flex justify-center"><RefreshCw className="animate-spin" /></div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">개인회생 정책 관리</h1>

                    {/* Year Selector */}
                    <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                        <button
                            onClick={() => setSelectedYear(prev => Math.max(2026, prev - 1))}
                            disabled={selectedYear <= 2026}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="mx-3 font-bold text-lg text-blue-600 min-w-[3rem] text-center">{selectedYear}년</span>
                        <button
                            onClick={() => setSelectedYear(prev => Math.min(2035, prev + 1))}
                            disabled={selectedYear >= 2035}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={downloadTemplate} className="px-4 py-2 border rounded bg-white hover:bg-gray-50 flex items-center gap-2 text-sm">
                        <Download className="w-4 h-4" /> 템플릿
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 shadow-sm font-bold"
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        설정 저장
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: Court Traits (Expanded) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 1. Court Traits Management */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-purple-600" />
                                법원별 성향 관리
                            </h2>
                            <button
                                onClick={() => setIsEditingCourt(true)}
                                className="text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 hover:bg-purple-100 flex items-center gap-1 font-bold"
                            >
                                <Plus className="w-4 h-4" /> 법원 추가
                            </button>
                        </div>

                        {/* Add New Court Form */}
                        {isEditingCourt && (
                            <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                                <h3 className="font-bold text-purple-800 mb-3 text-sm">새 법원 추가</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">법원명</label>
                                        <input
                                            type="text"
                                            value={newCourt.name}
                                            onChange={e => setNewCourt({ ...newCourt, name: e.target.value })}
                                            className="w-full p-2 border rounded bg-white"
                                            placeholder="예: 경기회생법원"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">설명</label>
                                        <input
                                            type="text"
                                            value={newCourt.description}
                                            onChange={e => setNewCourt({ ...newCourt, description: e.target.value })}
                                            className="w-full p-2 border rounded bg-white"
                                            placeholder="예: 배우자 재산 50% 반영"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-6 mb-4">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newCourt.allow24Months}
                                            onChange={e => setNewCourt({ ...newCourt, allow24Months: e.target.checked })}
                                        />
                                        <span className="text-gray-700">24개월 단축 가능</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newCourt.investLossInclude}
                                            onChange={e => setNewCourt({ ...newCourt, investLossInclude: e.target.checked })}
                                        />
                                        <span className="text-gray-700">투기성 손실 반영</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-gray-600">배우자 재산 반영률:</label>
                                        <select
                                            value={newCourt.spousePropertyRate}
                                            onChange={e => setNewCourt({ ...newCourt, spousePropertyRate: Number(e.target.value) })}
                                            className="p-1 border rounded bg-white text-sm"
                                        >
                                            <option value={0}>0% (미반영)</option>
                                            <option value={0.5}>50% (절반)</option>
                                            <option value={1.0}>100% (전체)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsEditingCourt(false)}
                                        className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleAddCourt}
                                        className="px-4 py-1.5 bg-purple-600 text-white rounded text-sm font-bold hover:bg-purple-700"
                                    >
                                        추가하기
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 border-b">
                                    <tr>
                                        <th className="p-3">법원명</th>
                                        <th className="p-3">24개월</th>
                                        <th className="p-3">배우자재산</th>
                                        <th className="p-3">투기손실</th>
                                        <th className="p-3">설명</th>
                                        <th className="p-3 text-right">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewConfig && Object.entries(previewConfig.courtTraits).map(([key, trait]) => (
                                        <tr key={key} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-bold">{trait.name}</td>
                                            <td className="p-3">
                                                {trait.allow24Months ? <span className="text-green-600 font-bold">가능</span> : <span className="text-gray-400">불가</span>}
                                            </td>
                                            <td className="p-3">
                                                {trait.spousePropertyRate * 100}%
                                            </td>
                                            <td className="p-3">
                                                {trait.investLossInclude ? <span className="text-red-500 font-bold">반영</span> : <span className="text-gray-400">미반영</span>}
                                            </td>
                                            <td className="p-3 text-gray-500 text-xs">{trait.description}</td>
                                            <td className="p-3 text-right flex justify-end gap-1">
                                                <button
                                                    onClick={() => handleEditCourt(trait)}
                                                    className="text-blue-400 hover:text-blue-600 p-1 bg-blue-50 rounded"
                                                    title="수정"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {key !== 'Default' && (
                                                    <button
                                                        onClick={() => handleDeleteCourt(key)}
                                                        className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded"
                                                        title="삭제"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 2. Additional Housing Cost Config (New) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-blue-600">🏠</span>
                            추가 주거비 인정 기준 (최대 한도)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['서울특별시', '과밀억제권역', '광역시기준', '그외'].map(group => (
                                <div key={group} className="border rounded-lg p-3 bg-gray-50">
                                    <h3 className="font-bold text-gray-700 mb-2 border-b pb-1 text-sm">{group}</h3>
                                    <table className="w-full text-xs text-center">
                                        <thead className="text-gray-500 font-normal">
                                            <tr>
                                                <th className="p-1 font-normal">가구</th>
                                                <th className="p-1 font-normal">인정한도</th>
                                                <th className="p-1 font-normal">기본포함</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[1, 2, 3, 4, 5, 6].map(size => {
                                                // Safety: Fallback to defaults if missing in loaded config
                                                const costConfig = previewConfig?.additionalHousingCosts?.[group]?.[size] ||
                                                    DEFAULT_POLICY_CONFIG_2026.additionalHousingCosts[group as keyof typeof DEFAULT_POLICY_CONFIG_2026.additionalHousingCosts]?.[size] ||
                                                    { limit: 0, included: 0 };

                                                return (
                                                    <tr key={size} className="border-t border-gray-200">
                                                        <td className="p-1.5 font-medium">{size}인</td>
                                                        <td className="p-1">
                                                            <input
                                                                type="number"
                                                                value={costConfig.limit}
                                                                onChange={e => {
                                                                    if (!previewConfig) return;
                                                                    const val = Number(e.target.value);
                                                                    const currentGroup = previewConfig.additionalHousingCosts?.[group] || {};

                                                                    setPreviewConfig({
                                                                        ...previewConfig,
                                                                        additionalHousingCosts: {
                                                                            ...(previewConfig.additionalHousingCosts || DEFAULT_POLICY_CONFIG_2026.additionalHousingCosts),
                                                                            [group]: {
                                                                                ...currentGroup,
                                                                                [size]: { ...costConfig, limit: val }
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                                className="w-full text-right p-1 border rounded bg-white"
                                                            />
                                                        </td>
                                                        <td className="p-1">
                                                            <input
                                                                type="number"
                                                                value={costConfig.included}
                                                                onChange={e => {
                                                                    if (!previewConfig) return;
                                                                    const val = Number(e.target.value);
                                                                    const currentGroup = previewConfig.additionalHousingCosts?.[group] || {};

                                                                    setPreviewConfig({
                                                                        ...previewConfig,
                                                                        additionalHousingCosts: {
                                                                            ...(previewConfig.additionalHousingCosts || DEFAULT_POLICY_CONFIG_2026.additionalHousingCosts),
                                                                            [group]: {
                                                                                ...currentGroup,
                                                                                [size]: { ...costConfig, included: val }
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                                className="w-full text-right p-1 border rounded bg-gray-100 text-gray-500"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Excel Upload (Region Map) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            엑셀 파일 업로드
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-green-50 rounded-lg border border-dashed border-green-300">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-green-100 file:text-green-700
                                hover:file:bg-green-200"
                            />
                            <div className="text-xs text-gray-500">
                                * 법원 매핑 및 보증금 기준이 포함된 엑셀 파일을 업로드하세요.
                            </div>
                        </div>

                        {/* Preview Region Map */}
                        <div className="mt-6">
                            <h3 className="font-bold text-gray-700 mb-3 text-sm">지역 &rarr; 관할 법원 매핑 (미리보기)</h3>
                            <div className="h-64 overflow-y-auto border rounded text-sm relative bg-gray-50">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 text-gray-600 sticky top-0">
                                        <tr>
                                            <th className="p-2 border-b">지역명</th>
                                            <th className="p-2 border-b">관할법원</th>
                                            <th className="p-2 border-b">지역그룹</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewConfig && Object.entries(previewConfig.regionToCourtMap).map(([region, court]) => (
                                            <tr key={region} className="border-b hover:bg-white">
                                                <td className="p-2 font-medium">{region}</td>
                                                <td className="p-2 text-blue-600">{court}</td>
                                                <td className="p-2 text-gray-500">{previewConfig.regionToGroupMap[region] || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Deposits & Basic Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-700 mb-4">보증금 공제 기준 ({selectedYear})</h3>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="p-2 border-b text-left">그룹</th>
                                    <th className="p-2 border-b text-right">상한(만원)</th>
                                    <th className="p-2 border-b text-right">공제(만원)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewConfig && Object.entries(previewConfig.depositExemptions)
                                    .filter(([key]) => !['Seoul', 'Overcrowded', 'Metro', 'Others'].includes(key))
                                    .map(([key, val]) => (
                                        <tr key={key} className="border-b">
                                            <td className="p-2 font-medium text-xs">{key}</td>
                                            <td className="p-2 text-right">
                                                <input
                                                    type="number"
                                                    value={val.limit / 10000}
                                                    onChange={(e) => {
                                                        const newExemptions = { ...previewConfig.depositExemptions };
                                                        newExemptions[key] = { ...val, limit: Number(e.target.value) * 10000 };
                                                        setPreviewConfig({ ...previewConfig, depositExemptions: newExemptions });
                                                    }}
                                                    className="w-20 text-right p-1 border rounded bg-white text-xs"
                                                />
                                            </td>
                                            <td className="p-2 text-right">
                                                <input
                                                    type="number"
                                                    value={val.deduct / 10000}
                                                    onChange={(e) => {
                                                        const newExemptions = { ...previewConfig.depositExemptions };
                                                        newExemptions[key] = { ...val, deduct: Number(e.target.value) * 10000 };
                                                        setPreviewConfig({ ...previewConfig, depositExemptions: newExemptions });
                                                    }}
                                                    className="w-20 text-right p-1 border rounded bg-white font-bold text-blue-600 text-xs"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        <p className="text-xs text-gray-400 mt-2">* 값 입력시 '만원' 단위로 입력해주세요.</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-700 mb-4">기본 정책 설정 (기준 중위소득 및 생계비)</h3>

                        {/* 1-6 Person Household Table */}
                        <div className="overflow-x-auto mb-6">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-600">
                                    <tr>
                                        <th className="p-2 border font-medium text-center">가구원</th>
                                        <th className="p-2 border font-medium text-center">기준 중위소득</th>
                                        <th className="p-2 border font-medium text-center">인정 생계비(60%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5, 6].map(size => (
                                        <tr key={size} className="hover:bg-gray-50">
                                            <td className="p-2 border text-center font-medium">{size}인</td>
                                            <td className="p-2 border text-center">
                                                <input
                                                    type="number"
                                                    value={previewConfig?.medianIncome[size] || 0}
                                                    onChange={e => {
                                                        if (!previewConfig) return;
                                                        const newVal = Number(e.target.value);
                                                        setPreviewConfig({
                                                            ...previewConfig,
                                                            medianIncome: {
                                                                ...previewConfig.medianIncome,
                                                                [size]: newVal
                                                            }
                                                        });
                                                    }}
                                                    className="w-full text-right p-1 border rounded"
                                                />
                                            </td>
                                            <td className="p-2 border text-center">
                                                <input
                                                    type="number"
                                                    value={previewConfig?.recognizedLivingCost[size] || 0}
                                                    onChange={e => {
                                                        if (!previewConfig) return;
                                                        const newVal = Number(e.target.value);
                                                        setPreviewConfig({
                                                            ...previewConfig,
                                                            recognizedLivingCost: {
                                                                ...previewConfig.recognizedLivingCost,
                                                                [size]: newVal
                                                            }
                                                        });
                                                    }}
                                                    className="w-full text-right p-1 border rounded font-bold text-blue-600"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Additional Settings */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">6인 초과시 1인당 추가액</label>
                                    <input
                                        type="number"
                                        value={previewConfig?.medianIncomeIncrement || 0}
                                        onChange={e => previewConfig && setPreviewConfig({
                                            ...previewConfig,
                                            medianIncomeIncrement: Number(e.target.value)
                                        })}
                                        className="w-full p-2 border rounded bg-gray-50 text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">생계비 인정률 (기본)</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={previewConfig?.livingCostRate || 0.6}
                                            onChange={e => previewConfig && setPreviewConfig({
                                                ...previewConfig,
                                                livingCostRate: Number(e.target.value)
                                            })}
                                            className="w-full p-2 border rounded bg-white text-right"
                                        />
                                        <span className="text-gray-500 text-sm w-8">
                                            {Math.round((previewConfig?.livingCostRate || 0) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between border-t pt-2 mt-2">
                                <span className="text-gray-500 text-sm">기준 연도</span>
                                <span className="font-bold text-blue-600">{previewConfig?.baseYear}년</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Medical & Education Cost (New) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <span className="text-red-500">🏥</span>
                            추가 의료비/교육비 인정 기준
                        </h3>

                        {/* Medical Cost */}
                        <div className="mb-6 border-b pb-6">
                            <h4 className="text-sm font-bold text-gray-600 mb-3">의료비 공제 기준 (중위소득 60% 포함분)</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {[1, 2, 3, 4, 5, 6].map(size => (
                                    <div key={size} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                                        <span className="text-xs text-gray-500 font-bold">{size}인 가구</span>
                                        <input
                                            type="number"
                                            value={previewConfig?.medicalCostIncluded?.[size] || 0}
                                            onChange={e => {
                                                if (!previewConfig) return;
                                                const newVal = Number(e.target.value);
                                                setPreviewConfig({
                                                    ...previewConfig,
                                                    medicalCostIncluded: {
                                                        ...(previewConfig.medicalCostIncluded || DEFAULT_POLICY_CONFIG_2026.medicalCostIncluded),
                                                        [size]: newVal
                                                    }
                                                });
                                            }}
                                            className="w-24 text-right bg-transparent outline-none font-bold text-gray-700"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">* 해당 금액을 초과하는 의료비만 추가 생계비로 인정됩니다.</p>
                        </div>

                        {/* Education Cost */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-600 mb-3">교육비 추가 인정 기준 (1인당)</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                                    <span className="text-xs text-gray-500 font-bold">기본 포함분 (생계비 내)</span>
                                    <input
                                        type="number"
                                        value={previewConfig?.educationCostCriteria?.included || 0}
                                        onChange={e => {
                                            if (!previewConfig) return;
                                            setPreviewConfig({
                                                ...previewConfig,
                                                educationCostCriteria: {
                                                    ...(previewConfig.educationCostCriteria || DEFAULT_POLICY_CONFIG_2026.educationCostCriteria),
                                                    included: Number(e.target.value)
                                                }
                                            });
                                        }}
                                        className="w-24 text-right bg-transparent outline-none font-bold text-gray-700"
                                    />
                                </div>
                                <div className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100">
                                    <span className="text-xs text-blue-600 font-bold">일반 교육비 한도</span>
                                    <input
                                        type="number"
                                        value={previewConfig?.educationCostCriteria?.limit || 0}
                                        onChange={e => {
                                            if (!previewConfig) return;
                                            setPreviewConfig({
                                                ...previewConfig,
                                                educationCostCriteria: {
                                                    ...(previewConfig.educationCostCriteria || DEFAULT_POLICY_CONFIG_2026.educationCostCriteria),
                                                    limit: Number(e.target.value)
                                                }
                                            });
                                        }}
                                        className="w-24 text-right bg-transparent outline-none font-bold text-blue-700"
                                    />
                                </div>
                                <div className="flex justify-between items-center bg-purple-50 p-2 rounded border border-purple-100">
                                    <span className="text-xs text-purple-600 font-bold">특수 교육비 한도</span>
                                    <input
                                        type="number"
                                        value={previewConfig?.educationCostCriteria?.specialLimit || 0}
                                        onChange={e => {
                                            if (!previewConfig) return;
                                            setPreviewConfig({
                                                ...previewConfig,
                                                educationCostCriteria: {
                                                    ...(previewConfig.educationCostCriteria || DEFAULT_POLICY_CONFIG_2026.educationCostCriteria),
                                                    specialLimit: Number(e.target.value)
                                                }
                                            });
                                        }}
                                        className="w-24 text-right bg-transparent outline-none font-bold text-purple-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. High Income Policy (New) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <span className="text-yellow-500">💰</span>
                            고소득자(기타생계비) 적용 기준
                        </h3>
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-sm">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex justify-between items-center border-b border-yellow-200 pb-3">
                                    <div>
                                        <div className="font-bold text-gray-800">적용 소득 기준</div>
                                        <div className="text-xs text-gray-500">기준 중위소득의 N배 초과 시 적용</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={previewConfig?.highIncomeConfig?.thresholdRate || 1.5}
                                            onChange={e => previewConfig && setPreviewConfig({
                                                ...previewConfig,
                                                highIncomeConfig: {
                                                    ...(previewConfig.highIncomeConfig || DEFAULT_POLICY_CONFIG_2026.highIncomeConfig),
                                                    thresholdRate: Number(e.target.value)
                                                }
                                            })}
                                            className="w-16 text-right p-1 border rounded bg-white font-bold"
                                        />
                                        <span className="text-gray-600 font-bold">배 ({(previewConfig?.highIncomeConfig?.thresholdRate || 1.5) * 100}%)</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b border-yellow-200 pb-3">
                                    <div>
                                        <div className="font-bold text-gray-800">총 생계비 인정 한도</div>
                                        <div className="text-xs text-gray-500">기준 중위소득의 N배까지만 인정</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={previewConfig?.highIncomeConfig?.maxLivingCostRate || 1.0}
                                            onChange={e => previewConfig && setPreviewConfig({
                                                ...previewConfig,
                                                highIncomeConfig: {
                                                    ...(previewConfig.highIncomeConfig || DEFAULT_POLICY_CONFIG_2026.highIncomeConfig),
                                                    maxLivingCostRate: Number(e.target.value)
                                                }
                                            })}
                                            className="w-16 text-right p-1 border rounded bg-white font-bold"
                                        />
                                        <span className="text-gray-600 font-bold">배 ({(previewConfig?.highIncomeConfig?.maxLivingCostRate || 1.0) * 100}%)</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-gray-800">최소 변제율 제한</div>
                                        <div className="text-xs text-gray-500">변제금이 원금의 N% 이상이어야 함</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={previewConfig?.highIncomeConfig?.minRepaymentRate || 0.4}
                                            onChange={e => previewConfig && setPreviewConfig({
                                                ...previewConfig,
                                                highIncomeConfig: {
                                                    ...(previewConfig.highIncomeConfig || DEFAULT_POLICY_CONFIG_2026.highIncomeConfig),
                                                    minRepaymentRate: Number(e.target.value)
                                                }
                                            })}
                                            className="w-16 text-right p-1 border rounded bg-white font-bold"
                                        />
                                        <span className="text-gray-600 font-bold">배 ({(previewConfig?.highIncomeConfig?.minRepaymentRate || 0.4) * 100}%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PolicyManager;
