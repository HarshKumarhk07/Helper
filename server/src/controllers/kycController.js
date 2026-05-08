import User from '../models/User.js';
import { ROLES } from '../config/roles.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { notifyKycApproved, notifyKycRejected } from '../utils/notificationService.js';

const KYC_FIELDS = ['aadhaarFront', 'aadhaarBack', 'panCard', 'selfie'];

const safeUser = (u) => u.toSafeJSON();

export const getMyKyc = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.WORKER) {
    throw new ApiError(403, 'Only workers have a KYC profile');
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
  if (req.user.role !== ROLES.WORKER) {
    throw new ApiError(403, 'Only workers can submit KYC');
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
    if (files[field]?.[0]?.path) {
      docs[field] = files[field][0].path;
      uploadedAny = true;
    }
  });
  user.kycDocuments = docs;

  if (!uploadedAny && !user.kycDocuments?.aadhaarFront && !user.kycDocuments?.panCard) {
    throw new ApiError(400, 'Upload at least Aadhaar front and PAN card');
  }

  user.kycStatus = 'submitted';
  user.kycSubmittedAt = new Date();
  user.kycRejectionReason = '';
  await user.save();

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
  const filter = { role: ROLES.WORKER };
  if (status && status !== 'all') filter.kycStatus = status;
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { email: { $regex: q, $options: 'i' } },
    { phone: { $regex: q, $options: 'i' } },
  ];
  const workers = await User.find(filter)
    .populate('kycReviewedBy', 'name email')
    .sort({ kycSubmittedAt: -1, createdAt: -1 })
    .limit(200);
  res.json({ workers: workers.map(safeUser) });
});

export const getKycSubmission = asyncHandler(async (req, res) => {
  const worker = await User.findOne({ _id: req.params.id, role: ROLES.WORKER })
    .populate('kycReviewedBy', 'name email');
  if (!worker) throw new ApiError(404, 'Worker not found');
  res.json({ worker: safeUser(worker) });
});

export const approveKyc = asyncHandler(async (req, res) => {
  const worker = await User.findOne({ _id: req.params.id, role: ROLES.WORKER });
  if (!worker) throw new ApiError(404, 'Worker not found');
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

  notifyKycApproved({ worker });

  res.json({ worker: safeUser(worker) });
});

export const rejectKyc = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !String(reason).trim()) {
    throw new ApiError(400, 'Rejection reason is required');
  }

  const worker = await User.findOne({ _id: req.params.id, role: ROLES.WORKER });
  if (!worker) throw new ApiError(404, 'Worker not found');
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

  notifyKycRejected({ worker, reason: worker.kycRejectionReason });

  res.json({ worker: safeUser(worker) });
});
