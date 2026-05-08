import mongoose from 'mongoose';

const SINGLETON_KEY = 'platform';

const adminSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: SINGLETON_KEY, unique: true, index: true },

    // Finance
    platformCommissionRate: { type: Number, min: 0, max: 1, default: 0.2 },
    gstRate: { type: Number, min: 0, max: 1, default: 0.18 },

    // Branding / contact
    platformName: { type: String, default: 'Velora House', maxlength: 80 },
    supportEmail: { type: String, default: '', maxlength: 120 },
    supportPhone: { type: String, default: '', maxlength: 30 },
    supportHoursLabel: { type: String, default: 'Mon–Sat, 9am–9pm IST', maxlength: 80 },
    address: { type: String, default: '', maxlength: 250 },
    gstNumber: { type: String, default: '', maxlength: 30 },

    // Booking policy
    bookingLeadTimeMinutes: { type: Number, min: 0, max: 24 * 60, default: 15 },
    cancellationWindowMinutes: { type: Number, min: 0, default: 60 },
    autoAssignDefault: { type: Boolean, default: true },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

adminSettingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne({ key: SINGLETON_KEY });
  if (!doc) {
    doc = await this.create({
      key: SINGLETON_KEY,
      platformCommissionRate: clamp01(envNumber('PLATFORM_COMMISSION_DEFAULT', 0.2)),
      gstRate: clamp01(envNumber('GST_RATE', 0.18)),
    });
  }
  return doc;
};

const envNumber = (k, fallback) => {
  const n = Number(process.env[k]);
  return Number.isFinite(n) ? n : fallback;
};

const clamp01 = (n) => {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
};

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
export default AdminSettings;
