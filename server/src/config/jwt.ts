import { hasMinimumSecretStrength } from './runtime';

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required but not set');
  }
  if (process.env.NODE_ENV === 'production' && !hasMinimumSecretStrength(secret)) {
    throw new Error('Production JWT_SECRET must be a securely generated value of at least 32 characters');
  }
  return secret;
};
