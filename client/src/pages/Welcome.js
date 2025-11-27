import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [animationStep, setAnimationStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // PWA installation prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });

    // Animation sequence
    const timer = setTimeout(() => setAnimationStep(1), 500);
    const timer2 = setTimeout(() => setAnimationStep(2), 1500);
    const timer3 = setTimeout(() => setAnimationStep(3), 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
      }
    }
  };

  const handleNavigation = (path, message) => {
    // Store welcome message for the next page
    sessionStorage.setItem('welcomeMessage', message);
    navigate(path);
  };

  return (
    <div className="welcome-container">
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="install-prompt">
          <div className="install-content">
            <div className="install-icon">📱</div>
            <h3>Install Electricity Record App</h3>
            <p>Get quick access to your electricity records from your home screen!</p>
            <div className="install-actions">
              <button onClick={handleInstall} className="install-btn">
                Install App
              </button>
              <button onClick={() => setShowInstallPrompt(false)} className="dismiss-btn">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="welcome-card">
        <div className="welcome-header">
          <div className={`logo-container ${animationStep >= 1 ? 'animate-in' : ''}`}>
            <div className="electricity-logo">⚡</div>
            <h1 className={`main-title ${animationStep >= 2 ? 'animate-in' : ''}`}>
              Electricity Record
            </h1>
          </div>
          
          <p className={`welcome-subtitle ${animationStep >= 3 ? 'animate-in' : ''}`}>
            Smart electricity meter management for modern homes
          </p>
        </div>

        <div className={`welcome-features ${animationStep >= 3 ? 'animate-in' : ''}`}>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>Track Usage</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💰</span>
            <span>Manage Bills</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📱</span>
            <span>Mobile Ready</span>
          </div>
        </div>

        <div className={`welcome-actions ${animationStep >= 3 ? 'animate-in' : ''}`}>
          <button 
            className="welcome-btn login-btn"
            onClick={() => handleNavigation('/login', 'Welcome back!')}
          >
            <span className="btn-icon">🔐</span>
            Login
          </button>
          <button 
            className="welcome-btn register-btn"
            onClick={() => handleNavigation('/register', 'Welcome to Electricity Record!')}
          >
            <span className="btn-icon">✨</span>
            Register
          </button>
        </div>

        <div className="welcome-footer">
          <p>Secure • Reliable • Easy to Use</p>
        </div>
      </div>
    </div>
  );
} 