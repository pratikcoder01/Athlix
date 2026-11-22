import { Router } from 'express';
import mongoose from 'mongoose';

export const createHealthRoutes = (databaseReady = () => mongoose.connection.readyState === 1) => {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ success: true, status: 'alive' });
  });
  router.get('/ready', (req, res) => {
    const ready = !req.app.locals.draining && databaseReady();
    res.setHeader('Cache-Control', 'no-store');
    res.status(ready ? 200 : 503).json({ success: ready, status: ready ? 'ready' : 'not_ready' });
  });
  return router;
};
