import BankAccount from '../models/BankAccount.js';
import AuditLog from '../models/AuditLog.js';
import { sanitizeInput } from '../utils/sanitizer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { encrypt } from '../utils/encryption.js';

// Simple in-memory set to track idempotency keys. 
// In a real multi-node production setup, use Redis instead.
const idempotencyCache = new Set();
// Clear idempotency cache periodically to prevent memory leaks
setInterval(() => idempotencyCache.clear(), 10 * 60 * 1000); // 10 minutes

/**
 * Helper to log audit events
 */
const logAudit = async (req, action, resourceId, changes = {}) => {
  try {
    await AuditLog.create({
      actor: req.user._id,
      action,
      resource: 'bank_account',
      resourceId,
      changes,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      requestId: req.get('X-Request-Id') || null,
      status: 'success'
    });
  } catch (err) {
    console.error('AuditLog Error:', err);
  }
};

/**
 * GET /api/bank-account
 * Get user's primary bank account
 */
export const getBankAccount = asyncHandler(async (req, res) => {
  const account = await BankAccount.findOne({
    user: req.user._id,
    isPrimary: true,
    isActive: true
  });

  if (!account) {
    return res.status(404).json({ message: 'No active bank account found' });
  }

  res.status(200).json(account.toSafeJSON());
});

/**
 * POST /api/bank-account
 * Create a new bank account
 */
export const createBankAccount = asyncHandler(async (req, res) => {
  const idempotencyKey = req.get('Idempotency-Key');
  if (idempotencyKey) {
    if (idempotencyCache.has(idempotencyKey)) {
      return res.status(409).json({ message: 'Duplicate request detected.' });
    }
    idempotencyCache.add(idempotencyKey);
  }

  const { accountHolderName, bankName, ifscCode, branchName, accountType, accountNumber, upiId } = req.body;

  if (!accountHolderName || !bankName || !ifscCode || !accountNumber) {
    if (idempotencyKey) idempotencyCache.delete(idempotencyKey);
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Basic format validation
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(ifscCode.toUpperCase())) {
    if (idempotencyKey) idempotencyCache.delete(idempotencyKey);
    return res.status(400).json({ message: 'Invalid IFSC Code format' });
  }
  
  if (upiId) {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId)) {
      if (idempotencyKey) idempotencyCache.delete(idempotencyKey);
      return res.status(400).json({ message: 'Invalid UPI ID format' });
    }
  }

  // Deactivate existing primary account
  await BankAccount.updateMany(
    { user: req.user._id, isPrimary: true },
    { $set: { isPrimary: false } }
  );

  const account = new BankAccount({
    user: req.user._id,
    accountHolderName: sanitizeInput(accountHolderName),
    bankName: sanitizeInput(bankName),
    ifscCode: sanitizeInput(ifscCode).toUpperCase(),
    branchName: sanitizeInput(branchName || ''),
    accountType: accountType === 'Current' ? 'Current' : 'Savings',
    isPrimary: true
  });

  account.setSecureAccountNumber(sanitizeInput(accountNumber));
  if (upiId) {
    account.setSecureUpiId(sanitizeInput(upiId));
  }

  await account.save();

  await logAudit(req, 'create_bank_account', account._id, {
    newValue: account.toSafeJSON()
  });

  res.status(201).json({ message: 'Bank account created successfully', account: account.toSafeJSON() });
});

/**
 * PATCH /api/bank-account/:id
 * Update an existing bank account
 */
export const updateBankAccount = asyncHandler(async (req, res) => {
  const idempotencyKey = req.get('Idempotency-Key');
  if (idempotencyKey) {
    if (idempotencyCache.has(idempotencyKey)) {
      return res.status(409).json({ message: 'Duplicate request detected.' });
    }
    idempotencyCache.add(idempotencyKey);
  }

  const { id } = req.params;
  const { accountHolderName, bankName, ifscCode, branchName, accountType, accountNumber, upiId, __v } = req.body;

  const account = await BankAccount.findOne({ _id: id, user: req.user._id, isActive: true });
  if (!account) {
    if (idempotencyKey) idempotencyCache.delete(idempotencyKey);
    return res.status(404).json({ message: 'Bank account not found' });
  }

  // Optimistic locking check
  if (__v !== undefined && account.__v !== __v) {
    if (idempotencyKey) idempotencyCache.delete(idempotencyKey);
    return res.status(409).json({ message: 'Conflict: This record was modified by another request. Please refresh and try again.' });
  }

  const oldValues = account.toSafeJSON();
  let changed = false;

  if (accountHolderName) { account.accountHolderName = sanitizeInput(accountHolderName); changed = true; }
  if (bankName) { account.bankName = sanitizeInput(bankName); changed = true; }
  if (branchName !== undefined) { account.branchName = sanitizeInput(branchName); changed = true; }
  if (accountType) { account.accountType = accountType; changed = true; }
  
  if (ifscCode) {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode.toUpperCase())) {
      if (idempotencyKey) idempotencyCache.delete(idempotencyKey);
      return res.status(400).json({ message: 'Invalid IFSC Code format' });
    }
    account.ifscCode = sanitizeInput(ifscCode).toUpperCase();
    changed = true;
  }

  if (accountNumber) {
    // Only re-encrypt if the user provided a new plain text value
    // (If they didn't, they'd typically submit 'XXXX XXXX 1234' or omit it)
    if (!accountNumber.includes('XXXX')) {
      account.setSecureAccountNumber(sanitizeInput(accountNumber));
      changed = true;
    }
  }

  if (upiId !== undefined) {
    if (upiId && !upiId.includes('***')) {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(upiId)) {
        if (idempotencyKey) idempotencyCache.delete(idempotencyKey);
        return res.status(400).json({ message: 'Invalid UPI ID format' });
      }
      account.setSecureUpiId(sanitizeInput(upiId));
      changed = true;
    } else if (!upiId) {
      account.upiId = undefined; // clear it
      changed = true;
    }
  }

  if (changed) {
    // Re-verify if any detail changes
    account.verifiedStatus = 'pending';
    account.verifiedAt = null;
    account.verifiedBy = null;
    
    try {
      await account.save();
    } catch (err) {
      // VersionError handling if mongoose triggers it
      if (err.name === 'VersionError') {
        if (idempotencyKey) idempotencyCache.delete(idempotencyKey);
        return res.status(409).json({ message: 'Conflict: This record was modified by another request. Please refresh and try again.' });
      }
      throw err;
    }

    await logAudit(req, 'update_bank_account', account._id, {
      oldValue: oldValues,
      newValue: account.toSafeJSON()
    });
  }

  res.status(200).json({ message: 'Bank account updated successfully', account: account.toSafeJSON() });
});

