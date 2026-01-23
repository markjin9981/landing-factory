/**
 * AI 변제금 진단 결과 리포트
 * 
 * 다크테마 + 네온 블루 액센트 디자인
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, AlertTriangle, TrendingDown, Building2, Shield, ArrowRight, Download, Share2, Users, DollarSign, Percent, BarChart3 } from 'lucide-react';
import { RehabCalculationResult, RehabUserInput, formatCurrency } from '../../services/calculationService';
import { StatComparisonCard, DistributionBar, PercentileBadge } from './StatisticalComparison';
import { calculateIncomePercentile, calculateDebtPercentile, calculateReductionRatePercentile, getAgeComparison, getFamilySizeComparison, generateStatisticalInsights } from '../../utils/statisticsUtils';
import { REHAB_STATISTICS_2025, AVERAGE_VALUES } from '../../config/rehabStatistics2025';

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
                className="w-full max-w-lg my-4 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto"
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

                    {/* Detailed Breakdown Sections */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-3"
                    >
                        {/* Court & Jurisdiction */}
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Building2 className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white mb-2">관할 법원 및 지역</h4>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">관할 법원</span>
                                            <span className="text-slate-200 font-medium">{result.courtName}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">지역 그룹</span>
                                            <span className="text-slate-200 font-medium">{result.regionGroup}</span>
                                        </div>
                                        {result.courtDescription && (
                                            <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700">
                                                {result.courtDescription}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Asset Composition */}
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                            <h4 className="text-sm font-bold text-white mb-3">자산 구성</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">본인 재산</span>
                                    <span className="text-slate-200 font-medium">{formatCurrency(userInput.myAssets)}</span>
                                </div>
                                {userInput.isMarried && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">배우자 재산 (반영분)</span>
                                        <span className="text-slate-200 font-medium">{formatCurrency(userInput.spouseAssets)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs pt-2 border-t border-slate-700">
                                    <span className="text-slate-400">보증금/전세금</span>
                                    <span className="text-slate-200 font-medium">{formatCurrency(userInput.deposit)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">면제 보증금</span>
                                    <span className="text-green-400 font-medium">-{formatCurrency(result.exemptDeposit)}</span>
                                </div>
                                <div className="flex justify-between text-xs pt-2 border-t border-slate-700 font-bold">
                                    <span className="text-white">청산가치 (총 자산)</span>
                                    <span className="text-cyan-400">{formatCurrency(result.liquidationValue)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Family & Dependents */}
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                            <h4 className="text-sm font-bold text-white mb-3">부양가족 구성</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">총 가구원 수</span>
                                    <span className="text-slate-200 font-medium">{userInput.familySize}인</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">혼인 상태</span>
                                    <span className="text-slate-200 font-medium">
                                        {userInput.isMarried ? '기혼' : '미혼/이혼/사별'}
                                    </span>
                                </div>
                                {userInput.minorChildren !== undefined && userInput.minorChildren > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">미성년 자녀</span>
                                        <span className="text-slate-200 font-medium">{userInput.minorChildren}명</span>
                                    </div>
                                )}
                                <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700">
                                    가구원 수에 따라 기본 생계비가 결정됩니다
                                </p>
                            </div>
                        </div>

                        {/* Living Cost Breakdown */}
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                            <h4 className="text-sm font-bold text-white mb-3">생계비 상세 내역</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">기본 생계비 ({userInput.familySize}인 가구)</span>
                                    <span className="text-slate-200 font-medium">{formatCurrency(result.baseLivingCost)}</span>
                                </div>

                                {result.additionalLivingCost > 0 && (
                                    <>
                                        <div className="text-xs text-slate-400 mt-2 mb-1">추가 생계비 항목:</div>
                                        {userInput.rentCost && userInput.rentCost > 0 && (
                                            <div className="flex justify-between text-xs pl-3">
                                                <span className="text-slate-400">• 월세</span>
                                                <span className="text-slate-200">{formatCurrency(userInput.rentCost)}</span>
                                            </div>
                                        )}
                                        {userInput.medicalCost && userInput.medicalCost > 0 && (
                                            <div className="flex justify-between text-xs pl-3">
                                                <span className="text-slate-400">• 의료비</span>
                                                <span className="text-slate-200">{formatCurrency(userInput.medicalCost)}</span>
                                            </div>
                                        )}
                                        {userInput.educationCost && userInput.educationCost > 0 && (
                                            <div className="flex justify-between text-xs pl-3">
                                                <span className="text-slate-400">• 교육비</span>
                                                <span className="text-slate-200">{formatCurrency(userInput.educationCost)}</span>
                                            </div>
                                        )}
                                        {userInput.childSupportPaid && userInput.childSupportPaid > 0 && (
                                            <div className="flex justify-between text-xs pl-3">
                                                <span className="text-slate-400">• 양육비 지급</span>
                                                <span className="text-slate-200">{formatCurrency(userInput.childSupportPaid)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-xs pt-2 border-t border-slate-700">
                                            <span className="text-slate-400">추가 생계비 합계</span>
                                            <span className="text-slate-200 font-medium">{formatCurrency(result.additionalLivingCost)}</span>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-between text-xs pt-2 border-t border-slate-700 font-bold">
                                    <span className="text-white">총 인정 생계비</span>
                                    <span className="text-cyan-400">{formatCurrency(result.recognizedLivingCost)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Available Income Calculation */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30">
                            <h4 className="text-sm font-bold text-white mb-3">가용 소득 계산</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-300">월 소득</span>
                                    <span className="text-slate-200 font-medium">{formatCurrency(userInput.monthlyIncome)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-300">총 인정 생계비</span>
                                    <span className="text-red-400 font-medium">-{formatCurrency(result.recognizedLivingCost)}</span>
                                </div>
                                <div className="flex justify-between text-xs pt-2 border-t border-cyan-500/30 font-bold">
                                    <span className="text-white">가용 소득 (변제 가능액)</span>
                                    <span className="text-cyan-400">{formatCurrency(result.availableIncome)}</span>
                                </div>
                                <p className="text-xs text-cyan-300/70 mt-2 pt-2 border-t border-cyan-500/20">
                                    월 변제금은 가용 소득과 청산가치를 고려하여 결정됩니다
                                </p>
                            </div>
                        </div>

                        {/* Repayment Calculation Summary */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/30">
                            <h4 className="text-sm font-bold text-white mb-3">변제금 산출 방식</h4>
                            <div className="space-y-2 text-xs text-slate-300">
                                <p>• <span className="text-purple-300 font-medium">청산가치 기준</span>: {formatCurrency(result.liquidationValue)} ÷ {result.repaymentMonths}개월 = {formatCurrency(Math.floor(result.liquidationValue / result.repaymentMonths))}/월</p>
                                <p>• <span className="text-purple-300 font-medium">가용소득 기준</span>: {formatCurrency(result.availableIncome)}/월</p>
                                <p className="pt-2 border-t border-purple-500/20 text-purple-200 font-medium">
                                    → 두 금액 중 <span className="text-purple-300">큰 금액</span>이 월 변제금으로 결정됩니다
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Statistical Comparison Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="space-y-3"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-lg font-bold text-white">통계 비교 분석</h3>
                            <span className="text-xs text-slate-400">(2025년 상반기 기준)</span>
                        </div>

                        {/* Key Percentile Cards */}
                        <div className="grid grid-cols-1 gap-3">
                            <StatComparisonCard
                                title="월 소득"
                                userValue={userInput.monthlyIncome}
                                averageValue={AVERAGE_VALUES.monthlyIncome}
                                percentile={calculateIncomePercentile(userInput.monthlyIncome)}
                                icon={<DollarSign className="w-4 h-4" />}
                            />

                            <StatComparisonCard
                                title="예상 탕감률"
                                userValue={`${result.debtReductionRate}%`}
                                averageValue={`${AVERAGE_VALUES.debtReductionRate}%`}
                                percentile={calculateReductionRatePercentile(result.debtReductionRate)}
                                icon={<Percent className="w-4 h-4" />}
                            />

                            <StatComparisonCard
                                title="총 채무"
                                userValue={userInput.totalDebt}
                                averageValue={AVERAGE_VALUES.totalDebt}
                                percentile={calculateDebtPercentile(userInput.totalDebt)}
                                icon={<TrendingDown className="w-4 h-4" />}
                            />
                        </div>

                        {/* Distribution Comparison */}
                        <DistributionBar
                            title="변제율"
                            userValue={result.debtReductionRate}
                            distribution={REHAB_STATISTICS_2025.debtReductionRateDistribution}
                            highlightRange={REHAB_STATISTICS_2025.debtReductionRateDistribution.find(d => {
                                const numbers = d.range.match(/\d+/g);
                                if (!numbers) return false;
                                const min = parseInt(numbers[0]);
                                const max = numbers[1] ? parseInt(numbers[1]) : 100;
                                return result.debtReductionRate >= min && result.debtReductionRate < max;
                            })?.range || ''}
                        />

                        {/* Statistical Insights */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30">
                            <div className="flex items-center gap-2 mb-3">
                                <Users className="w-4 h-4 text-cyan-400" />
                                <h4 className="text-sm font-bold text-white">통계 인사이트</h4>
                            </div>
                            <div className="space-y-2">
                                {generateStatisticalInsights({
                                    monthlyIncome: userInput.monthlyIncome,
                                    totalDebt: userInput.totalDebt,
                                    debtReductionRate: result.debtReductionRate,
                                    age: userInput.age,
                                    familySize: userInput.familySize
                                }).map((insight, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.9 + idx * 0.1 }}
                                        className="flex items-start gap-2"
                                    >
                                        <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-slate-300">{insight}</p>
                                    </motion.div>
                                ))}
                                {userInput.age && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.2 }}
                                        className="flex items-start gap-2"
                                    >
                                        <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-slate-300">{getAgeComparison(userInput.age)}</p>
                                    </motion.div>
                                )}
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.3 }}
                                    className="flex items-start gap-2"
                                >
                                    <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-slate-300">{getFamilySizeComparison(userInput.familySize)}</p>
                                </motion.div>
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
