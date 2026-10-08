import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LANDING_CONFIGS_JSON from './data/landingConfigs.json';
import { LandingConfig } from './types';
import { FileText, ArrowRight, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './authConfig';

// Lazy Load ALL Pages for better initial bundle
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const LandingEditor = lazy(() => import('./pages/Admin/LandingEditor'));
const LeadStats = lazy(() => import('./pages/Admin/LeadStats'));
const LeadStatsDetail = lazy(() => import('./pages/Admin/LeadStatsDetail'));
const TrafficLogs = lazy(() => import('./pages/Admin/TrafficLogs'));
const TrafficStats = lazy(() => import('./pages/Admin/TrafficStats'));
const Settings = lazy(() => import('./pages/Admin/Settings'));
const Login = lazy(() => import('./pages/Admin/Login'));
const PolicyManager = lazy(() => import('./pages/Admin/PolicyManager'));
const HomePage = lazy(() => import('./pages/HomePage'));

const LANDING_CONFIGS = LANDING_CONFIGS_JSON as unknown as Record<string, LandingConfig>;

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
  </div>
);

// Preserves OAuth callback hash (access_token) if coming from OAuth redirect, otherwise renders HomePage
const HomePageWrapper: React.FC = () => {
  const hash = window.location.hash;
  if (hash && (hash.includes('access_token') || hash.includes('error'))) {
    return <Navigate to={`/admin/login${hash}`} replace />;
  }
  return <HomePage />;
};

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Site Home for matelaw (Redirects to /admin/login only if OAuth hash is present) */}
            <Route path="/" element={<HomePageWrapper />} />

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