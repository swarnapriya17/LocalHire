import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [3, 'Job title must be at least 3 characters long'],
      maxlength: [120, 'Job title cannot exceed 120 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters long'],
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    town: {
      type: String,
      required: [true, 'Mandal or town location is required'],
      trim: true,
    },
    locationDetail: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Career category is required'],
      enum: {
        values: [
          'it-software',
          'education',
          'healthcare',
          'retail-sales',
          'office-admin',
          'hospitality',
          'skilled-technical',
          'fresher-opportunities',
        ],
        message: 'Invalid career sector category',
      },
      index: true,
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      enum: {
        values: ['Full-time', 'Part-time', 'Internship', 'Contract'],
        message: 'Employment type must be Full-time, Part-time, Internship, or Contract',
      },
      default: 'Full-time',
    },
    workMode: {
      type: String,
      enum: ['On-site', 'Remote', 'Hybrid'],
      default: 'On-site',
    },
    experience: {
      type: String,
      trim: true,
      default: 'Fresher / 0 - 1 Year',
    },
    isFresher: {
      type: Boolean,
      default: false,
      index: true,
    },
    salary: {
      type: String,
      trim: true,
      default: 'Salary Disclosed Upon Request',
    },
    salaryMin: {
      type: Number,
      default: 0,
    },
    salaryMax: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      minlength: [20, 'Job description must be at least 20 characters long'],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    perks: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['published', 'closed', 'draft'],
      default: 'published',
      index: true,
    },
    urgency: {
      type: String,
      default: 'Standard',
    },
    verificationStatus: {
      type: String,
      default: 'Verified Local Opening',
    },
    moderationStatus: {
      type: String,
      enum: ['approved', 'pending', 'flagged', 'rejected'],
      default: 'approved',
      index: true,
    },
    moderationNotes: {
      type: String,
      trim: true,
      default: '',
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field for string id mapping
jobSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : undefined;
});

// Clean JSON serialization
jobSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

export const Job = mongoose.model('Job', jobSchema);
export default Job;
