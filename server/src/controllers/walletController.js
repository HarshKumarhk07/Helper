import mongoose from 'mongoose';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { creditWallet, debitWallet } from '../utils/wallet.js';

const isObjectId = (v) =>
  typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const getMyWallet = asyncHandler(async (req, res) => {
  const wallet = await Wallet.ensureFor(req.user._id);
  const recent = await WalletTransaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({
    wallet: {
      _id: wallet._id,
      balance: round2(wallet.balance),
      currency: wallet.currency,
      isFrozen: wallet.isFrozen,
    },
    recentTransactions: recent,
  });
});

export const getMyTransactions = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const skip = Math.max(Number(req.query.skip) || 0, 0);
  const filter = { user: req.user._id };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.source) filter.source = req.query.source;

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip),
    WalletTransaction.countDocuments(filter),
  ]);

  res.json({ transactions, total, limit, skip });
});

export const getUserWallet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isObjectId(userId)) throw new ApiError(400, 'Invalid userId');
  const user = await User.findById(userId).select('name email phone role');
  if (!user) throw new ApiError(404, 'User not found');

  const wallet = await Wallet.ensureFor(user._id);
  const recent = await WalletTransaction.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('performedBy', 'name email role');

  res.json({
    user,
    wallet: {
      _id: wallet._id,
      balance: round2(wallet.balance),
      currency: wallet.currency,
      isFrozen: wallet.isFrozen,
    },
    transactions: recent,
  });
});

export const adminCreditWallet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { amount, note, source } = req.body || {};
  if (!isObjectId(userId)) throw new ApiError(400, 'Invalid userId');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const result = await creditWallet({
    userId,
    amount,
    source: source || 'admin_credit',
    note,
    performedBy: req.user._id,
  });

  logAudit({
    req,
    action: 'wallet_admin_credit',
    resource: 'wallet',
    resourceId: result.wallet._id,
    changes: {
      user: { from: null, to: String(userId) },
      amount: { from: null, to: result.transaction.amount },
      balanceAfter: { from: null, to: result.wallet.balance },
    },
  });

  res.json({
    wallet: {
      balance: round2(result.wallet.balance),
      currency: result.wallet.currency,
    },
    transaction: result.transaction,
  });
});

export const adminDebitWallet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { amount, note, source } = req.body || {};
  if (!isObjectId(userId)) throw new ApiError(400, 'Invalid userId');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const result = await debitWallet({
    userId,
    amount,
    source: source || 'admin_debit',
    note,
    performedBy: req.user._id,
  });

  logAudit({
    req,
    action: 'wallet_admin_debit',
    resource: 'wallet',
    resourceId: result.wallet._id,
    changes: {
      user: { from: null, to: String(userId) },
      amount: { from: null, to: result.transaction.amount },
      balanceAfter: { from: null, to: result.wallet.balance },
    },
  });

  res.json({
    wallet: {
      balance: round2(result.wallet.balance),
      currency: result.wallet.currency,
    },
    transaction: result.transaction,
  });
});

export const adminToggleFreeze = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { freeze } = req.body || {};
  if (!isObjectId(userId)) throw new ApiError(400, 'Invalid userId');

  const wallet = await Wallet.ensureFor(userId);
  const previous = wallet.isFrozen;
  wallet.isFrozen = !!freeze;
  await wallet.save();

  logAudit({
    req,
    action: 'wallet_freeze',
    resource: 'wallet',
    resourceId: wallet._id,
    changes: { isFrozen: { from: previous, to: wallet.isFrozen } },
  });

  res.json({ wallet });
});
