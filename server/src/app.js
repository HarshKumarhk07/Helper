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
import productCategoryRoutes from './routes/productCategory.routes.js';
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
import supportRoutes from './routes/support.routes.js';
import cartRoutes from './routes/cart.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import trackingRoutes from './routes/tracking.routes.js';
import debugRoutes from './routes/debug.routes.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

// Disable ETag generation so every API response logs as 200 instead of 304
// (304 just means the client's cached copy is still fresh — not an error).
app.set('etag', false);

// Render (and most cloud hosts) sit behind a reverse proxy that sets
// X-Forwarded-For. Without trusting it, express-rate-limit refuses to start
// and req.ip is the proxy IP — so audit logs and rate limits both go wrong.
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://urban-company-seven.vercel.app',
  'https://helper-nine-nu.vercel.app',
];

export const corsOriginHandler = (origin, callback) => {
  // Allow requests with no origin (like mobile apps, curl, postman, server-to-server)
  if (!origin) {
    return callback(null, true);
  }

  const normalizedOrigin = origin.replace(/\/$/, '');

  // Check if it matches allowed origins list exactly
  if (allowedOrigins.includes(normalizedOrigin)) {
    return callback(null, true);
  }

  // Check if it is a Vercel deployment/preview subdomain (ends with .vercel.app)
  if (normalizedOrigin.endsWith('.vercel.app')) {
    return callback(null, true);
  }

  // Check if it matches CLIENT_URL from env
  if (process.env.CLIENT_URL && normalizedOrigin === process.env.CLIENT_URL.replace(/\/$/, '')) {
    return callback(null, true);
  }

  // Allow cors
  callback(null, false);
};

app.use(
  cors({
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// JSON 429 response so the frontend's axios catches it the same as any
// other API error — express-rate-limit's default plain-text body otherwise
// triggers a JSON parse error in the client.
const jsonRateLimitHandler = (req, res, _next, options) =>
  res.status(options.statusCode || 429).json({
    error: 'Too many requests. Please slow down and try again shortly.',
    retryAfterSeconds: Math.ceil(options.windowMs / 1000),
  });

// General auth-area limiter — covers signup, refresh, forgot/reset, google.
// Login gets its own much tighter limiter below.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  handler: jsonRateLimitHandler,
});

// Dedicated brute-force limiter for /login: 5 attempts per 10 minutes per
// IP. Successful logins don't count (skipSuccessfulRequests) so a normal
// user typing the right password twice in a row never gets locked out.
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: (req) => req.method === 'OPTIONS',
  handler: jsonRateLimitHandler,
});

app.use('/uploads', express.static('uploads'));

// Any /uploads/* request that didn't resolve to a real file shouldn't fall
// through to the JSON notFound handler — the browser asked for an image and
// would get a JSON body, triggering CORB warnings in the console. Reply with
// a 1x1 transparent PNG so the <img onError> handler runs cleanly instead.
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);
app.use('/uploads', (_req, res) => {
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'no-store');
  res.status(404).send(TRANSPARENT_PNG);
});

app.get('/', (_req, res) => {
  res.status(200).send('API Running Successfully');
});

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', service: 'helper', time: new Date().toISOString() })
);

// Login gets the strict per-route limiter; the rest of /api/auth keeps the
// looser one. Order matters — loginLimiter has to be mounted on the exact
// path before the broader middleware.
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-categories', productCategoryRoutes);
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
app.use('/api/support', supportRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/debug', debugRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
