import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Earning from '../models/Earning.js';
import Review from '../models/Review.js';
import WorkerAvailability from '../models/WorkerAvailability.js';
import WorkerService from '../models/WorkerService.js';
import { ROLES } from '../config/roles.js';
import { BOOKING_STATUS } from '../config/booking.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { notifyKycSubmitted, notifyKycApproved, notifyKycRejected, notifyBrandApproved, notifyBrandRejected } from '../utils/notificationService.js';
import { isCloudinaryConfigured } from '../utils/cloudinary.js';

// Resolve a multer file to a stored reference. Cloudinary storage puts a full
// https URL on `.path`; the disk fallback is stored as a host-agnostic
// '/uploads/...' path so no server host leaks into the database.
const resolveUploadUrl = (file) =>
  isCloudinaryConfigured ? file.path : `/uploads/${file.filename}`;

const KYC_FIELDS = ['aadhaarFront', 'aadhaarBack', 'panCard', 'selfie', 'companyLicense', 'gstCertificate', 'companyLogo', 'founderImage'];

// KYC identity verification applies to service professionals — workers and
// managers. Customers and admins have no KYC profile.
const KYC_ROLES = [ROLES.WORKER, ROLES.BRAND];

const safeUser = (u) => u.toSafeJSON();

export const getMyKyc = asyncHandler(async (req, res) => {
  if (!KYC_ROLES.includes(req.user.role)) {
    throw new ApiError(403, 'Only service professionals have a KYC profile');
  }
  const user = await User.findById(req.user._id);
  res.json({
    kycStatus: user.kycStatus,
    aadhaarNumber: user.aadhaarNumber,
    panNumber: user.panNumber,
    documents: user.kycDocuments || {},
    submittedAt: user.kycSubmittedAt,
    reviewedAt: user.kycReviewedAt,
    rejectionReason: user.kycRejectionReason,
  });
});

export const submitKyc = asyncHandler(async (req, res) => {
  if (!KYC_ROLES.includes(req.user.role)) {
    throw new ApiError(403, 'Only service professionals can submit KYC');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.kycStatus === 'verified') {
    throw new ApiError(409, 'KYC is already verified');
  }

  const { aadhaarNumber, panNumber } = req.body;

  if (aadhaarNumber !== undefined) {
    const cleaned = String(aadhaarNumber).replace(/\s/g, '');
    if (cleaned && !/^\d{12}$/.test(cleaned)) {
      throw new ApiError(400, 'Aadhaar number must be 12 digits');
    }
    user.aadhaarNumber = cleaned;
  }
  if (panNumber !== undefined) {
    const cleaned = String(panNumber).toUpperCase().trim();
    if (cleaned && !/^[A-Z]{5}\d{4}[A-Z]$/.test(cleaned)) {
      throw new ApiError(400, 'PAN must be in format ABCDE1234F');
    }
    user.panNumber = cleaned;
  }

  const docs = user.kycDocuments?.toObject?.() || user.kycDocuments || {};
  const files = req.files || {};
  let uploadedAny = false;
  KYC_FIELDS.forEach((field) => {
    const file = files[field]?.[0];
    if (file) {
      docs[field] = resolveUploadUrl(file);
      uploadedAny = true;
    }
  });

  // Role-based mandatory checks
  if (user.role === ROLES.BRAND) {
    if (!docs.companyLicense) {
      throw new ApiError(400, 'Company License is required');
    }
    if (!docs.companyLogo) {
      throw new ApiError(400, 'Company Logo is required');
    }
    if (!docs.founderImage) {
      throw new ApiError(400, 'Founder Image is required');
    }
    // Update company avatar
    user.avatar = docs.companyLogo;
  } else {
    // Worker / Individual role
    if (!docs.aadhaarFront) {
      throw new ApiError(400, 'Aadhaar Front is required');
    }
    if (!docs.panCard) {
      throw new ApiError(400, 'PAN Card is required');
    }
    if (!docs.selfie) {
      throw new ApiError(400, 'Worker Profile Image (Selfie) is required');
    }
    // Update worker avatar and passportPhoto
    user.avatar = docs.selfie;
    user.passportPhoto = docs.selfie;
  }

  user.kycDocuments = docs;

  user.kycStatus = 'submitted';
  user.kycSubmittedAt = new Date();
  user.kycRejectionReason = '';
  await user.save();

  // Send email and SMS notification to the user
  notifyKycSubmitted({ user }).catch((err) =>
    console.error('[kyc] submission notification failed:', err)
  );

  logAudit({
    req,
    action: 'submit_kyc',
    resource: 'user',
    resourceId: user._id,
    changes: { kycStatus: { from: 'pending', to: 'submitted' } },
  });

  res.json({ user: safeUser(user) });
});

