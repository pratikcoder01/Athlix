import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { sessionExists, sessionVersion, verifyAccessToken } from '../utils/sessions';
import { AuthenticatedRequest } from '../types';

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const match = req.headers.authorization?.match(/^Bearer ([^\s]+)$/);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = verifyAccessToken(match[1]);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.isActive !== true || sessionVersion(user) !== decoded.ver || !await sessionExists(decoded.sid, decoded.id, decoded.ver)) {
      return res.status(401).json({ success: false, message: 'Not authorized, account unavailable' });
    }

    req.user = user;
    req.sessionId = decoded.sid;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};
export default protect;
