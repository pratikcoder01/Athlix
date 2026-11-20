import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { randomUUID } from 'crypto';

export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
export const MAX_CV_RESPONSE_BYTES = 32 * 1024 * 1024;
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

async function forward(req: AuthenticatedRequest, res: Response, path: string, init: RequestInit = {}, requestId?: string) {
  const config = serviceConfig();
  if (!config || !req.user) return res.status(503).json({ message: 'Video analysis is unavailable.' });
  const disconnected = new AbortController();
  const abort = () => disconnected.abort();
  const close = () => { if (!res.writableFinished) abort(); };
  req.once('aborted', abort);
  res.once('close', close);
  const signal = AbortSignal.any([AbortSignal.timeout(30_000), disconnected.signal]);
  try {
    if (req.aborted || res.destroyed) { abort(); return; }
    const response = await fetch(`${config.url}${path}`, {
      ...init,
      headers: { 'X-Athlix-Service-Key': config.secret, 'X-Athlix-User': String(req.user._id), ...(requestId ? { 'X-Athlix-Request-ID': requestId } : {}) },
      signal,
      redirect: 'error',
    });
    if (disconnected.signal.aborted || res.destroyed) {
      void response.body?.cancel().catch(() => undefined);
      return;
    }
    if (response.status === 204) return res.status(204).end();
    const payload = await boundedCvJson(response, signal) as { detail?: unknown };
    if (disconnected.signal.aborted || res.destroyed) return;
    if (!response.ok) {
      const status = [400, 404, 409, 413, 415, 422, 429, 503].includes(response.status) ? response.status : 502;
      const message = typeof payload.detail === 'string' && status !== 502 ? payload.detail.slice(0, 500) : 'The video service could not complete the request.';
      return res.status(status).json({ message });
    }
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(response.status).json(payload);
  } catch {
    if (disconnected.signal.aborted || res.destroyed) return;
    return res.status(502).json({ message: 'The video service is unavailable. Please retry later.' });
  } finally {
    req.removeListener('aborted', abort);
    res.removeListener('close', close);
  }
}

/** Bound chunked as well as declared responses, and cancel pending reads on disconnect. */
async function boundedCvJson(response: globalThis.Response, signal: AbortSignal): Promise<unknown> {
  if (!response.body) throw new Error('Missing CV response body');
  const declared = response.headers.get('content-length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > MAX_CV_RESPONSE_BYTES) {
    void response.body.cancel().catch(() => undefined);
    throw new Error('CV response exceeds the response budget');
  }
  const reader = response.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener('abort', cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    signal.throwIfAborted();
    while (true) {
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_CV_RESPONSE_BYTES) { cancel(); throw new Error('CV response exceeds the response budget'); }
      chunks.push(value);
    }
    const payload: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid CV response');
    return payload;
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

export async function analyzeVideo(req: AuthenticatedRequest, res: Response) {
  if (Object.keys(req.body).some(key => key !== 'consent' && key !== 'requestId')) return res.status(400).json({ message: 'Invalid video upload fields.' });
  if (req.body.consent !== 'true') return res.status(400).json({ message: 'Consent to server-side video processing is required.' });
  if (!req.file?.buffer?.length) return res.status(400).json({ message: 'Choose a video file.' });
  if (req.body.requestId !== undefined && (typeof req.body.requestId !== 'string' || !UUID_PATTERN.test(req.body.requestId))) {
    return res.status(400).json({ message: 'Invalid analysis request identifier. Select your video again.' });
  }
  const data = new FormData();
  const bytes = Uint8Array.from(req.file.buffer as Buffer);
  data.append('file', new Blob([bytes], { type: req.file.mimetype }), req.file.originalname);
  return forward(req, res, '/analyze', { method: 'POST', body: data }, req.body.requestId || randomUUID());
}

export async function getVideoStatus(req: AuthenticatedRequest, res: Response) {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(400).json({ message: 'Invalid analysis identifier.' });
  return forward(req, res, `/status/${req.params.id}`);
}

export async function deleteVideoResult(req: AuthenticatedRequest, res: Response) {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(400).json({ message: 'Invalid analysis identifier.' });
  return forward(req, res, `/status/${req.params.id}`, { method: 'DELETE' });
}
