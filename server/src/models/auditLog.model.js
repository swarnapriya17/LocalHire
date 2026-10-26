import mongoose from 'mongoose';

export const AUDIT_ACTIONS = [
  'USER_SUSPENDED',
  'USER_REACTIVATED',
  'EMPLOYER_VERIFIED',
  'EMPLOYER_REJECTED',
  'JOB_APPROVED',
  'JOB_REJECTED',
  'JOB_FLAGGED',
  'JOB_UNPUBLISHED',
];

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: AUDIT_ACTIONS,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    performedByName: {
      type: String,
      trim: true,
      default: 'Administrator',
    },
    performedByEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['User', 'Employer', 'Job'],
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetName: {
      type: String,
      trim: true,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
