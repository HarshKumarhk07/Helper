import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './sockets/index.js';
import { refreshCommissionCacheFromDB } from './utils/earnings.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await refreshCommissionCacheFromDB();
  const server = http.createServer(app);

  initSocket(server);

  server.listen(PORT, () => {
    console.log(`[velora] api ready on http://localhost:${PORT}`);
  });
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('[velora] unhandled rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[velora] uncaught exception:', err);
  process.exit(1);
});

start().catch((err) => {
  console.error('[velora] fatal startup error:', err);
  process.exit(1);
});
