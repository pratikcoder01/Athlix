import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Registration Payload Validator
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['athlete', 'coach', 'academy_owner', 'tournament_organizer', 'admin']).default('athlete'),
  discipline: z.string().optional().default('BJJ'),
  beltRank: z.string().optional().default('White'),
});

// Login Payload Validator
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
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
  try {
    schema.parse(req.body);
    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }
};

// AI Seeding Payload Validator
export const seedBracketSchema = z.object({
  tournamentId: z.string().min(1, 'tournamentId is required'),
});

// AI Training Plan Payload Validator
export const trainingPlanSchema = z.object({
  discipline: z.string().min(1, 'Discipline is required'),
  trainingGoal: z.string().min(1, 'Training goal is required'),
  daysAvailablePerWeek: z.number().min(1).max(7).default(7),
  notes: z.string().optional().default(''),
});


