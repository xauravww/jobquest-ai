'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { Mail, LoaderCircle, ArrowLeft, Sparkles } from 'lucide-react';

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

const ForgotPasswordPage: React.FC = () => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      error('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log(data)

      if (response.ok) {
        setIsSubmitted(true);
        success('Password reset link sent! Check your email.');
      } else {
        error(data.error || 'Failed to send reset email.');
      }
    } catch (err) {
      error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <div className="min-h-screen bg-[var(--bg-deep)] relative overflow-hidden flex items-center justify-center">
          {/* Background Elements */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--primary)]/20 rounded-full blur-[120px] animate-pulse-glow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--secondary)]/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

          <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 p-6">
            {/* Left Column - Branding */}
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
                  Reset your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">password</span> securely.
                </h1>
                <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                  Check your email for the reset link and get back to managing your career.
                </p>
              </div>
            </div>

            {/* Right Column - Success Card */}
            <div className="flex items-center justify-center w-full order-1 lg:order-2">
              <div className="w-full max-w-md">
                {/* Success Card */}
                <div className="backdrop-blur-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-2xl shadow-2xl shadow-black/50 p-8 relative overflow-hidden">
                  {/* Card Glow Effect */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--primary)]"></div>

                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Check Your Email</h2>
                    <p className="text-[var(--text-muted)] text-base">We&apos;ve sent a password reset link to your email address</p>
                  </div>

                  {/* Success Message */}
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-[var(--success)] rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_var(--success)]">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-[var(--text-muted)]">
                      Didn&apos;t receive the email? Check your spam folder or{' '}
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="text-[var(--primary)] hover:text-[var(--secondary)] font-bold transition-colors hover:underline"
                      >
                        try again
                      </button>
                    </p>
                  </div>

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
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--bg-deep)] relative overflow-hidden flex items-center justify-center">
        {/* Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--primary)]/20 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--secondary)]/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 p-6">
          {/* Left Column - Branding */}
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
                Forgot your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">password?</span>
              </h1>
              <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                No worries! Enter your email and we&apos;ll send you a reset link to get back on track.
              </p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="flex items-center justify-center w-full order-1 lg:order-2">
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
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Reset Password</h2>
                  <p className="text-[var(--text-muted)] text-base">Enter your email address to receive a reset link</p>
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
                        <span className="relative z-10">Sending Reset Link...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10">Send Reset Link</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Sign In */}
                <div className="text-center mt-8">
                  <p className="text-sm text-[var(--text-muted)]">
                    Remember your password?{' '}
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

export default ForgotPasswordPage;
