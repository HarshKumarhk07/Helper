import Wallet from '../models/Wallet.js';
import WalletTransaction, { WALLET_TX_TYPE, WALLET_TX_SOURCES } from '../models/WalletTransaction.js';
import { ApiError } from './asyncHandler.js';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const validateAmount = (amount) => {
  const value = round2(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new ApiError(400, 'amount must be a positive number');
  }
  return value;
};

const validateSource = (source) => {
  if (!WALLET_TX_SOURCES.includes(source)) {
    throw new ApiError(400, `invalid wallet source: ${source}`);
  }
};

// Atomically credit a user's wallet and write a ledger entry.
export const creditWallet = async ({
  userId,
  amount,
  source,
  referenceModel = null,
  referenceId = null,
  note = '',
  performedBy = null,
} = {}) => {
  if (!userId) throw new ApiError(400, 'userId is required');
  const value = validateAmount(amount);
  validateSource(source);

  // findOneAndUpdate with $inc handles the race; upsert ensures the wallet exists.
  const updated = await Wallet.findOneAndUpdate(
    { user: userId },
    { $inc: { balance: value }, $setOnInsert: { user: userId } },
    { new: true, upsert: true }
  );

  const tx = await WalletTransaction.create({
    wallet: updated._id,
    user: userId,
    type: WALLET_TX_TYPE.CREDIT,
    amount: value,
    balanceAfter: updated.balance,
    source,
    referenceModel,
    referenceId,
    note: String(note || '').slice(0, 500),
    performedBy,
  });

  return { wallet: updated, transaction: tx };
};

// Atomically debit a user's wallet (rejects if insufficient balance).
export const debitWallet = async ({
  userId,
  amount,
  source,
  referenceModel = null,
  referenceId = null,
  note = '',
  performedBy = null,
} = {}) => {
  if (!userId) throw new ApiError(400, 'userId is required');
  const value = validateAmount(amount);
  validateSource(source);

  // Conditional update: only decrements when balance >= value.
  const updated = await Wallet.findOneAndUpdate(
    { user: userId, balance: { $gte: value }, isFrozen: { $ne: true } },
    { $inc: { balance: -value } },
    { new: true }
  );
  if (!updated) {
    // Distinguish frozen vs insufficient
    const w = await Wallet.findOne({ user: userId });
    if (!w) throw new ApiError(404, 'Wallet not found');
    if (w.isFrozen) throw new ApiError(403, 'Wallet is frozen');
    throw new ApiError(400, 'Insufficient wallet balance');
  }

  const tx = await WalletTransaction.create({
    wallet: updated._id,
    user: userId,
    type: WALLET_TX_TYPE.DEBIT,
    amount: value,
    balanceAfter: updated.balance,
    source,
    referenceModel,
    referenceId,
    note: String(note || '').slice(0, 500),
    performedBy,
  });

  return { wallet: updated, transaction: tx };
};
