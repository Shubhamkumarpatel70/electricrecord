import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ShareView from './pages/ShareView';
import InstallPrompt from './components/InstallPrompt';
import { getStoredUser, clearAuth } from './utils/auth';

function Header() {
  const navigate = useNavigate();
  const user = getStoredUser();
  return (
    <header className="shadow-md sticky top-0 z-50" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <div className="text-2xl sm:text-3xl">⚡</div>
              <span className="text-lg sm:text-xl font-bold" style={{ color: '#37474F' }}>
                Electricity Record
              </span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base" style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-semibold" style={{ color: '#37474F' }}>{user.name}</span>
                    <span className="text-xs capitalize" style={{ color: '#37474F', opacity: 0.7 }}>{user.role}</span>
                  </div>
                </div>
                <button 
                  className="border-2 px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2"
                  style={{ backgroundColor: '#F5F5F5', borderColor: '#FFD54F', color: '#37474F' }}
                  onClick={() => { 
                    clearAuth(); 
                    navigate('/');
                  }}
                  title="Sign out"
                >
                  <span>🚪</span>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link 
                  to="/login" 
                  className="px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2"
                  style={{ color: '#87CEEB' }}
                >
                  <span>🔐</span>
                  <span className="hidden sm:inline">Login</span>
                </Link>
                <Link 
                  to="/register" 
                  className="px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm text-white transition-all flex items-center gap-1 sm:gap-2"
                  style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
                >
                  <span>✨</span>
                  <span className="hidden sm:inline">Register</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const location = useLocation();
  const isSharePage = location.pathname.startsWith('/share/');

  return (
    <>
      {!isSharePage && <Header />}
      <div className={isSharePage ? '' : 'min-h-screen'} style={!isSharePage ? { background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' } : {}}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/share/:token" element={<ShareView />} />
        </Routes>
      </div>
      {!isSharePage && <InstallPrompt />}
    </>
  );
}

export default function App() {
  return <AppContent />;
} 