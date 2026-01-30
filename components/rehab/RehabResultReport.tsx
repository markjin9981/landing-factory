/**
 * AI 변제금 진단 결과 리포트 V2 - 프리미엄 에디션
 * 
 * 최첨단 디자인 + 프리미엄 애니메이션
 * - 글래스모피즘 카드
 * - 카운트업 애니메이션
 * - 도넛 차트 시각화
 * - 웨이브 프로그레스 바
 * - 스태거드 등장 효과
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, TrendingDown, Building2, Shield, ArrowRight, Download, Share2, Users, DollarSign, Percent, BarChart3, Sparkles, Zap, Clock, Home, CreditCard, Calculator } from 'lucide-react';
import { RehabCalculationResult, RehabUserInput, formatCurrency } from '../../services/calculationService';
import { StatComparisonCard, DistributionBar, PercentileBadge } from './StatisticalComparison';
import { calculateIncomePercentile, calculateDebtPercentile, calculateReductionRatePercentile, getAgeComparison, getFamilySizeComparison, generateStatisticalInsights } from '../../utils/statisticsUtils';
import { REHAB_STATISTICS_2025, AVERAGE_VALUES } from '../../config/rehabStatistics2025';
import { CountUp, GlowingCard, AnimatedProgress, DonutChart, PulsingBadge, GradientButton, StaggerContainer, StaggerItem } from './animations/ReportAnimations';
import { ProcedureTimeline } from './ProcedureTimeline';

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
    // 상태별 설정
    const statusConfig = {
        POSSIBLE: {
            badge: '개인회생 가능',
            icon: <Check className="w-5 h-5" />,
            color: 'green' as const,
            bgGradient: 'from-green-500/5 via-emerald-500/5 to-teal-500/5',
            accentColor: '#22c55e',
        },
        DIFFICULT: {
            badge: '검토 필요',
            icon: <AlertTriangle className="w-5 h-5" />,
            color: 'yellow' as const,
            bgGradient: 'from-yellow-500/5 via-amber-500/5 to-orange-500/5',
            accentColor: '#eab308',
        },
        IMPOSSIBLE: {
            badge: '신청 어려움',
            icon: <X className="w-5 h-5" />,
            color: 'red' as const,
            bgGradient: 'from-red-500/5 via-rose-500/5 to-pink-500/5',
            accentColor: '#ef4444',
        }
    };

    const config = statusConfig[result.status];

    // 통화 포맷터 (카운트업용)
    const currencyFormatter = (value: number) => {
        if (value >= 100000000) {
            return `${(value / 100000000).toFixed(1)}억`;
        } else if (value >= 10000) {
            return `${Math.floor(value / 10000).toLocaleString()}만`;
        }
        return value.toLocaleString();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                {/* Background with animated gradient */}
                <motion.div
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />

                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-64 h-64 rounded-full"
                            style={{
                                background: `radial-gradient(circle, ${config.accentColor}15, transparent 70%)`,
                                left: `${20 + i * 15}%`,
                                top: `${10 + i * 20}%`,
                            }}
                            animate={{
                                x: [0, 30, 0],
                                y: [0, -20, 0],
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                                duration: 6 + i,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: i * 0.5,
                            }}
                        />
                    ))}
                </div>

                {/* Main Report Container */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={`
                        relative w-full max-w-lg my-4
                        bg-gradient-to-b ${config.bgGradient}
                        backdrop-blur-2xl
                        rounded-3xl shadow-2xl
                        border border-white/10
                        max-h-[92vh] overflow-y-auto overflow-x-hidden
                    `}
                    style={{
                        boxShadow: `0 0 100px ${config.accentColor}20, 0 25px 50px -12px rgba(0,0,0,0.5)`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ========== HERO SECTION ========== */}
                    <div className="relative px-6 pt-8 pb-10 overflow-hidden">
                        {/* Decorative grid */}
                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                backgroundSize: '40px 40px',
                            }}
                        />

                        {/* Close button */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
                        >
                            <X className="w-5 h-5" />
                        </motion.button>

                        {/* Logo / Brand */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center justify-center gap-2 mb-6"
                        >
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-slate-400 tracking-wider uppercase">AI Analysis Report</span>
                        </motion.div>

                        {/* Status Badge */}
                        <div className="flex justify-center mb-6">
                            <PulsingBadge color={config.color}>
                                {config.icon}
                                {config.badge}
                            </PulsingBadge>
                        </div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center"
                        >
                            <h2 className="text-2xl font-bold text-white mb-2">
                                AI 변제금 진단 리포트
                            </h2>
                            <p className="text-sm text-slate-400">
                                {userInput.name}님의 맞춤 분석 결과
                            </p>
                        </motion.div>
                    </div>

                    {/* ========== MAIN CONTENT ========== */}
                    <div className="px-5 pb-6 space-y-5">

                        {/* ===== KEY METRICS SECTION ===== */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Monthly Payment Card */}
                            <GlowingCard glowColor="cyan" delay={0.4} className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                                        <Calculator className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <span className="text-xs text-cyan-300">월 예상 변제금</span>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    <CountUp
                                        end={result.monthlyPayment}
                                        delay={0.6}
                                        formatter={currencyFormatter}
                                        suffix="원"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">{result.repaymentMonths}개월간 납부</p>
                            </GlowingCard>

                            {/* Debt Reduction Card */}
                            <GlowingCard glowColor="green" delay={0.5} className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-green-500/20 rounded-lg">
                                        <TrendingDown className="w-4 h-4 text-green-400" />
                                    </div>
                                    <span className="text-xs text-green-300">예상 탕감액</span>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    <CountUp
                                        end={result.totalDebtReduction}
                                        delay={0.7}
                                        formatter={currencyFormatter}
                                        suffix="원"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">탕감률 {result.debtReductionRate}%</p>
                            </GlowingCard>
                        </div>

                        {/* ===== DONUT CHART - DEBT VISUALIZATION ===== */}
                        <GlowingCard glowColor="purple" delay={0.6} className="p-5">
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-purple-400" />
                                채무 감면 현황
                            </h4>
                            <div className="flex items-center justify-around">
                                <DonutChart
                                    percentage={result.debtReductionRate}
                                    size={100}
                                    strokeWidth={8}
                                    colorFrom="#8b5cf6"
                                    colorTo="#06b6d4"
                                    delay={0.8}
                                    label="탕감률"
                                />
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">현재 총 채무</p>
                                        <p className="text-lg font-semibold text-red-400 line-through opacity-70">
                                            {formatCurrency(userInput.totalDebt)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">실제 변제 금액</p>
                                        <p className="text-lg font-semibold text-green-400">
                                            {formatCurrency(result.totalRepayment)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </GlowingCard>

                        {/* ===== PROGRESS BARS ===== */}
                        <GlowingCard glowColor="blue" delay={0.7} className="p-4">
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-blue-400" />
                                채무 비교
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-400">현재 총 채무</span>
                                        <span className="text-slate-300">{formatCurrency(userInput.totalDebt)}</span>
                                    </div>
                                    <AnimatedProgress
                                        value={100}
                                        colorFrom="#ef4444"
                                        colorTo="#f97316"
                                        delay={0.9}
                                        height={10}
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-400">실제 갚을 금액</span>
                                        <span className="text-green-400 font-medium">{formatCurrency(result.totalRepayment)}</span>
                                    </div>
                                    <AnimatedProgress
                                        value={100 - result.debtReductionRate}
                                        colorFrom="#22c55e"
                                        colorTo="#06b6d4"
                                        delay={1.1}
                                        height={10}
                                    />
                                </div>
                            </div>
                        </GlowingCard>

                        {/* ===== STATISTICS COMPARISON SECTION ===== */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                        >
                            <GlowingCard glowColor="cyan" className="p-5">
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                                    2025년 개인회생 신청자 통계 비교
                                    <span className="text-[10px] text-slate-500 font-normal ml-auto">서울회생법원 기준</span>
                                </h4>

                                {/* Percentile Comparison Cards */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <StatComparisonCard
                                        title="월 소득"
                                        userValue={userInput.monthlyIncome}
                                        averageValue={AVERAGE_VALUES.monthlyIncome}
                                        percentile={calculateIncomePercentile(userInput.monthlyIncome)}
                                        icon={<DollarSign className="w-4 h-4" />}
                                    />
                                    <StatComparisonCard
                                        title="총 채무"
                                        userValue={userInput.totalDebt}
                                        averageValue={AVERAGE_VALUES.totalDebt}
                                        percentile={calculateDebtPercentile(userInput.totalDebt)}
                                        icon={<CreditCard className="w-4 h-4" />}
                                    />
                                </div>

                                {/* Reduction Rate Comparison */}
                                <div className="mb-4">
                                    <StatComparisonCard
                                        title="예상 탕감률"
                                        userValue={`${result.debtReductionRate}%`}
                                        averageValue={`${AVERAGE_VALUES.debtReductionRate}%`}
                                        percentile={calculateReductionRatePercentile(result.debtReductionRate)}
                                        icon={<Percent className="w-4 h-4" />}
                                    />
                                </div>

                                {/* Distribution Chart */}
                                <DistributionBar
                                    title="채무 총액"
                                    userValue={userInput.totalDebt}
                                    distribution={REHAB_STATISTICS_2025.debtAmountDistribution}
                                    highlightRange={
                                        userInput.totalDebt <= 50000000 ? '5천만원 이하' :
                                            userInput.totalDebt <= 100000000 ? '5천만원 초과 1억 이하' :
                                                userInput.totalDebt <= 200000000 ? '1억 초과 2억 이하' :
                                                    userInput.totalDebt <= 300000000 ? '2억 초과 3억 이하' :
                                                        userInput.totalDebt <= 400000000 ? '3억 초과 4억 이하' : '4억 초과'
                                    }
                                />

                                {/* Statistical Insights */}
                                {(() => {
                                    const insights = generateStatisticalInsights({
                                        monthlyIncome: userInput.monthlyIncome,
                                        totalDebt: userInput.totalDebt,
                                        debtReductionRate: result.debtReductionRate,
                                        familySize: userInput.familySize,
                                    });

                                    return insights.length > 0 ? (
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">AI 통계 인사이트</p>
                                            <div className="space-y-1.5">
                                                {insights.map((insight, idx) => (
                                                    <motion.p
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 1.2 + idx * 0.1 }}
                                                        className="text-xs text-cyan-300/80 flex items-start gap-1.5"
                                                    >
                                                        <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                        {insight}
                                                    </motion.p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null;
                                })()}
                            </GlowingCard>
                        </motion.div>

                        {/* ===== PROCEDURE TIMELINE SECTION ===== */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                        >
                            <GlowingCard glowColor="purple" className="p-5">
                                <ProcedureTimeline processingMonths={result.processingMonths} />
                            </GlowingCard>
                        </motion.div>

                        {/* ===== DETAILED INFO SECTIONS ===== */}
                        <StaggerContainer staggerDelay={0.1} className="space-y-3">

                            {/* Court & Jurisdiction */}
                            <StaggerItem>
                                <GlowingCard glowColor="blue" hoverScale={1.01} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-500/20 rounded-xl">
                                            <Building2 className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-white mb-2">관할 법원</h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-slate-500">법원</span>
                                                    <p className="text-slate-200 font-medium truncate">{result.courtName}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">지역 그룹</span>
                                                    <p className="text-slate-200 font-medium">{result.regionGroup}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-slate-500">개시결정 소요기간</span>
                                                    <p className="text-cyan-400 font-bold">약 {result.processingMonths}개월</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </GlowingCard>
                            </StaggerItem>

                            {/* Assets */}
                            <StaggerItem>
                                <GlowingCard glowColor="cyan" hoverScale={1.01} className="p-4">
                                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-cyan-400" />
                                        자산 구성
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">본인 재산</span>
                                            <span className="text-slate-200">{formatCurrency(userInput.myAssets)}</span>
                                        </div>
                                        {userInput.isMarried && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">배우자 재산 (50%)</span>
                                                <span className="text-slate-200">{formatCurrency(userInput.spouseAssets)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-white/5">
                                            <span className="text-slate-400">보증금/전세금</span>
                                            <span className="text-slate-200">{formatCurrency(userInput.deposit)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">면제 보증금</span>
                                            <span className="text-green-400">-{formatCurrency(result.exemptDeposit)}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-white/10 font-bold">
                                            <span className="text-white">청산가치</span>
                                            <span className="text-cyan-400">{formatCurrency(result.liquidationValue)}</span>
                                        </div>
                                    </div>
                                </GlowingCard>
                            </StaggerItem>

                            {/* Family & Dependents */}
                            <StaggerItem>
                                <GlowingCard glowColor="purple" hoverScale={1.01} className="p-4">
                                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-purple-400" />
                                        부양가족 구성
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">적용 가구원 수</span>
                                            <span className="text-cyan-400 font-bold text-base">{userInput.familySize}인</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">혼인 상태</span>
                                            <span className="text-slate-200">{userInput.isMarried ? '기혼' : '미혼/이혼/사별'}</span>
                                        </div>
                                        {userInput.minorChildren !== undefined && userInput.minorChildren > 0 && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">미성년 자녀</span>
                                                    <span className="text-slate-200">{userInput.minorChildren}명</span>
                                                </div>
                                                {userInput.recognizedChildDependents !== undefined && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">인정 부양가족</span>
                                                        <span className="text-cyan-400 font-medium">
                                                            {userInput.recognizedChildDependents === Math.floor(userInput.recognizedChildDependents)
                                                                ? `${userInput.recognizedChildDependents}명`
                                                                : `${userInput.recognizedChildDependents}명 (중간값)`}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {userInput.elderlyParentDependents !== undefined && userInput.elderlyParentDependents > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">고령 부모님</span>
                                                <span className="text-cyan-400 font-medium">{userInput.elderlyParentDependents}분</span>
                                            </div>
                                        )}
                                        {userInput.dependentReason && (
                                            <p className="text-cyan-300/70 mt-2 pt-2 border-t border-white/5 text-[11px]">
                                                💡 {userInput.dependentReason}
                                            </p>
                                        )}
                                        {userInput.isMarried && (
                                            <p className="text-yellow-300/60 text-[10px] mt-1">
                                                ※ 배우자가 양육/장애/질병 등으로 경제활동 불가 시 추가 인정 가능
                                            </p>
                                        )}
                                    </div>
                                </GlowingCard>
                            </StaggerItem>

                            {/* Living Cost */}
                            <StaggerItem>
                                <GlowingCard glowColor="green" hoverScale={1.01} className="p-4">
                                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <Home className="w-4 h-4 text-green-400" />
                                        생계비 내역
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">기본 생계비 ({userInput.familySize}인)</span>
                                            <span className="text-slate-200">{formatCurrency(result.baseLivingCost)}</span>
                                        </div>
                                        {result.additionalLivingCost > 0 && (
                                            <>
                                                <div className="text-[10px] text-slate-500 pt-1">추가 생계비:</div>
                                                {userInput.rentCost && userInput.rentCost > 0 && (
                                                    <div className="flex justify-between pl-2">
                                                        <span className="text-slate-500">• 월세</span>
                                                        <span className="text-slate-300">{formatCurrency(userInput.rentCost)}</span>
                                                    </div>
                                                )}
                                                {userInput.medicalCost && userInput.medicalCost > 0 && (
                                                    <div className="flex justify-between pl-2">
                                                        <span className="text-slate-500">• 의료비</span>
                                                        <span className="text-slate-300">{formatCurrency(userInput.medicalCost)}</span>
                                                    </div>
                                                )}
                                                {userInput.educationCost && userInput.educationCost > 0 && (
                                                    <div className="flex justify-between pl-2">
                                                        <span className="text-slate-500">• 교육비</span>
                                                        <span className="text-slate-300">{formatCurrency(userInput.educationCost)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-white/10 font-bold">
                                            <span className="text-white">총 인정 생계비</span>
                                            <span className="text-green-400">{formatCurrency(result.recognizedLivingCost)}</span>
                                        </div>
                                    </div>
                                </GlowingCard>
                            </StaggerItem>

                            {/* Available Income Calculation */}
                            <StaggerItem>
                                <GlowingCard glowColor="cyan" hoverScale={1.01} className="p-4">
                                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-cyan-400" />
                                        가용 소득 계산
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">월 소득</span>
                                            <span className="text-slate-200">{formatCurrency(userInput.monthlyIncome)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">총 인정 생계비</span>
                                            <span className="text-red-400">-{formatCurrency(result.recognizedLivingCost)}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-cyan-500/20 font-bold">
                                            <span className="text-white">가용 소득</span>
                                            <span className="text-cyan-400 text-base">{formatCurrency(result.availableIncome)}</span>
                                        </div>
                                    </div>
                                </GlowingCard>
                            </StaggerItem>

                            {/* Repayment Calculation Method */}
                            <StaggerItem>
                                <GlowingCard glowColor="purple" hoverScale={1.01} className="p-4">
                                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <Calculator className="w-4 h-4 text-purple-400" />
                                        변제금 산출 방식
                                    </h4>
                                    <div className="space-y-2 text-xs text-slate-300">
                                        <p>• <span className="text-purple-300 font-medium">청산가치 기준</span>: {formatCurrency(result.liquidationValue)} ÷ {result.repaymentMonths}개월 = <span className="text-white">{formatCurrency(Math.floor(result.liquidationValue / result.repaymentMonths))}/월</span></p>
                                        <p>• <span className="text-purple-300 font-medium">가용소득 기준</span>: <span className="text-white">{formatCurrency(result.availableIncome)}/월</span></p>
                                        <p className="pt-2 border-t border-purple-500/20 text-purple-200 font-medium">
                                            → 두 금액 중 <span className="text-purple-300">큰 금액</span> = 월 변제금
                                        </p>
                                    </div>
                                </GlowingCard>
                            </StaggerItem>
                        </StaggerContainer>

                        {/* ===== AI ADVICE SECTION ===== */}
                        {(result.aiAdvice.length > 0 || result.riskWarnings.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                            >
                                <GlowingCard glowColor="cyan" className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield className="w-4 h-4 text-cyan-400" />
                                        <h4 className="text-sm font-bold text-white">AI 분석 의견</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {result.aiAdvice.map((advice, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 1.3 + idx * 0.1 }}
                                                className="flex items-start gap-2"
                                            >
                                                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-slate-300">{advice}</p>
                                            </motion.div>
                                        ))}
                                        {result.riskWarnings.map((warning, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 1.5 + idx * 0.1 }}
                                                className="flex items-start gap-2"
                                            >
                                                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-yellow-200">{warning}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </GlowingCard>
                            </motion.div>
                        )}

                        {/* Status Reason & Disclaimer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.4 }}
                            className="text-center space-y-2 px-2"
                        >
                            <p className="text-xs text-slate-400">{result.statusReason}</p>
                            <p className="text-[10px] text-slate-600">
                                ※ 본 결과는 AI 추정치이며, 실제 법원 판단과 다를 수 있습니다.
                            </p>
                        </motion.div>
                    </div>

                    {/* ========== CTA FOOTER ========== */}
                    <div className="sticky bottom-0 p-5 bg-gradient-to-t from-slate-900/95 via-slate-900/90 to-transparent backdrop-blur-md border-t border-white/5">
                        <GradientButton onClick={onConsultation} delay={1.5}>
                            <Sparkles className="w-5 h-5" />
                            즉시 전문 상담 신청
                            <ArrowRight className="w-5 h-5" />
                        </GradientButton>

                        <div className="flex gap-2 mt-3">
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.6 }}
                                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 border border-white/5"
                            >
                                <Download className="w-4 h-4" />
                                저장
                            </motion.button>
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.7 }}
                                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 border border-white/5"
                            >
                                <Share2 className="w-4 h-4" />
                                공유
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RehabResultReport;
