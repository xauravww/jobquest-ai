'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Briefcase, Mail, Lock, Eye, EyeOff, LoaderCircle } from 'lucide-react';

// --- Reusable Input Component ---
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
                    Unlock your next career move, faster.
                </h1>
                <p className="text-slate-400">
                    Welcome back. Manage your applications, track your progress, and get hired with the power of AI.
                </p>
            </div>
            <div className="absolute bottom-0 left-0 w-1/2 h-32 bg-gradient-to-t from-emerald-500/10 to-transparent blur-3xl"></div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-left">
              <h2 className="text-3xl font-bold text-white">Sign In</h2>
              <p className="text-slate-400 mt-2">Enter your credentials to access your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="password"className="block text-sm font-medium text-slate-400">Password</label>
                         <Link href="/auth/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                            Forgot password?
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
                            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-300"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 inline-flex items-center justify-center text-base font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="w-5 h-5 mr-2 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  'Sign In'
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
                Don't have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default SignInPage;