import mongoose from 'mongoose';

export const WALLET_TX_TYPE = {
  CREDIT: 'credit',
  DEBIT: 'debit',
};

export const WALLET_TX_SOURCES = [
  'admin_credit',
  'admin_debit',
  'refund',
  'cashback',
  'promo',
  'order_payment',
  'booking_payment',
  'adjustment',
];

const walletTransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(WALLET_TX_TYPE),
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    source: { type: String, enum: WALLET_TX_SOURCES, required: true },
    referenceModel: {
      type: String,
      enum: ['Booking', 'Order', 'PayoutBatch', null],
      default: null,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    note: { type: String, default: '', maxlength: 500 },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

// Prevent duplicate wallet credits for the same refund reference.
// The partial filter limits the uniqueness constraint to refund transactions only,
// so other sources (admin_credit, promo, etc.) are not affected.
walletTransactionSchema.index(
  { source: 1, referenceModel: 1, referenceId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      source: 'refund',
      referenceId: { $type: 'objectId' },
    },
    name: 'wallet_refund_idempotency',
  }
);

const WalletTransaction = mongoose.model(
  'WalletTransaction',
  walletTransactionSchema
);
export default WalletTransaction;
