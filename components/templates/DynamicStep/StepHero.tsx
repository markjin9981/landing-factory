import React from 'react';
import { motion } from 'framer-motion';
import { HeroSection } from '../../../types';
import { ArrowRight } from 'lucide-react';

interface StepHeroProps {
    heroConfig: HeroSection;
    onStart: () => void;
    primaryColor: string;
}

const StepHero: React.FC<StepHeroProps> = ({ heroConfig, onStart, primaryColor }) => {
    // Background floating elements animation
    const floatingAnimation = {
        y: [0, -20, 0],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col justify-center items-center px-6 text-center">

            {/* Animated Background Elements */}
            <motion.div
                className="absolute top-1/4 left-10 w-32 h-32 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"
                animate={floatingAnimation}
            />
            <motion.div
                className="absolute bottom-1/4 right-10 w-40 h-40 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"
                animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 1 } }}
            />

            {/* Main Content */}
            <div className="relative z-10 max-w-lg w-full">
                {/* SubHeadline with Badge Style */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-block mb-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
                >
                    <span className="text-sm font-semibold tracking-wide text-blue-300">
                        {heroConfig.subHeadline || "무료 자가진단"}
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                    className="text-4xl md:text-5xl font-bold leading-tight mb-8"
                    style={{
                        textShadow: '0 0 40px rgba(59, 130, 246, 0.5)',
                        whiteSpace: 'pre-line' // Allow newlines in config
                    }}
                >
                    {heroConfig.headline}
                </motion.h1>

                {/* CTA Button */}
                <motion.button
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStart}
                    className="group relative w-full max-w-xs mx-auto py-4 px-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-xl shadow-blue-500/30 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="relative flex items-center justify-center space-x-2">
                        <span className="text-xl font-bold">{heroConfig.ctaText || "진단 시작하기"}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.button>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="mt-6 text-gray-400 text-sm"
                >
                    3분이면 충분합니다 • 100% 무료
                </motion.p>
            </div>
        </div>
    );
};

export default StepHero;
