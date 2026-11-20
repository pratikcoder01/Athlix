import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { disciplineSchema, directoryObjectId } from './directoryPolicy';

export const aiCoachingEnabled = () => process.env.AI_COACHING_ENABLED === 'true';
export const aiDisabledMessage = 'Experimental AI coaching is disabled. Use the published coach directory and saved account workflows.';
export const requireAiCoachingEnabled = (_req: Request, res: Response, next: NextFunction) => {
  if (!aiCoachingEnabled()) return res.status(503).json({ success: false, message: aiDisabledMessage });
  next();
};

const shortText = (maximum: number) => z.string().trim().min(1).max(maximum);
const day = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
export const aiTrainingRequestSchema = z.object({
  discipline: disciplineSchema,
  trainingGoal: shortText(500),
  daysAvailablePerWeek: z.number().int().min(1).max(7).default(7),
  notes: z.string().trim().max(2000).default(''),
}).strict();
export const aiPlanSchema = z.object({
  weekOverview: shortText(2000),
  days: z.array(z.object({
    day, focus: shortText(200), drills: z.array(shortText(200)).min(1).max(20),
    duration: shortText(80), intensity: z.enum(['low', 'medium', 'high']),
  }).strict()).min(1).max(7).refine(days => new Set(days.map(value => value.day)).size === days.length, 'Days must be unique'),
  notes: z.string().trim().max(3000),
}).strict();
export const aiSavePlanSchema = z.object({ plan: aiPlanSchema }).strict();
export const aiMatchRequestSchema = z.object({ query: shortText(500), location: z.string().trim().max(200).optional() }).strict();
export const aiMatchOutputSchema = z.object({ matches: z.array(z.object({
  coachId: directoryObjectId, matchScore: z.number().int().min(0).max(100), reason: shortText(500),
}).strict()).max(5).refine(matches => new Set(matches.map(value => value.coachId)).size === matches.length, 'Coach matches must be unique') }).strict();
export const aiNudgeRequestSchema = z.object({
  currentPeriodHours: z.number().finite().min(0).max(168),
  trailingAverageHours: z.number().finite().positive().max(168),
}).strict();
export const aiNudgeOutputSchema = z.object({ nudge: shortText(120) }).strict();

// An explicit allowlist protects both the external-provider roster and API output,
// even if a database projection accidentally acquires an extra field in future.
const clock = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const aiPublicCoachSchema = z.object({
  id: directoryObjectId, name: shortText(100), discipline: disciplineSchema,
  beltRank: z.string().max(80).default(''), location: z.string().max(200).default(''),
  experienceYears: z.number().int().min(0).max(80).default(0),
  certifications: z.array(shortText(150)).max(10).default([]),
  pricingPerHour: z.number().finite().min(0).max(1000000), currency: z.enum(['INR', 'USD']),
  availabilityTimezone: z.literal('UTC'),
  availability: z.array(z.object({ dayOfWeek: day, startTime: clock, endTime: clock }).strip()
    .refine(window => window.startTime < window.endTime)).min(1).max(21),
}).strip();