/**
 * DELETE /api/bank-account/:id
 * Soft delete an account
 */
export const deleteBankAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const account = await BankAccount.findOne({ _id: id, user: req.user._id, isActive: true });
  if (!account) {
    return res.status(404).json({ message: 'Bank account not found' });
  }

  account.isActive = false;
  account.deletedAt = new Date();
  await account.save();

  await logAudit(req, 'delete_bank_account', account._id, {
    oldValue: account.toSafeJSON(),
    newValue: { isActive: false, deletedAt: account.deletedAt }
  });

  res.status(200).json({ message: 'Bank account deleted successfully' });
});

/**
 * GET /api/bank-account/admin
 * Admin only: list all bank accounts with pagination and filtering
 */
export const listAllBankAccounts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, q } = req.query;
  const query = { isActive: true };

  if (status && status !== 'all') {
    query.verifiedStatus = status;
  }

  // Populate user first if we need to search by user fields, or just do a general search
  let userIds = [];
  if (q) {
    const User = (await import('../models/User.js')).default;
    const regex = new RegExp(q, 'i');
    const matchedUsers = await User.find({
      $or: [{ name: regex }, { email: regex }]
    }).select('_id');
    
    userIds = matchedUsers.map(u => u._id);
    
    query.$or = [
      { accountHolderName: regex },
      { bankName: regex },
      { user: { $in: userIds } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const totalRecords = await BankAccount.countDocuments(query);
  const accounts = await BankAccount.find(query)
    .populate('user', 'name email phone role kycStatus')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Note: For admin listing, we might return full details or masked depending on security preference.
  // We'll return full details since it's the admin panel and they need to verify it.
  // (In a highly secure environment, you might only unmask on explicit request per account)
  const safeAccounts = accounts.map(acc => {
    const json = acc.toJSON();
    // Expose plain account number and UPI for admin verification
    json.accountNumber = acc.decryptedAccountNumber;
    if (acc.upiId) {
      json.upiId = acc.decryptedUpiId;
    }
    return json;
  });

  res.status(200).json({
    accounts: safeAccounts,
    pagination: {
      totalRecords,
      totalPages: Math.ceil(totalRecords / Number(limit)),
      page: Number(page),
      limit: Number(limit),
      hasNextPage: skip + accounts.length < totalRecords,
      hasPreviousPage: Number(page) > 1,
    }
  });
});

/**
 * PATCH /api/bank-account/admin/:id/verify
 * Admin only: verify or reject bank details
 */
export const adminVerifyAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { verifiedStatus, verificationNotes, verificationMethod } = req.body;

  if (!['verified', 'rejected', 'pending'].includes(verifiedStatus)) {
    return res.status(400).json({ message: 'Invalid verification status' });
  }

  const account = await BankAccount.findById(id);
  if (!account) {
    return res.status(404).json({ message: 'Bank account not found' });
  }

  const oldValues = account.toSafeJSON();

  account.verifiedStatus = verifiedStatus;
  account.verifiedAt = verifiedStatus === 'verified' ? new Date() : null;
  account.verifiedBy = req.user._id;
  if (verificationNotes !== undefined) account.verificationNotes = sanitizeInput(verificationNotes);
  if (verificationMethod !== undefined) account.verificationMethod = sanitizeInput(verificationMethod);

  await account.save();

  await logAudit(req, 'verify_bank_account', account._id, {
    oldValue: oldValues,
    newValue: account.toSafeJSON()
  });

  res.status(200).json({ message: 'Verification status updated', account: account.toSafeJSON() });
});
