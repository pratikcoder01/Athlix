// In-process streams/events only: no listening HTTP server or native CV runtime.
const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const multer = require('multer');
const { createCvUploadHandler } = require('../dist/utils/cvUploadLifecycle.js');
const { analyzeVideo, MAX_CV_RESPONSE_BYTES } = require('../dist/controllers/cvController.js');

process.env.CV_SERVICE_URL = 'http://127.0.0.1:8000';
process.env.CV_SERVICE_API_KEY = 'cv-lifecycle-test-internal-credential-only';
const nextTurn = () => new Promise(resolve => setImmediate(resolve));
const noError = error => { throw error; };
afterEach(() => mock.restoreAll());
function request() {
  const req = new EventEmitter();
  Object.assign(req, { aborted: false, destroyed: false, body: { consent: 'true' }, user: { _id: '507f1f77bcf86cd799439011' },
    file: { buffer: Buffer.from('video'), mimetype: 'video/mp4', originalname: 'clip.mp4' } });
  req.destroy = () => { req.destroyed = true; }; return req;
}
function response() {
  const res = new EventEmitter();
  Object.assign(res, { destroyed: false, writableFinished: false, writes: 0,
    status(code) { this.code = code; return this; }, json(body) { this.body = body; this.writes++; this.writableFinished = true; return this; },
    setHeader() { return this; }, end() { this.writes++; this.writableFinished = true; return this; } }); return res;
}

test('requests already disconnected during authentication never occupy upload admission', async () => {
  let parses = 0;
  const handler = createCvUploadHandler((_req, _res, next) => { parses++; next(); }, async () => undefined, 1);
  const aborted = request(); aborted.aborted = true; handler(aborted, response(), noError);
  const destroyed = response(); destroyed.destroyed = true; handler(request(), destroyed, noError);
  assert.equal(parses, 0); handler(request(), response(), noError); await nextTurn(); assert.equal(parses, 1);
});

test('premature response close cannot free admission before asynchronous handler cleanup finishes', async () => {
  let complete;
  const handler = createCvUploadHandler((_req, _res, next) => next(), async () => new Promise(resolve => { complete = resolve; }), 1);
  const req = request(), res = response(); handler(req, res, noError);
  res.emit('close'); res.emit('finish');
  let blocked = response(); handler(request(), blocked, noError); assert.equal(blocked.code, 429);
  complete(); await nextTurn(); assert.equal(req.file, undefined);
  const admitted = response(); handler(request(), admitted, noError); assert.equal(admitted.code, undefined);
  complete(); await nextTurn();
});

test('parse error cleanup releases exactly once even with repeated callbacks and close events', async () => {
  const callbacks = [];
  const handler = createCvUploadHandler((_req, _res, next) => callbacks.push(next), async () => { throw Error('Invalid upload must not forward'); }, 1);
  const req = request(), res = response(); handler(req, res, noError);
  callbacks[0](new multer.MulterError('LIMIT_FILE_SIZE')); await nextTurn(); assert.equal(res.code, 413); assert.equal(req.file, undefined);
  callbacks[0](new multer.MulterError('LIMIT_FILE_SIZE')); res.emit('close'); res.emit('finish');
  const pending = response(); handler(request(), pending, noError);
  const blocked = response(); handler(request(), blocked, noError); assert.equal(blocked.code, 429);
  callbacks[1](new multer.MulterError('LIMIT_PART_COUNT')); await nextTurn(); assert.equal(pending.code, 400);
});

test('disconnect during parsing keeps the permit until parser cleanup callback completes', async () => {
  const callbacks = []; let analyses = 0;
  const handler = createCvUploadHandler((_req, _res, next) => callbacks.push(next), async () => { analyses++; }, 1);
  const req = request(), res = response(); handler(req, res, noError); res.emit('close'); assert.equal(req.destroyed, true);
  const blocked = response(); handler(request(), blocked, noError); assert.equal(blocked.code, 429);
  callbacks[0](new Error('Request closed')); await nextTurn(); assert.equal(analyses, 0); assert.equal(req.file, undefined); assert.equal(res.writes, 0);
  handler(request(), response(), noError); callbacks[1](new Error('Cleanup fixture')); await nextTurn();
});

