import mongoose from 'mongoose';

// A service a worker offers, chosen from the admin master catalog (Service).
// Workers never create services — they only select an existing catalog Service
// and attach their own pricing to it. One row per (worker, service) pair.
const workerServiceSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    // Fixed → a flat amount. Variable → an optional "starting price" plus a note
    // explaining what the final price depends on (e.g. "depends on AC tonnage").
    pricingType: { type: String, enum: ['fixed', 'variable'], default: 'fixed' },
    amount: { type: Number, min: 0, default: 0 }, // used when pricingType === 'fixed'
    startingPrice: { type: Number, min: 0, default: 0 }, // optional, variable only
    note: { type: String, default: '', maxlength: 300 }, // variable only
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A worker can offer each catalog service at most once.
workerServiceSchema.index({ worker: 1, service: 1 }, { unique: true });

const WorkerService = mongoose.model('WorkerService', workerServiceSchema);
export default WorkerService;
