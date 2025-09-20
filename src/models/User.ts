import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

interface Project {
  name: string;
  description: string;
  url?: string;
}

interface Achievement {
  title: string;
  description: string;
  date?: Date;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate?: Date;
  endDate?: Date;
}

interface Experience {
  company: string;
  position: string;
  startDate?: Date;
  endDate?: Date;
  description: string;
}

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  isOnboarded: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  otp?: string;
  otpExpires?: Date;
  lastOtpSentAt?: Date;
  profile: {
    firstName?: string;
    lastName?: string;
    title?: string;
    company?: string;
    location?: string;
    bio?: string;
    summary?: string;
    skills: string[];
    experience: number;
    experienceYears?: number;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    projects?: Project[];
    achievements?: Achievement[];
    education?: Education[];
    workExperience?: Experience[];
  };
  preferences: {
    jobTypes: string[];
    locations: string[];
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
    remoteWork: boolean;
    notifications: {
      email: boolean;
      push: boolean;
      jobAlerts: boolean;
      applicationUpdates: boolean;
    };
  };
  aiConfig: {
    provider: string;
    apiKey?: string;
    apiUrl?: string;
    model: string;
    enabled: boolean;
  };
  telegramConfig?: {
    botToken?: string;
    chatId?: string;
    enabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    otp: String,
    otpExpires: Date,
    lastOtpSentAt: Date,
    profile: {
      firstName: String,
      lastName: String,
      title: String,
      company: String,
      location: String,
      bio: String,
      summary: String,
      skills: [String],
      experience: {
        type: Number,
        default: 0,
      },
      experienceYears: Number,
      linkedinUrl: String,
      githubUrl: String,
      portfolioUrl: String,
      projects: [{
        name: String,
        description: String,
        url: String,
      }],
      achievements: [{
        title: String,
        description: String,
        date: Date,
      }],
      education: [{
        institution: String,
        degree: String,
        field: String,
        startDate: Date,
        endDate: Date,
      }],
      workExperience: [{
        company: String,
        position: String,
        startDate: Date,
        endDate: Date,
        description: String,
      }],
    },
    preferences: {
      jobTypes: [String],
      locations: [String],
      salaryRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 100000 },
        currency: { type: String, default: 'USD' },
      },
      remoteWork: { type: Boolean, default: false },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        jobAlerts: { type: Boolean, default: true },
        applicationUpdates: { type: Boolean, default: true },
      },
    },
    aiConfig: {
      provider: { type: String, default: 'lm-studio' },
      apiKey: String,
      apiUrl: { type: String, default: 'http://localhost:1234' },
      model: { type: String, default: 'local-model' },
      enabled: { type: Boolean, default: true },
    },
    telegramConfig: {
      botToken: String,
      chatId: String,
      enabled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  const user = this as IUser;

  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

delete mongoose.models['User'];
export default mongoose.model<IUser>('User', UserSchema);
