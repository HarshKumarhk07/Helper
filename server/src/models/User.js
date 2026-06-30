import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_LIST, ROLES } from '../config/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, default: '' },
    aadhaarNumber: { type: String, trim: true, default: '' },
    panNumber: { type: String, trim: true, default: '' },
    passportPhoto: { type: String, trim: true, default: '' },
    kycStatus: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    kycDocuments: {
      aadhaarFront: { type: String, default: '' },
      aadhaarBack: { type: String, default: '' },
      panCard: { type: String, default: '' },
      selfie: { type: String, default: '' },
      companyLicense: { type: String, default: '' },
      gstCertificate: { type: String, default: '' },
      companyLogo: { type: String, default: '' },
      founderImage: { type: String, default: '' },
    },
    kycSubmittedAt: { type: Date, default: null },
    kycReviewedAt: { type: Date, default: null },
    kycReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    kycRejectionReason: { type: String, default: '' },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLE_LIST, default: ROLES.USER, index: true },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    // Worker specific fields
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', default: null },
    fixedPrice: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0 },
    pricingType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
    experienceYears: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isRecommended: { type: Boolean, default: false },
    workerType: { type: String, enum: ['individual', 'company'], default: 'individual' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // If company worker, links to Brand user
    
    // Brand specific fields
    companyName: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
    businessType: { type: String, default: '' },
    
    // Custom individual commission rate
    commissionRate: { type: Number, min: 0, max: 1, default: null },

    // Bumped on logout / password reset / forced sign-out. Tokens carry the
    // version they were issued at; the auth middleware rejects any token
    // whose version is older than the user's current one, so a stolen
    // token is killed by signing out — no shared blacklist needed.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
