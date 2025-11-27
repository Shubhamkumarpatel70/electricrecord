import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { storeAuth } from '../utils/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const message = sessionStorage.getItem('welcomeMessage');
    if (message) {
      setWelcomeMessage(message);
      sessionStorage.removeItem('welcomeMessage');
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const data = response.data;
      
      if (data.success && data.data) {
        storeAuth(data.data.token, data.data.user);
        toast.success(`Welcome back, ${data.data.user.name}!`);
        
        setTimeout(() => {
          if (data.data.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const response = err.response?.data;
      let errorMsg = 'Login failed';
      
      if (response?.errors && Array.isArray(response.errors)) {
        const errors = {};
        response.errors.forEach(err => {
          errors[err.field] = err.message;
        });
        setFieldErrors(errors);
        errorMsg = response.errors.map(e => e.message).join(', ');
      } else if (response?.message) {
        errorMsg = response.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}>
      {welcomeMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl p-4 animate-slide-in-right max-w-sm w-full mx-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">👋</div>
            <h3 className="font-semibold text-gray-800">{welcomeMessage}</h3>
          </div>
        </div>
      )}

      <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center mb-8">
          <div className="text-5xl sm:text-6xl mb-4">⚡</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#37474F' }}>Welcome Back</h2>
          <p className="text-sm sm:text-base" style={{ color: '#37474F', opacity: 0.8 }}>Sign in to your Electricity Record account</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📧</span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: '' });
                  }
                }}
                placeholder="Enter your email"
                required
                className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.email 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🔒</span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors({ ...fieldErrors, password: '' });
                  }
                }}
                placeholder="Enter your password"
                required
                className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.password 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                }`}
              />
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>🔐</span>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: '#37474F' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: '#87CEEB' }}>
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
