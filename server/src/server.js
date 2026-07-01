import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './sockets/index.js';
import { refreshCommissionCacheFromDB } from './utils/earnings.js';
import { startStaleWorkerSweeper, stopStaleWorkerSweeper } from './utils/staleWorkerSweeper.js';
import { startAssignmentExpirySweeper, stopAssignmentExpirySweeper } from './utils/dispatch.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await refreshCommissionCacheFromDB();
  const server = http.createServer(app);

  initSocket(server);
  startStaleWorkerSweeper();
  startAssignmentExpirySweeper();

  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, () => {
      stopStaleWorkerSweeper();
      stopAssignmentExpirySweeper();
      server.close(() => process.exit(0));
    });
  }

  server.listen(PORT, () => {
    console.log(`[helper] api ready on port ${PORT}`);
    console.log(`[helper] environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[helper] client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  });
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('[helper] unhandled rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[helper] uncaught exception:', err);
  process.exit(1);
});

start().catch((err) => {
  console.error('[helper] fatal startup error:', err);
  process.exit(1);
});
