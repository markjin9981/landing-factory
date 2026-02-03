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

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
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
    const reportRef = useRef<HTMLDivElement>(null);

    // 이미지 저장 기능
    const handleSaveReport = async () => {
        if (!reportRef.current) return;

        try {
            const canvas = await html2canvas(reportRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false
            });

            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.download = `변제금진단_${userInput.name}_${date}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('보고서 저장 실패:', error);
            alert('보고서 저장에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 공유 기능
    const handleShareReport = async () => {
        if (!reportRef.current) return;

        try {
            // Web Share API 지원 확인
            if (navigator.share && navigator.canShare) {
                const canvas = await html2canvas(reportRef.current, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    logging: false
                });

                canvas.toBlob(async (blob) => {
                    if (!blob) return;

                    const file = new File([blob], `변제금진단_${userInput.name}.png`, { type: 'image/png' });

                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: 'AI 변제금 진단 리포트',
                            text: `${userInput.name}님의 개인회생 변제금 진단 결과입니다.`,
                            files: [file]
                        });
                    } else {
                        // 파일 공유 불가시 링크로 대체
                        await navigator.share({
                            title: 'AI 변제금 진단 리포트',
                            text: `${userInput.name}님의 개인회생 변제금 진단 결과입니다.`,
                        });
                    }
                }, 'image/png');
            } else {
                // Web Share API 미지원시 이미지 저장으로 대체
                alert('이 브라우저에서는 직접 공유가 지원되지 않습니다.\n이미지를 저장한 후 공유해주세요.');
                handleSaveReport();
            }
        } catch (error) {
            console.error('공유 실패:', error);
            // 사용자가 공유 취소한 경우는 에러 표시하지 않음
            if ((error as Error).name !== 'AbortError') {
                alert('공유에 실패했습니다. 이미지를 저장 후 공유해주세요.');
            }
        }
    };

    // 상태별 설정
    const statusConfig = {
        POSSIBLE: {
            badge: '개인회생 가능',
            icon: <Check className="w-5 h-5" />,
            color: 'green' as const,
            bgGradient: 'from-emerald-50 to-white',
            accentColor: '#059669',
        },
        DIFFICULT: {
            badge: '검토 필요',
            icon: <AlertTriangle className="w-5 h-5" />,
            color: 'yellow' as const,
            bgGradient: 'from-amber-50 to-white',
            accentColor: '#d97706',
        },
        IMPOSSIBLE: {
            badge: '신청 어려움',
            icon: <X className="w-5 h-5" />,
            color: 'red' as const,
            bgGradient: 'from-red-50 to-white',
            accentColor: '#dc2626',
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
                {/* Background with light overlay */}
                <motion.div
                    className="absolute inset-0 bg-gray-100/95 backdrop-blur-sm"
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
                    ref={reportRef}
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={`
                        relative w-full max-w-lg my-4
                        bg-gradient-to-b ${config.bgGradient}
                        rounded-3xl shadow-2xl
                        border border-gray-200
                        max-h-[92vh] overflow-y-auto overflow-x-hidden
                    `}
                    style={{
                        boxShadow: `0 25px 50px -12px rgba(0,0,0,0.15)`,
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
                            className="absolute top-4 right-4 p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-300"
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
                            <Sparkles className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-gray-500 tracking-wider uppercase">AI Analysis Report</span>
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
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                AI 변제금 진단 리포트
                            </h2>
                            <p className="text-sm text-gray-500">
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
                                    <div className="p-1.5 bg-blue-100 rounded-lg">
                                        <Calculator className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-xs text-blue-600 font-medium">월 예상 변제금</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-800">
                                    <CountUp
                                        end={result.monthlyPayment}
                                        delay={0.6}
                                        formatter={currencyFormatter}
                                        suffix="원"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">{result.repaymentMonths}개월간 납부</p>
                            </GlowingCard>

                            {/* Debt Reduction Card */}
                            <GlowingCard glowColor="green" delay={0.5} className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                                        <TrendingDown className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span className="text-xs text-emerald-600 font-medium">예상 탕감액</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-800">
                                    <CountUp
                                        end={result.totalDebtReduction}
                                        delay={0.7}
                                        formatter={currencyFormatter}
                                        suffix="원"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">탕감률 {result.debtReductionRate}%</p>
                            </GlowingCard>
                        </div>

                        {/* ===== DONUT CHART - DEBT VISUALIZATION ===== */}
                        <GlowingCard glowColor="purple" delay={0.6} className="p-5">
                            <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-blue-600" />
                                채무 감면 현황
                            </h4>
                            <div className="flex items-center justify-around">
                                <DonutChart
                                    percentage={result.debtReductionRate}
                                    size={100}
                                    strokeWidth={8}
                                    colorFrom="#2563eb"
                                    colorTo="#059669"
                                    delay={0.8}
                                    label="탕감률"
                                />
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">현재 총 채무</p>
                                        <p className="text-lg font-semibold text-red-500 line-through opacity-70">
                                            {formatCurrency(userInput.totalDebt)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">실제 변제 금액</p>
                                        <p className="text-lg font-semibold text-emerald-600">
                                            {formatCurrency(result.totalRepayment)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </GlowingCard>

                        {/* ===== PROGRESS BARS ===== */}
                        <GlowingCard glowColor="blue" delay={0.7} className="p-4">
                            <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-blue-600" />
                                채무 비교
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-gray-500">현재 총 채무</span>
                                        <span className="text-gray-700">{formatCurrency(userInput.totalDebt)}</span>
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
                                        <span className="text-gray-500">실제 갚을 금액</span>
                                        <span className="text-emerald-600 font-medium">{formatCurrency(result.totalRepayment)}</span>
                                    </div>
                                    <AnimatedProgress
                                        value={100 - result.debtReductionRate}
                                        colorFrom="#059669"
                                        colorTo="#2563eb"
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
                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-blue-600" />
                                    2025년 개인회생 신청자 통계 비교
                                    <span className="text-[10px] text-gray-400 font-normal ml-auto">서울회생법원 기준</span>
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
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">AI 통계 인사이트</p>
                                            <div className="space-y-1.5">
                                                {insights.map((insight, idx) => (
                                                    <motion.p
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 1.2 + idx * 0.1 }}
                                                        className="text-xs text-blue-600 flex items-start gap-1.5"
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
                                        <div className="p-2 bg-blue-100 rounded-xl">
                                            <Building2 className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-800 mb-2">관할 법원</h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-gray-400">법원</span>
                                                    <p className="text-gray-700 font-medium truncate">{result.courtName}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">지역 그룹</span>
                                                    <p className="text-gray-700 font-medium">{result.regionGroup}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-gray-400">개시결정 소요기간</span>
                                                    <p className="text-blue-600 font-bold">약 {result.processingMonths}개월</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </GlowingCard>
                            </StaggerItem>

                            {/* Assets */}
                            <StaggerItem>
                                <GlowingCard glowColor="cyan" hoverScale={1.01} className="p-4">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-blue-600" />
                                        자산 구성
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">본인 재산</span>
                                            <span className="text-gray-700">{formatCurrency(userInput.myAssets)}</span>
                                        </div>
                                        {userInput.isMarried && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">배우자 재산 (50%)</span>
                                                <span className="text-gray-700">{formatCurrency(userInput.spouseAssets)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-gray-100">
                                            <span className="text-gray-400">보증금/전세금</span>
                                            <span className="text-gray-700">{formatCurrency(userInput.deposit)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">면제 보증금</span>
                                            <span className="text-emerald-600">-{formatCurrency(result.exemptDeposit)}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                                            <span className="text-gray-800">청산가치</span>
                                            <span className="text-blue-600">{formatCurrency(result.liquidationValue)}</span>
                                        </div>
                                    </div>
                                </GlowingCard>
                            </StaggerItem>

                            {/* Family & Dependents */}
                            <StaggerItem>
                                <GlowingCard glowColor="purple" hoverScale={1.01} className="p-4">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        부양가족 구성
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">적용 가구원 수</span>
                                            <span className="text-blue-600 font-bold text-base">{userInput.familySize}인</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">혼인 상태</span>
                                            <span className="text-gray-700">{userInput.isMarried ? '기혼' : '미혼/이혼/사별'}</span>
                                        </div>
                                        {userInput.minorChildren !== undefined && userInput.minorChildren > 0 && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">미성년 자녀</span>
                                                    <span className="text-gray-700">{userInput.minorChildren}명</span>
                                                </div>
                                                {userInput.recognizedChildDependents !== undefined && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">인정 부양가족</span>
                                                        <span className="text-blue-600 font-medium">
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
                                                <span className="text-gray-400">고령 부모님</span>
                                                <span className="text-blue-600 font-medium">{userInput.elderlyParentDependents}분</span>
                                            </div>
                                        )}
                                        {userInput.dependentReason && (
                                            <p className="text-blue-500 mt-2 pt-2 border-t border-gray-100 text-[11px]">
                                                💡 {userInput.dependentReason}
                                            </p>
                                        )}
                                        {userInput.isMarried && (
                                            <p className="text-amber-600 text-[10px] mt-1">
                                                ※ 배우자가 양육/장애/질병 등으로 경제활동 불가 시 추가 인정 가능
                                            </p>
                                        )}
                                    </div>
                                </GlowingCard>
                            </StaggerItem>

                            {/* Living Cost */}
                            <StaggerItem>
                                <GlowingCard glowColor="green" hoverScale={1.01} className="p-4">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <Home className="w-4 h-4 text-emerald-600" />
                                        생계비 내역
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">기본 생계비 ({userInput.familySize}인)</span>
                                            <span className="text-gray-700">{formatCurrency(result.baseLivingCost)}</span>
                                        </div>
                                        {result.additionalLivingCost > 0 && (
                                            <>
                                                <div className="text-[10px] text-gray-400 pt-1">추가 생계비:</div>
                                                {userInput.rentCost && userInput.rentCost > 0 && (
                                                    <div className="pl-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">• 월세</span>
                                                            <span className="text-gray-700">
                                                                {result.housingCostBreakdown
                                                                    ? formatCurrency(result.housingCostBreakdown.recognized)
                                                                    : formatCurrency(userInput.rentCost)}
                                                            </span>
                                                        </div>
                                                        {result.housingCostBreakdown && (
                                                            <p className="text-[9px] text-blue-500 mt-0.5 pl-2">
                                                                💡 {result.housingCostBreakdown.explanation}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {userInput.medicalCost && userInput.medicalCost > 0 && (
                                                    <div className="pl-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">• 의료비</span>
                                                            <span className="text-gray-700">
                                                                {result.medicalCostBreakdown
                                                                    ? formatCurrency(result.medicalCostBreakdown.recognized)
                                                                    : formatCurrency(userInput.medicalCost)}
                                                            </span>
                                                        </div>
                                                        {result.medicalCostBreakdown && (
                                                            <p className="text-[9px] text-blue-500 mt-0.5 pl-2">
                                                                💡 {result.medicalCostBreakdown.explanation}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {userInput.educationCost && userInput.educationCost > 0 && (
                                                    <div className="pl-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">• 교육비</span>
                                                            <span className="text-gray-700">
                                                                {result.educationCostBreakdown
                                                                    ? formatCurrency(result.educationCostBreakdown.recognized)
                                                                    : formatCurrency(userInput.educationCost)}
                                                            </span>
                                                        </div>
                                                        {result.educationCostBreakdown && (
                                                            <p className="text-[9px] text-blue-500 mt-0.5 pl-2">
                                                                💡 {result.educationCostBreakdown.explanation}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                                            <span className="text-gray-800">총 인정 생계비</span>
                                            <span className="text-emerald-600">{formatCurrency(result.recognizedLivingCost)}</span>
                                        </div>
                                    </div>
                                </GlowingCard>
                            </StaggerItem>

                            {/* Available Income Calculation */}
                            <StaggerItem>
                                <GlowingCard glowColor="cyan" hoverScale={1.01} className="p-4">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-blue-600" />
                                        가용 소득 계산
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">월 소득</span>
                                            <span className="text-gray-700">{formatCurrency(userInput.monthlyIncome)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">총 인정 생계비</span>
                                            <span className="text-red-500">-{formatCurrency(result.recognizedLivingCost)}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-blue-200 font-bold">
                                            <span className="text-gray-800">가용 소득</span>
                                            <span className="text-blue-600 text-base">{formatCurrency(result.availableIncome)}</span>
                                        </div>
                                    </div>
                                </GlowingCard>
                            </StaggerItem>

                            {/* Repayment Calculation Method */}
                            <StaggerItem>
                                <GlowingCard glowColor="purple" hoverScale={1.01} className="p-4">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <Calculator className="w-4 h-4 text-blue-600" />
                                        변제금 산출 방식
                                    </h4>
                                    <div className="space-y-2 text-xs text-gray-600">
                                        <p>• <span className="text-blue-600 font-medium">청산가치 기준</span>: {formatCurrency(result.liquidationValue)} ÷ {result.repaymentMonths}개월 = <span className="text-gray-800">{formatCurrency(Math.floor(result.liquidationValue / result.repaymentMonths))}/월</span></p>
                                        <p>• <span className="text-blue-600 font-medium">가용소득 기준</span>: <span className="text-gray-800">{formatCurrency(result.availableIncome)}/월</span></p>
                                        <p className="pt-2 border-t border-blue-100 text-blue-700 font-medium">
                                            → 두 금액 중 <span className="text-blue-600">큰 금액</span> = 월 변제금
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
                                        <Shield className="w-4 h-4 text-blue-600" />
                                        <h4 className="text-sm font-bold text-gray-800">AI 분석 의견</h4>
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
                                                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-gray-600">{advice}</p>
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
                                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-amber-700">{warning}</p>
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
                            <p className="text-xs text-gray-500">{result.statusReason}</p>
                            <p className="text-[10px] text-gray-400">
                                ※ 본 결과는 AI 추정치이며, 실제 법원 판단과 다를 수 있습니다.
                            </p>
                        </motion.div>
                    </div>

                    {/* ========== CTA FOOTER ========== */}
                    <div className="sticky bottom-0 p-5 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-md border-t border-gray-100">
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
                                onClick={handleSaveReport}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 border border-gray-200"
                            >
                                <Download className="w-4 h-4" />
                                저장
                            </motion.button>
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.7 }}
                                onClick={handleShareReport}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 border border-gray-200"
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
