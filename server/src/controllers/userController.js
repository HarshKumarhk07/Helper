import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import ServiceCategory from '../models/ServiceCategory.js';
import WorkerService from '../models/WorkerService.js';
import { ROLES } from '../config/roles.js';
import { BOOKING_STATUS } from '../config/booking.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { validatePassword } from '../utils/passwordPolicy.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { email: { $regex: q, $options: 'i' } },
  ];

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const totalRecords = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalRecords / limit);

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    users: users.map((u) => u.toSafeJSON()),
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

export const adminCreateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, aadhaarNumber, panNumber, passportPhoto, kycStatus, password, role, companyName, companyAddress, businessType } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already in use');
  if (password) {
    const check = validatePassword(password);
    if (!check.ok) throw new ApiError(400, check.message);
  }

  const user = await User.create({
    name,
    email,
    phone,
    aadhaarNumber,
    panNumber,
    passportPhoto,
    kycStatus,
    password,
    role,
    companyName,
    companyAddress,
    businessType,
  });
  res.status(201).json({ user: user.toSafeJSON() });
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  const user = await User.findById(id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  if (updates.email && updates.email !== user.email) {
    const emailExists = await User.findOne({ email: updates.email, _id: { $ne: id } });
    if (emailExists) throw new ApiError(409, 'Email already in use');
  }

  if (updates.password === '') delete updates.password;
  if ('password' in updates && !updates.password) delete updates.password;
  if (updates.password) {
    const check = validatePassword(updates.password);
    if (!check.ok) throw new ApiError(400, check.message);
  }

  if (updates.passportPhoto) {
    updates.avatar = updates.passportPhoto;
  } else if (updates.avatar && !updates.passportPhoto) {
    updates.passportPhoto = updates.avatar;
  }

  Object.assign(user, updates);
  await user.save();

  res.json({ user: user.toSafeJSON() });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { kycDocuments, ...rest } = req.body || {};
  Object.assign(req.user, rest);

  // Merge kycDocuments rather than overwriting — partial uploads must keep
  // existing URLs intact (e.g., uploading Aadhaar front shouldn't wipe PAN).
  if (kycDocuments && typeof kycDocuments === 'object') {
    const current =
      req.user.kycDocuments?.toObject?.() || req.user.kycDocuments || {};
    req.user.kycDocuments = { ...current, ...kycDocuments };
  }

  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
});

export const setUserActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  // Prevent administrators from suspending their own account.
  if (String(req.user._id) === String(id) && isActive === false) {
    throw new ApiError(400, 'Admin cannot suspend their own account');
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: !!isActive },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user: user.toSafeJSON() });
});

export const getFeaturedWorkersPublic = asyncHandler(async (req, res) => {
  const { category, location } = req.query;

  const filter = {
    role: ROLES.WORKER,
    kycStatus: 'verified',
    isActive: true,
    isFeatured: true
  };

  if (category && category !== 'all') {
    let catId = category;
    if (!catId.match(/^[a-f0-9]{24}$/)) {
      const cat = await ServiceCategory.findOne({ slug: category });
      if (cat) catId = cat._id;
      else return res.json({ workers: [] });
    }
    filter.category = catId;
  }

  if (location) {
    filter.$or = [
      { locations: { $exists: false } },
      { locations: { $size: 0 } },
      { locations: location }
    ];
  }

  const workers = await User.find(filter)
    .populate('category', 'name slug')
    .sort({ ratingAvg: -1, completedJobs: -1 })
    .limit(6)
    .lean();

  const publicWorkers = workers.map(w => ({
    _id: w._id,
    name: w.name,
    avatar: w.avatar || w.passportPhoto || '',
    category: w.category,
    ratingAvg: w.ratingAvg || 0,
    ratingCount: w.ratingCount || 0,
    completedJobs: w.completedJobs || 0
  }));

  res.json({ workers: publicWorkers });
});

