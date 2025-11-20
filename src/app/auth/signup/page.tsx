'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Briefcase, Mail, Lock, User, Eye, EyeOff, LoaderCircle, Shield } from 'lucide-react';

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
  <div className="flex items-center bg-slate-800/50 border border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-colors overflow-hidden">
    <span className="px-4 flex-shrink-0 text-slate-500">{icon}</span>
    <input
      ref={ref}
      className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-slate-300 placeholder-slate-500 rounded-none rounded-r-lg"
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
    <label htmlFor={id} className="block text-sm font-medium text-slate-400">
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
        className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-r-lg"
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
      <main className="min-h-screen w-full bg-slate-900 text-slate-300 flex font-sans">
        <div className="flex-1 hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-slate-900 to-slate-800 border-r border-slate-800">
          <div className="w-full max-w-md space-y-6">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Jobquest</span>
            </Link>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Start your career journey today.
            </h1>
            <p className="text-slate-400">
              Join thousands of professionals unlocking AI-powered job search and tracking.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 w-1/2 h-32 bg-gradient-to-t from-emerald-500/10 to-transparent blur-3xl"></div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-left">
              <h2 className="text-3xl font-bold text-white">Sign Up</h2>
              <p className="text-slate-400 mt-2">Create your account to get started.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
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
                <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-400 mb-2">
                  Confirm Password {passwordsMatch ? '' : <span className="text-red-400">(Does not match)</span>}
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
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-r-lg"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || passwordStrength < 0.6 || !passwordsMatch}
                className="w-full py-3 px-4 inline-flex items-center justify-center text-base font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
                aria-disabled={isLoading || passwordStrength < 0.6 || !passwordsMatch}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="w-5 h-5 mr-2 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>

            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-slate-900 text-slate-500">Or continue with</span>
                </div>
              </div>
              <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400">Social login is coming soon.</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link href="/auth/signin" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default SignUpPage;