import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    meterNumber: '', 
    address: '', 
    phone: '' 
  });
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

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    
    try {
      await api.post('/api/auth/register', form);
      toast.success(`Account created successfully! Please login to continue.`);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const response = err.response?.data;
      
      if (response?.errors && Array.isArray(response.errors)) {
        const errors = {};
        response.errors.forEach(err => {
          errors[err.field] = err.message;
        });
        setFieldErrors(errors);
        const firstError = response.errors[0];
        toast.error(`${firstError.field}: ${firstError.message}`);
      } else {
        const errorMsg = response?.message || 'Registration failed';
        setError(errorMsg);
        toast.error(errorMsg);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-y-auto py-8" style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}>
      {welcomeMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl p-4 animate-slide-in-right max-w-sm w-full mx-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">✨</div>
            <h3 className="font-semibold text-gray-800">{welcomeMessage}</h3>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl rounded-2xl shadow-2xl p-6 sm:p-8 my-8" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center mb-8">
          <div className="text-5xl sm:text-6xl mb-4">⚡</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#37474F' }}>Create Account</h2>
          <p className="text-sm sm:text-base" style={{ color: '#37474F', opacity: 0.8 }}>Join Electricity Record to manage your electricity usage</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">👤</span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Enter your full name"
                  required
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.name 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📧</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
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
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🔒</span>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                placeholder="Create a strong password"
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
            <p className="mt-1 text-xs text-gray-500">Min 8 chars, uppercase, lowercase, number, special char</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="meterNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Meter Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🔢</span>
                <input
                  id="meterNumber"
                  name="meterNumber"
                  type="text"
                  value={form.meterNumber}
                  onChange={onChange}
                  placeholder="Enter meter number"
                  required
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.meterNumber 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {fieldErrors.meterNumber && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.meterNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📱</span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="Enter phone number"
                  required
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.phone 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🏠</span>
              <input
                id="address"
                name="address"
                type="text"
                value={form.address}
                onChange={onChange}
                placeholder="Enter your address"
                required
                className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.address 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                }`}
              />
            </div>
            {fieldErrors.address && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: '#37474F' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#87CEEB' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
