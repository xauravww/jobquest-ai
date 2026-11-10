'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, Checkbox, Progress } from 'antd';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import {
  User,
  Mail,
  Briefcase,
  MapPin,
  DollarSign,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import BrandMark from '@/components/ui/BrandMark';

const { TextArea } = Input;

const STORAGE_KEY = 'applytron_onboarding';

interface OnboardingData {
  name: string;
  title: string;
  location: string;
  skills: string[];
  experienceYears: number;
  summary: string;
  jobTypes: string[];
  locations: string[];
  remote: boolean;
  salaryRange: { min: number; max: number };
  industries: string[];
}

const SKILL_OPTIONS = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'];
const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
];
const LOCATIONS = ['Remote', 'New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Austin', 'Seattle'];
const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Consulting', 'Manufacturing', 'Marketing'];

const OnboardingPage: React.FC = () => {
  const { success, error } = useToast();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState<Partial<OnboardingData>>({});
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore saved progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { step, values } = JSON.parse(saved);
        if (values) {
          setFormValues(values);
          form.setFieldsValue(values);
        }
        if (typeof step === 'number') setCurrentStep(step);
      }
    } catch {
      /* ignore corrupt data */
    }
    setHydrated(true);
  }, [form]);

  // Pre-fill name from session (register data)
  useEffect(() => {
    if (session?.user?.name && hydrated) {
      const name = session.user.name;
      form.setFieldsValue({ name });
      setFormValues((prev) => ({ ...prev, name }));
    }
  }, [session, form, hydrated]);

  // Auto-save progress on every change
  const saveProgress = useCallback((step: number, values: Partial<OnboardingData>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, values }));
    } catch {
      /* storage full, ignore */
    }
  }, []);

  const handleValuesChange = useCallback((_: unknown, allValues: Partial<OnboardingData>) => {
    const merged = { ...formValues, ...allValues };
    setFormValues(merged);
    saveProgress(currentStep, merged);
  }, [formValues, currentStep, saveProgress]);

  const steps = [
    { title: 'Personal Info' },
    { title: 'Professional Details' },
    { title: 'Job Preferences' },
    { title: 'Complete' },
    { title: 'Verify Email' },
  ];

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      const merged = { ...formValues, ...values };
      setFormValues(merged);
      const next = currentStep + 1;
      if (next < steps.length) {
        setCurrentStep(next);
        saveProgress(next, merged);
      }
    } catch {
      /* stay */
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      saveProgress(prev, formValues);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });
      const data = await response.json();
      if (response.ok) {
        success('Profile setup complete!');
        localStorage.removeItem(STORAGE_KEY);
      } else {
        error(data.error || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    const email = session?.user?.email;
    if (!email) {
      error('Email is required');
      return;
    }
    try {
      const response = await fetch('/api/user/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        success('OTP sent to your email');
        setOtpSent(true);
      } else {
        const errorData = await response.json();
        error(errorData.error || 'Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      error('Network error while sending OTP');
    }
  };

  const verifyOtp = async () => {
    const email = session?.user?.email;
    if (!email) {
      error('Email is required');
      return;
    }
    try {
      const response = await fetch('/api/user/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (response.ok) {
        success('Email verified successfully');
        setOtpVerified(true);
        localStorage.removeItem(STORAGE_KEY);
        router.push('/dashboard');
      } else {
        error('Invalid OTP');
      }
    } catch (err) {
      console.error(err);
      error('Network error while verifying OTP');
    }
  };

  if (status === 'loading' || !hydrated) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-main)] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="h-7 w-28 bg-[var(--bg-glass)] rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-[var(--bg-glass)] rounded-lg animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-xl space-y-6">
            <div className="space-y-3">
              <div className="h-8 w-64 bg-[var(--bg-glass)] rounded-lg animate-pulse" />
              <div className="h-4 w-40 bg-[var(--bg-glass)] rounded animate-pulse" />
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-11 bg-[var(--bg-glass)] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const iconClass = 'w-4 h-4 text-[var(--text-dim)]';
  const userEmail = session?.user?.email || '';

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">Welcome to Applytron</h2>
              <p className="text-[var(--text-muted)]">Set up your profile so we can find roles that fit.</p>
            </div>
            <Form.Item name="name" label="Full name" rules={[{ required: true, message: 'Enter your full name' }]}>
              <Input prefix={<User className={iconClass} />} placeholder="Your full name" size="middle" allowClear />
            </Form.Item>
            {/* Email from session — read-only display */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Email</label>
              <Input
                prefix={<Mail className={iconClass} />}
                value={userEmail}
                size="middle"
                disabled
              />
              <p className="text-xs text-[var(--text-dim)] mt-1">From your account. Cannot be changed here.</p>
            </div>
            <Form.Item name="title" label="Job title" rules={[{ required: true, message: 'Enter your job title' }]}>
              <Input prefix={<Briefcase className={iconClass} />} placeholder="e.g., Frontend Developer" size="middle" allowClear />
            </Form.Item>
            <Form.Item name="location" label="Location" rules={[{ required: true, message: 'Enter your location' }]}>
              <Input prefix={<MapPin className={iconClass} />} placeholder="e.g., San Francisco, CA" size="middle" allowClear />
            </Form.Item>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">Professional background</h2>
              <p className="text-[var(--text-muted)]">Tell us about your experience and skills.</p>
            </div>
            <Form.Item name="experienceYears" label="Years of experience" rules={[{ required: true, message: 'Enter years of experience' }]}>
              <Input type="number" min={0} max={50} prefix={<Briefcase className={iconClass} />} placeholder="Years of experience" size="middle" />
            </Form.Item>
            <Form.Item name="skills" label="Skills" rules={[{ required: true, message: 'Add at least one skill' }]}>
              <Select mode="tags" placeholder="Type or pick a skill, e.g. React, Python" size="middle" options={SKILL_OPTIONS.map((s) => ({ value: s, label: s }))} />
            </Form.Item>
            <Form.Item name="summary" label="Summary" rules={[{ required: true, message: 'Provide a short summary' }]}>
              <TextArea placeholder="Brief description of your background and goals..." rows={4} />
            </Form.Item>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">Job preferences</h2>
              <p className="text-[var(--text-muted)]">What kind of roles are you looking for?</p>
            </div>
            <Form.Item name="jobTypes" label="Job types" rules={[{ required: true, message: 'Select at least one job type' }]}>
              <Select mode="multiple" placeholder="Preferred job types" size="middle" options={JOB_TYPES} />
            </Form.Item>
            <Form.Item name="locations" label="Preferred locations" rules={[{ required: true, message: 'Add preferred locations' }]}>
              <Select mode="tags" placeholder="Type or pick a location" size="middle" virtual={false} options={LOCATIONS.map((l) => ({ value: l, label: l }))} />
            </Form.Item>
            <Form.Item name="industries" label="Industries" rules={[{ required: true, message: 'Select industries' }]}>
              <Select mode="multiple" placeholder="Type or pick an industry" size="middle" options={INDUSTRIES.map((i) => ({ value: i, label: i }))} />
            </Form.Item>
            <Form.Item name="remote" valuePropName="checked">
              <Checkbox>Open to remote work</Checkbox>
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name={['salaryRange', 'min']} label="Min salary" rules={[{ required: true, message: 'Min salary' }]}>
                <Input type="number" prefix={<DollarSign className={iconClass} />} placeholder="e.g. 60000" size="middle" />
              </Form.Item>
              <Form.Item name={['salaryRange', 'max']} label="Max salary" rules={[{ required: true, message: 'Max salary' }]}>
                <Input type="number" prefix={<DollarSign className={iconClass} />} placeholder="e.g. 120000" size="middle" />
              </Form.Item>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-[var(--accent-soft)] flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">You are all set</h2>
              <p className="text-[var(--text-muted)]">Your profile is ready. One last step: verify your email.</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] p-5 text-left">
              <h3 className="font-semibold text-[var(--text-main)] mb-3">What happens next</h3>
              <ul className="space-y-2">
                {[
                  'Access your personalized dashboard',
                  'Get job recommendations based on your profile',
                  'Track applications and interviews',
                  'Automated follow-ups',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <CheckCircle className="w-4 h-4 text-[var(--live)] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5 max-w-md mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">Verify your email</h2>
              <p className="text-[var(--text-muted)]">We will send a code to {userEmail}.</p>
            </div>
            {!otpSent ? (
              <Button variant="primary" className="w-full" onClick={sendOtp}>
                Send verification code
              </Button>
            ) : otpVerified ? (
              <p className="text-[var(--live)] font-semibold text-center">Email verified!</p>
            ) : (
              <>
                <Input placeholder="Enter the code" value={otp} onChange={(e) => setOtp(e.target.value)} size="middle" allowClear />
                <div className="flex gap-3">
                  <Button variant="primary" className="flex-1" onClick={verifyOtp}>
                    Verify
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={sendOtp}>
                    Resend
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-main)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <BrandMark size={28} textClass="text-lg" />
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<LogOut className="w-4 h-4" />}
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        >
          Log out
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold">Set up your profile</h1>
              <span className="font-mono-ui text-xs text-[var(--text-muted)]">
                {currentStep + 1} / {steps.length}
              </span>
            </div>
            <Progress
              percent={((currentStep + 1) / steps.length) * 100}
              showInfo={false}
              strokeColor="var(--accent)"
              trailColor="var(--border)"
              size={['100%', 4]}
            />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8">
            <Form
              form={form}
              onFinish={currentStep === steps.length - 1 ? handleComplete : handleNext}
              onValuesChange={handleValuesChange}
              layout="vertical"
            >
              {renderStepContent()}

              <div className="flex justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={loading}
                    rightIcon={!loading ? <CheckCircle className="w-4 h-4" /> : undefined}
                  >
                    {loading ? 'Saving' : 'Complete setup'}
                  </Button>
                )}
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
