import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { TrainingEntry } from '../models/TrainingEntry';
import { TrainingPlanModel } from '../models/TrainingPlan';
import { createTrainingSchema, updateTrainingSchema, removeTrainingSchema, recordId, recordListQuery } from '../utils/trainingPolicy';

const entryProjection = '_id date discipline durationMinutes focus notes effort version createdAt updatedAt';
const planProjection = '_id weekOverview days notes createdAt';
const invalid = (res: Response) => res.status(400).json({ success: false, message: 'Invalid training record or pagination' });
const duplicate = (error: unknown) => typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
const entryData = (record: any) => ({ _id: record._id, date: record.date, discipline: record.discipline, durationMinutes: record.durationMinutes,
  focus: record.focus, notes: record.notes, ...(record.effort === undefined ? {} : { effort: record.effort }), version: record.version,
  createdAt: record.createdAt, updatedAt: record.updatedAt });

export const listTrainingEntries = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    const parsed = recordListQuery.safeParse(req.query); if (!parsed.success) return invalid(res);
    const { page, limit } = parsed.data;
    const entries = await TrainingEntry.find({ athleteId: req.user._id, deletedAt: { $exists: false } }).select(entryProjection)
      .sort({ date: -1, _id: -1 }).skip((page - 1) * limit).limit(limit + 1).lean();
    return res.json({ success: true, entries: entries.slice(0, limit).map(entryData), page, hasMore: entries.length > limit });
  } catch (error) { next(error); }
};

export const createTrainingEntry = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    const parsed = createTrainingSchema.safeParse(req.body); if (!parsed.success) return invalid(res);
    const { clientRequestId, ...details } = parsed.data;
    try {
      const entry = await TrainingEntry.create({ ...details, clientRequestId, athleteId: req.user._id, version: 0 });
      return res.status(201).json({ success: true, entry: entryData(entry), message: 'Training entry saved' });
    } catch (error) {
      if (!duplicate(error)) throw error;
      // Retries of the same browser draft cannot create duplicate training work.
      const existing = await TrainingEntry.findOne({ athleteId: req.user._id, clientRequestId }).select(`${entryProjection} deletedAt`).lean();
      if (!existing || existing.deletedAt) return res.status(409).json({ success: false, message: 'This draft was removed. Start a new entry.' });
      if (existing.date !== details.date || existing.discipline !== details.discipline || existing.durationMinutes !== details.durationMinutes ||
          existing.focus !== details.focus || existing.notes !== details.notes || existing.effort !== details.effort) {
        return res.status(409).json({ success: false, message: 'This draft was already saved with different details. Refresh your history before retrying.' });
      }
      return res.status(200).json({ success: true, entry: entryData(existing), message: 'Training entry already saved' });
    }
  } catch (error) { next(error); }
};

export const updateTrainingEntry = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    const parsed = updateTrainingSchema.safeParse(req.body); if (!parsed.success || !recordId.safeParse(req.params.id).success) return invalid(res);
    const { version, ...details } = parsed.data;
    const entry = await TrainingEntry.findOneAndUpdate({ _id: req.params.id, athleteId: req.user._id, version, deletedAt: { $exists: false } },
      { $set: details, ...(details.effort === undefined ? { $unset: { effort: 1 } } : {}), $inc: { version: 1 } }, { new: true, runValidators: true }).select(entryProjection).lean();
    if (!entry) return res.status(409).json({ success: false, message: 'Training entry unavailable or changed. Refresh your history.' });
    return res.json({ success: true, entry: entryData(entry), message: 'Training entry updated' });
  } catch (error) { next(error); }
};

export const removeTrainingEntry = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    const parsed = removeTrainingSchema.safeParse(req.body); if (!parsed.success || !recordId.safeParse(req.params.id).success) return invalid(res);
    const entry = await TrainingEntry.findOneAndUpdate({ _id: req.params.id, athleteId: req.user._id, version: parsed.data.version, deletedAt: { $exists: false } },
      { $set: { deletedAt: new Date() }, $inc: { version: 1 } }, { new: true }).select('_id').lean();
    if (!entry) return res.status(409).json({ success: false, message: 'Training entry unavailable or changed. Refresh your history.' });
    return res.json({ success: true, message: 'Training entry removed from your history' });
  } catch (error) { next(error); }
};

export const listTrainingPlans = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    const parsed = recordListQuery.safeParse(req.query); if (!parsed.success) return invalid(res);
    const { page, limit } = parsed.data;
    const plans = await TrainingPlanModel.find({ athleteId: req.user._id }).select(planProjection).sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit).limit(limit + 1).lean();
    return res.json({ success: true, plans: plans.slice(0, limit), page, hasMore: plans.length > limit });
  } catch (error) { next(error); }
};

export const getTrainingPlan = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (!recordId.safeParse(req.params.id).success) return invalid(res);
    const plan = await TrainingPlanModel.findOne({ _id: req.params.id, athleteId: req.user._id }).select(planProjection).lean();
    if (!plan) return res.status(404).json({ success: false, message: 'Saved plan not found' });
    return res.json({ success: true, plan });
  } catch (error) { next(error); }
};
