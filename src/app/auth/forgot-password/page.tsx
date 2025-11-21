'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Briefcase, Mail, LoaderCircle, ArrowLeft } from 'lucide-react';

// --- Reusable Input Component ---
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

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
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
        toast.success('Password reset link sent! Check your email.');
      } else {
        toast.error(data.error || 'Failed to send reset email.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
                    Reset your password securely.
                  </h1>
                  <p className="text-lg text-slate-300 leading-relaxed">
                    Check your email for the reset link and get back to managing your career.
                  </p>
                </div>

                {/* Decorative Element */}
                <div className="hidden lg:block absolute bottom-0 left-0 w-1/2 h-32 bg-gradient-to-t from-emerald-500/10 to-transparent blur-3xl"></div>
              </div>
            </div>

            {/* Right Column - Success Card */}
            <div className="flex items-center justify-center p-8 lg:p-12 order-1 lg:order-2">
              <div className="w-full max-w-md space-y-8">
                {/* Success Card */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-8 relative">
                  {/* Card Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl blur-xl -z-10"></div>

                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Check Your Email</h2>
                    <p className="text-slate-300 text-base">We&apos;ve sent a password reset link to your email address</p>
                  </div>

                  {/* Success Message */}
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-slate-300">
                      Didn&apos;t receive the email? Check your spam folder or{' '}
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                      >
                        try again
                      </button>
                    </p>
                  </div>

                  {/* Back to Sign In */}
                  <div className="text-center mt-6">
                    <Link
                      href="/auth/signin"
                      className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
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
                  Forgot your password?
                </h1>
                <p className="text-lg text-slate-300 leading-relaxed">
                  No worries! Enter your email and we&apos;ll send you a reset link to get back on track.
                </p>
              </div>

              {/* Decorative Element */}
              <div className="hidden lg:block absolute bottom-0 left-0 w-1/2 h-32 bg-gradient-to-t from-emerald-500/10 to-transparent blur-3xl"></div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="flex items-center justify-center p-8 lg:p-12 order-1 lg:order-2">
            <div className="w-full max-w-md space-y-8">
              {/* Form Card */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-8 relative">
                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl blur-xl -z-10"></div>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Reset Password</h2>
                  <p className="text-slate-300 text-base">Enter your email address to receive a reset link</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
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
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                        <span>Sending Reset Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Sign In */}
                <div className="text-center mt-6">
                  <p className="text-sm text-slate-400">
                    Remember your password?{' '}
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

export default ForgotPasswordPage;
