import mongoose from 'mongoose';

const payoutBatchSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    earnings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Earning',
      },
    ],
    earningsCount: { type: Number, required: true, min: 1 },
    totalGross: { type: Number, required: true, min: 0 },
    totalCommission: { type: Number, required: true, min: 0 },
    totalNet: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['bank_transfer', 'upi', 'cash', 'other'],
      default: 'bank_transfer',
    },
    reference: { type: String, default: '', maxlength: 120 },
    notes: { type: String, default: '', maxlength: 500 },
    settledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    settledAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const generateCode = () => {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `PO-${ts}${rand}`;
};

payoutBatchSchema.pre('validate', function setCode(next) {
  if (!this.code) this.code = generateCode();
  next();
});

const PayoutBatch = mongoose.model('PayoutBatch', payoutBatchSchema);
export default PayoutBatch;
