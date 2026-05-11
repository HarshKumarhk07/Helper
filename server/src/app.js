import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import categoryRoutes from './routes/category.routes.js';
import serviceRoutes from './routes/service.routes.js';
import addressRoutes from './routes/address.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import reviewRoutes from './routes/review.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import auditRoutes from './routes/audit.routes.js';
import kycRoutes from './routes/kyc.routes.js';
import payoutRoutes from './routes/payout.routes.js';
import availabilityRoutes from './routes/availability.routes.js';
import slotsRoutes from './routes/slots.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import managerRoutes from './routes/manager.routes.js';
import supportRoutes from './routes/support.routes.js';
import cartRoutes from './routes/cart.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import trackingRoutes from './routes/tracking.routes.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

// Disable ETag generation so every API response logs as 200 instead of 304
// (304 just means the client's cached copy is still fresh — not an error).
app.set('etag', false);

app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'https://urban-company-seven.vercel.app',
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/', (_req, res) => {
  res.status(200).send('API Running Successfully');
});

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', service: 'urbanease', time: new Date().toISOString() })
);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/tracking', trackingRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
