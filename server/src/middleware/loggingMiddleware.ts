import { randomUUID } from 'crypto';
import { RequestHandler } from 'express';

export type LogEvent = { level: 'info' | 'error'; event: string; [field: string]: string | number | boolean };
export type LogWriter = (event: LogEvent) => void;
export const writeLog: LogWriter = (event) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), ...event }));

/** Never record arbitrary URL/query/body/header values or caller-supplied IDs. */
export const createRequestLogger = (write: LogWriter = writeLog): RequestHandler => (req, res, next) => {
  const requestId = randomUUID();
  const started = process.hrtime.bigint();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  let recorded = false;
  const record = () => {
    if (recorded) return;
    recorded = true;
    write({ level: 'info', event: 'http_request', requestId,
      method: req.method, route: typeof req.route?.path === 'string' ? req.route.path : 'unmatched',
      status: res.statusCode, durationMs: Math.round(Number(process.hrtime.bigint() - started) / 1_000_000),
      completed: res.writableFinished });
  };
  res.once('finish', record);
  res.once('close', record);
  next();
};

export const loggingMiddleware = createRequestLogger();

export default loggingMiddleware;
