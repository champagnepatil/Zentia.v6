import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { Loader2, AlertCircle, Check, X, Eye, EyeOff, Shield, UserCheck, Mail } from 'lucide-react';
import { AppError, ErrorType } from '../utils/errorHandling';
import { Glow } from '../components/ui/glow';

interface PasswordStrength {
  score: number;
  feedback: string[];
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as 'therapist' | 'patient'
  });
  
  const [formState, setFormState] = useState({
    error: '',
    loading: false,
    showPassword: false,
    showConfirmPassword: false,
    acceptedTerms: false,
    acceptedPrivacy: false
  });
  
  const [demoLoading, setDemoLoading] = useState<'patient' | 'therapist' | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [] });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const { register, login } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One special character');
    }

    return { score, feedback };
  };

  // Real-time validation
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'Name can only contain letters and spaces';
        return '';
      
      case 'email':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    if (touched[name]) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
    
    // Update password strength for password field
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
      
      // Re-validate confirm password if it's been touched
      if (touched.confirmPassword) {
        const confirmError = validateField('confirmPassword', formData.confirmPassword);
        setFieldErrors(prev => ({ ...prev, confirmPassword: confirmError }));
      }
    }
    
    // Re-validate confirm password when it changes
    if (name === 'confirmPassword') {
      const error = validateField(name, value);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ['name', 'email', 'password', 'confirmPassword'];
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    // Validate all fields
    const errors: Record<string, string> = {};
    allFields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData] as string);
      if (error) errors[field] = error;
    });
    
    // Check terms acceptance
    if (!formState.acceptedTerms) {
      errors.terms = 'You must accept the Terms of Service';
    }
    
    if (!formState.acceptedPrivacy) {
      errors.privacy = 'You must accept the Privacy Policy';
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setFormState(prev => ({ ...prev, error: 'Please fix the errors above' }));
      return;
    }
    
    try {
      setFormState(prev => ({ ...prev, error: '', loading: true }));
      
      await register(formData.name, formData.email, formData.password, formData.role);
      
      // Try to sign in after registration
      await login(formData.email, formData.password);
      
      // Navigate to welcome page instead of direct dashboard
      navigate('/welcome', { state: { newUser: true, role: formData.role } });
      
    } catch (err) {
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (err instanceof AppError) {
        errorMessage = err.userMessage || err.message;
      } else if (err instanceof Error) {
        if (err.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please try signing in instead.';
        } else if (err.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (err.message.includes('Password')) {
          errorMessage = 'Password does not meet requirements. Please try a stronger password.';
        }
      }
      
      setFormState(prev => ({ ...prev, error: errorMessage }));
      console.error('Registration error:', err);
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDemoLogin = async (role: 'patient' | 'therapist') => {
    const demoCredentials = {
      patient: { email: 'democlient@mindtwin.demo', password: 'demo123456' },
      therapist: { email: 'demotherapist@mindtwin.demo', password: 'demo123456' }
    };

    const { email: demoEmail, password: demoPassword } = demoCredentials[role];
    
    try {
      setFormState(prev => ({ ...prev, error: '' }));
      setDemoLoading(role);
      await login(demoEmail, demoPassword);
      navigate(role === 'therapist' ? '/therapist' : '/client');
    } catch (err: any) {
      const errorMessage = err.message.includes('password is incorrect') || err.message.includes('Please use password')
        ? err.message
        : err.message.includes('Database error')
        ? 'System error. Please try again in a few minutes.'
        : 'Demo login failed. Please try again.';
      
      setFormState(prev => ({ ...prev, error: errorMessage }));
      setDemoLoading(null);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
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
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Create Your Account</h1>
            <p className="text-neutral-600 mt-2">Join our mental health platform to begin your wellness journey</p>
          </div>
          
          {formState.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-md mb-6 flex items-start"
            >
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{formState.error}</span>
            </motion.div>
          )}

          {/* Demo Login Buttons */}
          <div className="text-center text-sm text-neutral-600 mb-3">Try the demo:</div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleDemoLogin('patient')}
              disabled={formState.loading || demoLoading !== null}
              className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm py-2"
            >
              {demoLoading === 'patient' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Demo Client'
              )}
            </button>
            <button
              onClick={() => handleDemoLogin('therapist')}
              disabled={formState.loading || demoLoading !== null}
              className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm py-2"
            >
              {demoLoading === 'therapist' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Demo Therapist'
              )}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">Or create a new account</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="mb-4">
              <label htmlFor="name" className="label">
                Full Name <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={`input ${fieldErrors.name ? 'border-error-500 focus:border-error-500' : ''}`}
                value={formData.name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="John Doe"
                disabled={demoLoading !== null}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              />
              {fieldErrors.name && (
                <p id="name-error" className="text-error-600 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {fieldErrors.name}
                </p>
              )}
            </div>
            
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="label">
                Email Address <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`input pr-10 ${fieldErrors.email ? 'border-error-500 focus:border-error-500' : ''}`}
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="your@email.com"
                  disabled={demoLoading !== null}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="text-error-600 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {fieldErrors.email}
                </p>
              )}
            </div>
            
            {/* Password */}
            <div className="mb-4">
              <label htmlFor="password" className="label">
                Password <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={formState.showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`input pr-10 ${fieldErrors.password ? 'border-error-500 focus:border-error-500' : ''}`}
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  disabled={demoLoading !== null}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : 'password-help'}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  onClick={() => setFormState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  aria-label={formState.showPassword ? 'Hide password' : 'Show password'}
                >
                  {formState.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-600">Password strength:</span>
                    <span className={`font-medium ${passwordStrength.score >= 4 ? 'text-green-600' : passwordStrength.score >= 3 ? 'text-blue-600' : passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {getPasswordStrengthText(passwordStrength.score)}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-1 text-xs text-neutral-600">
                      Missing: {passwordStrength.feedback.join(', ')}
                    </div>
                  )}
                </div>
              )}
              
              {fieldErrors.password && (
                <p id="password-error" className="text-error-600 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {fieldErrors.password}
                </p>
              )}
              {!fieldErrors.password && (
                <p id="password-help" className="text-xs text-neutral-500 mt-1">
                  Must be at least 6 characters. Stronger passwords include uppercase, lowercase, numbers, and symbols.
                </p>
              )}
            </div>
            
            {/* Confirm Password */}
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="label">
                Confirm Password <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={formState.showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`input pr-10 ${fieldErrors.confirmPassword ? 'border-error-500 focus:border-error-500' : formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  disabled={demoLoading !== null}
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  onClick={() => setFormState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                  aria-label={formState.showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {formState.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <Check className="absolute right-10 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirm-password-error" className="text-error-600 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
            
            {/* Role Selection */}
            <div className="mb-6">
              <label className="label">I am a: <span className="text-error-500">*</span></label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`p-4 rounded-md border-2 transition-all ${
                    formData.role === 'patient' 
                      ? 'border-primary-600 bg-primary-50 text-primary-700' 
                      : 'border-neutral-300 text-neutral-700 hover:border-primary-300 hover:bg-neutral-50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, role: 'patient' }))}
                  disabled={demoLoading !== null}
                  aria-pressed={formData.role === 'patient'}
                >
                  <span className="font-medium">Client</span>
                  <p className="text-xs mt-1 opacity-75">Seeking mental health support</p>
                </button>
                
                <button
                  type="button"
                  className={`p-4 rounded-md border-2 transition-all ${
                    formData.role === 'therapist' 
                      ? 'border-primary-600 bg-primary-50 text-primary-700' 
                      : 'border-neutral-300 text-neutral-700 hover:border-primary-300 hover:bg-neutral-50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, role: 'therapist' }))}
                  disabled={demoLoading !== null}
                  aria-pressed={formData.role === 'therapist'}
                >
                  <span className="font-medium">Therapist</span>
                  <p className="text-xs mt-1 opacity-75">Providing professional care</p>
                </button>
              </div>
            </div>

            {/* Terms and Privacy */}
            <div className="mb-6 space-y-3">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formState.acceptedTerms}
                  onChange={(e) => setFormState(prev => ({ ...prev, acceptedTerms: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 mt-0.5"
                  disabled={demoLoading !== null}
                />
                <label htmlFor="terms" className="ml-2 text-sm text-neutral-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-700 underline" target="_blank">
                    Terms of Service
                  </Link>
                  <span className="text-error-500"> *</span>
                </label>
              </div>
              {fieldErrors.terms && (
                <p className="text-error-600 text-sm flex items-center ml-6">
                  <X className="w-4 h-4 mr-1" />
                  {fieldErrors.terms}
                </p>
              )}
              
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={formState.acceptedPrivacy}
                  onChange={(e) => setFormState(prev => ({ ...prev, acceptedPrivacy: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 mt-0.5"
                  disabled={demoLoading !== null}
                />
                <label htmlFor="privacy" className="ml-2 text-sm text-neutral-700">
                  I agree to the{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-700 underline" target="_blank">
                    Privacy Policy
                  </Link>
                  <span className="text-error-500"> *</span>
                </label>
              </div>
              {fieldErrors.privacy && (
                <p className="text-error-600 text-sm flex items-center ml-6">
                  <X className="w-4 h-4 mr-1" />
                  {fieldErrors.privacy}
                </p>
              )}
              
              <div className="flex items-center text-xs text-neutral-600 mt-2">
                <Shield className="w-4 h-4 mr-1 text-primary-600" />
                Your data is encrypted and HIPAA compliant
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px]"
              disabled={formState.loading || demoLoading !== null}
            >
              {formState.loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </form>
          
          <p className="text-center mt-6 text-neutral-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Register;