'use client';

import React, { useState } from 'react';
import { Form, Input } from 'antd';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

// react-icons
import { FaBriefcase, FaArrowLeft } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

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

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { email: string }) => {
    if (!values.email) {
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
        body: JSON.stringify({ email: values.email }),
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
              <h2 className="text-3xl font-bold text-white">Check Your Email</h2>
              <p className="text-gray-400 mt-2">
                We&apos;ve sent a password reset link to your email address.
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
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  try again
                </button>
              </p>
            </div>

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
            <h2 className="text-3xl font-bold text-white">Forgot Password?</h2>
            <p className="text-gray-400 mt-2">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
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

            <Form.Item>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-base font-semibold shadow-lg shadow-indigo-600/30 transform hover:scale-105 transition-transform"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending Reset Link...</span>
                  </div>
                ) : (
                  'Send Reset Link'
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

export default ForgotPasswordPage;
