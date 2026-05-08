import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    isFrozen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

walletSchema.statics.ensureFor = async function ensureFor(userId) {
  let wallet = await this.findOne({ user: userId });
  if (!wallet) wallet = await this.create({ user: userId, balance: 0 });
  return wallet;
};

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;
