'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { Button } from 'antd';
import { Mail, User, ArrowRight } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import AuthField from '@/components/auth/AuthField';
import PasswordField, { getPasswordStrength } from '@/components/auth/PasswordField';

const signUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      return { ok: true, error: null };
    }
    return { ok: false, error: data.error || 'We could not create your account.' };
  } catch (error) {
    console.error('Signup error:', error);
    return { ok: false, error: 'Network error. Please try again.' };
  }
};

const SignUpPage: React.FC = () => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;

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
    if (!name || !email || !password || !confirmPassword) {
      error('Please fill in every field.');
      return;
    }
    if (!passwordsMatch) {
      error('Your passwords do not match.');
      return;
    }
    if (passwordStrength < 0.6) {
      error('Pick a stronger password before continuing.');
      return;
    }
    setIsLoading(true);

    try {
      const result = await signUp({ name, email, password });
      if (result?.error) {
        error(result.error);
      } else {
        success('You are all set. Welcome to Applytron.');
        router.push('/onboarding');
      }
    } catch (err) {
      error('Something went wrong on our end. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted || status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-deep)]">
        <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set it up once, then let Applytron do the applying."
      pitchTitle="Point it at the jobs you want. It handles the rest."
      pitchBody="Tailored resumes, applications sent for you, and follow-ups on time. You stay in control."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="name"
          name="name"
          type="text"
          label="Full name"
          autoComplete="name"
          required
          placeholder="Alex Morgan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<User className="w-5 h-5" strokeWidth={1.5} />}
        />

        <AuthField
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-5 h-5" strokeWidth={1.5} />}
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          required
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showStrength
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          required
          placeholder="Type it again"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPassword && !passwordsMatch ? 'These do not match yet.' : undefined}
        />

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isLoading}
          disabled={passwordStrength < 0.6 || !passwordsMatch}
          icon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
          iconPosition="end"
          className="!h-11 !font-semibold"
        >
          {isLoading ? 'Creating account' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-[var(--text-muted)] text-center">
        Already have an account?{' '}
        <Link href="/auth/signin" className="font-semibold text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export default SignUpPage;
