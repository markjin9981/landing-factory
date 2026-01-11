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
                <div className="bg-black text-green-500 px-4 py-2 rounded-md font-mono text-[10px] shadow-lg border border-green-900 flex flex-col items-start min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 border-b border-green-900 w-full pb-1 opacity-70">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="ml-auto text-[8px]">SECURE_SHELL</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-green-600">$</span>
                        <span className="animate-[pulse_0.2s_infinite]">init_security_protocol...</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-green-400">
                        <span>{'>'} ENCRYPTING DATA...</span>
                        <span className="animate-pulse">100%</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs font-bold text-green-300">
                        <Lock className="w-3 h-3" />
                        <span>SECURE CONNECTION ESTABLISHED</span>
                        <span className="w-1.5 h-3 bg-green-500 animate-pulse ml-1"></span>
                    </div>
                </div>
            </div>
        );
    }

    // 6. Badge Style (Premium Gold)
    if (pid === '6') {
        return (
            <div className="flex justify-center mt-5 mb-2 relative">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                    <div className="relative px-5 py-2 bg-gradient-to-b from-yellow-50 to-white ring-1 ring-yellow-900/10 rounded-lg leading-none flex items-center gap-3 shadow-xl">
                        <div className="flex items-center justify-center p-1.5 rounded-full bg-yellow-100 text-yellow-600">
                            <ShieldCheck className="w-5 h-5 animate-[bounce_2s_infinite]" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="text-[10px] font-semibold text-yellow-800 tracking-wider">OFFICIAL SECURE FORM</div>
                            <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                                <Lock className="w-3 h-3 text-yellow-500" />
                                <span>SSL Verified Badge</span>
                            </div>
                        </div>
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                            <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] animate-[shimmer_2s_infinite]" style={{ animation: 'btn-hyper-shimmer 2.5s infinite' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 7. Server Status (Live Monitor)
    if (pid === '7') {
        return (
            <div className="flex justify-center mt-4">
                <div className="bg-gray-900 text-gray-300 px-4 py-2 rounded-lg text-xs font-mono shadow-inner border border-gray-700 flex items-center gap-4">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </div>
                            <span className="font-bold text-white tracking-wider">SYSTEM ONLINE</span>
                        </div>
                        <div className="text-[9px] text-gray-400">Uptime: 99.99% | Latency: 12ms</div>
                    </div>
                    <div className="h-6 w-[1px] bg-gray-700"></div>
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                        <div className="flex gap-0.5 items-end h-3">
                            <div className="w-0.5 bg-blue-500 h-1 animate-[pulse_1s_infinite]"></div>
                            <div className="w-0.5 bg-blue-500 h-2 animate-[pulse_1.2s_infinite]"></div>
                            <div className="w-0.5 bg-blue-500 h-3 animate-[pulse_0.8s_infinite]"></div>
                            <div className="w-0.5 bg-blue-500 h-1.5 animate-[pulse_1.5s_infinite]"></div>
                            <div className="w-0.5 bg-blue-500 h-2.5 animate-[pulse_1.1s_infinite]"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 8. Privacy Focused (Active Shield)
    if (pid === '8') {
        return (
            <div className="flex justify-center mt-5 mb-2">
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 px-5 py-2 rounded-full border border-blue-100 shadow-sm flex items-center gap-3">
                    <div className="absolute inset-0 bg-blue-400/5 animate-[pulse_3s_infinite]"></div>
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm text-purple-600">
                        <Eye className="w-4 h-4 animate-[ping_3s_infinite] absolute opacity-30" />
                        <Eye className="w-4 h-4 relative z-10" />
                    </div>
                    <div className="relative">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                            <Lock className="w-3 h-3 text-purple-500" />
                            <span>Privacy Protected</span>
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                            Data is encrypted & safe
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 9. Certified Stamp (Dynamic)
    if (pid === '9') {
        return (
            <div className="flex justify-center mt-5 mb-2 pointer-events-none select-none">
                <div className="relative animate-[bounce_1s_ease-out]">
                    <div className="absolute -inset-1 rounded-full border-2 border-dashed border-blue-200 animate-[spin_10s_linear_infinite]"></div>
                    <div className="relative border-2 border-blue-600 text-blue-600 rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] bg-white transform -rotate-3 shadow-xl">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                            Officially Certified
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                        </div>
                        <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full p-1 border-2 border-white shadow-md animate-[ping_2s_infinite_1s]">
                            <CheckCircle className="w-3 h-3" />
                        </div>
                        <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full p-1 border-2 border-white shadow-md">
                            <CheckCircle className="w-3 h-3" />
                        </div>
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
