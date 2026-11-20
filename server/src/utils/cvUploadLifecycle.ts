import { RequestHandler, Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../types';

/** Hold admission through multipart cleanup and the complete upstream response. */
export const createCvUploadHandler = (parse: RequestHandler,
  analyze: (req: AuthenticatedRequest, res: Response) => Promise<unknown>, maximum = 2): RequestHandler => {
  let active = 0;
  return (req: AuthenticatedRequest, res, next) => {
    // Authentication may have awaited the database after the caller left.
    // A closed request will not emit another parser failure event to clean up.
    if (req.aborted || res.destroyed) return;
    if (active >= maximum) return res.status(429).json({ message: 'The analyzer is busy. Please retry shortly.' });
    active++;
    let parsing = true;
    let disconnected: boolean = false;
    let handled = false;
    let released = false;
    const aborted = () => { disconnected = true; };
    const closed = () => {
      if (res.writableFinished) return;
      disconnected = true;
      // Let Multer's request failure path finish removing its own partial
      // buffers. Releasing on response close would admit replacement work while
      // parsing or forwarding still retains the previous upload.
      if (parsing && !req.destroyed) req.destroy();
    };
    const release = () => {
      if (released) return;
      released = true;
      delete req.file;
      req.removeListener('aborted', aborted);
      res.removeListener('close', closed);
      active--;
    };
    req.once('aborted', aborted);
    res.once('close', closed);
    const parsed = async (error?: unknown) => {
      if (handled) return;
      handled = true; parsing = false;
      try {
        if (disconnected || req.aborted || res.destroyed) return;
        if (error) {
          const failure = error as { code?: string; statusCode?: number };
          const status = error instanceof multer.MulterError ? (failure.code === 'LIMIT_FILE_SIZE' ? 413 : 400) : failure.statusCode === 415 ? 415 : 400;
          res.status(status).json({ message: failure.code === 'LIMIT_FILE_SIZE' ? 'Video exceeds the 25 MB upload limit.' : 'Invalid video upload. Use one supported video, consent and an optional request identifier.' });
          return;
        }
        await analyze(req, res);
      } catch (error) {
        if (!disconnected && !res.destroyed) next(error);
      } finally { release(); }
    };
    try { parse(req, res, error => { void parsed(error); }); }
    catch (error) { void parsed(error); }
  };
};
