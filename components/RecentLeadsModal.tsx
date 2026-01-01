import React, { useMemo } from 'react';
import { X, ExternalLink, User, Phone, MessageSquare, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeadData {
    [key: string]: any;
}

interface RecentLeadsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    leads: LeadData[];
    landingTitles: Record<string, string>; // ID -> Title Map
}

const SYSTEM_FIELDS = [
    'landing_id', 'timestamp', 'user_agent', 'referrer',
    'page_title', 'marketing_consent', 'third_party_consent',
    'privacy_consent', 'type'
];

const parseKoreanDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return 0;
    const standard = new Date(dateStr).getTime();
    if (!isNaN(standard)) return standard;
    try {
        const numbers = dateStr.match(/\d+/g);
        if (!numbers || numbers.length < 3) return 0;
        let year = parseInt(numbers[0], 10);
        let month = parseInt(numbers[1], 10) - 1;
        let day = parseInt(numbers[2], 10);
        let hour = 0, min = 0;
        if (numbers.length >= 4) hour = parseInt(numbers[3], 10);
        if (numbers.length >= 5) min = parseInt(numbers[4], 10);

        if ((dateStr.includes('오후') || dateStr.toLowerCase().includes('pm')) && hour < 12) hour += 12;

        return new Date(year, month, day, hour, min).getTime();
    } catch (e) { return 0; }
};

export const RecentLeadsModal: React.FC<RecentLeadsModalProps> = ({ isOpen, onClose, title, leads, landingTitles }) => {
    const navigate = useNavigate();

    // Sort by newest
    const sortedLeads = useMemo(() => {
        return [...leads].sort((a, b) => parseKoreanDate(b['Timestamp']) - parseKoreanDate(a['Timestamp']));
    }, [leads]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500 mt-1">총 {leads.length}건의 데이터가 조회되었습니다.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-6 space-y-4 bg-gray-50">
                    {sortedLeads.length === 0 ? (
                        <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                            <p className="text-gray-400">수집된 데이터가 없습니다.</p>
                        </div>
                    ) : (
                        sortedLeads.map((lead, idx) => {
                            const landingId = String(lead['Landing ID'] || '');
                            const pageTitle = landingTitles[landingId] || `ID: ${landingId}`;

                            // Identify Primary Info
                            const name = lead['Name'] || lead['name'] || lead['이름'];
                            const phone = lead['Phone'] || lead['phone'] || lead['연락처'] || lead['휴대폰'];

                            // Collect Extra Info
                            const extras: string[] = [];
                            Object.entries(lead).forEach(([k, v]) => {
                                const kLower = k.toLowerCase();
                                if (SYSTEM_FIELDS.includes(kLower)) return;
                                if (['name', 'phone', '이름', '연락처', '휴대폰', 'landing id'].includes(kLower)) return;
                                if (!v) return;
                                extras.push(`${k}: ${v}`);
                            });

                            const timeStr = lead['Timestamp'] || '';

                            return (
                                <div key={idx} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                                                {pageTitle}
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {timeStr}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => { onClose(); navigate(`/admin/stats/${landingId}`); }}
                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                            title="해당 페이지 통계로 이동"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {/* Primary Row */}
                                        <div className="flex items-center gap-4">
                                            {name && (
                                                <div className="flex items-center gap-2 font-bold text-gray-900 text-lg">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    {name}
                                                </div>
                                            )}
                                            {phone && (
                                                <div className="flex items-center gap-2 text-gray-700 font-medium font-mono">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    {phone}
                                                </div>
                                            )}
                                            {!name && !phone && (
                                                <span className="text-gray-500 italic">식별 정보 없음</span>
                                            )}
                                        </div>

                                        {/* Extras Row */}
                                        {extras.length > 0 && (
                                            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-1">
                                                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                                <p className="line-clamp-2 leading-relaxed">
                                                    {extras.join('  |  ')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
