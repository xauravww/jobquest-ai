'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Briefcase, Mail, Lock, User, Eye, EyeOff, LoaderCircle, Shield, ArrowRight } from 'lucide-react';

// Password strength logic
const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[^a-zA-Z\d]/.test(password)) strength += 1;
  return Math.min(strength / 5, 1); // Normalize to 0-1
};

const getStrengthColor = (strength: number) => {
  if (strength < 0.4) return 'bg-red-500';
  if (strength < 0.7) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getStrengthText = (strength: number) => {
  if (strength < 0.4) return 'Weak';
  if (strength < 0.7) return 'Medium';
  return 'Strong';
};

// --- Reusable Input Component (flex-based) ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}

const FormInput = React.forwardRef<HTMLInputElement, InputProps>(({ icon, ...props }, ref) => (
  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg transition-colors overflow-hidden">
    <span className="px-4 flex-shrink-0 text-slate-500">{icon}</span>
    <input
      ref={ref}
      className="flex-1 px-4 py-3 bg-slate-800 border-none outline-none text-slate-300 placeholder-slate-500 rounded-none rounded-r-lg"
      {...props}
    />
  </div>
));
FormInput.displayName = 'FormInput';

// Password input with strength indicator and eye toggle
const PasswordInput = ({
  value,
  onChange,
  showPassword,
  onTogglePassword,
  label,
  id,
  placeholder,
  strength = 0,
  autoComplete
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  label: string;
  id: string;
  placeholder: string;
  strength?: number;
  autoComplete?: string;
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
      <Lock className="w-4 h-4 text-emerald-400" />
      {label}
    </label>
    <div className="relative">
      <FormInput
        id={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        icon={<Lock strokeWidth={1.5} className="w-5 h-5" />}
      />
      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute inset-y-0 right-0 flex items-center px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-r-lg password-toggle-btn"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
    {value && (
      <div className="flex items-center space-x-1">
        <div className={`flex-1 h-1 rounded-full overflow-hidden ${getStrengthColor(strength)}`} role="img" aria-label={`Password strength: ${getStrengthText(strength)}`}>
          <div className="h-full transition-all duration-300" style={{ width: `${strength * 100}%` }} />
        </div>
        <span className="text-xs text-slate-400">{getStrengthText(strength)}</span>
      </div>
    )}
    {strength < 1 && value && (
      <p className="text-xs text-slate-500 mt-1">
        For a stronger password: Use 8+ characters, mix uppercase/lowercase, numbers, and symbols.
      </p>
    )}
  </div>
);

// --- Signup API Function ---
const signUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      return { ok: true, error: null };
    } else {
      return { ok: false, error: data.error || 'Signup failed' };
    }
  } catch (error) {
    console.error('Signup error:', error);
    return { ok: false, error: 'Network error. Please try again.' };
  }
};

// --- Main Sign-Up Page Component ---
const SignUpPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status]);

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
    setPasswordsMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (passwordStrength < 0.6) {
      toast.error('Password is too weak. Please use a stronger one.');
      return;
    }
    setIsLoading(true);

    try {
      const result = await signUp({ name, email, password });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Account created successfully!');
        router.push('/onboarding');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted || status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900">
        <LoaderCircle className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#e2e8f0',
          border: '1px solid #334155',
        }
      }} />
      <div className="min-h-screen bg-slate-900 relative overflow-hidden">

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Left Column - Branding */}
          <div className="flex flex-col justify-center items-center p-8 lg:p-12 order-2 lg:order-1">
            <div className="w-full max-w-md space-y-8 text-center lg:text-left">
              {/* Logo */}
              <Link href="/" className="inline-flex items-center gap-3 group justify-center lg:justify-start">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl lg:text-4xl font-black text-white tracking-tight">JobQuest</span>
                  <span className="text-sm font-semibold text-emerald-400 tracking-wider uppercase">AI Powered</span>
                </div>
              </Link>

              {/* Hero Content */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                  Start your career journey today.
                </h1>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Join thousands of professionals unlocking AI-powered job search and tracking.
                </p>
              </div>

              {/* Decorative Element */}
              <div className="hidden lg:block absolute bottom-0 left-0 w-1/2 h-32 bg-gradient-to-t from-emerald-500/10 to-transparent blur-3xl"></div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="flex items-center justify-center p-8 lg:p-12 order-1 lg:order-2">
            <div className="w-full max-w-lg space-y-8">
              {/* Form Card */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-8 relative">
                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl blur-xl -z-10"></div>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
                  <p className="text-slate-300 text-base">Join JobQuest and start your AI-powered career journey</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      Full Name
                    </label>
                      <FormInput
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        icon={<User strokeWidth={1.5} className="w-5 h-5" />}
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-400" />
                        Email Address
                      </label>
                      <FormInput
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail strokeWidth={1.5} className="w-5 h-5" />}
                      />
                    </div>

                    <PasswordInput
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      label="Password"
                      id="password"
                      placeholder="••••••••"
                      strength={passwordStrength}
                      autoComplete="new-password"
                    />

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        Confirm Password {passwordsMatch ? '' : <span className="text-red-400 ml-2">(Does not match)</span>}
                      </label>
                      <div className="relative">
                        <FormInput
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          icon={<Lock strokeWidth={1.5} className="w-5 h-5" />}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-4 password-toggle-btn"
                          style={{ color: 'white', transition: 'none' }}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || passwordStrength < 0.6 || !passwordsMatch}
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-slate-900/50 text-slate-400 rounded-full">or continue with</span>
                  </div>
                </div>

                {/* Social Login Placeholder */}
                <div className="text-center p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400">Social login coming soon</p>
                </div>

                {/* Sign In Link */}
                <div className="text-center mt-6">
                  <p className="text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link href="/auth/signin" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;