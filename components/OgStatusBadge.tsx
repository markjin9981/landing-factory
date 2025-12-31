
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';

interface Props {
    id: string;
    expectedTitle: string;
}

/**
 * Checks if the deployed page has the correct OG Tags.
 */
const OgStatusBadge: React.FC<Props> = ({ id, expectedTitle }) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');

    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            try {
                // Fetch the live page (cache-busted)
                const response = await fetch(`/${id}/index.html?t=${Date.now()}`, { method: 'GET' });

                if (response.status === 404) {
                    if (isMounted) setStatus('pending'); // Likely 404.html served or not found
                    return;
                }

                const text = await response.text();

                // Check for generic title
                const isGeneric = text.includes('<title>Landing Page Factory</title>');
                // Check for specific title
                const hasSpecificTitle = text.includes(`<meta property="og:title" content="${expectedTitle}"`);

                if (hasSpecificTitle) {
                    if (isMounted) setStatus('success');
                } else if (isGeneric) {
                    if (isMounted) setStatus('pending');
                } else {
                    // Maybe title mismatch or other issue
                    if (isMounted) setStatus('pending');
                }

            } catch (e) {
                if (isMounted) setStatus('error');
            }
        };

        checkStatus();

        return () => { isMounted = false; };
    }, [id, expectedTitle]);

    if (status === 'loading') return <div className="p-2"><RefreshCw className="w-4 h-4 text-gray-400 animate-spin" /></div>;

    if (status === 'success') {
        return (
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs border border-green-200" title="SNS 공유 미리보기가 준비되었습니다.">
                <CheckCircle2 className="w-3 h-3" />
                <span>공유 준비완료</span>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200" title="서버가 변경사항을 반영 중입니다. (약 5분 소요)">
                <Clock className="w-3 h-3" />
                <span>배포 대기중</span>
            </div>
        );
    }

    return null; // Error state, hide or show silent failure
};

export default OgStatusBadge;
