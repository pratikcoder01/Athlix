import { Response, NextFunction } from 'express';
import { Academy } from '../models/Academy';
import { AuthenticatedRequest } from '../types';
import { academyCreateSchema, academyQuerySchema, directoryObjectId, literalSearch } from '../utils/directoryPolicy';

const PUBLIC_FIELDS = 'name address location ownerId disciplines description schedule gallery';

export const registerAcademy = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['academy_owner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Approved academy owner access is required' });
    }
    const parsed = academyCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid academy details or coordinates', errors: parsed.error.issues });
    const { longitude, latitude, ...details } = parsed.data;
    const academy = await Academy.create({ ...details, ownerId: req.user._id,
      location: { type: 'Point', coordinates: [longitude, latitude] } });
    return res.status(201).json({ success: true, message: 'Academy listing saved', academy });
  } catch (error) { next(error); }
};

export const getAcademies = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = academyQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid academy filters or pagination' });
    const { search, discipline, lat, lng, maxDistanceKm, mine, page, limit } = parsed.data;
    if (mine && !req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    const nearby = lat !== undefined && lng !== undefined;
    const filter = {
      ...(search ? { name: { $regex: literalSearch(search), $options: 'i' } } : {}),
      ...(discipline ? { disciplines: discipline } : {}),
      ...(mine ? { ownerId: req.user!._id } : {}),
      ...(nearby ? { location: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: (maxDistanceKm || 10) * 1000 } } } : {}),
    };
    let query = Academy.find(filter).select(PUBLIC_FIELDS).populate('ownerId', 'name');
    if (!nearby) query = query.sort({ name: 1, _id: 1 });
    const academies = await query.skip((page - 1) * limit).limit(limit + 1).exec();
    return res.status(200).json({ success: true, count: Math.min(academies.length, limit), page,
      hasMore: academies.length > limit, academies: academies.slice(0, limit) });
  } catch (error) { next(error); }
};

export const getAcademyById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!directoryObjectId.safeParse(req.params.id).success) return res.status(400).json({ success: false, message: 'Invalid academy identifier' });
    const academy = await Academy.findById(req.params.id).select(PUBLIC_FIELDS).populate('ownerId', 'name');
    if (!academy) return res.status(404).json({ success: false, message: 'Academy not found' });
    return res.status(200).json({ success: true, academy });
  } catch (error) { next(error); }
};
