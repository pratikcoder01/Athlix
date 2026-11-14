import { NextFunction, Response } from 'express';
import { Academy } from '../models/Academy';
import { AcademyMember } from '../models/AcademyMember';
import { AcademyAttendance } from '../models/AcademyAttendance';
import { AuthenticatedRequest } from '../types';
import { directoryObjectId, literalSearch } from '../utils/directoryPolicy';
import { academyAttendanceQuerySchema, academyAttendanceSchema, academyListingUpdateSchema,
  academyMemberCreateSchema, academyMemberQuerySchema, academyMemberUpdateSchema,
  academyOwnedFilter, academyVersionFilter, utcDay } from '../utils/academyOperationsPolicy';
import { withAcademyWrite } from '../utils/academyTransaction';

const LISTING_FIELDS = 'name address location ownerId disciplines description schedule gallery isPublished archivedAt version';
const MEMBER_FIELDS = 'academyId memberCode name email discipline beltRank joinedOn status notes permissionRecordedAt version createdAt updatedAt';
const deny = (res: Response, code: number, message: string) => res.status(code).json({ success: false, message });
const duplicate = (error: unknown) => typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;

async function owned(req: AuthenticatedRequest, res: Response) {
  if (!req.user) { deny(res, 401, 'Not authorized'); return null; }
  if (!['academy_owner', 'admin'].includes(req.user.role)) { deny(res, 403, 'Approved academy owner access is required'); return null; }
  if (!directoryObjectId.safeParse(req.params.id).success) { deny(res, 400, 'Invalid academy identifier'); return null; }
  const scope = academyOwnedFilter(req.params.id, req.user);
  const academy = await Academy.findOne(scope).select(LISTING_FIELDS);
  if (!academy) { deny(res, 404, 'Academy not found'); return null; }
  return { scope, academy };
}

export const getAcademyOperations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const access = await owned(req, res); if (!access) return;
    const academyId = access.academy._id;
    const [totalMembers, activeMembers, attendance] = await Promise.all([
      AcademyMember.countDocuments({ academyId }), AcademyMember.countDocuments({ academyId, status: 'active' }),
      AcademyAttendance.aggregate([{ $match: { academyId, date: utcDay() } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    const totals = { present: 0, absent: 0, excused: 0 };
    for (const row of attendance) if (Object.hasOwn(totals, row._id)) totals[row._id as keyof typeof totals] = row.count;
    return res.status(200).json({ success: true, academy: access.academy,
      summary: { totalMembers, activeMembers, inactiveMembers: totalMembers - activeMembers, date: utcDay(), attendance: totals } });
  } catch (error) { next(error); }
};

export const updateAcademyListing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = academyListingUpdateSchema.safeParse(req.body);
    if (!parsed.success) return deny(res, 400, 'Invalid listing changes, coordinates or version');
    const access = await owned(req, res); if (!access) return;
    const { expectedVersion, latitude, longitude, archived, ...details } = parsed.data;
    const changes = { ...details, ...(latitude !== undefined && longitude !== undefined ? { location: { type: 'Point', coordinates: [longitude, latitude] } } : {}),
      ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}) };
    const academy = await Academy.findOneAndUpdate({ ...access.scope, ...academyVersionFilter(expectedVersion) },
      { $set: changes, $inc: { version: 1 } }, { new: true, runValidators: true }).select(LISTING_FIELDS);
    if (!academy) return deny(res, 409, 'The listing changed. Reload before saving again.');
    return res.status(200).json({ success: true, message: archived === true ? 'Academy archived; records retained' : archived === false ? 'Academy restored' : 'Academy listing saved', academy });
  } catch (error) { next(error); }
};

