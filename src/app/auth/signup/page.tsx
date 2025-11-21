'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { Mail, Lock, User, Eye, EyeOff, LoaderCircle, ArrowRight, Sparkles } from 'lucide-react';

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
  if (strength < 0.4) return 'bg-[var(--danger)]';
  if (strength < 0.7) return 'bg-[var(--warning)]';
  return 'bg-[var(--success)]';
};

const getStrengthText = (strength: number) => {
  if (strength < 0.4) return 'Weak';
  if (strength < 0.7) return 'Medium';
  return 'Strong';
};

// --- Reusable Input Component ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}

const FormInput = React.forwardRef<HTMLInputElement, InputProps>(({ icon, ...props }, ref) => (
  <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl transition-all duration-300 focus-within:border-[var(--primary)] focus-within:shadow-[0_0_10px_var(--primary-glow)] overflow-hidden group hover:border-[var(--primary)]/50">
    <span className="px-4 flex-shrink-0 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">{icon}</span>
    <input
      ref={ref}
      className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-white placeholder-[var(--text-dim)]"
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
    <label htmlFor={id} className="block text-sm font-medium text-[var(--text-main)] mb-2 flex items-center gap-2">
      <Lock className="w-4 h-4 text-[var(--primary)]" />
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
        className="absolute inset-y-0 right-0 flex items-center px-4 text-[var(--text-muted)] hover:text-white transition-colors"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
    {value && (
      <div className="flex items-center space-x-1 mt-2">
        <div className={`flex-1 h-1 rounded-full overflow-hidden bg-[var(--bg-surface)]`} role="img" aria-label={`Password strength: ${getStrengthText(strength)}`}>
          <div className={`h-full transition-all duration-300 ${getStrengthColor(strength)}`} style={{ width: `${strength * 100}%` }} />
        </div>
        <span className="text-xs text-[var(--text-muted)]">{getStrengthText(strength)}</span>
      </div>
    )}
    {strength < 1 && value && (
      <p className="text-xs text-[var(--text-dim)] mt-1">
        Use 8+ chars, mix case, numbers & symbols.
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
  const { success, error } = useToast();
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
      error('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }
    if (passwordStrength < 0.6) {
      error('Password is too weak. Please use a stronger one.');
      return;
    }
    setIsLoading(true);

    try {
      const result = await signUp({ name, email, password });

      if (result?.error) {
        error(result.error);
      } else {
        success('Account created successfully!');
        router.push('/onboarding');
      }
    } catch (err) {
      error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted || status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-deep)]">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--primary-glow)]"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--bg-deep)] relative overflow-hidden flex items-center justify-center">

        {/* Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--primary)]/20 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--secondary)]/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 p-6">

          {/* Left Column - Branding (Hidden on mobile, visible on large screens) */}
          <div className="hidden lg:flex flex-col justify-center items-start space-y-8 order-2 lg:order-1">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-4xl font-black text-white tracking-tight">JobQuest</span>
                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] tracking-wider uppercase">AI Powered</span>
              </div>
            </Link>

            <div className="space-y-6 max-w-lg">
              <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
                Start your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">career journey</span> today.
              </h1>
              <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                Join thousands of professionals unlocking AI-powered job search and tracking.
              </p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="flex items-center justify-center w-full order-1 lg:order-2">
            <div className="w-full max-w-lg">
              {/* Mobile Logo (Visible only on mobile) */}
              <div className="lg:hidden flex justify-center mb-8">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-black text-white tracking-tight">JobQuest</span>
                </Link>
              </div>

              {/* Form Card */}
              <div className="backdrop-blur-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-2xl shadow-2xl shadow-black/50 p-8 relative overflow-hidden">
                {/* Card Glow Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--primary)]"></div>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
                  <p className="text-[var(--text-muted)] text-base">Join JobQuest and start your AI-powered career journey</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-[var(--text-main)] mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-[var(--primary)]" />
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
                      <label htmlFor="email" className="block text-sm font-medium text-[var(--text-main)] mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[var(--primary)]" />
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
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-main)] mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[var(--primary)]" />
                        Confirm Password {passwordsMatch ? '' : <span className="text-[var(--danger)] ml-2">(Does not match)</span>}
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
                          className="absolute inset-y-0 right-0 flex items-center px-4 text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || passwordStrength < 0.6 || !passwordsMatch}
                    className="w-full py-4 px-6 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[var(--primary)]/25 hover:shadow-[0_0_20px_var(--primary-glow)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    {isLoading ? (
                      <>
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                        <span className="relative z-10">Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10">Create Account</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border-glass)]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded-full border border-[var(--border-glass)]">or continue with</span>
                  </div>
                </div>

                {/* Social Login Placeholder */}
                <div className="text-center p-4 bg-[var(--bg-surface)]/50 rounded-xl border border-[var(--border-glass)] border-dashed">
                  <p className="text-xs text-[var(--text-muted)]">Social login coming soon</p>
                </div>

                {/* Sign In Link */}
                <div className="text-center mt-6">
                  <p className="text-sm text-[var(--text-muted)]">
                    Already have an account?{' '}
                    <Link href="/auth/signin" className="font-bold text-[var(--primary)] hover:text-[var(--secondary)] transition-colors hover:underline">
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