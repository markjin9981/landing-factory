import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import LandingEditor from './pages/Admin/LandingEditor';
import LeadStats from './pages/Admin/LeadStats';
import TrafficLogs from './pages/Admin/TrafficLogs';
import TrafficStats from './pages/Admin/TrafficStats';
import Settings from './pages/Admin/Settings';
import Login from './pages/Admin/Login';
import ProtectedRoute from './components/ProtectedRoute';
import LANDING_CONFIGS_JSON from './data/landingConfigs.json';
import { LandingConfig } from './types';
import { FileText, ArrowRight, Settings as SettingsIcon } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './authConfig';

const LANDING_CONFIGS = LANDING_CONFIGS_JSON as Record<string, LandingConfig>;

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
      <BrowserRouter basename="/landing-factory">
        <Routes>
          {/* Redirect Root to Login */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />

          {/* Login Route */}
          <Route path="/admin/login" element={<Login />} />

          {/* Protected Admin Routes */}
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

          {/* Dynamic Route for Landing Pages: /1, /2, /30 etc. */}
          <Route path="/:id" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};


export default App;