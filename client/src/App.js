import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
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
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <Link to="/" className="brand-link">
            <div className="brand-logo">⚡</div>
            <span className="brand-text">Electricity Record</span>
          </Link>
        </div>
        
        <nav className="header-nav">
          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <div className="user-avatar">
                  <span className="avatar-text">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
              </div>
              <button 
                className="logout-btn" 
                onClick={() => { 
                  clearAuth(); 
                  navigate('/');
                }}
                title="Sign out"
              >
                <span className="btn-icon">🚪</span>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-link">
                <span className="link-icon">🔐</span>
                Login
              </Link>
              <Link to="/register" className="nav-link">
                <span className="link-icon">✨</span>
                Register
              </Link>
            </div>
          )}
        </nav>
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
      <div className={isSharePage ? '' : 'container'}>
        <Routes>
          <Route path="/" element={<Welcome />} />
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