export const listKycSubmissions = asyncHandler(async (req, res) => {
  const { status = 'submitted', q } = req.query;
  const filter = { role: { $in: KYC_ROLES } };
  if (status && status !== 'all') filter.kycStatus = status;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ];
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const totalRecords = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalRecords / limit);

  const [workers, countsAgg] = await Promise.all([
    User.find(filter)
      .populate('kycReviewedBy', 'name email')
      .sort({ kycSubmittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.aggregate([
      { $match: { role: { $in: KYC_ROLES } } },
      {
        $group: {
          _id: { $ifNull: ['$kycStatus', 'pending'] },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const counts = { all: 0 };
  countsAgg.forEach(({ _id, count }) => {
    const key = _id || 'pending';
    counts[key] = count;
    counts.all += count;
  });

  // How many catalog services each worker on this page offers, so the admin
  // list can surface enrolment inline instead of making admins open each
  // worker's full profile. One aggregate for the page, not N queries.
  const workerIds = workers.filter((w) => w.role === ROLES.WORKER).map((w) => w._id);
  const serviceCounts = new Map();
  if (workerIds.length > 0) {
    const agg = await WorkerService.aggregate([
      { $match: { worker: { $in: workerIds } } },
      { $group: { _id: '$worker', n: { $sum: 1 } } },
    ]);
    agg.forEach(({ _id, n }) => serviceCounts.set(String(_id), n));
  }

  res.json({
    workers: workers.map((w) => ({
      ...safeUser(w),
      serviceCount: serviceCounts.get(String(w._id)) || 0,
    })),
    counts,
    pagination: {
      page,
      limit,
      skip,
      totalPages,
      totalRecords,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  });
});


export const getKycSubmission = asyncHandler(async (req, res) => {
  const worker = await User.findOne({ _id: req.params.id, role: { $in: KYC_ROLES } })
    .populate('kycReviewedBy', 'name email');
  if (!worker) throw new ApiError(404, 'Submission not found');
  res.json({ worker: safeUser(worker) });
});

export const approveKyc = asyncHandler(async (req, res) => {
  const worker = await User.findOne({ _id: req.params.id, role: { $in: KYC_ROLES } });
  if (!worker) throw new ApiError(404, 'Submission not found');
  if (worker.kycStatus === 'verified') {
    throw new ApiError(409, 'Already verified');
  }

  const previous = worker.kycStatus;
  worker.kycStatus = 'verified';
  worker.kycReviewedAt = new Date();
  worker.kycReviewedBy = req.user._id;
  worker.kycRejectionReason = '';
  await worker.save();

  logAudit({
    req,
    action: 'approve_kyc',
    resource: 'user',
    resourceId: worker._id,
    changes: { kycStatus: { from: previous, to: 'verified' } },
  });

  if (worker.role === ROLES.BRAND) {
    notifyBrandApproved({ brand: worker });
  } else {
    notifyKycApproved({ worker });
  }

  res.json({ worker: safeUser(worker) });
});

export const rejectKyc = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !String(reason).trim()) {
    throw new ApiError(400, 'Rejection reason is required');
  }

  const worker = await User.findOne({ _id: req.params.id, role: { $in: KYC_ROLES } });
  if (!worker) throw new ApiError(404, 'Submission not found');
  if (worker.kycStatus === 'rejected') {
    throw new ApiError(409, 'Already rejected');
  }

  const previous = worker.kycStatus;
  worker.kycStatus = 'rejected';
  worker.kycReviewedAt = new Date();
  worker.kycReviewedBy = req.user._id;
  worker.kycRejectionReason = String(reason).trim().slice(0, 500);
  await worker.save();

  logAudit({
    req,
    action: 'reject_kyc',
    resource: 'user',
    resourceId: worker._id,
    changes: {
      kycStatus: { from: previous, to: 'rejected' },
      reason: { from: null, to: worker.kycRejectionReason },
    },
  });

  if (worker.role === ROLES.BRAND) {
    notifyBrandRejected({ brand: worker, reason: worker.kycRejectionReason });
  } else {
    notifyKycRejected({ worker, reason: worker.kycRejectionReason });
  }

  res.json({ worker: safeUser(worker) });
});

// Aggregated admin view of a worker: profile + KYC + availability + earnings totals + recent jobs + reviews.
export const getWorkerProfile = asyncHandler(async (req, res) => {
  const worker = await User.findOne({ _id: req.params.id, role: { $in: [ROLES.WORKER, ROLES.BRAND] } })
    .populate('kycReviewedBy', 'name email');
  if (!worker) throw new ApiError(404, 'Worker not found');

  const { getWorkerFinancialStats, getWorkerBookingStats } = await import('../utils/aggregation.js');

  const [
    availability,
    earnings,
    recentBookings,
    bookingStats,
    workerBookingIds,
  ] = await Promise.all([
    WorkerAvailability.findOne({ worker: worker._id }).lean(),
    getWorkerFinancialStats(worker._id),
    Booking.find({ worker: worker._id })
      .populate('service', 'name slug price')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    getWorkerBookingStats(worker._id),
    Booking.find({ worker: worker._id }).distinct('_id'),
  ]);

  // Reviews are linked via booking — query through the worker's booking IDs.
  const [recentReviews, avgRatingAgg] = workerBookingIds.length
    ? await Promise.all([
        Review.find({ booking: { $in: workerBookingIds } })
          .populate('user', 'name')
          .populate({
            path: 'booking',
            select: 'code service',
            populate: { path: 'service', select: 'name' },
          })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        Review.aggregate([
          { $match: { booking: { $in: workerBookingIds } } },
          { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]),
      ])
    : [[], []];

  const ratingSummary = avgRatingAgg[0] || { avg: 0, count: 0 };

  res.json({
    worker: safeUser(worker),
    availability,
    earnings,
    bookings: { stats: bookingStats, recent: recentBookings },
    reviews: {
      recent: recentReviews,
      average: ratingSummary.avg,
      count: ratingSummary.count,
    },
  });
});
