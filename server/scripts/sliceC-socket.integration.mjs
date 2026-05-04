import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as createClient } from 'socket.io-client';

const timeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);

async function main() {
  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('workerLocation', (data) => {
      if (data.workerId) {
        io.emit(`locationUpdate_${data.workerId}`, data);
      }
      if (data.bookingId) {
        io.emit(`locationUpdate_${data.bookingId}`, data);
      }
    });
  });

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const address = httpServer.address();
  const port = typeof address === 'object' && address ? address.port : null;
  assert.ok(port, 'failed to bind ephemeral socket server');

  const url = `http://127.0.0.1:${port}`;
  const workerId = 'worker-123';
  const bookingId = 'booking-abc';
  const emittedPayload = {
    workerId,
    bookingId,
    lat: 28.6139,
    lng: 77.209,
  };

  const trackerClient = createClient(url, {
    autoConnect: false,
    transports: ['websocket'],
  });
  const workerClient = createClient(url, {
    autoConnect: false,
    transports: ['websocket'],
  });

  try {
    await timeout(
      Promise.all([
        new Promise((resolve, reject) => {
          trackerClient.once('connect', resolve);
          trackerClient.once('connect_error', reject);
          trackerClient.connect();
        }),
        new Promise((resolve, reject) => {
          workerClient.once('connect', resolve);
          workerClient.once('connect_error', reject);
          workerClient.connect();
        }),
      ]),
      5000,
      'socket client connection'
    );

    const receivedByBooking = new Promise((resolve, reject) => {
      trackerClient.once(`locationUpdate_${bookingId}`, resolve);
      setTimeout(() => reject(new Error('booking location update was not received')), 5000);
    });

    workerClient.emit('workerLocation', emittedPayload);

    const received = await timeout(receivedByBooking, 5000, 'booking location update');
    assert.deepStrictEqual(received, emittedPayload);

    console.log('Slice C socket integration test passed');
  } finally {
    trackerClient.disconnect();
    workerClient.disconnect();
    io.close();
    await new Promise((resolve) => httpServer.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});