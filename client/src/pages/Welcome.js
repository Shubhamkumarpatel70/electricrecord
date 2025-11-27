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
    sessionStorage.setItem('welcomeMessage', message);
    navigate(path);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-primary bg-[length:400%_400%] animate-gradient" style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}>
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-xl shadow-xl p-5 max-w-xs animate-slide-in-right">
          <div className="text-center">
            <div className="text-5xl mb-4">📱</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Install Electricity Record App</h3>
            <p className="text-sm text-gray-600 mb-4">Get quick access to your electricity records from your home screen!</p>
            <div className="flex gap-2">
              <button 
                onClick={handleInstall} 
                className="flex-1 bg-success text-white py-2 px-4 rounded-lg font-semibold hover:bg-success-dark transition-colors"
              >
                Install App
              </button>
              <button 
                onClick={() => setShowInstallPrompt(false)} 
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl animate-fade-in-up" style={{ backgroundColor: 'rgba(245, 245, 245, 0.98)', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
        <div className="text-center mb-8">
          <div className={`mb-6 transition-all duration-800 ${animationStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-7xl sm:text-8xl mb-4 animate-pulse-slow filter drop-shadow-lg">⚡</div>
            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 transition-all duration-800 ${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ color: '#37474F' }}>
              Electricity Record
            </h1>
          </div>
          
          <p className={`text-base sm:text-lg mb-8 transition-all duration-800 ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ color: '#37474F' }}>
            Smart electricity meter management for modern homes
          </p>
        </div>

        <div className={`flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 transition-all duration-800 ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex flex-col items-center p-4 rounded-xl transition-colors" style={{ backgroundColor: '#F5F5F5' }}>
            <span className="text-3xl sm:text-4xl mb-2">📊</span>
            <span className="text-sm sm:text-base font-medium" style={{ color: '#37474F' }}>Track Usage</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl transition-colors" style={{ backgroundColor: '#F5F5F5' }}>
            <span className="text-3xl sm:text-4xl mb-2">💰</span>
            <span className="text-sm sm:text-base font-medium" style={{ color: '#37474F' }}>Manage Bills</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl transition-colors" style={{ backgroundColor: '#F5F5F5' }}>
            <span className="text-3xl sm:text-4xl mb-2">📱</span>
            <span className="text-sm sm:text-base font-medium" style={{ color: '#37474F' }}>Mobile Ready</span>
          </div>
        </div>

        <div className={`flex flex-col sm:flex-row gap-4 mb-6 transition-all duration-800 ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button 
            className="flex-1 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
            onClick={() => handleNavigation('/login', 'Welcome back!')}
          >
            <span className="text-xl">🔐</span>
            <span>Login</span>
          </button>
          <button 
            className="flex-1 border-2 font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2"
            style={{ background: '#F5F5F5', borderColor: '#FFD54F', color: '#37474F' }}
            onClick={() => handleNavigation('/register', 'Welcome to Electricity Record!')}
          >
            <span className="text-xl">✨</span>
            <span>Register</span>
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm" style={{ color: '#37474F', opacity: 0.7 }}>Secure • Reliable • Easy to Use</p>
        </div>
      </div>
    </div>
  );
}
