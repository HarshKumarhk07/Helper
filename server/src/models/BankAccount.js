import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

const encryptedFieldSchema = new mongoose.Schema(
  {
    iv: { type: String, required: true },
    encryptedData: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { _id: false }
);

const bankAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    
    // Public details
    accountHolderName: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    ifscCode: { type: String, required: true, trim: true, uppercase: true },
    branchName: { type: String, trim: true, default: '' },
    accountType: { type: String, enum: ['Savings', 'Current'], default: 'Savings' },
    
    // Encrypted details
    accountNumber: { type: encryptedFieldSchema, required: true },
    upiId: { type: encryptedFieldSchema, required: false },
    
    isPrimary: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },

    // Verification Workflow Metadata
    verifiedStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'], 
      default: 'pending',
      index: true
    },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verificationMethod: { type: String, default: 'manual' },
    verificationNotes: { type: String, default: '' },
  },
  { 
    timestamps: true,
    optimisticConcurrency: true // Handles versioning (__v) to prevent concurrent overwrites
  }
);

// Composite indexes for performance
bankAccountSchema.index({ user: 1, isPrimary: 1 });
bankAccountSchema.index({ updatedAt: 1 });

// Virtual field for plain text account number (for server side use only e.g. Payouts API)
bankAccountSchema.virtual('decryptedAccountNumber').get(function() {
  if (this.accountNumber && this.accountNumber.encryptedData) {
    return decrypt(this.accountNumber);
  }
  return null;
});

// Virtual field for plain text UPI ID
bankAccountSchema.virtual('decryptedUpiId').get(function() {
  if (this.upiId && this.upiId.encryptedData) {
    return decrypt(this.upiId);
  }
  return null;
});

// We encrypt data in the controller before setting to model, or we can do it via a method.
// To keep things clean, we will have a helper method to set encrypted fields.
bankAccountSchema.methods.setSecureAccountNumber = function(plainText) {
  this.accountNumber = encrypt(plainText);
};

bankAccountSchema.methods.setSecureUpiId = function(plainText) {
  if (plainText) {
    this.upiId = encrypt(plainText);
  } else {
    this.upiId = undefined;
  }
};

// Masking helper for API responses
bankAccountSchema.methods.toSafeJSON = function() {
  const obj = this.toObject();
  
  // Mask account number: XXXX XXXX 4321
  const plainAcc = this.decryptedAccountNumber;
  if (plainAcc) {
    const last4 = plainAcc.slice(-4);
    obj.accountNumberMasked = `XXXX XXXX ${last4}`;
  } else {
    obj.accountNumberMasked = null;
  }

  // Mask UPI ID (e.g. johndoe@upi -> j******e@upi)
  const plainUpi = this.decryptedUpiId;
  if (plainUpi) {
    const [name, provider] = plainUpi.split('@');
    if (provider && name.length > 2) {
      obj.upiIdMasked = `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${provider}`;
    } else {
      obj.upiIdMasked = '***@***';
    }
  } else {
    obj.upiIdMasked = null;
  }

  // Remove the encrypted objects entirely from the response
  delete obj.accountNumber;
  delete obj.upiId;

  return obj;
};

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
export default BankAccount;
