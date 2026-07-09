import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { uploadCarKyc, isCloudinaryConfigured } from '../utils/cloudinary.js';
import {
  submitCarKyc,
  getMyCarKyc,
  listCarKycSubmissions,
  reviewCarKyc,
  createTrip,
  searchTrips,
  getTripDetail,
  cancelTrip,
  getMyTrips,
  createBooking,
  verifyBookingPayment,
  cancelBooking,
  getMyBookings,
} from '../controllers/carServiceController.js';

const router = Router();

// Multipart file uploader middleware for Car KYC
const carKycMultipart = (req, res, next) => {
  if (!isCloudinaryConfigured) {
    return res.status(503).json({
      error: 'Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server to enable document uploads.',
    });
  }
  uploadCarKyc.fields([
    { name: 'rcDocument', maxCount: 1 },
    { name: 'carPhoto', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message || 'KYC upload failed',
      });
    }
    next();
  });
};

// Authenticated Worker Route (must be defined before /trips/:id dynamic route)
router.get('/trips/me', requireAuth, requireRole(ROLES.WORKER), getMyTrips);

// Public Routes (any role, authenticated or not, can search/view trips)
router.get('/trips', searchTrips);
router.get('/trips/:id', getTripDetail);

// Authenticated Routes
router.use(requireAuth);

// Customer Booking Routes (user role)
router.post('/bookings', requireRole(ROLES.USER), createBooking);
router.post('/bookings/verify', requireRole(ROLES.USER), verifyBookingPayment);
router.patch('/bookings/:id/cancel', requireRole(ROLES.USER), cancelBooking);
router.get('/bookings/me', requireRole(ROLES.USER), getMyBookings);

// Professional (Worker) Routes
router.post('/kyc', requireRole(ROLES.WORKER), carKycMultipart, submitCarKyc);
router.get('/kyc/me', requireRole(ROLES.WORKER), getMyCarKyc);
router.post('/trips', requireRole(ROLES.WORKER), createTrip);
router.patch('/trips/:id/cancel', requireRole(ROLES.WORKER), cancelTrip);

// Admin Routes (admin role)
router.get('/admin/kyc', requireRole(ROLES.ADMIN), listCarKycSubmissions);
router.patch('/admin/kyc/:id', requireRole(ROLES.ADMIN), reviewCarKyc);

export default router;
