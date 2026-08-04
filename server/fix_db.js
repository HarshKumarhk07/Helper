import('dotenv/config').then(() => import('./src/config/db.js').then((m) => m.default()).then(async () => {
  const { default: Earning } = await import('./src/models/Earning.js');
  
  // Unset 'order' where it is null
  const resultOrder = await Earning.collection.updateMany(
    { order: null },
    { $unset: { order: 1 } }
  );
  console.log('Unset order on', resultOrder.modifiedCount, 'documents');

  // Unset 'booking' where it is null
  const resultBooking = await Earning.collection.updateMany(
    { booking: null },
    { $unset: { booking: 1 } }
  );
  console.log('Unset booking on', resultBooking.modifiedCount, 'documents');

  process.exit(0);
}).catch(console.error));
