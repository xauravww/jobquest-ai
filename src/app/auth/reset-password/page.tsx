'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Form, Input } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

// react-icons
import { FaBriefcase, FaArrowLeft, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

// --- Button Component ---
const Button = ({
  children,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      disabled:opacity-50 disabled:pointer-events-none bg-indigo-600 text-white hover:bg-indigo-600/90 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const ResetPasswordForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link. Please request a new password reset.');
      router.push('/auth/forgot-password');
    }
  }, [token, router]);

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (!values.password || !values.confirmPassword) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (values.password !== values.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (values.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (!token) {
      toast.error('Invalid reset token.');
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
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success('Password reset successfully!');
        // Redirect to sign in after a short delay
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
              <h2 className="text-3xl font-bold text-white">Password Reset!</h2>
              <p className="text-gray-400 mt-2">
                Your password has been successfully reset.
              </p>
            </div>

            {/* Success Message */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300">
                Redirecting you to sign in...
              </p>
            </div>

            {/* Manual Redirect */}
            <div className="text-center">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
                Go to Sign In
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md mx-auto bg-gray-800/60 rounded-2xl shadow-2xl shadow-indigo-900/20 p-8 space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-indigo-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-white mb-2">Invalid Link</h3>
            <p className="text-gray-400">Redirecting...</p>
          </div>
        </div>
      </main>
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
            <h2 className="text-3xl font-bold text-white">Reset Password</h2>
            <p className="text-gray-400 mt-2">
              Enter your new password below.
            </p>
          </div>

          {/* Form */}
          <Form form={form} onFinish={handleSubmit} className="space-y-6" layout="vertical">
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter your new password' },
                { min: 6, message: 'Password must be at least 6 characters long' },
              ]}
            >
              <Input.Password
                prefix={<FaLock className="h-5 w-5 text-gray-500" />}
                placeholder="New password"
                size="large"
                iconRender={(visible: boolean) =>
                  visible ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                  )
                }
                className="bg-gray-900/70 text-gray-300 placeholder-gray-500 border-gray-700 hover:border-indigo-500 focus:border-indigo-500 px-4 py-3 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<FaLock className="h-5 w-5 text-gray-500" />}
                placeholder="Confirm new password"
                size="large"
                iconRender={(visible: boolean) =>
                  visible ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                  )
                }
                className="bg-gray-900/70 text-gray-300 placeholder-gray-500 border-gray-700 hover:border-indigo-500 focus:border-indigo-500 px-4 py-3 rounded-lg"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-base font-semibold shadow-lg shadow-indigo-600/30 transform hover:scale-105 transition-transform"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Resetting Password...</span>
                  </div>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </Form.Item>
          </Form>

          {/* Back to Sign In */}
          <div className="text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

const ResetPasswordPage: React.FC = () => {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md mx-auto bg-gray-800/60 rounded-2xl shadow-2xl shadow-indigo-900/20 p-8 space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-indigo-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-white mb-2">Loading</h3>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
