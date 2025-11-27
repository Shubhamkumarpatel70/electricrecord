import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser } from '../utils/auth';

export default function Home() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const features = [
    {
      icon: '📊',
      title: 'Track Electricity Usage',
      description: 'Easily record and monitor your electricity meter readings with detailed analytics and insights.'
    },
    {
      icon: '💰',
      title: 'Manage Bills & Payments',
      description: 'Keep track of all your electricity bills, payment status, and due dates in one place.'
    },
    {
      icon: '👥',
      title: 'Customer Management',
      description: 'Manage multiple customers and their electricity records efficiently with shareable links.'
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Access your records from any device, anywhere. Fully responsive and mobile-optimized.'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is encrypted and secure. Only you have access to your records.'
    },
    {
      icon: '📈',
      title: 'Analytics & Reports',
      description: 'View detailed charts and reports to understand your electricity consumption patterns.'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Register Your Account',
      description: 'Create a free account with your email and meter number.'
    },
    {
      number: '2',
      title: 'Add Your Records',
      description: 'Start recording your electricity meter readings and bills.'
    },
    {
      number: '3',
      title: 'Track & Manage',
      description: 'Monitor your usage, manage payments, and view detailed analytics.'
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}>
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="text-8xl sm:text-9xl animate-pulse-slow filter drop-shadow-lg">⚡</div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6" style={{ color: '#37474F' }}>
              Electricity Record Management
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl mx-auto" style={{ color: '#37474F', opacity: 0.9 }}>
              Smart, efficient, and easy-to-use platform for managing your electricity meter readings and bills
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-4 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                    style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
                  >
                    Go to Dashboard
                  </button>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="px-8 py-4 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                      style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}
                    >
                      Admin Panel
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-8 py-4 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                    style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                    style={{ backgroundColor: '#F5F5F5', color: '#37474F', border: '2px solid #FFD54F' }}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: '#37474F' }}>
              Why Choose Electricity Record?
            </h2>
            <p className="text-lg sm:text-xl max-w-2xl mx-auto" style={{ color: '#37474F', opacity: 0.8 }}>
              Everything you need to manage your electricity records efficiently
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(55, 71, 79, 0.1)' }}
              >
                <div className="text-5xl sm:text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: '#37474F' }}>
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base" style={{ color: '#37474F', opacity: 0.7 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: '#37474F' }}>
              How It Works
            </h2>
            <p className="text-lg sm:text-xl max-w-2xl mx-auto" style={{ color: '#37474F', opacity: 0.9 }}>
              Get started in three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl sm:text-4xl font-bold text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}
                >
                  {step.number}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#37474F' }}>
                  {step.title}
                </h3>
                <p className="text-base sm:text-lg" style={{ color: '#37474F', opacity: 0.8 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl p-8 sm:p-12 shadow-2xl" style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-lg sm:text-xl mb-8 text-white opacity-95">
              Join thousands of users managing their electricity records efficiently
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                  style={{ backgroundColor: '#FFD54F', color: '#37474F' }}
                >
                  Create Free Account
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-white"
                >
                  Sign In to Your Account
                </Link>
              </div>
            )}
            {user && (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                style={{ backgroundColor: '#FFD54F', color: '#37474F' }}
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#37474F' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm sm:text-base text-white opacity-80">
            © {new Date().getFullYear()} Electricity Record. All rights reserved.
          </p>
          <p className="text-xs sm:text-sm text-white opacity-60 mt-2">
            Secure • Reliable • Easy to Use
          </p>
        </div>
      </footer>
    </div>
  );
}

