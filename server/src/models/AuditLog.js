import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: { type: String, required: true, index: true }, // e.g., 'create_coupon', 'update_order', 'delete_product'
    resource: { type: String, required: true, index: true }, // e.g., 'coupon', 'order', 'product'
    resourceId: { type: mongoose.Schema.Types.ObjectId, index: true },
    changes: { type: Object, default: {} }, // stores { field: { from, to } }
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
