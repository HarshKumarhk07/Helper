import 'dotenv/config';
import dns from 'dns';
import http from 'http';
import app from './app.js';

// Render's containers don't have IPv6 egress. If Node's resolver picks an
// IPv6 record first (smtp.gmail.com, etc.) the socket dies with ENETUNREACH
// no matter what `family` you pass to the consumer. Flip the global resolver
// to prefer IPv4 once, here, and every outbound call inherits it.
dns.setDefaultResultOrder('ipv4first');
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
