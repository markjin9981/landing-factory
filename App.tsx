import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import LANDING_CONFIGS_JSON from './data/landingConfigs.json';
import { LandingConfig } from './types';
import { FileText, ArrowRight, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './authConfig';

// Lazy Load Admin Pages
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const LandingEditor = lazy(() => import('./pages/Admin/LandingEditor'));
const LeadStats = lazy(() => import('./pages/Admin/LeadStats'));
const LeadStatsDetail = lazy(() => import('./pages/Admin/LeadStatsDetail'));
const TrafficLogs = lazy(() => import('./pages/Admin/TrafficLogs'));
const TrafficStats = lazy(() => import('./pages/Admin/TrafficStats'));
const Settings = lazy(() => import('./pages/Admin/Settings'));
const Login = lazy(() => import('./pages/Admin/Login'));
const PolicyManager = lazy(() => import('./pages/Admin/PolicyManager'));

const LANDING_CONFIGS = LANDING_CONFIGS_JSON as unknown as Record<string, LandingConfig>;

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
  </div>
);

// A simple dashboard to list available landing pages for the visitor
const Home = () => {
  const configs = Object.values(LANDING_CONFIGS);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Landing Page Factory</h1>
            <p className="text-gray-600">
              Serverless • Config-Driven • Google Sheet DB
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            관리자 페이지
          </button>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Link
              key={config.id}
              to={`/${config.id}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 block group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="bg-brand-100 text-brand-900 text-xs font-bold px-2 py-1 rounded">
                  ID: {config.id}
                </span>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                {config.hero.headline}
              </h2>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {config.hero.subHeadline}
              </p>
              <div className="flex items-center text-sm text-gray-400">
                <FileText className="w-4 h-4 mr-1" />
                Config ID: {config.id}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Redirect Root to Login */}
            <Route path="/" element={<Navigate to="/admin/login" replace />} />

            {/* Login Route (Lazy) */}
            <Route path="/admin/login" element={<Login />} />

            {/* Protected Admin Routes (Lazy) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/editor"
              element={
                <ProtectedRoute>
                  <LandingEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/editor/:id"
              element={
                <ProtectedRoute>
                  <LandingEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stats"
              element={
                <ProtectedRoute>
                  <LeadStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stats/:id"
              element={
                <ProtectedRoute>
                  <LeadStatsDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/traffic-logs"
              element={
                <ProtectedRoute>
                  <TrafficLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/traffic-stats"
              element={
                <ProtectedRoute>
                  <TrafficStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/policy"
              element={
                <ProtectedRoute>
                  <PolicyManager />
                </ProtectedRoute>
              }
            />

            {/* Dynamic Route for Landing Pages (Eager) */}
            <Route path="/:id" element={<LandingPage />} />
            <Route path="/:id/gallery" element={<LandingPage viewMode="gallery" />} />
            <Route path="/:id/board" element={<LandingPage viewMode="board" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

// Animation Styles for Sticky Bottom Form Button
const animationStyles = `
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.1);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes wiggle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-3deg);
  }
  75% {
    transform: rotate(3deg);
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-5px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(5px);
  }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animate-heartbeat {
  animation: heartbeat 1.5s ease-in-out infinite;
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    currentColor 0%,
    rgba(255, 255, 255, 0.3) 50%,\n    currentColor 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}

.animate-bounce {
  animation: bounce 1s ease-in-out infinite;
}

.animate-wiggle {
  animation: wiggle 0.5s ease-in-out infinite;
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}

.animate-shake {
  animation: shake 0.5s ease-in-out infinite;
}
`;

// Inject animation styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = animationStyles;
  document.head.appendChild(styleElement);
}


export default App;