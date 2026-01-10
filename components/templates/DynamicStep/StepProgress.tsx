import React from 'react';
import { motion } from 'framer-motion';

interface StepProgressProps {
    currentStep: number; // 0-indexed (excluding Hero)
    totalSteps: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ currentStep, totalSteps }) => {
    // Calculate percentage (1-based index for display)
    const progress = Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100));

    return (
        <div className="w-full fixed top-0 left-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-500">진행률</span>
                    <span className="text-xs font-bold text-brand-600">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            </div>
        </div>
    );
};

export default StepProgress;
