import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './sockets/index.js';
import { refreshCommissionCacheFromDB } from './utils/earnings.js';
import { startStaleWorkerSweeper, stopStaleWorkerSweeper } from './utils/staleWorkerSweeper.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await refreshCommissionCacheFromDB();
  const server = http.createServer(app);

  initSocket(server);
  startStaleWorkerSweeper();

  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, () => {
      stopStaleWorkerSweeper();
      server.close(() => process.exit(0));
    });
  }

  server.listen(PORT, () => {
    console.log(`[urbanease] api ready on http://localhost:${PORT}`);
  });
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('[urbanease] unhandled rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[urbanease] uncaught exception:', err);
  process.exit(1);
});

start().catch((err) => {
  console.error('[urbanease] fatal startup error:', err);
  process.exit(1);
});
