import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  profile: {
    title?: string;
    company?: string;
    location?: string;
    bio?: string;
    skills: string[];
    experience: number;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
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
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    profile: {
      title: String,
      company: String,
      location: String,
      bio: String,
      skills: [String],
      experience: {
        type: Number,
        default: 0,
      },
      linkedinUrl: String,
      githubUrl: String,
      portfolioUrl: String,
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

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
