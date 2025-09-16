'use client';

import React, { useState } from 'react';
import { Form, Input, Select, Checkbox, Button, Card, Progress } from 'antd';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Briefcase,
  MapPin,
  DollarSign,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const { TextArea } = Input;
const { Option } = Select;

interface OnboardingData {
  name: string;
  email: string;
  title: string;
  location: string;
  skills: string[];
  experienceYears: number;
  summary: string;
  jobTypes: string[];
  locations: string[];
  remote: boolean;
  salaryRange: {
    min: number;
    max: number;
  };
  industries: string[];
}

const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState<Partial<OnboardingData>>({});
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpVerified, setOtpVerified] = useState<boolean>(false);

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          const fullName = data.firstName + (data.lastName ? ' ' + data.lastName : '');
          form.setFieldsValue({
            name: fullName,
            email: data.email,
          });
          setFormValues((prev) => ({ ...prev, name: fullName, email: data.email }));
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    }
    fetchProfile();
  }, [form]);

  const steps = [
    { title: 'Personal Info', description: 'Basic information' },
    { title: 'Professional Details', description: 'Your background' },
    { title: 'Job Preferences', description: 'What you\'re looking for' },
    { title: 'Complete', description: 'Ready to start!' },
    { title: 'Verify Email', description: 'OTP Verification' }
  ];

  const handleNext = async (): Promise<void> => {
    try {
      const values = await form.validateFields();
      setFormValues((prev) => ({ ...prev, ...values }));
      if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
    } catch {
      /* stay on current step */
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleComplete = async () => {
    console.log('Onboarding form values:', formValues);
    setLoading(true);
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile setup complete!');
        // Onboarding will be marked complete after OTP verification
      } else {
        toast.error(data.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    try {
      const response = await fetch('/api/user/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formValues.email }),
      });
      if (response.ok) {
        toast.success('OTP sent to your email');
        setOtpSent(true);
      } else {
        toast.error('Failed to send OTP');
      }
    } catch (error) {
      toast.error('Network error while sending OTP');
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await fetch('/api/user/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formValues.email, otp }),
      });
      if (response.ok) {
        toast.success('Email verified successfully');
        setOtpVerified(true);
        // Onboarding is now complete after OTP verification
        router.push('/dashboard');
      } else {
        toast.error('Invalid OTP');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error while verifying OTP');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to JobQuest AI!</h2>
              <p className="text-gray-400">Let&apos;s set up your profile to find the perfect job opportunities.</p>
            </div>

            <Form.Item name="name" rules={[{ required: true, message: 'Please enter your full name' }]}>
              <Input
                prefix={<User className="w-5 h-5 text-gray-400" />}
                placeholder="Your full name"
                size="large"
                className="bg-bg-card text-white placeholder-gray-500 border-border hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input
                prefix={<Mail className="w-5 h-5 text-gray-400" />}
                placeholder="your.email@example.com"
                size="large"
                className="bg-bg-card text-white placeholder-gray-500 border-border hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>

            <Form.Item name="title" rules={[{ required: true, message: 'Please enter your job title' }]}>
              <Input
                prefix={<Briefcase className="w-5 h-5 text-gray-400" />}
                placeholder="e.g., Frontend Developer, Product Manager"
                size="large"
                className="bg-bg-card text-white placeholder-gray-500 border-border hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>

            <Form.Item name="location" rules={[{ required: true, message: 'Please enter your location' }]}>
              <Input
                prefix={<MapPin className="w-5 h-5 text-gray-400" />}
                placeholder="e.g., San Francisco, CA"
                size="large"
                className="bg-bg-card text-white placeholder-gray-500 border-border hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Professional Background</h2>
              <p className="text-gray-400">Tell us about your experience and skills.</p>
            </div>

            <Form.Item name="experienceYears" rules={[{ required: true, message: 'Please enter your years of experience' }]}>
              <Input
                type="number"
                min={0}
                max={50}
                prefix={<Briefcase className="w-5 h-5 text-gray-400" />}
                placeholder="Years of experience"
                size="large"
                className="bg-gray-800/70 text-white placeholder-gray-500 border-gray-600 hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>

            <Form.Item name="skills" rules={[{ required: true, message: 'Please add at least one skill' }]}>
              <Select
                mode="tags"
                placeholder="Add your skills (e.g., React, Python, Project Management)"
                size="large"
                className="bg-gray-800/70 text-white rounded-md"
                classNames={{
                  root: '',
                  popup: { root: 'select-dark-popup' }, // ✅ new API
                }}
              >
                <Option value="JavaScript">JavaScript</Option>
                <Option value="TypeScript">TypeScript</Option>
                <Option value="React">React</Option>
                <Option value="Node.js">Node.js</Option>
                <Option value="Python">Python</Option>
              </Select>
            </Form.Item>

            <Form.Item name="summary" rules={[{ required: true, message: 'Please provide a professional summary' }]}>
              <TextArea
                placeholder="Brief description of your professional background and career goals..."
                rows={4}
                className="bg-gray-800/70 text-white placeholder-gray-500 border-gray-600 hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Job Preferences</h2>
              <p className="text-gray-400">What kind of opportunities are you looking for?</p>
            </div>

            <Form.Item name="jobTypes" rules={[{ required: true, message: 'Please select at least one job type' }]}>
              <Select
                mode="multiple"
                placeholder="Preferred job types"
                size="large"
                className="bg-gray-800/70 text-white rounded-md"
                classNames={{
                  root: '',
                  popup: { root: 'select-dark-popup' },
                }}
              >
                <Option value="full-time">Full-time</Option>
                <Option value="part-time">Part-time</Option>
                <Option value="contract">Contract</Option>
                <Option value="freelance">Freelance</Option>
                <Option value="internship">Internship</Option>
              </Select>
            </Form.Item>

            <Form.Item name="locations" rules={[{ required: true, message: 'Please add preferred locations' }]}>
              <Select
                mode="tags"
                placeholder="Preferred locations (e.g., New York, Remote, San Francisco)"
                size="large"
                className="bg-gray-800/70 text-white rounded-md"
                classNames={{
                  root: '',
                  popup: { root: 'select-dark-popup max-h-52 overflow-y-auto' },
                }}
                virtual={false}
              >
                <Option value="Remote">Remote</Option>
                <Option value="New York">New York</Option>
                <Option value="San Francisco">San Francisco</Option>
                <Option value="Los Angeles">Los Angeles</Option>
                <Option value="Chicago">Chicago</Option>
                <Option value="Austin">Austin</Option>
                <Option value="Seattle">Seattle</Option>
              </Select>
            </Form.Item>

            <Form.Item name="industries" rules={[{ required: true, message: 'Please select industries of interest' }]}>
              <Select
                mode="multiple"
                placeholder="Industries of interest"
                size="large"
                className="bg-gray-800/70 text-white rounded-md"
                classNames={{
                  root: '',
                  popup: { root: 'select-dark-popup' },
                }}
              >
                <Option value="Technology">Technology</Option>
                <Option value="Healthcare">Healthcare</Option>
                <Option value="Finance">Finance</Option>
                <Option value="Education">Education</Option>
                <Option value="E-commerce">E-commerce</Option>
                <Option value="Consulting">Consulting</Option>
                <Option value="Manufacturing">Manufacturing</Option>
                <Option value="Marketing">Marketing</Option>
              </Select>
            </Form.Item>

            <Form.Item name="remote" valuePropName="checked">
              <Checkbox className="text-gray-300">I&apos;m open to remote work opportunities</Checkbox>
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name={['salaryRange', 'min']} rules={[{ required: true, message: 'Please enter minimum salary' }]}>
                <Input
                  type="number"
                  prefix={<DollarSign className="w-4 h-4 text-gray-400" />}
                  placeholder="Min salary"
                  size="large"
                  className="bg-gray-800/70 text-white placeholder-gray-500 border-gray-600 hover:border-indigo-500 focus:border-indigo-500"
                />
              </Form.Item>

              <Form.Item name={['salaryRange', 'max']} rules={[{ required: true, message: 'Please enter maximum salary' }]}>
                <Input
                  type="number"
                  prefix={<DollarSign className="w-4 h-4 text-gray-400" />}
                  placeholder="Max salary"
                  size="large"
                  className="bg-gray-800/70 text-white placeholder-gray-500 border-gray-600 hover:border-indigo-500 focus:border-indigo-500"
                />
              </Form.Item>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white mb-2">You&apos;re All Set!</h2>
              <p className="text-gray-300">Your profile is ready. Let&apos;s find you some amazing job opportunities.</p>
            </div>

            <div className="rounded-lg p-6 border border-border bg-bg-card">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">What&apos;s Next?</h3>
              <ul className="text-left space-y-2 text-gray-200">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Access your personalized dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Get job recommendations based on your profile</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Track your applications and interviews</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Receive AI-powered career insights</span>
                </li>
              </ul>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Verify Your Email</h2>
            {!otpSent ? (
              <Button type="primary" onClick={sendOtp} className="w-full">
                Send OTP to {formValues.email}
              </Button>
            ) : otpVerified ? (
              <p className="text-green-500 font-semibold">Email verified successfully!</p>
            ) : (
              <>
                <Input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  size="large"
                  className="bg-bg-card text-white placeholder-gray-500 border-border hover:border-indigo-500 focus:border-indigo-500"
                />
                <div className="flex justify-between mt-4">
                  <Button type="primary" onClick={verifyOtp} className="w-1/2 mr-2">
                    Verify OTP
                  </Button>
                  <Button type="default" onClick={sendOtp} className="w-1/2 ml-2">
                    Resend OTP
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
    <>
      {/* Scoped dark styles for Select dropdown using the new API */}
      <style jsx global>{`
        .select-dark-popup {
          background-color: rgb(31 41 55); /* bg-gray-800 */
          color: #fff;
        }
        .select-dark-popup .ant-select-item {
          color: #e5e7eb; /* text-gray-200 */
        }
        .select-dark-popup .ant-select-item-option-active:not(.ant-select-item-option-disabled),
        .select-dark-popup .ant-select-item-option:hover:not(.ant-select-item-option-disabled) {
          background-color: rgb(79 70 229); /* indigo-600 */
          color: #fff;
        }
        .select-dark-popup .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background-color: rgb(79 70 229); /* indigo-600 */
          color: #fff;
        }
        .select-dark-popup .ant-empty-description {
          color: #9ca3af; /* muted */
        }
      `}</style>

      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Complete Your Profile</h1>
              <span className="text-gray-400">Step {currentStep + 1} of {steps.length}</span>
            </div>
            <Progress
              percent={((currentStep + 1) / steps.length) * 100}
              showInfo={false}
              strokeColor="#6366f1"
              trailColor="#374151"
            />
          </div>

          {/* Step Content */}
          <Card className="bg-bg-card border-border" styles={{ body: { padding: '2rem' } }}>
            <Form
              form={form}
              onFinish={currentStep === steps.length - 1 ? handleComplete : handleNext}
              layout="vertical"
            >
              {renderStepContent()}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  type="default"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    type="primary"
                    onClick={handleNext}
                    className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600"
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="bg-green-600 hover:bg-green-700 border-green-600"
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    {loading ? 'Setting up...' : 'Complete Setup'}
                  </Button>
                )}
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OnboardingPage;
