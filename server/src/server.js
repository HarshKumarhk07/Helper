import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  const server = http.createServer(app);
  
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[velora] socket connected: ${socket.id}`);

    socket.on('workerLocation', (data) => {
      // Emit the worker's location to anyone tracking this specific worker or booking
      if (data.workerId) {
        io.emit(`locationUpdate_${data.workerId}`, data);
      }
      if (data.bookingId) {
        io.emit(`locationUpdate_${data.bookingId}`, data);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[velora] socket disconnected: ${socket.id}`);
    });
  });

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
