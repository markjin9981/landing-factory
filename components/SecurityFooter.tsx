import React from 'react';
import { Lock, Shield, ShieldCheck, Server, Eye, FileKey, CheckCircle, Wifi, Activity, Database } from 'lucide-react';

interface SecurityFooterProps {
    presetId?: string;
    themeColor?: string;
}

const SecurityFooter: React.FC<SecurityFooterProps> = ({ presetId = '0', themeColor = '#2563eb' }) => {
    // 0: Minimal (Default - Current)
    // 1: Pulse Shield (Green)
    // 2: Radar Scan (Blue)
    // 3: Bank Grade (Gold)
    // 4: Live Monitor (Red dot)
    // 5: Dark Mode Cyber (Black/Green)
    // 6: Badge Style (Outlined)
    // 7: Server Status (Tech)
    // 8: Privacy Focused (Eye)
    // 9: Certified Badge (Stamp)
    // 10: Encrypted Data (File)

    const pid = String(presetId);

    // Default (0) - Clean text only
    if (!pid || pid === '0') {
        return (
            <div className="flex justify-center items-center gap-4 text-xs mt-3 opacity-60">
                <div className="flex items-center gap-1"><Lock className="w-3 h-3" /> SSL 보안 적용</div>
                <div className="flex items-center gap-1">개인정보 암호화</div>
            </div>
        );
    }

    // 1. Pulse Shield (Green Theme - Trust)
    if (pid === '1') {
        return (
            <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200 shadow-sm animate-fade-in">
                    <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-green-600 relative z-10" />
                        <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></span>
                    </div>
                    <span>SSL 보안 서버 작동중</span>
                </div>
            </div>
        );
    }

    // 2. Radar Scan (Blue Theme - Active)
    if (pid === '2') {
        return (
            <div className="flex justify-center mt-4">
                <div className="flex items-center gap-3 text-xs text-blue-900 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                    <div className="relative flex items-center justify-center w-5 h-5">
                        <Wifi className="w-4 h-4 text-blue-500 relative z-10" />
                        <span className="absolute inset-0 border-2 border-blue-400 rounded-full animate-[ping_2s_infinite] opacity-30"></span>
                    </div>
                    <div>
                        <div className="font-bold">실시간 정보 보호 가동중</div>
                        <div className="text-[10px] text-blue-400">24시간 모니터링 시스템</div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Bank Grade (Gold/Yellow - Premium)
    if (pid === '3') {
        return (
            <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded bg-yellow-50 border border-yellow-200 opacity-90">
                    <Lock className="w-3 h-3 text-yellow-600" />
                    <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide">금융권 수준 암호화 적용 (256-bit)</span>
                </div>
            </div>
        );
    }

    // 4. Live Monitor (Red - Urgency/Realtime)
    if (pid === '4') {
        return (
            <div className="flex justify-center mt-4 gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="font-bold text-gray-700">LIVE SYSTEM</span>
                </div>
                <div className="flex items-center gap-1">
                    <Server className="w-3 h-3" />
                    데이터 안전 저장
                </div>
            </div>
        );
    }

    // 5. Dark Mode Cyber (Black/Green terminal style)
    if (pid === '5') {
        return (
            <div className="flex justify-center mt-4">
                <div className="bg-gray-900 text-green-400 px-3 py-1.5 rounded flex items-center gap-2 text-[10px] font-mono shadow-md">
                    <span className="text-green-500">root@secure:~#</span>
                    <span className="animate-pulse">_encrypt_data... OK</span>
                    <Lock className="w-3 h-3 ml-1 text-green-500" />
                </div>
            </div>
        );
    }

    // 6. Badge Style (Outlined Modern)
    if (pid === '6') {
        return (
            <div className="flex justify-center mt-4 gap-2">
                <div className="px-2 py-0.5 border border-gray-300 rounded text-[10px] text-gray-500 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Safe Form
                </div>
                <div className="px-2 py-0.5 border border-gray-300 rounded text-[10px] text-gray-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> SSL Secured
                </div>
            </div>
        );
    }

    // 7. Server Status (Tech - Gray)
    if (pid === '7') {
        return (
            <div className="flex justify-center mt-4 text-xs text-gray-400 font-mono">
                <div className="flex items-center gap-2 border-t border-b border-gray-100 py-1 px-4">
                    <Activity className="w-3 h-3" />
                    <span>Secure Connection Established...</span>
                    <span className="text-green-500 font-bold">100%</span>
                </div>
            </div>
        );
    }

    // 8. Privacy Focused (Eye Icon - Soft Purple)
    if (pid === '8') {
        return (
            <div className="flex justify-center mt-4">
                <div className="flex flex-col items-center">
                    <div className="bg-purple-50 text-purple-600 rounded-full p-1.5 mb-1 animate-bounce duration-[3000ms]">
                        <Eye className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                        철통 보안: 고객님만 볼 수 있습니다
                    </span>
                </div>
            </div>
        );
    }

    // 9. Certified Badge (Stamp style)
    if (pid === '9') {
        return (
            <div className="flex justify-center mt-5 mb-2">
                <div className="relative border-2 border-blue-600 text-blue-600 rounded-lg px-4 py-1 text-xs font-bold uppercase tracking-widest bg-blue-50/50 transform -rotate-2">
                    Official Form
                    <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full p-1 border-2 border-white shadow-sm">
                        <CheckCircle className="w-3 h-3" />
                    </div>
                </div>
            </div>
        );
    }

    // 10. Encrypted Data (File style)
    if (pid === '10') {
        return (
            <div className="flex justify-center mt-4 items-center gap-3">
                <div className="text-right">
                    <div className="text-[10px] text-gray-400">Security Protocol</div>
                    <div className="text-xs font-bold text-gray-700">AES-256</div>
                </div>
                <div className="h-8 w-[1px] bg-gray-200"></div>
                <div className="flex items-center gap-1 text-gray-600">
                    <FileKey className="w-5 h-5" strokeWidth={1.5} />
                    <div className="text-[10px] leading-tight">
                        Encrypted<br />Submission
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export const SECURITY_PRESETS = [
    { id: '0', name: '기본 (텍스트)', icon: Lock },
    { id: '1', name: '그린 쉴드 (신뢰)', icon: ShieldCheck },
    { id: '2', name: '블루 레이더 (활동중)', icon: Wifi },
    { id: '3', name: '골드 뱅크 (최고보안)', icon: Lock },
    { id: '4', name: '라이브 레드 (실시간)', icon: Server },
    { id: '5', name: '다크 터미널 (개발자)', icon: Database },
    { id: '6', name: '뱃지 스타일 (심플)', icon: Shield },
    { id: '7', name: '서버 상태 (모노)', icon: Activity },
    { id: '8', name: '프라이버시 (눈)', icon: Eye },
    { id: '9', name: '인증 도장 (공식)', icon: CheckCircle },
    { id: '10', name: '파일 암호화 (데이터)', icon: FileKey },
];

export default SecurityFooter;
