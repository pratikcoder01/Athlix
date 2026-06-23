import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have permission to perform this action (${roles.join(', ')} required)`,
      });
    }
    next();
  };
};

export default restrictTo;
