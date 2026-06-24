import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

export interface IUserDocument extends IUser, Document {
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: false,        // optional — phone-OTP users may not have email
      unique: true,
      sparse: true,           // sparse so multiple null values are allowed
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,           // phone-only users; email users leave this null
      trim: true,
      index: true,
    },
    /**
     * firebaseUid — the UID issued by Firebase for this identity.
     * Populated on first Firebase sign-in; absent for legacy bcrypt users.
     */
    firebaseUid: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
    /**
     * password — only set for legacy email+bcrypt accounts.
     * Firebase-authenticated users leave this undefined.
     */
    password: {
      type: String,
      required: false,
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: ['athlete', 'coach', 'academy_owner', 'tournament_organizer', 'admin'],
      default: 'athlete',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving — only if a plaintext password is present
UserSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.password || !this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password — safe to call even on Firebase-only users (returns false)
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = model<IUserDocument>('User', UserSchema);
