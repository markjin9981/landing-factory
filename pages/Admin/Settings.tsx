import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Mail, Lock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { sendAdminNotification } from '../../services/googleSheetService';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('admin_email') || '';
    const storedPass = localStorage.getItem('admin_password') || '';
    setEmail(storedEmail);
    setPassword(storedPass);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
        alert('비밀번호는 필수입니다.');
        return;
    }

    setStatus('saving');

    // Save to LocalStorage (Client-side persistence)
    localStorage.setItem('admin_email', email);
    localStorage.setItem('admin_password', password);

    // Send email notification if email provided
    if (email) {
        const success = await sendAdminNotification(
            email, 
            '[Landing Factory] 관리자 계정 정보 변경 알림', 
            `관리자 비밀번호가 변경되었습니다.\n\n변경된 비밀번호: ${password}\n\n본인이 변경한 것이 아니라면 즉시 확인하세요.`
        );
        if (success) {
            setMsg('저장 및 이메일 발송 완료');
        } else {
            setMsg('저장 완료 (이메일 발송 실패)');
        }
    } else {
        setMsg('저장 완료');
    }

    setStatus('success');
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
         <div className="flex items-center gap-4">
             <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-full">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
             </button>
             <h1 className="text-xl font-bold">마이페이지 (설정)</h1>
         </div>
      </header>

      <main className="max-w-2xl mx-auto p-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                관리자 계정 설정
            </h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-sm text-yellow-800">
                <strong className="block mb-1">주의사항</strong>
                이 시스템은 서버가 없는 구조이므로 계정 정보는 <strong>현재 브라우저(LocalStorage)</strong>에 저장됩니다. 
                브라우저 캐시를 삭제하면 설정이 초기화될 수 있습니다. 
                비밀번호 변경 시 입력한 이메일로 백업 메일이 발송됩니다.
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">관리자 이메일 (ID)</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="example@email.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">변경할 비밀번호</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            placeholder="새로운 비밀번호 입력"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <button 
                        type="submit" 
                        disabled={status === 'saving'}
                        className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center"
                    >
                        {status === 'saving' ? '처리중...' : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                설정 저장하기
                            </>
                        )}
                    </button>
                    {status === 'success' && (
                        <div className="mt-4 flex items-center justify-center text-green-600 text-sm font-bold animate-fade-in">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {msg}
                        </div>
                    )}
                </div>
            </form>
        </div>
      </main>
    </div>
  );
};

export default Settings;