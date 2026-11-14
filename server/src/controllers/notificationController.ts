import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Notification } from '../models/Notification';
import { notificationQuery, notificationReadSchema, recordId, safeNotificationLink } from '../utils/trainingPolicy';
import { z } from 'zod';
const publicNotification = (record: any) => ({ _id: record._id, type: record.type, message: record.message, read: record.read,
  link: safeNotificationLink(record.link), createdAt: record.createdAt });

export const listNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    const parsed = notificationQuery.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid notification filters' });
    const { page, limit, unreadOnly } = parsed.data;
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientId: req.user._id, ...(unreadOnly === 'true' ? { read: false } : {}) })
        .select('_id type message read link createdAt').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit + 1).lean(),
      Notification.countDocuments({ recipientId: req.user._id, read: false }),
    ]);
    return res.json({ success: true, notifications: notifications.slice(0, limit).map(publicNotification), unreadCount, page, hasMore: notifications.length > limit });
  } catch (error) { next(error); }
};

export const setNotificationRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    const parsed = notificationReadSchema.safeParse(req.body);
    if (!parsed.success || !recordId.safeParse(req.params.id).success) return res.status(400).json({ success: false, message: 'Invalid notification update' });
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipientId: req.user._id }, { $set: { read: parsed.data.read } },
      { new: true, runValidators: true }).select('_id type message read link createdAt').lean();
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, notification: publicNotification(notification) });
  } catch (error) { next(error); }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (!z.object({}).strict().safeParse(req.body).success) return res.status(400).json({ success: false, message: 'Invalid notification update' });
    // A notification written after this request starts remains unread.
    const result = await Notification.updateMany({ recipientId: req.user._id, read: false, createdAt: { $lte: new Date() } }, { $set: { read: true } });
    return res.json({ success: true, changed: result.modifiedCount });
  } catch (error) { next(error); }
};
