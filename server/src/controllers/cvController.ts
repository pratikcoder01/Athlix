import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';

export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serviceConfig() {
  const secret = process.env.CV_SERVICE_API_KEY || '';
  if (secret.length < 32 || !process.env.CV_SERVICE_URL) return null;
  try {
    const url = new URL(process.env.CV_SERVICE_URL);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return null;
    return { url: url.origin, secret };
  } catch {
    return null;
  }
}

export function requireCvConfigured(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!serviceConfig()) {
    return res.status(503).json({ message: 'Video analysis is not configured. Please try again later.' });
  }
  return next();
}

async function forward(req: AuthenticatedRequest, res: Response, path: string, init: RequestInit = {}) {
  const config = serviceConfig();
  if (!config || !req.user) return res.status(503).json({ message: 'Video analysis is unavailable.' });
  try {
    const response = await fetch(`${config.url}${path}`, {
      ...init,
      headers: { 'X-Athlix-Service-Key': config.secret, 'X-Athlix-User': String(req.user._id) },
      signal: AbortSignal.timeout(30_000),
      redirect: 'error',
    });
    if (response.status === 204) return res.status(204).end();
    const payload = await response.json() as { detail?: unknown };
    if (!response.ok) {
      const status = [400, 404, 409, 413, 415, 422, 429, 503].includes(response.status) ? response.status : 502;
      const message = typeof payload.detail === 'string' && status !== 502 ? payload.detail : 'The video service could not complete the request.';
      return res.status(status).json({ message });
    }
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(response.status).json(payload);
  } catch {
    return res.status(502).json({ message: 'The video service is unavailable. Please retry later.' });
  }
}

export async function analyzeVideo(req: AuthenticatedRequest, res: Response) {
  if (req.body.consent !== 'true') return res.status(400).json({ message: 'Consent to server-side video processing is required.' });
  if (!req.file?.buffer?.length) return res.status(400).json({ message: 'Choose a video file.' });
  const data = new FormData();
  const bytes = Uint8Array.from(req.file.buffer as Buffer);
  data.append('file', new Blob([bytes], { type: req.file.mimetype }), req.file.originalname);
  return forward(req, res, '/analyze', { method: 'POST', body: data });
}

export async function getVideoStatus(req: AuthenticatedRequest, res: Response) {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(400).json({ message: 'Invalid analysis identifier.' });
  return forward(req, res, `/status/${req.params.id}`);
}

export async function deleteVideoResult(req: AuthenticatedRequest, res: Response) {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(400).json({ message: 'Invalid analysis identifier.' });
  return forward(req, res, `/status/${req.params.id}`, { method: 'DELETE' });
}
