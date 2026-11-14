/** Build/server configuration only; never accept an upstream from a request. */
export function authApiOrigin(environment: NodeJS.ProcessEnv = process.env): string {
  const configured = environment.AUTH_API_ORIGIN?.trim();
  if (!configured && environment.NODE_ENV === 'production') {
    throw new Error('AUTH_API_ORIGIN must explicitly identify the trusted backend origin in production');
  }
  let url: URL;
  try { url = new URL(configured || 'http://127.0.0.1:5000'); }
  catch { throw new Error('AUTH_API_ORIGIN must be an exact HTTP(S) origin'); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!['https:', 'http:'].includes(url.protocol) || (url.protocol !== 'https:' && !loopback) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('AUTH_API_ORIGIN requires HTTPS (or explicit loopback HTTP), no credentials, path, query or fragment');
  }
  return url.origin;
}
