import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { Spinner } from './components/ui';
import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Requests from './pages/Requests';
import RequestDetail from './pages/RequestDetail';
import CreateRequest from './pages/CreateRequest';
import Offers from './pages/Offers';
import CreateOffer from './pages/CreateOffer';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Thread from './pages/Thread';
import Sessions from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import VideoRoom from './pages/VideoRoom';
import Leaderboard from './pages/Leaderboard';
import Verification from './pages/Verification';
import Insights from './pages/Insights';
import Settings from './pages/Settings';

function BackendBanner() {
  const { backendOnline, checkBackend } = useAuth();
  if (backendOnline) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[210] flex items-center justify-center gap-3 bg-gradient-to-r from-accent-amber/95 to-rose/90 px-4 py-2 text-center text-xs font-medium text-[#fff] shadow-soft">
      <WifiOff size={14} className="shrink-0" />
      <span>
        Can&apos;t reach the backend API. Start it with <b>npm run dev</b> from the project root,
        then reload.
      </span>
      <button
        type="button"
        onClick={checkBackend}
        className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 font-semibold transition hover:bg-black/30"
      >
        <RefreshCw size={12} /> Retry
      </button>
    </div>
  );
}

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Preparing your campus…" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

function RequireOnboarding({ children }) {
  const { user } = useAuth();
  if (user && !user.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  return (
    <>
      <BackendBanner />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />

          <Route
            path="/onboarding"
            element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />

        <Route
          element={
            <RequireAuth>
              <RequireOnboarding>
                <AppLayout />
              </RequireOnboarding>
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests/new" element={<CreateRequest />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/offers/new" element={<CreateOffer />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Thread />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/sessions/:id/video" element={<VideoRoom />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
    </>
  );
}