test('actual Multer partial memory upload cleans up after an in-process request disconnect', async () => {
  let analyses = 0;
  const parse = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024, files: 1 } }).single('file');
  const handler = createCvUploadHandler(parse, async () => { analyses++; }, 1);
  const req = new PassThrough(); req.headers = { 'content-type': 'multipart/form-data; boundary=fixture', 'transfer-encoding': 'chunked' };
  req.aborted = false; const res = response(); handler(req, res, noError);
  req.write('--fixture\r\nContent-Disposition: form-data; name="file"; filename="clip.mp4"\r\nContent-Type: video/mp4\r\n\r\npartial-video');
  await nextTurn(); res.emit('close');
  for (let index = 0; index < 4; index++) await nextTurn();
  assert.equal(req.destroyed, true); assert.equal(req.file, undefined); assert.equal(analyses, 0);
  const second = new PassThrough(); second.headers = { 'content-type': 'application/json' }; second.aborted = false;
  const accepted = response(); handler(second, accepted, noError); await nextTurn(); assert.equal(accepted.code, undefined); assert.equal(analyses, 1); second.destroy();
});

for (const event of ['aborted', 'close']) test(`upstream fetch aborts on client ${event} without writing to a disconnected response`, async () => {
  let signal;
  mock.method(global, 'fetch', async (_url, init) => {
    signal = init.signal;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('Controlled upstream abort')), { once: true }));
  });
  const req = request(), res = response(), work = analyzeVideo(req, res);
  if (event === 'aborted') { req.aborted = true; req.emit('aborted'); } else res.emit('close');
  await work; assert.equal(signal.aborted, true); assert.equal(res.writes, 0);
  assert.equal(req.listenerCount('aborted'), 0); assert.equal(res.listenerCount('close'), 0);
});

test('a disconnect after upstream headers cancels the pending response-body read', async () => {
  let cancelled = 0;
  mock.method(global, 'fetch', async () => new Response(new ReadableStream({ start() {}, cancel() { cancelled++; } }), { status: 202 }));
  const req = request(), res = response(), work = analyzeVideo(req, res); await nextTurn(); res.emit('close'); await work;
  assert.equal(cancelled, 1); assert.equal(res.writes, 0); assert.equal(res.listenerCount('close'), 0);
});

test('admission remains occupied through the complete upstream response body', async () => {
  let body;
  mock.method(global, 'fetch', async () => new Response(new ReadableStream({ start(controller) { body = controller; } }), { status: 202 }));
  const handler = createCvUploadHandler((_req, _res, next) => next(), analyzeVideo, 1);
  const req = request(), res = response(); handler(req, res, noError); await nextTurn();
  const blocked = response(); handler(request(), blocked, noError); assert.equal(blocked.code, 429);
  body.enqueue(new TextEncoder().encode('{"task_id":"51c48680-38ce-4cc4-9905-548b310cd5d1","status":"pending"}')); body.close();
  await nextTurn(); await nextTurn(); assert.equal(res.code, 202); assert.equal(req.file, undefined);
});

test('declared and chunked oversized CV responses are cancelled and mapped to a safe 502', async () => {
  for (const declared of [true, false]) {
    let cancelled = 0;
    const responseBody = new ReadableStream({
      start(controller) { if (!declared) controller.enqueue(new Uint8Array(MAX_CV_RESPONSE_BYTES + 1)); },
      cancel() { cancelled++; },
    });
    const fetchMock = mock.method(global, 'fetch', async () => new Response(responseBody, { status: 200,
      headers: declared ? { 'Content-Length': String(MAX_CV_RESPONSE_BYTES + 1) } : {} }));
    const res = response(); await analyzeVideo(request(), res); assert.equal(res.code, 502); assert.equal(cancelled, 1);
    assert.doesNotMatch(JSON.stringify(res.body), /credential|private|buffer/i); fetchMock.mock.restore();
  }
});
