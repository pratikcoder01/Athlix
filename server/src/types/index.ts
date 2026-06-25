import { Types } from 'mongoose';
import { Request } from 'express';
import { IUserDocument } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
  file?: any;
  files?: any;
}

export interface IUser {
  name: string;
  email?: string;           // optional — phone-OTP users may not have email
  phone?: string;           // optional — set for phone-OTP sign-in users
  firebaseUid?: string;     // Firebase UID — set for all Firebase-authenticated users
  password?: string;        // optional — only set for legacy bcrypt users
  role: 'athlete' | 'coach' | 'academy_owner' | 'tournament_organizer' | 'admin';
  isActive?: boolean;
}

export interface IProfile {
  userId: Types.ObjectId;
  bio?: string;
  discipline?: 'Karate' | 'BJJ' | 'Judo' | 'Muay Thai' | 'Taekwondo' | 'Boxing' | 'MMA' | 'Wrestling' | string;
  beltRank?: string;
  achievements?: string[];
  location?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  profileImage?: string;
}

export interface ICoachProfile {
  userId: Types.ObjectId;
  certifications?: string[];
  experienceYears?: number;
  pricingPerHour?: number;
  availability?: Array<{
    dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | string;
    startTime: string; // e.g. "09:00"
    endTime: string;   // e.g. "17:00"
  }>;
  ratings?: number;
  active?: boolean;
  autoConfirm?: boolean;
}

export interface IAcademy {
  name: string;
  address: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  ownerId: Types.ObjectId;
  disciplines?: string[];
  description?: string;
  schedule?: string;
  gallery?: string[];
  membersCount?: number;
}

export interface ISeed {
  fighterId: Types.ObjectId;
  seed: number;
  rationale: string;
}

export interface IMatch {
  p1: string;
  p1_rationale?: string;
  p2: string;
  p2_rationale?: string;
  score: string;
  winner?: string;
}

export interface IRound {
  round: string;
  matches: IMatch[];
}

export interface IBracket {
  seeds: ISeed[];
  rounds: IRound[];
}

export interface ITournament {
  title: string;
  description: string;
  date: Date;
  registrationDeadline: Date;
  location: string;
  entryFee: number;
  disciplines?: string[];
  organizerId: Types.ObjectId;
  registrations?: Types.ObjectId[];
  brackets?: IBracket;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface IPost {
  authorId: Types.ObjectId;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  likes?: Types.ObjectId[];
  commentsCount?: number;
}

export interface IComment {
  authorId: Types.ObjectId;
  postId: Types.ObjectId;
  content: string;
}

export interface IBooking {
  athleteId: Types.ObjectId;
  coachId: Types.ObjectId;
  scheduledTime: Date;
  durationMinutes: number;
  price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export interface INotification {
  recipientId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: 'booking' | 'social' | 'tournament' | 'system';
  message: string;
  read: boolean;
  link?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
