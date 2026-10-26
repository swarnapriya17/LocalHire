import mongoose from 'mongoose';

export const APPLICATION_STATUSES = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Rejected',
  'Hired',
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: APPLICATION_STATUSES,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const interviewDetailsSchema = new mongoose.Schema(
  {
    interviewDate: {
      type: String,
      trim: true,
      default: '',
    },
    interviewTime: {
      type: String,
      trim: true,
      default: '',
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
      index: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: APPLICATION_STATUSES,
        message: '{VALUE} is not a valid application status',
      },
      default: 'Applied',
      index: true,
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [2500, 'Cover letter cannot exceed 2500 characters'],
      default: '',
    },
    // Note: Cloud storage integration is planned for later file-storage phase.
    // In Phase 7, resumeUrl accepts only a validated remote HTTP/HTTPS document link or candidate profile resume.
    resumeUrl: {
      type: String,
      trim: true,
      default: '',
    },
    recruiterNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Recruiter notes cannot exceed 2000 characters'],
      default: '',
    },
    interviewDetails: {
      type: interviewDetailsSchema,
      default: () => ({}),
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    submissionTimestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications by the same applicant for the same job
applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });

// Secondary lookup indexes
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ applicant: 1, createdAt: -1 });

// Virtual field for string id mapping
applicationSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : undefined;
});

// Clean JSON serialization: exclude internal version key
applicationSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

export const Application = mongoose.model('Application', applicationSchema);
export default Application;
