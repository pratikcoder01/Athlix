import { Response, NextFunction } from 'express';
import { Types, PipelineStage } from 'mongoose';
import { AuthenticatedRequest } from '../types';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { CoachClientNote } from '../models/CoachClientNote';
import { clientNotesSchema, recordId, recordListQuery } from '../utils/trainingPolicy';

const requireCoach = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, message: 'Not authorized' }); return false; }
  if (req.user.role !== 'coach') { res.status(403).json({ success: false, message: 'Approved coach account required' }); return false; }
  return true;
};
const relationship = (coachId: unknown, athleteId: string) => ({ coachId, athleteId, status: { $in: ['accepted', 'completed'] } });

export const listCoachClients = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireCoach(req, res)) return;
    const parsed = recordListQuery.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid client pagination' });
    const { page, limit } = parsed.data;
    const pipeline: PipelineStage[] = [
      { $match: { coachId: new Types.ObjectId(String(req.user!._id)), status: { $in: ['accepted', 'completed'] } } },
      { $group: { _id: '$athleteId', sessions: { $sum: 1 }, completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        lastScheduledTime: { $max: '$scheduledTime' } } },
      { $sort: { lastScheduledTime: -1, _id: 1 } }, { $skip: (page - 1) * limit }, { $limit: limit + 1 },
      { $lookup: { from: User.collection.name, localField: '_id', foreignField: '_id', as: 'account' } },
      { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: Profile.collection.name, localField: '_id', foreignField: 'userId', as: 'profile' } },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, name: { $ifNull: ['$account.name', 'Former member'] }, discipline: { $ifNull: ['$profile.discipline', ''] },
        beltRank: { $ifNull: ['$profile.beltRank', ''] }, sessions: 1, completedSessions: 1, lastScheduledTime: 1 } },
    ];
    const clients = await Booking.aggregate(pipeline).exec();
    return res.json({ success: true, clients: clients.slice(0, limit), page, hasMore: clients.length > limit });
  } catch (error) { next(error); }
};

export const getCoachClient = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireCoach(req, res)) return;
    if (!recordId.safeParse(req.params.id).success || !recordListQuery.safeParse(req.query).success) return res.status(400).json({ success: false, message: 'Invalid client details' });
    const { page, limit } = recordListQuery.parse(req.query);
    if (!await Booking.exists(relationship(req.user!._id, req.params.id))) return res.status(404).json({ success: false, message: 'No accepted coaching relationship found' });
    const [account, profile, notes, sessions] = await Promise.all([
      User.findById(req.params.id).select('_id name').lean(),
      Profile.findOne({ userId: req.params.id }).select('discipline beltRank').lean(),
      CoachClientNote.findOne({ coachId: req.user!._id, athleteId: req.params.id }).select('notes version updatedAt').lean(),
      Booking.find({ coachId: req.user!._id, athleteId: req.params.id }).select('_id scheduledTime durationMinutes status')
        .sort({ scheduledTime: -1, _id: -1 }).skip((page - 1) * limit).limit(limit + 1).lean(),
    ]);
    return res.json({ success: true, client: { id: req.params.id, name: account?.name || 'Former member', discipline: profile?.discipline || '', beltRank: profile?.beltRank || '' },
      notes: { text: notes?.notes || '', version: notes?.version || 0, updatedAt: notes?.updatedAt },
      sessions: sessions.slice(0, limit), page, hasMore: sessions.length > limit });
  } catch (error) { next(error); }
};

export const saveCoachClientNotes = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireCoach(req, res)) return;
    const parsed = clientNotesSchema.safeParse(req.body);
    if (!parsed.success || !recordId.safeParse(req.params.id).success) return res.status(400).json({ success: false, message: 'Invalid client notes' });
    if (!await Booking.exists(relationship(req.user!._id, req.params.id))) return res.status(404).json({ success: false, message: 'No accepted coaching relationship found' });
    const { notes, version } = parsed.data;
    try {
      const updated = await CoachClientNote.findOneAndUpdate({ coachId: req.user!._id, athleteId: req.params.id, version },
        { $set: { notes }, $inc: { version: 1 } }, { new: true, runValidators: true, upsert: version === 0, setDefaultsOnInsert: false }).select('notes version updatedAt').lean();
      if (!updated) return res.status(409).json({ success: false, message: 'Client notes changed. Reload before saving.' });
      return res.json({ success: true, message: 'Private coaching notes saved', notes: { text: updated.notes, version: updated.version, updatedAt: updated.updatedAt } });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) return res.status(409).json({ success: false, message: 'Client notes changed. Reload before saving.' });
      throw error;
    }
  } catch (error) { next(error); }
};
