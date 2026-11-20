import { Request, Response, NextFunction } from 'express';
import { LogWriter, writeLog } from './loggingMiddleware';

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: unknown;
  type?: string;
}

export const createErrorHandler = (write: LogWriter = writeLog) => (err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) {
    write({ level: 'error', event: 'http_error', requestId: String(res.locals.requestId || 'unavailable'), status: res.statusCode, category: 'response_interrupted' });
    // The response cannot be replaced after headers have been sent. Close it
    // without passing raw driver/provider detail to Express's fallback logger.
    return res.destroy();
  }
  let status = Number.isInteger(err.statusCode || err.status) ? Number(err.statusCode || err.status) : 500;
  if (status < 400 || status > 599) status = 500;
  let message = status >= 500 ? 'The server could not complete the request. Please try again.' :
    (err.message || 'Request could not be completed').replace(/[\r\n\x00-\x1f]/g, ' ').slice(0, 240);
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON request body'; }
  else if (err.type === 'entity.too.large' || status === 413) { status = 413; message = 'Request body exceeds the size limit'; }
  else if (err.code === 11000) { status = 409; message = 'A record with these details already exists'; }
  else if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; }
  else if (err.name === 'ValidationError') { status = 400; message = 'Request validation failed'; }
  else if (err.name === 'VersionError') { status = 409; message = 'The record changed. Reload and try again.'; }
  const requestId = String(res.locals.requestId || 'unavailable');
  // Raw driver/provider errors can contain credentials, submitted fields and
  // user data. Correlate a bounded category instead; never log their message/stack.
  write({ level: 'error', event: 'http_error', requestId, status,
    category: ['CastError', 'ValidationError', 'VersionError', 'SyntaxError'].includes(err.name) ? err.name : status >= 500 ? 'internal_error' : 'request_error' });
  return res.status(status).json({ success: false, message, requestId });
};

export const errorHandler = createErrorHandler();

export default errorHandler;
