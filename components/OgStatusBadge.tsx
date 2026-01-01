
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
    const [debugInfo, setDebugInfo] = useState<string>('');

    const checkStatus = async () => {
        setStatus('loading');
        try {
            const cacheBuster = Date.now();
            const targetUrl = `/${id}/index.html?t=${cacheBuster}`;
            console.log(`[Badge] Checking ${targetUrl}`);

            // Fetch the live page
            const response = await fetch(targetUrl, { method: 'GET' });

            if (response.status === 404) {
                console.warn(`[Badge] ${id}: 404 Not Found`);
                setStatus('pending');
                setDebugInfo('404 Not Found (File not generated yet)');
                return;
            }

            const text = await response.text();

            // Debug: Print first 500 chars
            console.log(`[Badge] ${id} Content Preview:`, text.substring(0, 200));

            // Check for generic title (Vite App Shell)
            const isGeneric = text.includes('<title>Landing Page Factory</title>');

            // Check for specific title
            // Note: We loosely match ensure we find it even if attributes are re-ordered
            const hasSpecificTitle = text.includes(expectedTitle);
            const hasOgTag = text.includes('property="og:title"');

            console.log(`[Badge] ${id} Analysis:`, {
                isGeneric,
                hasSpecificTitle,
                hasOgTag,
                expected: expectedTitle
            });

            if (hasSpecificTitle && hasOgTag) {
                setStatus('success');
            } else if (isGeneric) {
                setStatus('pending');
                setDebugInfo('Generic Title Found (Serving App Shell)');
            } else {
                // If we found SOMETHING but not the exact title, it might be an old deploy
                setStatus('pending');
                setDebugInfo('Content Mismatch (Old version cached?)');
            }

        } catch (e: any) {
            console.error(`[Badge] ${id} Error:`, e);
            setStatus('error');
            setDebugInfo(e.message);
        }
    };

    useEffect(() => {
        checkStatus();
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
            <div
                className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
                title={`클릭하여 다시 확인\n디버그 정보: ${debugInfo}\n(서버 반영에 최대 15분 소요)`}
                onClick={checkStatus}
            >
                <Clock className="w-3 h-3" />
                <span>배포 대기중</span>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded text-xs border border-red-200 cursor-pointer"
            title={`에러 발생: ${debugInfo}`}
            onClick={checkStatus}
        >
            <XCircle className="w-3 h-3" />
            <span>확인 불가</span>
        </div>
    );
};

export default OgStatusBadge;
