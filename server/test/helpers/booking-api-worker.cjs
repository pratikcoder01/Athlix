// Isolated API process used only by the opt-in loopback MongoDB integration test.
const mongoose = require('mongoose');
const express = require('express');
const { safeLocalMongoUri, safeTestDbName } = require('./localMongo.cjs');
const { Notification } = require('../../dist/models/Notification.js');
const { updateCoachProfile } = require('../../dist/controllers/profileController.js');
const protect = require('../../dist/middleware/authMiddleware.js').default;

let server;
async function main() {
  const uri = safeLocalMongoUri(process.env.TEST_MONGO_URI);
  const dbName = safeTestDbName(process.env.ATHLIX_TEST_DB_NAME);
  if (!process.env.JWT_SECRET) throw new Error('Test JWT secret is required');
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
  if (process.env.ATHLIX_TEST_FAIL_NOTIFICATIONS === 'true') {
    Notification.create = async () => { throw new Error('Injected notification storage failure'); };
  }
  const app = express();
  app.use(express.json());
  app.use('/api/bookings', require('../../dist/routes/bookingRoutes.js').default);
  app.put('/api/profiles/coach', protect, updateCoachProfile);
  app.use((_error, _req, res, _next) => res.status(500).json({ success: false, message: 'Test request failed' }));
  server = app.listen(0, '127.0.0.1', () => process.send?.({ ready: true, port: server.address().port }));
}

process.on('message', async message => {
  if (message?.type !== 'shutdown') return;
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  process.exit(0);
});
main().catch(() => { process.send?.({ error: 'Isolated test API failed to initialize' }); process.exitCode = 1; });
