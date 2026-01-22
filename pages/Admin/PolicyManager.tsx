import React, { useState, useEffect } from 'react';
import { GlobalSettings } from '../../types';
import { fetchGlobalSettings, saveGlobalSettings } from '../../services/googleSheetService';
import { RehabPolicyConfig, DEFAULT_POLICY_CONFIG_2026, CourtTrait } from '../../config/PolicyConfig';
import { Save, Upload, Download, RefreshCw, FileText, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

const PolicyManager: React.FC = () => {
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [previewConfig, setPreviewConfig] = useState<RehabPolicyConfig | null>(null);

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
            // 만약 저장된 정책이 있으면 그것을 프리뷰로, 없으면 기본값
            // Deep copy needed to avoid mutation issues
            const config = settings.policyConfig || DEFAULT_POLICY_CONFIG_2026;
            setPreviewConfig(JSON.parse(JSON.stringify(config)));
        } else {
            // 초기 설정이 없는 경우
            setPreviewConfig(JSON.parse(JSON.stringify(DEFAULT_POLICY_CONFIG_2026)));
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
                const group = row['지역그룹'] || row['Group'];

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
                    const group = row['지역그룹'] || row['Group'];
                    const limit = row['보증금상한'] || row['Limit'];
                    const deduct = row['공제금액'] || row['Deduct'];

                    if (group && limit !== undefined && deduct !== undefined) {
                        depositExemptions[group] = { limit: Number(limit), deduct: Number(deduct) };
                    }
                });
            }

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
        if (!globalSettings || !previewConfig) return;
        setIsSaving(true);

        const newSettings: GlobalSettings = {
            ...globalSettings,
            policyConfig: previewConfig
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
        if (previewConfig.courtTraits[newCourt.name]) return alert('이미 존재하는 법원명입니다.');

        const trait: CourtTrait = {
            name: newCourt.name,
            allow24Months: newCourt.allow24Months || false,
            spousePropertyRate: newCourt.spousePropertyRate || 0,
            investLossInclude: newCourt.investLossInclude || false,
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

    if (isLoading) return <div className="p-8 text-center flex justify-center"><RefreshCw className="animate-spin" /></div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">2026 개인회생 정책 관리</h1>
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
                                            <td className="p-3 text-right">
                                                {key !== 'Default' ? (
                                                    <button
                                                        onClick={() => handleDeleteCourt(key)}
                                                        className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded"
                                                        title="삭제"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                ) : <span className="text-xs text-gray-300">기본</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                        <h3 className="font-bold text-gray-700 mb-4">보증금 공제 기준 (2026)</h3>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="p-2 border-b text-left">그룹</th>
                                    <th className="p-2 border-b text-right">상한</th>
                                    <th className="p-2 border-b text-right">공제</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewConfig && Object.entries(previewConfig.depositExemptions).map(([key, val]) => (
                                    <tr key={key} className="border-b">
                                        <td className="p-2 font-medium text-xs">{key}</td>
                                        <td className="p-2 text-right text-xs">{(val.limit / 10000).toLocaleString()}만</td>
                                        <td className="p-2 text-right font-bold text-blue-600">{(val.deduct / 10000).toLocaleString()}만</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="text-xs text-gray-400 mt-2">* 단위: 만원</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-700 mb-4">기본 정책 설정</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">기준 연도</span>
                                <span className="font-medium">{previewConfig?.baseYear}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">생계비 인정률</span>
                                <span className="font-medium">{(previewConfig?.livingCostRate || 0) * 100}%</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">중위 소득 (1인)</span>
                                <span className="font-medium">{previewConfig?.medianIncome[1].toLocaleString()}원</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PolicyManager;
