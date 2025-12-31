import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Lock } from 'lucide-react';
import { authService } from '../../services/authService';

const Login: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (authService.isAuthenticated()) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (response.credential) {
      // Pass the credential to service (which calls verifyGoogleToken)
      try {
        // We need to modify authService.loginWithGoogle to return the message or handle it.
        // But authService.loginWithGoogle returns boolean.
        // Let's modify it to be smarter or just rely on console?
        // Wait, I can't easily change authService return type without breaking interface usages?
        // Actually I can, strict check.
        // For now, let's peek at the verification directly? No that duplicates logic.
        // Let's quick-fix verifyGoogleToken to LOG to the UI?

        // Better: Update authService to throw or return object?
        // Let's verify directly here for debugging, OR simpler:
        // Update authService to store the last error message?

        // Actually, let's just use the service but if it fails, we want to know why.
        // I will temporarily update `authService.ts` to return {success, message} or similar?
        // Or I can just call verifyGoogleToken directly here to see the error?
        // No, `loginWithGoogle` does the session storage stuff.

        // Revised Plan: Update authService.loginWithGoogle to return { success: boolean, message?: string }
        const result = await authService.loginWithGoogle(response.credential);
        if (result.success) {
          navigate('/admin');
        } else {
          setErrorMsg(result.message || '로그인 실패: 알 수 없는 오류');
        }
      } catch (e) {
        setErrorMsg('로그인 처리 중 예외 발생');
      }
    } else {
      setErrorMsg('Google 인증 정보를 가져올 수 없습니다.');
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('로그인 중 오류가 발생했습니다.');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full border border-gray-200">
        <div className="flex justify-center mb-6">
          <div className="bg-brand-100 p-3 rounded-full"> {/* Changed generic blue to brand if possible, or just blue */}
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">관리자 로그인</h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          Google 계정으로 안전하게 로그인하세요.
        </p>

        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
          />
        </div>

        {errorMsg && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
            {errorMsg}
          </div>
        )}

        <p className="mt-8 text-xs text-center text-gray-400">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default Login;