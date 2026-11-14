import { z } from 'zod';

export const bookingObjectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
export const bookingCurrencies = ['INR', 'USD'] as const;
export const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const money = z.number().finite().min(0).max(1000000).refine(
  value => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, 'Use at most two decimal places');
const sessionAmount = z.number().finite().min(0).max(4000000).refine(
  value => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, 'Use at most two decimal places');

export const createBookingSchema = z.object({
  coachId: bookingObjectIdSchema,
  scheduledTime: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(15).max(240).multipleOf(15),
  // Accepted only for old clients; never used to calculate the stored price.
  price: sessionAmount.optional(),
  quotedPrice: sessionAmount.optional(),
  quotedCurrency: z.enum(bookingCurrencies).optional(),
}).strict().refine(value => (value.quotedPrice === undefined) === (value.quotedCurrency === undefined),
  'Provide both quoted price and currency, or neither');

export const bookingStatusSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'completed', 'cancelled']),
}).strict();

export const bookingListSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

export const coachQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  discipline: z.enum(['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA', 'Wrestling', 'Other']).optional(),
  coachId: bookingObjectIdSchema.optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
}).strict();

const clock = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm in UTC');
const availabilityWindowSchema = z.object({
  dayOfWeek: z.enum(weekdays), startTime: clock, endTime: clock,
}).strict().refine(value => value.startTime < value.endTime, 'End time must be after start time on the same UTC day');

export const coachSettingsSchema = z.object({
  certifications: z.array(z.string().trim().min(1).max(150)).max(10).optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
  pricingPerHour: money.optional(),
  currency: z.enum(bookingCurrencies).optional(),
  availabilityTimezone: z.literal('UTC').optional(),
  availability: z.array(availabilityWindowSchema).max(21).optional(),
  active: z.boolean().optional(), autoConfirm: z.boolean().optional(),
}).strict().refine(value => Object.keys(value).length > 0, 'No changes provided').superRefine((value, context) => {
  const windows = value.availability || [];
  for (let index = 0; index < windows.length; index++) {
    if (windows.some((other, otherIndex) => otherIndex < index && other.dayOfWeek === windows[index].dayOfWeek &&
        other.startTime < windows[index].endTime && other.endTime > windows[index].startTime)) {
      context.addIssue({ code: 'custom', path: ['availability', index], message: 'Availability windows must not overlap' });
    }
  }
});

export class BookingPolicyError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}

export const sessionPrice = (hourlyRate: number, durationMinutes: number) => {
  if (!money.safeParse(hourlyRate).success || !Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240 || durationMinutes % 15 !== 0) {
    throw new BookingPolicyError(400, 'Coach rate or session duration is invalid');
  }
  return Math.round(Math.round(hourlyRate * 100) * durationMinutes / 60) / 100;
};

export const validateSessionTime = (scheduledTime: string, now = Date.now()) => {
  const start = new Date(scheduledTime);
  if (!Number.isFinite(start.getTime()) || start.getTime() <= now || start.getTime() > now + 90 * 86400000) {
    throw new BookingPolicyError(400, 'Choose a future session within the next 90 days');
  }
  if (start.getUTCMinutes() % 15 !== 0 || start.getUTCSeconds() !== 0 || start.getUTCMilliseconds() !== 0) {
    throw new BookingPolicyError(400, 'Sessions must start on a 15-minute boundary');
  }
  return start;
};

export type CoachSchedule = {
  active?: boolean; pricingPerHour?: number; currency?: string; availabilityTimezone?: string;
  availability?: Array<{ dayOfWeek: string; startTime: string; endTime: string }>;
};

export const validatePublishedCoach = (profile: CoachSchedule | null) => {
  if (!profile || profile.active !== true || profile.availabilityTimezone !== 'UTC' ||
      !bookingCurrencies.includes(profile.currency as typeof bookingCurrencies[number]) ||
      !money.safeParse(profile.pricingPerHour).success || !profile.availability?.length) {
    throw new BookingPolicyError(409, 'Coach has not published a valid rate and UTC availability');
  }
};

export const isWithinAvailability = (profile: CoachSchedule, start: Date, durationMinutes: number) => {
  const startMinute = start.getUTCHours() * 60 + start.getUTCMinutes();
  const endMinute = startMinute + durationMinutes;
  return endMinute <= 1440 && !!profile.availability?.some(window => {
    const [startHour, startMin] = window.startTime.split(':').map(Number);
    const [endHour, endMin] = window.endTime.split(':').map(Number);
    return window.dayOfWeek === weekdays[start.getUTCDay()] &&
      startMinute >= startHour * 60 + startMin && endMinute <= endHour * 60 + endMin;
  });
};

export const canChangeBookingStatus = (current: string, next: string, actor: 'coach' | 'athlete', start: number, end: number, now = Date.now()) => {
  if (actor === 'athlete' && next !== 'cancelled') return false;
  if (current === next) return true;
  if (!['pending', 'accepted'].includes(current)) return false;
  if (next === 'cancelled') return now < start;
  if (actor !== 'coach') return false;
  if (next === 'accepted') return current === 'pending' && now < start;
  if (next === 'rejected') return current === 'pending';
  return next === 'completed' && current === 'accepted' && now >= end;
};
