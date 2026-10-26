import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDbConnected } from '../config/db.js';
import Job from '../models/job.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const LOCAL_JOBS_FILE = path.join(DATA_DIR, 'localJobs.json');
const SEED_JOBS_FILE = path.join(DATA_DIR, 'seedJobs.json');

/**
 * Temporary local JSON store helper for development when MongoDB Atlas is unreachable.
 * Safely initializes with seed jobs and persists changes to disk.
 */
class LocalJobStore {
  constructor() {
    this.jobs = [];
    this.initialized = false;
  }

  ensureInitialized() {
    if (this.initialized) return;

    try {
      if (fs.existsSync(LOCAL_JOBS_FILE)) {
        const raw = fs.readFileSync(LOCAL_JOBS_FILE, 'utf-8');
        this.jobs = JSON.parse(raw);
      } else if (fs.existsSync(SEED_JOBS_FILE)) {
        const raw = fs.readFileSync(SEED_JOBS_FILE, 'utf-8');
        this.jobs = JSON.parse(raw);
        this.save();
      } else {
        this.jobs = [];
      }
    } catch (err) {
      console.warn(`[LocalJobStore] Could not read local jobs file, starting fresh: ${err.message}`);
      this.jobs = [];
    }
    this.initialized = true;
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(LOCAL_JOBS_FILE, JSON.stringify(this.jobs, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[LocalJobStore] Error persisting local jobs: ${err.message}`);
    }
  }

  getAll() {
    this.ensureInitialized();
    return [...this.jobs];
  }

  getById(id) {
    this.ensureInitialized();
    return this.jobs.find((j) => String(j.id) === String(id) || String(j._id) === String(id)) || null;
  }

  add(job) {
    this.ensureInitialized();
    this.jobs.unshift(job);
    this.save();
    return job;
  }

  update(id, updateData) {
    this.ensureInitialized();
    const index = this.jobs.findIndex((j) => String(j.id || j._id) === String(id));
    if (index === -1) return null;

    const updated = {
      ...this.jobs[index],
      ...updateData,
      id: this.jobs[index].id,
      _id: this.jobs[index]._id || this.jobs[index].id,
      updatedAt: new Date().toISOString(),
    };
    this.jobs[index] = updated;
    this.save();
    return updated;
  }

  delete(id) {
    this.ensureInitialized();
    const index = this.jobs.findIndex((j) => String(j.id || j._id) === String(id));
    if (index === -1) return false;

    this.jobs.splice(index, 1);
    this.save();
    return true;
  }
}

const localStore = new LocalJobStore();

/**
 * Filter and paginate an array of jobs (used by local store)
 */
function filterLocalJobs(jobs, filters = {}) {
  let result = [...jobs];

  // 1. Status filter (default to 'published' for public queries)
  if (filters.status && filters.status !== 'all') {
    result = result.filter((j) => (j.status || 'published') === filters.status);
  } else if (!filters.status && !filters.recruiterId) {
    result = result.filter((j) => (j.status || 'published') === 'published');
  }

  // 2. Recruiter ownership filter
  if (filters.recruiterId) {
    result = result.filter((j) => String(j.recruiterId) === String(filters.recruiterId));
  }

  // 3. Keyword search (case-insensitive across title, company, description, town)
  if (filters.keyword && filters.keyword.trim()) {
    const q = filters.keyword.toLowerCase().trim();
    result = result.filter((j) => {
      const titleMatch = (j.title || '').toLowerCase().includes(q);
      const companyMatch = (j.company || '').toLowerCase().includes(q);
      const descMatch = (j.description || '').toLowerCase().includes(q);
      const townMatch = (j.town || '').toLowerCase().includes(q);
      return titleMatch || companyMatch || descMatch || townMatch;
    });
  }

  // 4. Town / Mandal filter
  if (filters.town && filters.town !== 'all') {
    const t = filters.town.toLowerCase().trim();
    result = result.filter((j) => (j.town || '').toLowerCase() === t);
  }

  // 5. Category filter
  if (filters.category && filters.category !== 'all') {
    const c = filters.category.toLowerCase().trim();
    result = result.filter((j) => (j.category || '').toLowerCase() === c);
  }

  // 6. Experience level filter
  if (filters.experience && filters.experience !== 'all') {
    const exp = filters.experience.toLowerCase().trim();
    if (exp === 'fresher') {
      result = result.filter((j) => Boolean(j.isFresher));
    } else if (exp === 'experienced') {
      result = result.filter((j) => !j.isFresher);
    }
  }

  // 7. Boolean isFresher filter
  if (filters.isFresher !== undefined && filters.isFresher !== '') {
    const isFr = String(filters.isFresher).toLowerCase() === 'true';
    result = result.filter((j) => Boolean(j.isFresher) === isFr);
  }

  // 8. Employment type filter
  if (filters.employmentType && filters.employmentType !== 'all') {
    result = result.filter((j) => (j.employmentType || '').toLowerCase() === filters.employmentType.toLowerCase());
  }

  // 9. Work arrangement / mode filter
  if (filters.workMode && filters.workMode !== 'all') {
    result = result.filter((j) => (j.workMode || '').toLowerCase() === filters.workMode.toLowerCase());
  }

  // 10. Salary range filter
  if (filters.salaryMin && Number(filters.salaryMin) > 0) {
    const min = Number(filters.salaryMin);
    result = result.filter((j) => (j.salaryMax || 0) >= min || (j.salaryMin || 0) >= min);
  }

  // Sort: newest first by default
  result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Pagination
  const page = Math.max(1, parseInt(filters.page || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(filters.limit || '12', 10)));
  const total = result.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = result.slice((page - 1) * limit, page * limit);

  return {
    jobs: paginated,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Unified Job Service Layer
 */
export const jobService = {
  /**
   * Get all published jobs with search, filtering, and pagination
   */
  async getJobs(filters = {}) {
    if (isDbConnected()) {
      try {
        const query = {};

        // Status
        if (filters.status && filters.status !== 'all') {
          query.status = filters.status;
        } else if (!filters.status && !filters.recruiterId) {
          query.status = 'published';
        }

        // Recruiter
        if (filters.recruiterId) {
          query.recruiterId = filters.recruiterId;
        }

        // Keyword
        if (filters.keyword && filters.keyword.trim()) {
          const q = filters.keyword.trim();
          query.$or = [
            { title: { $regex: q, $options: 'i' } },
            { company: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { town: { $regex: q, $options: 'i' } },
          ];
        }

        // Town
        if (filters.town && filters.town !== 'all') {
          query.town = { $regex: `^${filters.town.trim()}$`, $options: 'i' };
        }

        // Category
        if (filters.category && filters.category !== 'all') {
          query.category = filters.category.trim();
        }

        // Fresher
        if (filters.experience && filters.experience.toLowerCase() === 'fresher') {
          query.isFresher = true;
        } else if (filters.experience && filters.experience.toLowerCase() === 'experienced') {
          query.isFresher = false;
        }

        if (filters.isFresher !== undefined && filters.isFresher !== '') {
          query.isFresher = String(filters.isFresher).toLowerCase() === 'true';
        }

        // Employment type
        if (filters.employmentType && filters.employmentType !== 'all') {
          query.employmentType = filters.employmentType;
        }

        // Work mode
        if (filters.workMode && filters.workMode !== 'all') {
          query.workMode = filters.workMode;
        }

        const page = Math.max(1, parseInt(filters.page || '1', 10));
        const limit = Math.max(1, Math.min(100, parseInt(filters.limit || '12', 10)));
        const total = await Job.countDocuments(query);
        const totalPages = Math.ceil(total / limit) || 1;

        const jobs = await Job.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

        return {
          jobs: jobs.map((j) => j.toJSON()),
          total,
          page,
          limit,
          totalPages,
          persistenceMode: 'mongodb',
        };
      } catch (err) {
        console.warn(`[JobService] DB query failed, falling back to local store: ${err.message}`);
      }
    }

    // Local / fallback mode
    const filtered = filterLocalJobs(localStore.getAll(), filters);
    return {
      ...filtered,
      persistenceMode: 'local_store',
    };
  },

  /**
   * Get single job by ID
   */
  async getJobById(id) {
    if (isDbConnected()) {
      try {
        const job = await Job.findById(id);
        if (job) {
          return { job: job.toJSON(), persistenceMode: 'mongodb' };
        }
      } catch (err) {
        // ID might not be a valid ObjectId (e.g. 'job-1'), fall through to local store
      }
    }

    const job = localStore.getById(id);
    if (!job) return null;
    return { job, persistenceMode: 'local_store' };
  },

  /**
   * Create a new job listing
   */
  async createJob(jobData, user) {
    const newJobPayload = {
      ...jobData,
      recruiterId: user._id || user.id,
      company: jobData.company || user.recruiterProfile?.companyName || 'Verified Regional Employer',
      status: jobData.status || 'published',
      verificationStatus: user.role === 'admin' ? 'Verified Local Opening' : 'Pending Verification',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDbConnected()) {
      try {
        const created = await Job.create(newJobPayload);
        return { job: created.toJSON(), persistenceMode: 'mongodb' };
      } catch (err) {
        console.warn(`[JobService] DB job creation failed, falling back to local store: ${err.message}`);
      }
    }

    const uniqueId = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const localJob = {
      ...newJobPayload,
      id: uniqueId,
      _id: uniqueId,
    };

    localStore.add(localJob);
    return { job: localJob, persistenceMode: 'local_store' };
  },

  /**
   * Update existing job with ownership check
   */
  async updateJob(id, updateData, user) {
    const existingResult = await this.getJobById(id);
    if (!existingResult || !existingResult.job) {
      const error = new Error('Job listing not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const existing = existingResult.job;

    // Recruiter ownership check: only the posting recruiter or an admin can edit
    const isOwner = existing.recruiterId && String(existing.recruiterId) === String(user._id || user.id);
    const isAdmin = user.role === 'admin';

    // If existing job has no recruiterId (seed demo jobs), allow recruiters or admins to edit in dev
    const isSeedJob = !existing.recruiterId;

    if (!isOwner && !isAdmin && !isSeedJob) {
      const error = new Error('Access denied. You can only modify job openings created by your account.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    if (isDbConnected()) {
      try {
        const updated = await Job.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (updated) {
          return { job: updated.toJSON(), persistenceMode: 'mongodb' };
        }
      } catch (err) {
        // Fall back to local store
      }
    }

    const updated = localStore.update(id, updateData);
    return { job: updated, persistenceMode: 'local_store' };
  },

  /**
   * Delete or close job with ownership check
   */
  async deleteJob(id, user) {
    const existingResult = await this.getJobById(id);
    if (!existingResult || !existingResult.job) {
      const error = new Error('Job listing not found.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const existing = existingResult.job;
    const isOwner = existing.recruiterId && String(existing.recruiterId) === String(user._id || user.id);
    const isAdmin = user.role === 'admin';
    const isSeedJob = !existing.recruiterId;

    if (!isOwner && !isAdmin && !isSeedJob) {
      const error = new Error('Access denied. You can only remove job openings created by your account.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    if (isDbConnected()) {
      try {
        await Job.findByIdAndDelete(id);
        return { success: true, persistenceMode: 'mongodb' };
      } catch (err) {
        // Fall back to local store
      }
    }

    localStore.delete(id);
    return { success: true, persistenceMode: 'local_store' };
  },
};

export default jobService;
