import { z } from 'zod';

export const directoryObjectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
export const disciplineSchema = z.enum(['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA', 'Wrestling', 'Other']);
const httpsUrl = z.string().trim().max(2048).url().refine(value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}, 'Use an HTTPS URL without credentials');
const optionalUrl = z.union([httpsUrl, z.literal('')]);
export const profileUpdateSchema = z.object({
  bio: z.string().trim().max(2000).optional(),
  discipline: disciplineSchema.optional(),
  beltRank: z.string().trim().max(80).optional(),
  achievements: z.array(z.string().trim().min(1).max(200)).max(30).optional(),
  location: z.string().trim().max(200).optional(),
  profileImage: optionalUrl.optional(),
  socialLinks: z.object({ instagram: optionalUrl.optional(), twitter: optionalUrl.optional(), linkedin: optionalUrl.optional() }).strict().optional(),
}).strict().refine(value => Object.keys(value).length > 0, 'No profile changes provided');

const pagination = {
  page: z.preprocess(value => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value, z.number().int().min(1).max(10000)).default(1),
  limit: z.preprocess(value => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value, z.number().int().min(1).max(50)).default(24),
};
export const profileQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  discipline: disciplineSchema.optional(),
  role: z.enum(['athlete', 'coach', 'academy_owner', 'tournament_organizer']).optional(),
  ...pagination,
}).strict();

export const academyCreateSchema = z.object({
  name: z.string().trim().min(1).max(150),
  address: z.string().trim().min(1).max(300),
  longitude: z.number().finite().min(-180).max(180),
  latitude: z.number().finite().min(-90).max(90),
  disciplines: z.array(disciplineSchema).min(1).max(9),
  description: z.string().trim().max(2000).default(''),
  schedule: z.string().trim().max(1000).default(''),
  gallery: z.array(httpsUrl).max(8).default([]),
}).strict();

const queryNumber = (minimum: number, maximum: number) => z.string().trim().min(1).max(32)
  .transform(value => Number(value)).pipe(z.number().finite().min(minimum).max(maximum));
export const academyQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  discipline: disciplineSchema.optional(),
  lat: queryNumber(-90, 90).optional(),
  lng: queryNumber(-180, 180).optional(),
  maxDistanceKm: queryNumber(0.1, 100).optional(),
  mine: z.literal('true').optional(),
  ...pagination,
}).strict().superRefine((value, context) => {
  if ((value.lat === undefined) !== (value.lng === undefined)) context.addIssue({ code: 'custom', message: 'Latitude and longitude must be provided together' });
  if (value.maxDistanceKm !== undefined && value.lat === undefined) context.addIssue({ code: 'custom', message: 'Distance filtering requires coordinates' });
});

export const literalSearch = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
