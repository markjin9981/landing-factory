import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Smartphone,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Zap,
  MousePointerClick,
  FileSpreadsheet,
  Menu,
  X,
  LogIn,
  Check
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedIndustry, setSelectedIndustry] = useState<number>(0);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: '', phone: '' });

  const handleGoLogin = () => {
    navigate('/admin/login');
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.name || !demoForm.phone) return;
    setDemoSubmitted(true);
    setTimeout(() => {
      setDemoSubmitted(false);
      setDemoForm({ name: '', phone: '' });
    }, 4000);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 6개 업종별 사례 데이터
  const industries = [
    {
      category: '스마트폰 / IT',
      title: '휴대폰 당일 수리예약',
      desc: '아이폰/갤럭시 기종별 즉시 견적 확인 및 방문 시간 예약 폼',
      tag: '당일 방문율 87%',
      bgGradient: 'from-blue-500 to-indigo-600',
      fields: ['기종 선택', '고장 증상', '예약 희망 시간']
    },
    {
      category: '뷰티 / 헤어',
      title: '탈모 & 헤어 맞춤 상담',
      desc: '1:1 두피 정밀 진단 신청 및 첫 방문 30% 할인 프로모션',
      tag: 'DB 전환율 14.2%',
      bgGradient: 'from-emerald-500 to-teal-700',
      fields: ['연령대', '탈모 고민 부위', '상담 희망 시간']
    },
    {
      category: '병의원 / 한방',
      title: '한방 다이어트 1:1 상담',
      desc: '개인별 체질 분석 문진표 작성 및 감량 목표 맞춤 처방 상담',
      tag: '신규 예약 420건/월',
      bgGradient: 'from-amber-500 to-orange-600',
      fields: ['목표 감량 체중', '다이어트 경험 유무', '연락처']
    },
    {
      category: '숙박 / 레저',
      title: '감성 펜션 & 풀빌라 예약',
      desc: '실시간 객실 현황 확인 및 얼리버드 바비큐 패키지 예약 신청',
      tag: '주말 예약 완판',
      bgGradient: 'from-cyan-500 to-blue-600',
      fields: ['숙박 인원', '체크인 날짜', '바베큐 추가 여부']
    },
    {
      category: '전문직 / 법률·세무',
      title: '세무·법률 전문가 상담',
      desc: '비밀 보장 1:1 심층 상담 접수 및 사전 자료 등록 폼',
      tag: '고관여 DB 최적화',
      bgGradient: 'from-slate-700 to-slate-900',
      fields: ['상담 분야 선택', '사건/세무 개요', '상담 방식']
    },
    {
      category: '교육 / 클래스',
      title: '원데이 클래스 사전예약',
      desc: '선착순 정원 마감 알림 등록 및 얼리버드 수강료 할인권 발송',
      tag: '오픈 1시간 마감',
      bgGradient: 'from-purple-500 to-indigo-700',
      fields: ['희망 수강 요일', '수강생 인원', '사전문진']
    }
  ];

  // FAQ 데이터
  const faqs = [
    {
      q: 'matelaw는 어떤 서비스인가요?',
      a: 'matelaw(메이트로)는 코딩이나 디자인 툴 없이 고화질 이미지와 입력폼만으로 단 1분 만에 고전환 광고 랜딩페이지를 제작하는 웹 솔루션입니다. 광고 집행용 랜딩페이지부터 온라인 신청서, 이벤트 페이지까지 고객 DB 접수를 완벽하게 지원합니다.'
    },
    {
      q: '광고 랜딩페이지(Meta, Google, 당근, 네이버)로 바로 쓸 수 있나요?',
      a: '네, 완벽하게 지원합니다. Meta(페이스북/인스타그램), Google Ads, TikTok, 당근마켓, 네이버 등 주요 광고 매체의 픽셀 스크립트와 전환 이벤트를 클릭 한 번으로 손쉽게 연동할 수 있습니다.'
    },
    {
      q: '온라인 신청서 및 설문 폼도 만들 수 있나요?',
      a: '이름, 연락처, 드롭다운 선택, 체크박스, 주소 등 비즈니스에 필요한 모든 폼 요소를 자유롭게 구성할 수 있습니다. 수집된 신청서는 안전하게 암호화되어 저장됩니다.'
    },
    {
      q: '수집된 고객 DB와 성과 데이터는 어디서 확인하나요?',
      a: 'matelaw 관리자 대시보드에서 실시간으로 유입 통계, 전환율, 이탈률을 그래프로 조회할 수 있으며, 신규 DB 접수 시 카카오 알림톡 전송 및 구글 스프레드시트 자동 동기화를 지원합니다.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                M
              </div>
              <span className="text-2xl font-black tracking-tight text-gray-900">
                matelaw
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 text-[15px] font-medium text-gray-600">
              <button
                onClick={handleGoLogin}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                랜딩관리
              </button>
              <button
                onClick={handleGoLogin}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                디비내역
              </button>
              <button
                onClick={() => scrollToSection('sample-section')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                샘플보기
              </button>
              <button
                onClick={() => scrollToSection('features-section')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                기능안내
              </button>
              <button
                onClick={() => scrollToSection('analytics-section')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                성과분석
              </button>
              <button
                onClick={() => scrollToSection('faq-section')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                자주묻는질문
              </button>
            </nav>
          </div>

          {/* Desktop Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={handleGoLogin}
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              로그인
            </button>
            <button
              onClick={handleGoLogin}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm shadow-blue-600/30 hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              무료로 시작하기
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={handleGoLogin}
              className="px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-md"
            >
              로그인
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="메뉴 열기"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 pt-3 pb-6 space-y-3 shadow-lg">
            <button
              onClick={handleGoLogin}
              className="block w-full text-left py-2 font-medium text-gray-700 hover:text-blue-600"
            >
              랜딩관리
            </button>
            <button
              onClick={handleGoLogin}
              className="block w-full text-left py-2 font-medium text-gray-700 hover:text-blue-600"
            >
              디비내역
            </button>
            <button
              onClick={() => scrollToSection('sample-section')}
              className="block w-full text-left py-2 font-medium text-gray-700 hover:text-blue-600"
            >
              샘플보기
            </button>
            <button
              onClick={() => scrollToSection('features-section')}
              className="block w-full text-left py-2 font-medium text-gray-700 hover:text-blue-600"
            >
              기능안내
            </button>
            <button
              onClick={() => scrollToSection('analytics-section')}
              className="block w-full text-left py-2 font-medium text-gray-700 hover:text-blue-600"
            >
              성과분석
            </button>
            <button
              onClick={() => scrollToSection('faq-section')}
              className="block w-full text-left py-2 font-medium text-gray-700 hover:text-blue-600"
            >
              자주묻는질문
            </button>
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <button
                onClick={handleGoLogin}
                className="w-full py-2.5 text-center font-bold text-white bg-blue-600 rounded-lg"
              >
                무료로 시작하기
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-blue-50/60 via-white to-white">
        {/* Decorative Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/20 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Headline & Action */}
            <div className="lg:col-span-7 text-left space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs sm:text-sm font-bold border border-blue-200/60 shadow-sm">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>단 60초면 가능한 제작</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.15]">
                1분 완성! <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
                  고전환 랜딩 페이지
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                랜딩 제작부터 성과 분석과 고객 모집까지,{' '}
                <strong className="text-gray-900 font-semibold">matelaw</strong>에서 한 번에 완성하세요.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={handleGoLogin}
                  className="px-7 py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2 group"
                >
                  무료로 시작하기
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => scrollToSection('sample-section')}
                  className="px-7 py-4 text-base font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  샘플 보기
                </button>
              </div>

              {/* Micro Trust Copy */}
              <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                신용카드 등록 없이 무료로 시작하고 언제든 유료 플랜으로 변경 가능
              </p>
            </div>

            {/* Right Interactive Card Mockup */}
            <div className="lg:col-span-5 relative">
              {/* Backing decorative cards */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-20 transform -rotate-1" />

              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden transform hover:-translate-y-1 transition-all duration-300">
                {/* Window header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                    </div>
                    <span className="text-[11px] font-medium bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      실시간 상담 접수 폼
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">1:1 맞춤 상담 신청</h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    빠른 상담을 위해 성함과 연락처를 남겨주세요.
                  </p>
                </div>

                {/* Form Body Mockup */}
                <div className="p-6">
                  {demoSubmitted ? (
                    <div className="py-10 text-center space-y-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900">상담 신청이 완료되었습니다!</h4>
                      <p className="text-xs text-gray-500">
                        신청 즉시 관리자에게 알림톡이 전송되었습니다.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleDemoSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          성함 <span className="text-blue-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={demoForm.name}
                          onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                          placeholder="홍길동"
                          className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          연락처 <span className="text-blue-600">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={demoForm.phone}
                          onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                          placeholder="010-1234-5678"
                          className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1 text-xs text-gray-500">
                        <input
                          type="checkbox"
                          id="agree"
                          defaultChecked
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        <label htmlFor="agree">개인정보 수집 및 상담 이용에 동의합니다.</label>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-lg shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        신청하기
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      SSL 256bit 암호화 보안
                    </span>
                    <span>Powered by matelaw</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature 1: No-Code Visual Builder (오퍼/특징 1) */}
      <section id="features-section" className="py-20 md:py-28 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
                <span>오퍼/특징 1</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                이미지만 추가하면 바로 사용할 <br />
                <span className="text-blue-600">랜딩페이지가 완성됩니다.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                복잡한 디자인 작업이나 코딩 없이 이미지를 추가하고, 필요한 입력폼을 선택하면
                고객 모집용 고전환 페이지를 빠르게 만들 수 있습니다.
              </p>

              {/* Step Checklist */}
              <div className="space-y-3 pt-2">
                {[
                  { step: '1', title: '이미지 업로드', desc: '기획안이나 상세페이지 이미지를 그대로 등록' },
                  { step: '2', title: '입력폼 선택', desc: '이름, 연락처, 희망일정 등 수집할 항목 체크' },
                  { step: '3', title: '링크 공유 후 접수 시작', desc: '생성된 단축 URL로 광고 집행 및 실시간 DB 수집' }
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Mockup Graphic */}
            <div className="lg:col-span-6">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden">
                <div className="flex items-center justify-between pb-6 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs font-mono text-gray-400">matelaw-editor.tsx</span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-xl bg-gray-800/90 border border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-200">배너 & 상세 이미지</div>
                        <div className="text-[11px] text-gray-400">hero_campaign_v2.png (업로드 완료)</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800">
                      준비됨
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-800/90 border border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-200">입력 폼 컴포넌트</div>
                        <div className="text-[11px] text-gray-400">성함 · 연락처 · 1:1 상담 희망 분야</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-800">
                      3개 필드
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-800/90 border border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-200">생성된 배포 URL</div>
                        <div className="text-[11px] text-gray-400 font-mono">https://matelaw.net/c/quick-lead</div>
                      </div>
                    </div>
                    <button
                      onClick={handleGoLogin}
                      className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition-colors"
                    >
                      테스트
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700/60 flex items-center justify-between text-xs text-gray-400">
                  <span>⚡ 0.8초 내 초고속 로딩 보장</span>
                  <span className="text-emerald-400 font-semibold">모바일 최적화 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Feature 2: Analytics & Notification (성과/분석) */}
      <section id="analytics-section" className="py-20 md:py-28 bg-gray-50/70 border-t border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
                <span>성과/분석</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                전환 과정을 정밀 분석하는 <br />
                <span className="text-blue-600">matelaw 랜딩페이지</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                이미지 노출 분석부터 구글 · 메타 · 틱톡 · 당근 픽셀 설정, UTM 분석까지 지원합니다.
                클릭부터 신청 완료까지 전환 과정을 정밀 분석하여 더 높은 성과를 만들 수 있습니다.
              </p>

              {/* 4-Item List */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {[
                  {
                    title: '이미지 노출 & 스크롤 분석',
                    desc: '이탈 구간을 파악해 페이지 전환율 극대화'
                  },
                  {
                    title: '주요 광고 픽셀 완벽 연동',
                    desc: 'Meta, Google, TikTok, 네이버, 당근 지원'
                  },
                  {
                    title: '정밀 UTM 파라미터 추적',
                    desc: '광고 매체/캠페인별 유입 효율 실시간 대조'
                  },
                  {
                    title: '실시간 알림톡 & 구글 시트',
                    desc: '고객 접수 즉시 스마트폰 알림 및 CRM 전송'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal pl-6">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Graphic: Kakao Notification Mockup */}
            <div className="lg:col-span-6 relative">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 space-y-4 max-w-md mx-auto">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-500 fill-amber-500" />
                    접수 알림 및 고객 관리
                  </span>
                  <span className="text-[10px] text-gray-400">실시간 연동</span>
                </div>

                {/* Kakao Talk Balloon */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      [알림톡] 상담 접수 완료
                    </span>
                    <span className="text-[10px] text-gray-400">방금 전</span>
                  </div>
                  <div className="text-xs text-gray-800 space-y-1 font-mono bg-white/70 p-3 rounded-lg border border-amber-100">
                    <div><strong>고객명:</strong> 이*현 고객님</div>
                    <div><strong>연락처:</strong> 010-8***-1932</div>
                    <div><strong>신청항목:</strong> 1:1 맞춤 상담 신청</div>
                    <div><strong>유입매체:</strong> Meta Ads (Instagram)</div>
                  </div>
                  <button
                    onClick={handleGoLogin}
                    className="w-full py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    대시보드에서 열람
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom Synced Services */}
                <div className="flex items-center justify-around pt-2 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1 font-medium">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    구글 시트 자동 동기화
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                    광고 픽셀 즉시 전송
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Metrics & Social Proof (통계 지표) */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
            <span>빠른 개설과 높은 전환</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            matelaw로 <span className="text-blue-600">매일 새로운 랜딩페이지</span>가 개설됩니다.
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            제작, 유입, 접수 데이터를 통해 가장 빠르고 효율적으로 마케팅에 활용할 수 있습니다.
          </p>

          <div className="grid md:grid-cols-3 gap-6 pt-6">
            <div className="p-8 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                누적 생성 랜딩 수
              </div>
              <div className="text-4xl sm:text-5xl font-black text-blue-600 tracking-tight">
                136,000+
              </div>
              <p className="text-xs text-gray-400 mt-2">다양한 산업군의 맞춤형 페이지</p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                접수된 상담 DB 수
              </div>
              <div className="text-4xl sm:text-5xl font-black text-indigo-600 tracking-tight">
                975,000+
              </div>
              <p className="text-xs text-gray-400 mt-2">안전하게 암호화되어 관리되는 데이터</p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                일평균 방문자 수
              </div>
              <div className="text-4xl sm:text-5xl font-black text-blue-600 tracking-tight">
                83,000+
              </div>
              <p className="text-xs text-gray-400 mt-2">초고속 서버리스 인프라 처리</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Industry Showcase (업종별 사례) */}
      <section id="sample-section" className="py-20 md:py-28 bg-gray-50/80 border-t border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
              <span>다양한 업종에서 활용</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              다양한 업종에 <span className="text-blue-600">matelaw를 활용</span>합니다.
            </h2>
            <p className="text-base text-gray-500 max-w-xl mx-auto">
              어떤 업종이든 고객 접수와 전환에 최적화된 템플릿과 입력폼을 자유롭게 설정할 수 있습니다.
            </p>
          </div>

          {/* Industry Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer"
                onClick={handleGoLogin}
              >
                {/* Visual Header Banner */}
                <div className={`h-32 bg-gradient-to-r ${item.bgGradient} p-5 flex flex-col justify-between text-white relative`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-black/25 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold bg-white text-gray-900 px-2.5 py-1 rounded-full shadow-sm">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">{item.title}</h3>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      주요 입력 항목
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.fields.map((f, fIdx) => (
                        <span
                          key={fIdx}
                          className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                    <span>랜딩 템플릿 적용하기</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. All-in-One Workflow (체계적인 기능) */}
      <section className="py-20 md:py-28 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
            <span>체계적인 기능</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            고객 모집에 필요한 모든 기능을 <br />
            <span className="text-blue-600">하나의 흐름으로 확인</span>해보세요.
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            랜딩페이지 제작부터 광고 연결, 고객 접수, 알림, 성과 분석까지 matelaw의 올인원 워크플로우를 제공합니다.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 text-left">
            {[
              {
                step: '01',
                title: '노코드 랜딩 제작',
                desc: '이미지 업로드와 폼 설정만으로 60초 만에 모바일 최적화 랜딩 완성'
              },
              {
                step: '02',
                title: '광고 & 픽셀 연동',
                desc: '구글, 메타, 틱톡, 당근 픽셀 및 UTM 추적 코드를 간편하게 세팅'
              },
              {
                step: '03',
                title: '실시간 접수 & 알림',
                desc: '고객 신청 즉시 스마트폰 알림톡과 구글 스프레드시트로 동시 전송'
              },
              {
                step: '04',
                title: '전환 분석 & 최적화',
                desc: '체류 시간과 이탈 섹션을 분석하여 광고 비용 대비 최고 효율 달성'
              }
            ].map((card) => (
              <div
                key={card.step}
                className="p-6 rounded-2xl bg-gray-50 border border-gray-200/70 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
              >
                <div className="text-2xl font-black text-blue-600 mb-3">{card.step}</div>
                <h4 className="text-base font-bold text-gray-900 mb-1.5">{card.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq-section" className="py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">자주 묻는 질문</h2>
            <p className="text-sm text-gray-500">
              matelaw 서비스 이용에 관해 궁금한 점들을 빠르게 확인해 보세요.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-200/80 overflow-hidden shadow-sm transition-shadow"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-gray-900 text-sm sm:text-base hover:bg-gray-50/80 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. Bottom CTA Banner (Blue Banner) */}
      <section className="py-20 md:py-24 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            누구나 무료로 시작 가능합니다.
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            이미지만으로 고전환 랜딩페이지를 완성하고, 마케팅과 접수 데이터를 지금 바로 확인해보세요.
          </p>
          <div className="pt-4">
            <button
              onClick={handleGoLogin}
              className="px-9 py-4 text-base font-black text-blue-700 bg-white hover:bg-blue-50 active:bg-blue-100 rounded-xl shadow-xl shadow-black/10 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              무료로 시작하기
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-8 pb-8 border-b border-gray-200">
            {/* Left Brand & Company Info */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs">
                  M
                </div>
                <span className="text-lg font-black text-gray-900 tracking-tight">matelaw</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                (주)메이트로 | 고전환 광고 랜딩페이지 및 고객 데이터 수집 SaaS 솔루션
              </p>
              <div className="space-y-1 text-gray-500 text-[11px] leading-relaxed">
                <p>서울특별시 강남구 테헤란로 152 | 대표자: 메이트로</p>
                <p>사업자등록번호: 504-86-00831 | 통신판매업신고: 제 2026-서울강남-0317호</p>
                <p>대표번호: 1600-2079 | 고객센터 이메일: help@matelaw.net</p>
                <p>업무시간: 평일 10:00 ~ 19:00 (점심시간 12:30 ~ 13:30)</p>
              </div>
            </div>

            {/* Right Support & Navigation */}
            <div className="md:col-span-5 grid grid-cols-2 gap-6">
              <div>
                <h5 className="font-bold text-gray-900 text-xs mb-3">고객지원</h5>
                <ul className="space-y-2 text-gray-600">
                  <li>
                    <button onClick={handleGoLogin} className="hover:text-blue-600">
                      카카오톡 문의
                    </button>
                  </li>
                  <li>
                    <button onClick={handleGoLogin} className="hover:text-blue-600">
                      1:1 상담 문의
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('faq-section')} className="hover:text-blue-600">
                      서비스 이용가이드
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-gray-900 text-xs mb-3">서비스 정책</h5>
                <ul className="space-y-2 text-gray-600">
                  <li>
                    <button onClick={handleGoLogin} className="hover:text-blue-600">
                      이용약관
                    </button>
                  </li>
                  <li>
                    <button onClick={handleGoLogin} className="hover:text-blue-600">
                      개인정보처리방침
                    </button>
                  </li>
                  <li>
                    <button onClick={handleGoLogin} className="hover:text-blue-600 font-semibold text-blue-600">
                      관리자 로그인
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400">
            <div>Copyright ⓒ 2026 matelaw. All Rights Reserved.</div>
            <div>고객 DB 암호화 및 무중단 서버리스 아키텍처 적용</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
