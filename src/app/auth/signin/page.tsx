'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Briefcase, Mail, Lock, Eye, EyeOff, LoaderCircle, ArrowRight } from 'lucide-react';

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


// --- Main Sign-In Page Component ---
const SignInPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      toast.error('Please fill in both fields.');
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
        toast.error(result.error);
      } else if (result?.ok) {
        toast.success('Signed in successfully!');
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
      toast.error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render a skeleton or nothing until mounted to avoid flash of unstyled content
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/30 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

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
                  Unlock your next career move, faster.
                </h1>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Welcome back. Manage your applications, track your progress, and get hired with the power of AI.
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
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl -z-10"></div>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Sign In</h2>
                  <p className="text-slate-300 text-base">Enter your credentials to access your account</p>
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

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-400" />
                          Password
                        </label>
                        <Link href="/auth/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
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
                            className="absolute inset-y-0 right-0 flex items-center px-4 password-toggle-btn"
                            style={{ color: 'white', transition: 'none' }}
                          >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
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
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
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

                {/* Sign Up Link */}
                <div className="text-center mt-6">
                  <p className="text-sm text-slate-400">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
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