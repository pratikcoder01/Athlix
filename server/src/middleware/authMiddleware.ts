import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { getJwtSecret } from '../config/jwt';
import { AuthenticatedRequest } from '../types';

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const match = req.headers.authorization?.match(/^Bearer ([^\s]+)$/);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(match[1], getJwtSecret(), { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || typeof decoded.id !== 'string' ||
        !/^[a-f\d]{24}$/i.test(decoded.id) || typeof decoded.exp !== 'number') {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.isActive !== true) {
      return res.status(401).json({ success: false, message: 'Not authorized, account unavailable' });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};
export default protect;
