/** The same explicit browser origin policy applies to HTTP and Socket.IO. */
export const createOriginPolicy = (environment: NodeJS.ProcessEnv = process.env) => {
  const configured = environment.ALLOWED_ORIGIN?.trim();
  if (!configured && environment.NODE_ENV === 'production') {
    throw new Error('ALLOWED_ORIGIN must list trusted client origins in production');
  }

  const origins = (configured || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((value) => {
      const origin = value.trim();
      let parsed: URL;
      try {
        parsed = new URL(origin);
      } catch {
        throw new Error('ALLOWED_ORIGIN must contain explicit HTTP(S) origins');
      }
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password ||
          parsed.pathname !== '/' || parsed.search || parsed.hash) {
        throw new Error('ALLOWED_ORIGIN must contain explicit HTTP(S) origins');
      }
      return parsed.origin;
    });

  const trustedOrigins = new Set(origins);
  // Native clients have no Origin header and must still authenticate normally.
  const isAllowed = (origin: string | undefined): boolean =>
    origin === undefined || trustedOrigins.has(origin);

  return {
    isAllowed,
    origin: (origin: string | undefined, callback: (error: Error | null, allowed?: boolean) => void) => {
      callback(null, isAllowed(origin));
    },
  };
};
