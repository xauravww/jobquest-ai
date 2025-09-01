'use client';

import React, { useState } from 'react';
import { Form, Input } from 'antd';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// react-icons
import { FaBriefcase, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaUser } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { FaTwitter } from "react-icons/fa";

// --- Stubbed signup function ---
const signUp = async (
  { name, email, password }: { name: string; email: string; password: string }
): Promise<{ ok: boolean; error: string | null }> => {
  console.log("Signing up", { name, email, password });
  if (email === 'test@example.com') {
    return { ok: false, error: 'Email already exists' };
  }
  return { ok: true, error: null };
};

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

// --- SignUpPage ---
const SignUpPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { name: string; email: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signUp({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mt-8 min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md mx-auto bg-gray-800/60 rounded-2xl shadow-2xl shadow-indigo-900/20 p-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <FaBriefcase className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-wider">Jobquest AI</span>
          </Link>
          <h2 className="text-3xl font-bold text-white">Create your account</h2>
          <p className="text-gray-400 mt-2">Join us and start your journey.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <FaExclamationCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <Form form={form} onFinish={handleSubmit} className="space-y-6" layout="vertical">
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input
              prefix={<FaUser className="h-5 w-5 text-gray-500" />}
              placeholder="Your Name"
              size="large"
              className="bg-gray-900/70 text-gray-300 placeholder-gray-500 border-gray-700 hover:border-indigo-500 focus:border-indigo-500 px-4 py-3 rounded-lg"
            />
          </Form.Item>

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

          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: 'Please confirm your password' }]}
          >
            <Input.Password
              prefix={<FaLock className="h-5 w-5 text-gray-500" />}
              placeholder="Confirm Password"
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

          <Form.Item>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-base font-semibold shadow-lg shadow-indigo-600/30 transform hover:scale-105 transition-transform"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing Up...</span>
                </div>
              ) : (
                'Sign Up'
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
              <span className="px-3 bg-gray-800 text-gray-500">Or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="social-btn flex items-center justify-center gap-2 h-12">
              <FcGoogle size={20} />
              <span>Google</span>
            </button>
            <button type="button" className="social-btn flex items-center justify-center gap-2 h-12">
              <FaTwitter size={20} className="text-sky-400" />
              <span>Twitter</span>
            </button>
          </div>
        </div>

        {/* Already have account */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default SignUpPage;
