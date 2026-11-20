import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Registration Payload Validator
export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long').max(128),
  // Public signup never grants operating or administrative privileges.
  role: z.literal('athlete', { error: 'Privileged roles require operator approval' }).default('athlete'),
  discipline: z.string().trim().min(1).max(80).optional().default('BJJ'),
  beltRank: z.string().trim().min(1).max(80).optional().default('White'),
});

export const firebaseLoginSchema = z.object({
  idToken: z.string().min(1, 'Firebase idToken is required').max(16384),
  name: z.string().trim().min(1).max(100).optional(),
  role: z.literal('athlete', { error: 'Privileged roles require operator approval' }).optional(),
  discipline: z.string().trim().min(1).max(80).optional(),
});

// Login Payload Validator
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// Post Feed Payload Validator
export const postSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty'),
  mediaUrl: z.string().optional().default(''),
  mediaType: z.enum(['image', 'video', 'none']).optional().default('none'),
});

// Coaching Session Payload Validator
export const bookingSchema = z.object({
  coachId: z.string().min(1, 'Coach ID is required'),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  durationMinutes: z.number().min(15, 'Minimum duration is 15 minutes'),
  price: z.number().min(0, 'Price cannot be negative'),
});

// Tournament Setup Payload Validator
export const tournamentSchema = z.object({
  title: z.string().min(1, 'Tournament title is required'),
  description: z.string().min(1, 'Tournament description is required'),
  date: z.string().min(1, 'Tournament date is required'),
  registrationDeadline: z.string().min(1, 'Registration deadline is required'),
  location: z.string().min(1, 'Location is required'),
  entryFee: z.number().min(0, 'Entry fee cannot be negative'),
  disciplines: z.array(z.string()).optional(),
});

// Express validation helper middleware
export const validateBody = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }
  // Use parsed defaults/transforms and discard unknown client-controlled fields.
  req.body = result.data;
  next();
};

// AI Seeding Payload Validator
export const seedBracketSchema = z.object({
  tournamentId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid tournament ID'),
  version: z.number().int().nonnegative(),
});

// AI Training Plan Payload Validator
export const trainingPlanSchema = z.object({
  discipline: z.string().min(1, 'Discipline is required'),
  trainingGoal: z.string().min(1, 'Training goal is required'),
  daysAvailablePerWeek: z.number().min(1).max(7).default(7),
  notes: z.string().optional().default(''),
});

// AI Coach Matchmaker Payload Validator
export const matchCoachSchema = z.object({
  query: z.string().min(1, 'Query is required'),
});



