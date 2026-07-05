'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { Button } from 'antd';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import AuthField from '@/components/auth/AuthField';

const ForgotPasswordPage: React.FC = () => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      error('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        success('Password reset link sent! Check your email.');
      } else {
        error(data.error || 'Failed to send reset email.');
      }
    } catch (err) {
      error('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We sent a reset link to your inbox."
        pitchTitle="You are one step away from getting back in."
        pitchBody="Open the link in your email to set a new password and pick up where you left off."
        backHref="/auth/signin"
      >
        <div className="text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-[var(--accent-soft)] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-[var(--accent)]" />
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            Did not get it? Check spam or{' '}
            <button
              onClick={() => setIsSubmitted(false)}
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              try again
            </button>
          </p>

          <Link href="/auth/signin">
            <Button size="large" block className="!h-11 !font-semibold">
              Back to sign in
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we will send a reset link."
      pitchTitle="Happens to everyone. We will get you back in."
      pitchBody="One email, one link, and you are set. Your applications keep running in the meantime."
      backHref="/auth/signin"
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
          {isLoading ? 'Sending link' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-[var(--text-muted)] text-center">
        Remember it?{' '}
        <Link href="/auth/signin" className="font-semibold text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
