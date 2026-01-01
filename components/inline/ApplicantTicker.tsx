
import React, { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';

interface ApplicantTickerProps {
    messageTemplate?: string; // e.g. "{name}님 상담신청 완료"
}

// Fake Data Generator
const generateFakeApplicant = () => {
    const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
    const firstNames = ['민수', '지훈', '서연', '도현', '예진', '준호', '지은', '현우', '수진', '민지'];

    // Random Name with Masking
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const maskedName = `${lastName}*${firstName.slice(1)}`;

    // Random Phone with Masking
    const middlePart = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const lastPart = Math.floor(Math.random() * 9000) + 1000;
    const maskedPhone = `010-****-${lastPart}`;

    return { name: maskedName, phone: maskedPhone };
};

const ApplicantTicker: React.FC<ApplicantTickerProps> = ({ messageTemplate = "{name} ({phone}) 신청완료!" }) => {
    const [applicant, setApplicant] = useState(generateFakeApplicant());
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        // Change applicant every 3~6 seconds randomly
        const intervalTime = Math.random() * 3000 + 3000;

        const timer = setInterval(() => {
            setApplicant(generateFakeApplicant());
            setAnimationKey(prev => prev + 1);
        }, intervalTime);

        return () => clearInterval(timer);
    }, [animationKey]);

    const displayMessage = messageTemplate
        .replace('{name}', applicant.name)
        .replace('{phone}', applicant.phone);

    return (
        <div className="bg-black/80 text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg backdrop-blur mx-auto w-fit animate-slide-up-fade" key={animationKey}>
            <div className="bg-green-500 p-1 rounded-full animate-pulse">
                <UserCheck className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs md:text-sm font-medium">
                {displayMessage} <span className="text-gray-400 text-[10px] ml-1">방금 전</span>
            </span>
        </div>
    );
};

export default ApplicantTicker;
