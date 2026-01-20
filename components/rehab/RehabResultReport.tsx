/**
 * AI 변제금 진단 결과 리포트
 * 
 * 다크테마 + 네온 블루 액센트 디자인
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, AlertTriangle, TrendingDown, Building2, Shield, ArrowRight, Download, Share2 } from 'lucide-react';
import { RehabCalculationResult, RehabUserInput, formatCurrency } from '../../services/calculationService';

interface RehabResultReportProps {
    result: RehabCalculationResult;
    userInput: RehabUserInput;
    onClose: () => void;
    onConsultation?: () => void;
}

const RehabResultReport: React.FC<RehabResultReportProps> = ({
    result,
    userInput,
    onClose,
    onConsultation
}) => {
    const statusConfig = {
        POSSIBLE: {
            badge: '개인회생 가능',
            bgColor: 'from-green-500/20 to-green-600/10',
            borderColor: 'border-green-500/50',
            textColor: 'text-green-400',
            glowColor: 'shadow-green-500/30',
        },
        DIFFICULT: {
            badge: '검토 필요',
            bgColor: 'from-yellow-500/20 to-yellow-600/10',
            borderColor: 'border-yellow-500/50',
            textColor: 'text-yellow-400',
            glowColor: 'shadow-yellow-500/30',
        },
        IMPOSSIBLE: {
            badge: '신청 어려움',
            bgColor: 'from-red-500/20 to-red-600/10',
            borderColor: 'border-red-500/50',
            textColor: 'text-red-400',
            glowColor: 'shadow-red-500/30',
        }
    };

    const config = statusConfig[result.status];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-2 bg-black/80 backdrop-blur-md overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                className="w-full max-w-lg my-4 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative px-6 py-8 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${config.borderColor} bg-gradient-to-r ${config.bgColor} ${config.textColor} font-bold text-sm shadow-lg ${config.glowColor}`}
                        >
                            {result.status === 'POSSIBLE' && <Check className="w-4 h-4" />}
                            {result.status === 'DIFFICULT' && <AlertTriangle className="w-4 h-4" />}
                            {result.status === 'IMPOSSIBLE' && <X className="w-4 h-4" />}
                            {config.badge}
                        </motion.div>

                        <h2 className="mt-4 text-xl font-bold text-white">
                            AI 변제금 진단 리포트
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            {userInput.name}님의 분석 결과입니다
                        </p>
                    </div>
                </div>

                {/* Main Metrics */}
                <div className="p-6 space-y-6">
                    {/* Key Numbers */}
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30"
                        >
                            <p className="text-xs text-cyan-300 mb-1">월 예상 변제금</p>
                            <p className="text-2xl font-bold text-white">
                                {formatCurrency(result.monthlyPayment)}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{result.repaymentMonths}개월간</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30"
                        >
                            <p className="text-xs text-green-300 mb-1">예상 탕감액</p>
                            <p className="text-2xl font-bold text-white">
                                {formatCurrency(result.totalDebtReduction)}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">탕감율 {result.debtReductionRate}%</p>
                        </motion.div>
                    </div>

                    {/* Debt Comparison Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                    >
                        <div className="flex justify-between text-xs text-slate-400 mb-2">
                            <span className="flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" /> 채무 비교
                            </span>
                        </div>

                        {/* Total Debt Bar */}
                        <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-300">현재 총 채무</span>
                                <span className="text-slate-400">{formatCurrency(userInput.totalDebt)}</span>
                            </div>
                            <div className="h-3 bg-red-500/30 rounded-full overflow-hidden">
                                <div className="h-full w-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" />
                            </div>
                        </div>

                        {/* Repayment Bar */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-300">실제 갚을 금액</span>
                                <span className="text-green-400">{formatCurrency(result.totalRepayment)}</span>
                            </div>
                            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${100 - result.debtReductionRate}%` }}
                                    transition={{ delay: 0.8, duration: 0.8 }}
                                    className="h-full bg-gradient-to-r from-green-500 to-cyan-400 rounded-full"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Court Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Building2 className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-1">관할 법원 분석</h4>
                                <p className="text-sm text-slate-300">{result.courtName}</p>
                                {result.courtDescription && (
                                    <p className="text-xs text-slate-400 mt-1">{result.courtDescription}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* AI Advice */}
                    {(result.aiAdvice.length > 0 || result.riskWarnings.length > 0) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-cyan-400" />
                                <h4 className="text-sm font-bold text-white">AI 분석 의견</h4>
                            </div>

                            {result.aiAdvice.map((advice, idx) => (
                                <div key={idx} className="flex items-start gap-2 mb-2">
                                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-slate-300">{advice}</p>
                                </div>
                            ))}

                            {result.riskWarnings.map((warning, idx) => (
                                <div key={idx} className="flex items-start gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-yellow-200">{warning}</p>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Status Reason */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center text-sm text-slate-400 px-4"
                    >
                        {result.statusReason}
                    </motion.p>

                    {/* Disclaimer */}
                    <p className="text-[10px] text-slate-500 text-center px-4">
                        ※ 본 결과는 AI 추정치이며, 실제 법원 판단과 다를 수 있습니다.
                        정확한 상담은 전문가와 진행해주세요.
                    </p>
                </div>

                {/* CTA Footer */}
                <div className="p-6 bg-gradient-to-t from-slate-900 to-transparent border-t border-slate-700">
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onConsultation}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
                    >
                        즉시 전문 상담 신청
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>

                    <div className="flex gap-2 mt-3">
                        <button className="flex-1 py-2 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-1">
                            <Download className="w-4 h-4" />
                            저장
                        </button>
                        <button className="flex-1 py-2 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-1">
                            <Share2 className="w-4 h-4" />
                            공유
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default RehabResultReport;
