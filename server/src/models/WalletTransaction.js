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

const WalletTransaction = mongoose.model(
  'WalletTransaction',
  walletTransactionSchema
);
export default WalletTransaction;
