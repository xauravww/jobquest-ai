'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { Button } from 'antd';
import { Mail, ArrowRight } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import AuthField from '@/components/auth/AuthField';
import PasswordField from '@/components/auth/PasswordField';

const SignInPage: React.FC = () => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
      error('Enter your email and password to continue.');
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
        if (result.error === 'CredentialsSignin') {
          error('That email and password do not match. Try again.');
        } else {
          error(result.error);
        }
      } else if (result?.ok) {
        success('Welcome back.');
        const onboardingResponse = await fetch('/api/user/onboarding');
        const onboardingData = await onboardingResponse.json();
        if (onboardingResponse.ok && !onboardingData.user?.isOnboarded) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
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
      title="Welcome back"
      subtitle="Sign in to pick up where Applytron left off."
      pitchTitle="Your applications kept moving while you were away."
      pitchBody="Sign in to see what got applied, what needs a look, and what came back."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          autoComplete="current-password"
          required
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          action={
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-[var(--accent)] hover:underline"
            >
              Forgot?
            </Link>
          }
        />

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isLoading}
          icon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
          iconPosition="end"
          className="!h-11 !font-semibold"
        >
          {isLoading ? 'Signing in' : 'Sign in'}
        </Button>
      </form>

      <div className="flex items-center gap-4 my-5">
        <span className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-dim)]">More sign-in options soon</span>
        <span className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <p className="text-sm text-[var(--text-muted)] text-center">
        New to Applytron?{' '}
        <Link href="/auth/signup" className="font-semibold text-[var(--accent)] hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
};

export default SignInPage;
