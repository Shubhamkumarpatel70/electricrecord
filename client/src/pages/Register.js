import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { storeAuth } from '../utils/auth';

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
    // Get welcome message from session storage
    const message = sessionStorage.getItem('welcomeMessage');
    if (message) {
      setWelcomeMessage(message);
      sessionStorage.removeItem('welcomeMessage');
    }
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error for this field when user starts typing
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
      const { data } = await api.post('/api/auth/register', form);
      
      // Don't auto-login after registration - user must login manually
      // storeAuth(data.token, data.user); // Removed - user should login manually
      
      toast.success(`Account created successfully! Please login to continue.`);
      
      // Redirect to login page after registration
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const response = err.response?.data;
      
      // Handle validation errors
      if (response?.errors && Array.isArray(response.errors)) {
        const errors = {};
        response.errors.forEach(err => {
          errors[err.field] = err.message;
        });
        setFieldErrors(errors);
        
        // Show first error in toast
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
    <div className="auth-container">
      {welcomeMessage && (
        <div className="welcome-message">
          <div className="welcome-content">
            <div className="welcome-icon">✨</div>
            <h3>{welcomeMessage}</h3>
          </div>
        </div>
      )}

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">⚡</div>
          <h2>Create Account</h2>
          <p>Join Electricity Record to manage your electricity usage</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Enter your full name"
                  required
                  className={fieldErrors.name ? 'input-error' : ''}
                />
                {fieldErrors.name && (
                  <span className="field-error">{fieldErrors.name}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="Enter your email"
                  required
                  className={fieldErrors.email ? 'input-error' : ''}
                />
                {fieldErrors.email && (
                  <span className="field-error">{fieldErrors.email}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="Create a strong password (min 8 chars, uppercase, lowercase, number, special char)"
                  required
                  className={fieldErrors.password ? 'input-error' : ''}
                />
                {fieldErrors.password && (
                  <span className="field-error">{fieldErrors.password}</span>
                )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="meterNumber">Meter Number</label>
              <div className="input-wrapper">
                <span className="input-icon">🔢</span>
                <input
                  id="meterNumber"
                  name="meterNumber"
                  type="text"
                  value={form.meterNumber}
                  onChange={onChange}
                  placeholder="Enter meter number (6-12 alphanumeric)"
                  required
                  className={fieldErrors.meterNumber ? 'input-error' : ''}
                />
                {fieldErrors.meterNumber && (
                  <span className="field-error">{fieldErrors.meterNumber}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="input-wrapper">
                <span className="input-icon">📱</span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="Enter phone number (8-15 digits)"
                  required
                  className={fieldErrors.phone ? 'input-error' : ''}
                />
                {fieldErrors.phone && (
                  <span className="field-error">{fieldErrors.phone}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <div className="input-wrapper">
              <span className="input-icon">🏠</span>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={onChange}
                  placeholder="Enter your address (min 10 characters)"
                  required
                  className={fieldErrors.address ? 'input-error' : ''}
                />
                {fieldErrors.address && (
                  <span className="field-error">{fieldErrors.address}</span>
                )}
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Creating Account...
              </>
            ) : (
              <>
                <span className="btn-icon">✨</span>
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 