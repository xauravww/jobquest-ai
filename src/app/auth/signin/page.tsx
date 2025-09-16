'use client';

import React, { useState } from 'react';
import { Form, Input, Checkbox } from 'antd';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

// react-icons
import { FaBriefcase, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { FaTwitter } from "react-icons/fa";

// --- Button Component ---
const Button = ({
  children,
  className = '',
  ...props
}: { children: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors 
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
      disabled:opacity-50 disabled:pointer-events-none bg-indigo-600 text-white hover:bg-indigo-600/90 ${className}`}
    {...props}
  >
    {children}
  </button>
);


const SignInPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  const { status } = useSession();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleSubmit = async (values: { email: string; password: string }) => {
    if (!values.email || !values.password) {
      toast.error('Please fill in both fields.');
      return;
    }
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.ok) {
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

  if (!isMounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-indigo-600 mx-auto mb-4"></div>
            <div className="animate-ping absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 bg-indigo-600 rounded-full opacity-75"></div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Loading...</h3>
          <p className="text-gray-400">Please wait while we prepare your experience</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <main className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md mx-auto bg-gray-800/60 rounded-2xl shadow-2xl shadow-indigo-900/20 p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <FaBriefcase className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white tracking-wider">Jobquest AI</span>
            </Link>
            <h2 className="text-3xl font-bold text-white">Welcome Back!</h2>
            <p className="text-gray-400 mt-2">Let&apos;s find your next opportunity.</p>
          </div>

          {/* Form */}
          <Form form={form} onFinish={handleSubmit} className="space-y-6" layout="vertical">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your email address' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input
                prefix={<MdEmail className="h-5 w-5 text-gray-500" />}
                placeholder="you@example.com"
                size="large"
                className="bg-gray-900/70 text-gray-300 placeholder-gray-500 border-gray-700 hover:border-indigo-500 focus:border-indigo-500 px-4 py-3 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<FaLock className="h-5 w-5 text-gray-500" />}
                placeholder="••••••••"
                size="large"
                iconRender={(visible:boolean) =>
                  visible ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                  )
                }
                className="bg-gray-900/70 text-gray-300 placeholder-gray-500 border-gray-700 hover:border-indigo-500 focus:border-indigo-500 px-4 py-3 rounded-lg"
              />
            </Form.Item>

            <div className="flex items-center justify-between">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className="text-text">Remember me</Checkbox>
              </Form.Item>
              <Link href="/auth/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <Form.Item>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-base font-semibold shadow-lg shadow-indigo-600/30 transform hover:scale-105 transition-transform"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </Form.Item>
          </Form>

          {/* Social */}
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-gray-800 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Disabled Google and Twitter sign-in buttons */}
              <button type="button" className="social-btn flex items-center justify-center gap-2 h-12 opacity-50 cursor-not-allowed" disabled>
                <FcGoogle size={20} />
                <span>Google (Disabled)</span>
              </button>
              <button type="button" className="social-btn flex items-center justify-center gap-2 h-12 opacity-50 cursor-not-allowed" disabled>
                <FaTwitter size={20} className="text-sky-400" />
                <span>Twitter (Disabled)</span>
              </button>
            </div>
          </div>

          {/* Signup */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default SignInPage;