export const getWorkersForCustomer = asyncHandler(async (req, res) => {
  const { category, q, service, location } = req.query;

  const filter = {
    role: ROLES.WORKER,
    kycStatus: 'verified',
    isActive: true,
  };

  // When a specific service is requested, only surface workers who actually
  // offer that service (via WorkerService), and carry their per-service price.
  let offeringMap = null;
  if (service) {
    const offerings = await WorkerService.find({ service, isActive: true }).lean();
    if (!offerings.length) return res.json({ workers: [] });
    filter._id = { $in: offerings.map((o) => o.worker) };
    offeringMap = new Map(offerings.map((o) => [String(o.worker), o]));
  }

  if (category) {
    let catId = category;
    if (!catId.match(/^[a-f0-9]{24}$/)) {
      const cat = await ServiceCategory.findOne({ slug: category });
      if (cat) catId = cat._id;
      else return res.json({ workers: [] });
    }
    filter.category = catId;
  }

  if (q) {
    if (q.trim().match(/^[a-f0-9]{24}$/)) {
      filter._id = q.trim();
    } else {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
      ];
    }
  }

  if (location) {
    const locFilter = {
      $or: [
        { locations: { $exists: false } },
        { locations: { $size: 0 } },
        { locations: location }
      ]
    };
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, locFilter];
      delete filter.$or;
    } else {
      filter.$or = locFilter.$or;
    }
  }

  const rawWorkers = await User.find(filter)
    .populate('category', 'name slug icon color')
    .lean();

  const workers = [];

  for (const w of rawWorkers) {
    const workerBookings = await Booking.find({ worker: w._id }).distinct('_id');
    const completedJobsCount = await Booking.countDocuments({ worker: w._id, status: BOOKING_STATUS.COMPLETED });

    // Calculate public rating
    let publicRating = 0;
    if (workerBookings.length > 0) {
      const ratingAgg = await Review.aggregate([
        { $match: { booking: { $in: workerBookings } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]);
      if (ratingAgg.length > 0) {
        publicRating = Math.round(ratingAgg[0].avgRating * 10) / 10;
      }
    }

    // Check if the current user has booked this worker before
    let displayRating = publicRating;
    let previousRating = null;
    let hasHiredBefore = false;

    if (req.user) {
      const lastCompletedBooking = await Booking.findOne({
        user: req.user._id,
        worker: w._id,
        status: BOOKING_STATUS.COMPLETED
      }).sort({ completedAt: -1 });

      if (lastCompletedBooking) {
        const lastReview = await Review.findOne({
          user: req.user._id,
          booking: lastCompletedBooking._id
        });
        if (lastReview) {
          previousRating = lastReview.rating;
          displayRating = lastReview.rating;
          hasHiredBefore = true;
        }
      }
    }

    const offering = offeringMap?.get(String(w._id)) || null;

    workers.push({
      _id: w._id,
      name: w.name,
      avatar: w.avatar || w.passportPhoto || '',
      email: w.email,
      phone: w.phone,
      experienceYears: w.experienceYears || 0,
      completedJobs: completedJobsCount || w.completedJobs || 0,
      fixedPrice: w.fixedPrice || 0,
      hourlyRate: w.hourlyRate || 0,
      pricingType: w.pricingType || 'fixed',
      isFeatured: !!w.isFeatured,
      isRecommended: !!w.isRecommended,
      category: w.category,
      currentStatus: w.currentStatus || 'free',
      ratingAvg: w.ratingAvg || 0,
      // Per-service pricing when a specific service was requested (else null).
      serviceOffering: offering
        ? {
            pricingType: offering.pricingType,
            amount: offering.amount,
            startingPrice: offering.startingPrice,
            note: offering.note,
          }
        : null,
      displayRating,
      publicRating,
      previousRating,
      hasHiredBefore,
    });
  }

  // Sorting priorities:
  // 1. Featured
  // 2. Recommended
  // 3. Display Rating
  // 4. Completed Jobs
  // 5. Experience
  workers.sort((a, b) => {
    if (b.isFeatured !== a.isFeatured) return b.isFeatured ? 1 : -1;
    if (b.isRecommended !== a.isRecommended) return b.isRecommended ? 1 : -1;
    if (b.displayRating !== a.displayRating) return b.displayRating - a.displayRating;
    if (b.completedJobs !== a.completedJobs) return b.completedJobs - a.completedJobs;
    return b.experienceYears - a.experienceYears;
  });

  res.json({ workers });
});
