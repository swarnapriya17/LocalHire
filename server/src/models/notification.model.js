import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'APPLICATION_SUBMITTED',
  'APPLICATION_STATUS_UPDATED',
  'INTERVIEW_SCHEDULED',
  'EMPLOYER_VERIFIED',
  'EMPLOYER_REJECTED',
  'JOB_APPROVED',
  'JOB_REJECTED',
  'JOB_FLAGGED',
  'SYSTEM_ALERT',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user reference is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: NOTIFICATION_TYPES,
        message: 'Invalid notification type',
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    relatedEntityType: {
      type: String,
      enum: ['Application', 'Job', 'User', 'Interview', null],
      default: null,
    },
    relatedEntityId: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant querying of user feeds
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

notificationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
