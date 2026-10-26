import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Do not return passwordHash by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['jobseeker', 'recruiter', 'admin'],
        message: 'Role must be either jobseeker, recruiter, or admin',
      },
      default: 'jobseeker',
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'pending_verification'],
        message: 'Account status must be active, suspended, or pending_verification',
      },
      default: 'active',
    },
    // Role-appropriate profile subfields
    jobseekerProfile: {
      headline: { type: String, trim: true, default: '' },
      summary: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      location: { type: String, trim: true, default: 'West Godavari' },
      isFresher: { type: Boolean, default: true },
      portfolioLinks: {
        portfolio: { type: String, trim: true, default: '' },
        github: { type: String, trim: true, default: '' },
        linkedin: { type: String, trim: true, default: '' },
      },
      skills: [{ type: String, trim: true }],
      softSkills: [{ type: String, trim: true }],
      education: [
        {
          institution: { type: String, trim: true },
          degree: { type: String, trim: true },
          fieldOfStudy: { type: String, trim: true },
          graduationYear: { type: String, trim: true },
          grade: { type: String, trim: true, default: '' },
        },
      ],
      workExperience: [
        {
          title: { type: String, trim: true },
          company: { type: String, trim: true },
          location: { type: String, trim: true, default: '' },
          startDate: { type: String, trim: true },
          endDate: { type: String, trim: true, default: '' },
          isCurrent: { type: Boolean, default: false },
          description: { type: String, trim: true, default: '' },
        },
      ],
      projects: [
        {
          title: { type: String, trim: true },
          description: { type: String, trim: true },
          technologies: [{ type: String, trim: true }],
          link: { type: String, trim: true, default: '' },
        },
      ],
      certifications: [
        {
          name: { type: String, trim: true },
          issuingOrganization: { type: String, trim: true },
          issueDate: { type: String, trim: true },
          credentialUrl: { type: String, trim: true, default: '' },
        },
      ],
      jobPreferences: {
        preferredLocations: [{ type: String, trim: true }],
        categories: [{ type: String, trim: true }],
        employmentTypes: [{ type: String, trim: true }],
        workModes: [{ type: String, trim: true }],
        experienceLevel: { type: String, trim: true, default: 'Fresher / Entry-Level' },
        expectedSalary: { type: String, trim: true, default: '' },
      },
      privacySettings: {
        visibleToRecruiters: { type: Boolean, default: true },
        allowContact: { type: Boolean, default: true },
      },
      experienceLevel: { type: String, trim: true, default: 'Fresher / Entry-Level' },
      resumeUrl: { type: String, trim: true, default: '' },
    },
    recruiterProfile: {
      companyName: { type: String, trim: true, default: '' },
      companyDescription: { type: String, trim: true, default: '' },
      companyWebsite: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      contactEmail: { type: String, trim: true, default: '' },
      location: { type: String, trim: true, default: 'West Godavari' },
      town: { type: String, trim: true, default: 'Bhimavaram' },
      address: { type: String, trim: true, default: '' },
      industry: { type: String, trim: true, default: '' },
      designation: { type: String, trim: true, default: 'Hiring Manager' },
      logoUrl: { type: String, trim: true, default: '' },
      verifiedEmployer: { type: Boolean, default: false },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationRequest: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
        index: true,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reviewedAt: {
        type: Date,
      },
      reason: {
        type: String,
        trim: true,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field for accepting plain-text password on creation/update
userSchema.virtual('password')
  .set(function (plainPassword) {
    this._plainPassword = plainPassword;
  })
  .get(function () {
    return this._plainPassword;
  });

// Pre-validate hook: Hash plain-text password before Mongoose validation runs
userSchema.pre('validate', async function () {
  if (this._plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    this._plainPassword = undefined;
  }
});

// Pre-save hook: Ensure any pending plain password is encrypted
userSchema.pre('save', async function () {
  if (this._plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    this._plainPassword = undefined;
  }
});

// Instance method to compare candidate password with stored hash safely
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Ensure sensitive fields (passwordHash, plainPassword, __v) are NEVER exposed in JSON
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.password;
  delete userObject._plainPassword;
  delete userObject.__v;
  return userObject;
};

// Static helper to hash passwords directly if needed
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

export const User = mongoose.model('User', userSchema);
export default User;
