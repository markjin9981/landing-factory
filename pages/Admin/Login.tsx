import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Retrieve stored credentials or use defaults
    const storedPassword = localStorage.getItem('admin_password') || 'admin';
    const storedEmail = localStorage.getItem('admin_email');

    // If an email is set in settings, validate it. Otherwise just check password.
    const isEmailValid = storedEmail ? email === storedEmail : true; 
    const isPasswordValid = password === storedPassword;

    if (isEmailValid && isPasswordValid) {
      sessionStorage.setItem('admin_auth', 'true');
      navigate('/admin');
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full border border-gray-200">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">관리자 로그인</h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          {localStorage.getItem('admin_email') 
            ? '설정된 이메일과 비밀번호로 로그인하세요.' 
            : '초기 비밀번호: admin (로그인 후 변경 권장)'}
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Show Email Input only if one is configured or to simulate email login */}
          <div>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                    type="email"
                    placeholder="이메일 (admin@example.com)"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(false); }}
                    className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
          </div>

          <div>
            <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError(false);
                    }}
                    className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>
          </div>
          
          {error && (
            <p className="text-red-500 text-sm text-center">
              계정 정보가 일치하지 않습니다.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;