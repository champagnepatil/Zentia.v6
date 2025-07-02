import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { Loader2, AlertCircle } from 'lucide-react';
import { Glow } from '../components/ui/glow';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<'patient' | 'therapist' | 'admin' | null>(null);
  const { login, user, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get role from URL params if provided
  const roleFromUrl = searchParams.get('role') as 'patient' | 'therapist' | 'admin' | null;

  // Redirect user if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/'); // Admin users stay on homepage to access admin features
      } else if (user.role === 'therapist') {
        navigate('/therapist');
      } else {
        navigate('/client');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    // If role is specified in URL, auto-trigger demo login
    if (roleFromUrl && (roleFromUrl === 'patient' || roleFromUrl === 'therapist' || roleFromUrl === 'admin') && !user && !loading && !demoLoading) {
      handleDemoLogin(roleFromUrl);
    }
  }, [roleFromUrl, user, loading, demoLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // Navigation will happen automatically when user state updates
    } catch (err: any) {
      let errorMessage = 'Login failed';
      
      if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (err.message.includes('Database error')) {
        errorMessage = 'System error. Please try again in a few minutes.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'patient' | 'therapist' | 'admin') => {
    if (loading || demoLoading) return; // Prevent double clicks

    const demoCredentials = {
      patient: { email: 'democlient@mindtwin.demo', password: 'demo123456' },
      therapist: { email: 'demotherapist@mindtwin.demo', password: 'demo123456' },
      admin: { email: 'admin@mindtwin.demo', password: 'demo123456' }
    };

    const { email: demoEmail, password: demoPassword } = demoCredentials[role];
    
    try {
      setError('');
      setDemoLoading(role);
      await login(demoEmail, demoPassword);
      // Navigation will happen automatically when user state updates
    } catch (err: any) {
      let errorMessage = 'Demo login failed';
      
      if (err.message.includes('Database error')) {
        errorMessage = 'System error. Please try again in a few minutes.';
      } else if (err.message.includes('password is incorrect') || err.message.includes('Please use password') || err.message.includes('Use:')) {
        errorMessage = err.message; // Use the specific error message from AuthContext
      } else {
        errorMessage = 'Demo login failed. Please try again.';
      }
      
      console.error('Demo login error:', err.message);
      setError(errorMessage);
    } finally {
      setDemoLoading(null);
    }
  };

  const createDemoUsers = async () => {
    try {
      setError('');
      setLoading(true);
      
      // Create demo client
      await register('Demo Client', 'democlient@mindtwin.demo', 'demo123456', 'patient');
      
      // Create demo therapist  
      await register('Demo Therapist', 'demotherapist@mindtwin.demo', 'demo123456', 'therapist');
      
      setError('Demo users created successfully! Try the demo buttons now.');
    } catch (err: any) {
      console.error('Error creating demo users:', err);
      setError('Error creating demo users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Glow variant="above" className="animate-appear-zoom opacity-100" />
      </div>
      <div className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">Welcome Back</h1>
            <p className="text-neutral-600 mt-2">Sign in to continue your journey</p>
          </div>
          
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-md mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="your@email.com"
                disabled={loading || !!demoLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="••••••••"
                disabled={loading || !!demoLoading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || !!demoLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">or try the demo</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleDemoLogin('patient')}
                  className="btn btn-outline"
                  disabled={loading || !!demoLoading}
                >
                  {demoLoading === 'patient' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Demo Client'
                  )}
                </button>

                <button
                  onClick={() => handleDemoLogin('therapist')}
                  className="btn btn-outline"
                  disabled={loading || !!demoLoading}
                >
                  {demoLoading === 'therapist' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Demo Therapist'
                  )}
                </button>
              </div>
              
              <button
                onClick={() => handleDemoLogin('admin')}
                className="btn btn-primary w-full"
                disabled={loading || !!demoLoading}
              >
                {demoLoading === 'admin' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  '🔑 Demo Admin Access'
                )}
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;