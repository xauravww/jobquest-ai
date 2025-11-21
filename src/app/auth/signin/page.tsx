'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { Mail, Lock, Eye, EyeOff, LoaderCircle, ArrowRight, Sparkles } from 'lucide-react';

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


// --- Main Sign-In Page Component ---
const SignInPage: React.FC = () => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      error('Please fill in both fields.');
      return;
    }
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          error('Invalid email or password. Please check your credentials and try again.');
        } else {
          error(result.error);
        }
      } else if (result?.ok) {
        success('Signed in successfully!');
        // Check onboarding status
        const onboardingResponse = await fetch('/api/user/onboarding');
        const onboardingData = await onboardingResponse.json();
        if (onboardingResponse.ok && !onboardingData.user?.isOnboarded) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render a skeleton or nothing until mounted to avoid flash of unstyled content
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
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--primary)]/20 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--secondary)]/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 p-6">

          {/* Left Column - Branding (Hidden on mobile, visible on large screens) */}
          <div className="hidden lg:flex flex-col justify-center items-start space-y-8">
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
                Unlock your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">career move</span>, faster.
              </h1>
              <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                Welcome back. Manage your applications, track your progress, and get hired with the power of AI.
              </p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="flex items-center justify-center w-full">
            <div className="w-full max-w-md">
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
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Sign In</h2>
                  <p className="text-[var(--text-muted)] text-base">Enter your credentials to access your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
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

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="password" className="block text-sm font-medium text-[var(--text-main)] flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[var(--primary)]" />
                          Password
                        </label>
                        <Link href="/auth/forgot-password" className="text-xs text-[var(--primary)] hover:text-[var(--primary-dim)] font-medium transition-colors hover:underline">
                          Forgot?
                        </Link>
                      </div>
                      <div className="relative">
                        <FormInput
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          icon={<Lock strokeWidth={1.5} className="w-5 h-5" />}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-4 text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[var(--primary)]/25 hover:shadow-[0_0_20px_var(--primary-glow)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    {isLoading ? (
                      <>
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                        <span className="relative z-10">Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10">Sign In</span>
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

                {/* Sign Up Link */}
                <div className="text-center mt-6">
                  <p className="text-sm text-[var(--text-muted)]">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="font-bold text-[var(--primary)] hover:text-[var(--secondary)] transition-colors hover:underline">
                      Sign up for free
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

export default SignInPage;