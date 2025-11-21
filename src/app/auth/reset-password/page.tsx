'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { Lock, Eye, EyeOff, LoaderCircle, ArrowLeft, Sparkles } from 'lucide-react';

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

const ResetPasswordForm: React.FC = () => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      error('Invalid reset link. Please request a new password reset.');
      router.push('/auth/forgot-password');
    }
  }, [token, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || !confirmPassword) {
      error('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      error('Password must be at least 6 characters long.');
      return;
    }

    if (!token) {
      error('Invalid reset token.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        success('Password reset successfully!');
        // Redirect to sign in after a short delay
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        error(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <div className="min-h-screen bg-[var(--bg-deep)] relative overflow-hidden flex items-center justify-center">
          {/* Background Elements */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--primary)]/20 rounded-full blur-[120px] animate-pulse-glow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--secondary)]/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

          <div className="relative z-10 w-full max-w-md p-6">
            <div className="backdrop-blur-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-2xl shadow-2xl shadow-black/50 p-8 relative overflow-hidden">
              {/* Card Glow Effect */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--primary)]"></div>

              <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-black text-white tracking-tight">JobQuest</span>
                </Link>
                <h2 className="text-3xl font-bold text-white mb-2">Password Reset!</h2>
                <p className="text-[var(--text-muted)]">
                  Your password has been successfully reset.
                </p>
              </div>

              {/* Success Message */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[var(--success)] rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_var(--success)]">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-medium">
                  Redirecting you to sign in...
                </p>
              </div>

              {/* Manual Redirect */}
              <div className="text-center mt-8">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-2 text-[var(--primary)] hover:text-[var(--secondary)] font-bold transition-colors hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-[0_0_20px_var(--primary-glow)]"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Invalid Link</h3>
          <p className="text-[var(--text-muted)]">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--bg-deep)] relative overflow-hidden flex items-center justify-center">
        {/* Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--primary)]/20 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--secondary)]/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 w-full max-w-md p-6">
          <div className="backdrop-blur-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-2xl shadow-2xl shadow-black/50 p-8 relative overflow-hidden">
            {/* Card Glow Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--primary)]"></div>

            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight">JobQuest</span>
              </Link>
              <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-[var(--text-muted)]">
                Enter your new password below.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[var(--text-main)] mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[var(--primary)]" />
                    New Password
                  </label>
                  <div className="relative">
                    <FormInput
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="New password"
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-main)] mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[var(--primary)]" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FormInput
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm new password"
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
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[var(--primary)]/25 hover:shadow-[0_0_20px_var(--primary-glow)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                {isLoading ? (
                  <>
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                    <span className="relative z-10">Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Reset Password</span>
                  </>
                )}
              </button>
            </form>

            {/* Back to Sign In */}
            <div className="text-center mt-8">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-white font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ResetPasswordPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-deep)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-[0_0_20px_var(--primary-glow)]"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Loading</h3>
          <p className="text-[var(--text-muted)]">Please wait...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
