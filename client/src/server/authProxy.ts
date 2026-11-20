/** Build/server configuration only; never accept an upstream from a request. */
export function authApiOrigin(environment: NodeJS.ProcessEnv = process.env): string {
  // Existing deployments already configure the direct API origin. Reuse that
  // operator-controlled value when no dedicated auth upstream was supplied.
  // A nonblank override remains authoritative, including when it is invalid.
  const configured = environment.AUTH_API_ORIGIN?.trim() || environment.NEXT_PUBLIC_API_URL?.trim();
  if (!configured && environment.NODE_ENV === 'production') {
    throw new Error('Set AUTH_API_ORIGIN or NEXT_PUBLIC_API_URL to the trusted backend HTTPS origin before building for production');
  }
  let url: URL;
  try { url = new URL(configured || 'http://127.0.0.1:5000'); }
  catch { throw new Error('Auth backend (AUTH_API_ORIGIN or NEXT_PUBLIC_API_URL) must be an exact HTTP(S) origin'); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!['https:', 'http:'].includes(url.protocol) || (url.protocol !== 'https:' && !loopback) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Auth backend (AUTH_API_ORIGIN or NEXT_PUBLIC_API_URL) requires HTTPS (or explicit loopback HTTP), no credentials, path, query or fragment');
  }
  return url.origin;
}
