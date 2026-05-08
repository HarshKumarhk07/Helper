import mongoose from 'mongoose';

const otpTokenSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    requesterIp: { type: String, default: '' },
    requesterAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-expire stale tokens via TTL.
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpToken = mongoose.model('OtpToken', otpTokenSchema);
export default OtpToken;