export const getAcademyMembers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = academyMemberQuerySchema.safeParse(req.query);
    if (!parsed.success) return deny(res, 400, 'Invalid member search or pagination');
    const access = await owned(req, res); if (!access) return;
    const { page, limit, search, status } = parsed.data;
    const members = await AcademyMember.find({ academyId: access.academy._id, ...(status ? { status } : {}),
      ...(search ? { $or: [{ name: { $regex: literalSearch(search), $options: 'i' } }, { memberCode: { $regex: literalSearch(search), $options: 'i' } }] } : {}) })
      .select(MEMBER_FIELDS).sort({ name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit + 1).lean();
    return res.status(200).json({ success: true, members: members.slice(0, limit), page, hasMore: members.length > limit });
  } catch (error) { next(error); }
};

export const createAcademyMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = academyMemberCreateSchema.safeParse(req.body);
    if (!parsed.success) return deny(res, 400, 'Invalid member details; permission to store this record is required');
    const access = await owned(req, res); if (!access) return;
    const { permissionConfirmed: _, ...details } = parsed.data;
    const member = await withAcademyWrite(access.scope, async session => {
      const records = await AcademyMember.create([{ ...details, academyId: access.academy._id, permissionRecordedAt: new Date(), status: 'active' }], { session });
      return records[0];
    });
    return res.status(201).json({ success: true, message: 'Member record saved', member });
  } catch (error) {
    if (duplicate(error)) return deny(res, 409, 'This member code already exists in this academy');
    next(error);
  }
};

export const updateAcademyMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = academyMemberUpdateSchema.safeParse(req.body);
    if (!parsed.success || !directoryObjectId.safeParse(req.params.memberId).success) return deny(res, 400, 'Invalid member changes or identifier');
    const access = await owned(req, res); if (!access) return;
    const { expectedVersion, ...details } = parsed.data;
    const member = await withAcademyWrite(access.scope, async session => {
      const saved = await AcademyMember.findOneAndUpdate({ _id: req.params.memberId, academyId: access.academy._id, version: expectedVersion },
        { $set: details, $inc: { version: 1 } }, { new: true, runValidators: true, session }).select(MEMBER_FIELDS);
      if (!saved) throw Object.assign(new Error('Member record changed or is unavailable. Reload before saving.'), { statusCode: 409 });
      return saved;
    });
    return res.status(200).json({ success: true, message: 'Member record saved', member });
  } catch (error) {
    if (duplicate(error)) return deny(res, 409, 'This member code already exists in this academy');
    next(error);
  }
};

export const getAcademyAttendance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = academyAttendanceQuerySchema.safeParse(req.query);
    if (!parsed.success) return deny(res, 400, 'Invalid attendance date or pagination');
    const access = await owned(req, res); if (!access) return;
    const { page, limit } = parsed.data, date = parsed.data.date || utcDay();
    const records = await AcademyAttendance.find({ academyId: access.academy._id, date }).select('academyId memberId date status recordedBy updatedAt')
      .populate({ path: 'memberId', match: { academyId: access.academy._id }, select: 'name memberCode' })
      .sort({ _id: 1 }).skip((page - 1) * limit).limit(limit + 1).lean();
    return res.status(200).json({ success: true, records: records.slice(0, limit), date, page, hasMore: records.length > limit });
  } catch (error) { next(error); }
};

export const recordAcademyAttendance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = academyAttendanceSchema.safeParse(req.body);
    if (!parsed.success) return deny(res, 400, 'Invalid attendance; choose a valid date within the past year');
    const access = await owned(req, res); if (!access) return;
    const { memberId, date, status } = parsed.data;
    const record = await withAcademyWrite(access.scope, async session => {
      const member = await AcademyMember.findOne({ _id: memberId, academyId: access.academy._id, status: 'active' }).session(session).select('_id');
      if (!member) throw Object.assign(new Error('Active member not found in this academy'), { statusCode: 404 });
      return AcademyAttendance.findOneAndUpdate({ academyId: access.academy._id, memberId, date },
        { $set: { status, recordedBy: req.user!._id }, $setOnInsert: { academyId: access.academy._id, memberId, date } },
        { new: true, upsert: true, runValidators: true, session }).select('academyId memberId date status recordedBy updatedAt');
    });
    return res.status(200).json({ success: true, message: 'Attendance saved', record });
  } catch (error) { next(error); }
};
