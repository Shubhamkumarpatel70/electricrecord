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
    // Get welcome message from session storage
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
      
      // Check if response has the expected structure
      if (data.success && data.data) {
        storeAuth(data.data.token, data.data.user);
        
        toast.success(`Welcome back, ${data.data.user.name}!`);
        
        // Redirect to dashboard (or admin dashboard for admins)
        setTimeout(() => {
          if (data.data.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      } else {
        // Handle unexpected response structure
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const response = err.response?.data;
      let errorMsg = 'Login failed';
      
      // Handle validation errors
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
    <div className="auth-container">
      {welcomeMessage && (
        <div className="welcome-message">
          <div className="welcome-content">
            <div className="welcome-icon">👋</div>
            <h3>{welcomeMessage}</h3>
          </div>
        </div>
      )}

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">⚡</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your Electricity Record account</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
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
                className={fieldErrors.email ? 'input-error' : ''}
              />
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
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
                className={fieldErrors.password ? 'input-error' : ''}
              />
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Signing In...
              </>
            ) : (
              <>
                <span className="btn-icon">🔐</span>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 