'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { Button } from 'antd';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import PasswordField, { getPasswordStrength } from '@/components/auth/PasswordField';

const ResetPasswordForm: React.FC = () => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const token = searchParams.get('token');
  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    if (!token) {
      error('Invalid reset link. Please request a new one.');
      router.push('/auth/forgot-password');
    }
  }, [token, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || !confirmPassword) {
      error('Please fill in both fields.');
      return;
    }
    if (!passwordsMatch) {
      error('Your passwords do not match.');
      return;
    }
    if (password.length < 6) {
      error('Password must be at least 6 characters.');
      return;
    }
    if (!token) {
      error('Invalid reset token.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        success('Password reset successfully!');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        error(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthShell
        title="Password updated"
        subtitle="You are all set. Redirecting to sign in."
        pitchTitle="Back in business."
        pitchBody="Your password has been changed. Your applications kept running while you were away."
        backHref="/auth/signin"
      >
        <div className="text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-[var(--accent-soft)] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-[var(--accent)]" />
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            Not redirecting?{' '}
            <Link href="/auth/signin" className="font-semibold text-[var(--accent)] hover:underline">
              Sign in manually
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-deep)]">
        <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Pick something strong. You will not need to remember it often."
      pitchTitle="Almost there."
      pitchBody="Choose a new password and you will be back to your dashboard in seconds."
      backHref="/auth/forgot-password"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          id="password"
          name="password"
          label="New password"
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
          {isLoading ? 'Resetting password' : 'Reset password'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-[var(--text-muted)] text-center">
        Remember your password?{' '}
        <Link href="/auth/signin" className="font-semibold text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};

const ResetPasswordPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-deep)]">
        <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
