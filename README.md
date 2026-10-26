# LocalHire

> **Tagline:** *"Local Jobs. Limitless Opportunities."*  
> **District Focus:** West Godavari District, Andhra Pradesh, India (Bhimavaram, Eluru, Tadepalligudem, Tanuku, Palakollu, Narasapuram, and surrounding regional hubs).

[![Node.js Tests](https://img.shields.io/badge/Node.js%20Tests-161%20Passing-brightgreen)](file:///D:/LocalHire/server/src/tests)
[![Frontend Build](https://img.shields.io/badge/Vite%20Build-Passing-blue)](file:///D:/LocalHire/client)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](file:///D:/LocalHire/package.json)
[![Bilingual](https://img.shields.io/badge/Languages-English%20%7C%20%E0%B0%A4%E0%B1%86%E0%B0%B2%E0%B1%81%E0%B0%97%E0%B1%81-purple)](#-bilingual-support--localization)

---

## 📋 Table of Contents

- [Overview & Objectives](#-overview--objectives)
- [Key Features](#-key-features)
  - [For Job Seekers & Students](#for-job-seekers--students)
  - [For Recruiters & Regional Employers](#for-recruiters--regional-employers)
  - [For Platform Administrators](#for-platform-administrators)
  - [Feature Implementation Status](#feature-implementation-status)
- [Technology Stack](#-technology-stack)
- [Architecture & Folder Structure](#-architecture--folder-structure)
- [Prerequisites (Windows & Cross-Platform)](#-prerequisites)
- [Local Setup & Startup Commands](#-local-setup--startup-commands)
- [MongoDB Atlas Setup](#-mongodb-atlas-setup)
- [Environment Variables](#-environment-variables)
- [Authentication & Authorization](#-authentication--authorization)
- [Verified API Endpoints](#-verified-api-endpoints)
- [AI Career Assistant: Setup & Known Limitations](#-ai-career-assistant-setup--known-limitations)
- [File & CV Handling Architecture](#-file--cv-handling-architecture)
- [Testing & Production Build](#-testing--production-build)
- [Production Deployment Guide](#-production-deployment-guide)
  - [MongoDB Atlas Deployment](#1-mongodb-atlas-database)
  - [Render Deployment (Backend API)](#2-render-backend-api)
  - [Vercel Deployment (Frontend SPA)](#3-vercel-frontend-spa)
- [Security Practices & Troubleshooting](#-security-practices--troubleshooting)
- [Contribution Guidelines](#-contribution-guidelines)
- [License](#-license)

---

## 🎯 Overview & Objectives

**LocalHire** is an end-to-end local employment and career enablement platform designed specifically for the economic landscape of **West Godavari district, Andhra Pradesh**. While mainstream national job boards cater primarily to metropolitan tier-1 corporations, LocalHire bridges regional job seekers, recent graduates, and skilled local technicians directly with verified regional enterprises, educational institutions, healthcare centers, aquaculture businesses, retail establishments, and local IT firms.

### Core Objectives:
1. **Regional Job Visibility:** Index entry-level and experienced openings situated within local towns (Bhimavaram, Eluru, Tadepalligudem, Tanuku, Palakollu, Narasapuram).
2. **Fresher Equal Opportunity:** Enable college students and first-time applicants to achieve 100% profile completeness based on academic projects, skills, and certifications without requiring corporate work history.
3. **Verified Local Trust:** Combat predatory listings through administrative employer verification workflows and job listing moderation.
4. **Bilingual Accessibility:** Provide seamless on-the-fly toggling between English and Telugu (`తెలుగు`) with client-side persistence and dictionary fallbacks.
5. **AI Career Empowerment:** Assist regional candidates with resume suggestions, interview preparation (STAR methodology), and personalized skill-gap roadmaps.

---

## 🌟 Key Features

### For Job Seekers & Students
- **Smart Local Search & Filter:** Filter openings by town (Bhimavaram, Eluru, Tadepalligudem, etc.), category (IT, Education, Healthcare, Retail, etc.), employment type (Full-time, Internship, Contract), work mode (On-site, Hybrid, Remote), minimum salary, and boolean Fresher eligibility.
- **Fresher-Optimized Profiles:** Profile completeness meter designed with zero-experience parity—freshers earn full completeness through projects, education, and skills.
- **Job Applications:** Direct one-click application submission with customized cover letters and external resume links. Automatic prevention of duplicate applications.
- **Application Tracking:** Real-time visibility into hiring progress (`Applied` &rarr; `Under Review` &rarr; `Shortlisted` &rarr; `Interview Scheduled` &rarr; `Hired`/`Rejected`).
- **Interactive Interview Details:** Access date, time, location, video meeting links, and recruiter notes when an interview is scheduled.
- **Notifications Bell:** Real-time unread notification count badge and interactive notification drawer alerting candidates to status changes and interviews.

### For Recruiters & Regional Employers
- **Company Profile Management:** Maintain verified employer brand details (company name, description, website, contact email, phone, town, industry).
- **Opening Management (CRUD):** Post, update, unpublish, and delete job openings with strict recruiter ownership enforcement.
- **Applicant Pipeline & Candidate Review:** Filter and manage incoming candidate applications per opening. Inspect candidate profiles with recruiter privacy protection.
- **Hiring Progression & Interview Scheduling:** Transition candidate statuses with automated candidate notification triggers. Schedule interviews with custom dates, times, and meeting links.
- **Recruitment Analytics:** Dashboard metrics displaying total postings, active applicants, shortlisted rates, scheduled interviews, and conversion pipelines.

### For Platform Administrators
- **Platform Overview:** High-level system metrics aggregating registered users, active postings, pending verifications, and moderation counts.
- **User Account Moderation:** Paginated user directory with search, role filters, and immediate account suspension/reactivation actions.
- **Employer Verification Queue:** Review submitted company credentials and approve or reject regional employers with audit feedback.
- **Job Moderation Queue:** Review job postings for authenticity and flag, approve, reject, or unpublish non-compliant listings.
- **Audit Logging:** System activity logs documenting administrative moderation decisions and compliance actions.
- **CLI Admin Provisioning:** Secure command-line provisioning script to create administrative accounts without exposing public admin registration endpoints.

### Feature Implementation Status

| Feature Area | Status | Implementation Details |
| :--- | :--- | :--- |
| **User Authentication & Roles** | ✅ Implemented | JWT + HTTP-only cookies, password hashing (bcryptjs), rate limiter, role authorization (`jobseeker`, `recruiter`, `admin`). |
| **Job Listings & Multi-Filter Search** | ✅ Implemented | MongoDB Atlas persistence + local JSON fallback store. 10+ query filters supported. |
| **Profile Completeness Engine** | ✅ Implemented | Mathematically verified 100% fresher scoring algorithm without work experience penalty. |
| **Application Submission & Pipeline** | ✅ Implemented | Full state machine with audit status history and recruiter/candidate access controls. |
| **Recruiter Dashboard & Analytics** | ✅ Implemented | Aggregates, candidate pipeline conversion rates, interview management. |
| **Admin Moderation & Audit Logs** | ✅ Implemented | Employer verification queue, job moderation, audit log collection. |
| **In-App Notification System** | ✅ Implemented | Automatic triggers on application, interview, moderation, and verification events. |
| **English / Telugu Localization** | ✅ Implemented | React Context with localStorage persistence, full bilingual dictionary coverage. |
| **AI Career Assistant Endpoints & UI** | ⚠️ Partially Implemented | Express backend routes, rate limiting, and React UI fully built. Live LLM calls depend on external provider key & model availability (see [AI Limitations](#-ai-career-assistant-setup--known-limitations)). |
| **File / CV Storage** | ⚠️ URL-Based | Currently supports validated external document URLs (Google Drive, LinkedIn, portfolio). Binary cloud storage (S3/Cloudinary) is planned for a future release. |
| **External Email/SMS Delivery** | ℹ️ Unverified / Future | In-app notifications are fully operational; external SMTP/SMS gateway is not configured. |

---

## 🏗️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 (`react` ^19.2.8, `react-dom` ^19.2.8) | Component architecture and reactive UI |
| **Client Bundler** | Vite 8 (`vite` ^8.3.0) | High-speed local dev server and optimized production packaging |
| **Client Routing** | React Router v7 (`react-router-dom` ^7.18.4) | Declarative single-page routing and role-based route guards |
| **Styling** | Vanilla CSS + CSS Modules | Bespoke design system without external CSS framework bloat |
| **Backend Runtime** | Node.js (v20+ / v22+ LTS) | Non-blocking asynchronous JavaScript server environment |
| **API Framework** | Express.js 5 (`express` ^5.3.0) | Modular RESTful API architecture with ES Modules (`"type": "module"`) |
| **Database** | MongoDB Atlas via Mongoose 9 (`mongoose` ^9.11.2) | Cloud document database with schemas, indexes, and virtuals |
| **Authentication** | JSON Web Tokens (`jsonwebtoken` ^9.0.3) + `bcryptjs` | Cryptographically signed sessions delivered in HTTP-only cookies |
| **Cookie Parsing & CORS** | `cookie-parser` ^1.4.7 + `cors` ^2.8.6 | Secure credentialed cross-origin request handling |
| **AI Integration** | Google Gemini REST API / OpenAI API compatible | LLM client with exponential backoff, jitter, and fallback model logic |
| **Test Runner** | Native Node.js Test Runner (`node --test`) | Zero-dependency, native automated unit and integration testing |

---

## 📂 Architecture & Folder Structure

```text
LocalHire/
├── .env.example                # Unified workspace environment variables template
├── .gitignore                  # Git ignore rules (node_modules, .env, build outputs, test caches)
├── package.json                # Root workspace management scripts
├── README.md                   # Comprehensive project documentation
│
├── client/                     # Frontend Application (React 19 + Vite)
│   ├── public/                 # Static assets (favicons, icons)
│   ├── src/
│   │   ├── assets/             # Vector icons and project imagery
│   │   ├── components/         # Modular UI components
│   │   │   ├── common/         # Navbar, Footer, LanguageSelector, NotificationBell, Modal, Toast, ProtectedRoute
│   │   │   └── home/           # HeroSection, JobSection, JobCard, JobCategories, IntroAnimation, Modals
│   │   ├── contexts/           # AuthContext (sessions) & LanguageContext (i18n)
│   │   ├── data/               # Regional reference datasets (towns, categories, resources, mocks)
│   │   ├── layouts/            # MainLayout page scaffolding
│   │   ├── pages/              # Routed views (HomePage, Login, Register, Dashboards, AI Assistant)
│   │   ├── routes/             # AppRoutes.jsx client routing registry
│   │   ├── services/           # api.js unified HTTP client wrapper
│   │   ├── styles/             # global.css design tokens & variables.css
│   │   ├── translations/       # en.js (English) & te.js (Telugu) i18n dictionaries
│   │   ├── utils/              # completeness.js profile calculation utilities
│   │   ├── App.jsx             # Top-level application component
│   │   └── main.jsx            # React root entry point
│   ├── .env.example            # Client-specific environment variables template
│   ├── .gitignore              # Client ignore rules
│   ├── package.json            # Client dependencies and build scripts
│   ├── vercel.json             # Vercel SPA rewrite rules (prevents 404 on page reload)
│   └── vite.config.js          # Vite server configuration & /api reverse proxy
│
└── server/                     # Backend API Service (Node.js + Express 5)
    ├── src/
    │   ├── config/             # env.js configuration loader & db.js MongoDB Atlas manager
    │   ├── controllers/        # Express route request/response controllers
    │   │   ├── admin.controller.js
    │   │   ├── ai.controller.js
    │   │   ├── application.controller.js
    │   │   ├── auth.controller.js
    │   │   ├── health.controller.js
    │   │   ├── job.controller.js
    │   │   ├── notification.controller.js
    │   │   ├── recruiter.controller.js
    │   │   └── user.controller.js
    │   ├── data/               # Seed data (seedJobs.json) & dev fallback cache
    │   ├── middleware/         # auth.js, errorHandler.js, notFound.js, rateLimiter.js
    │   ├── models/             # Mongoose schemas (user, job, application, notification, auditLog)
    │   ├── routes/             # Express router modules mounted under /api
    │   ├── scripts/            # createAdmin.js CLI provisioning utility
    │   ├── services/           # Domain business logic & data operations
    │   ├── tests/              # 161 automated unit and integration tests across 32 suites
    │   ├── utils/              # token.js (JWT & cookies) & completeness.js
    │   ├── validators/         # Input sanitization and payload validation schemas
    │   ├── app.js              # Express application assembly, CORS, & middleware pipeline
    │   └── server.js           # Server bootstrap, database initialization, & graceful shutdown
    ├── .env                    # Local secrets (strictly ignored by Git)
    ├── .env.example            # Server-specific environment template with placeholders
    ├── .gitignore              # Server ignore rules
    └── package.json            # Server dependencies, scripts, and test definitions
```

---

## ⚙️ Prerequisites

Before installing and running LocalHire locally on Windows, macOS, or Linux, ensure you have:

- **Node.js:** v18.0.0 or higher (**v20.x or v22.x LTS recommended**)
- **npm:** v9.0.0 or higher
- **MongoDB Atlas Account:** Free M0 Shared Cluster (or a local MongoDB instance)
- **Modern Web Browser:** Chrome, Edge, Firefox, or Safari

Verify your installed versions:
```powershell
node -v
npm -v
```

---

## 🚀 Local Setup & Startup Commands

### Step 1: Install Dependencies
From the project root (`D:\LocalHire`), install dependencies for both services:
```powershell
# Install both backend and frontend dependencies in one command
npm run install:all
```
*Alternatively, install each individually:*
```powershell
# Backend
cd server
npm install

# Frontend
cd ..\client
npm install
```

### Step 2: Configure Environment Files
Create local configuration files from the provided templates:

**For Backend:**
```powershell
cd D:\LocalHire\server
copy .env.example .env
```
Open `server\.env` in your editor and configure your credentials (see [Environment Variables](#-environment-variables)).

**For Frontend:**
```powershell
cd D:\LocalHire\client
copy .env.example .env
```
*(In local development, `VITE_API_URL` can be left blank or set to `http://localhost:5000/api`. Vite's dev server automatically proxies `/api` requests to port 5000).*

### Step 3: Run the Development Servers
Open two terminal windows:

#### Terminal 1 — Start Backend API:
```powershell
cd D:\LocalHire\server
npm run dev
```
- API will start at: `http://localhost:5000`
- System Health Check: `http://localhost:5000/api/health`
- Auth API Base: `http://localhost:5000/api/auth`

#### Terminal 2 — Start Frontend Client:
```powershell
cd D:\LocalHire\client
npm run dev
```
- Frontend application will open at: `http://localhost:5173`

### Step 4: Provision an Initial Administrator (Optional)
To test administrative moderation, provision a secure administrator account via the backend CLI:
```powershell
cd D:\LocalHire\server
npm run create-admin -- admin@localhire.in "YourSecurePassword123!" "LocalHire Admin"
```

---

## 🗄️ MongoDB Atlas Setup

LocalHire utilizes **MongoDB Atlas** for persistent storage of users, job postings, applications, notifications, and administrative audit logs.

### Step-by-Step Atlas Configuration:
1. Log in or register at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a new project and deploy a **Free M0 Shared Cluster**.
   - *Recommendation:* Select AWS region **Mumbai (`ap-south-1`)** for minimal latency to Andhra Pradesh users.
3. Under **Security &rarr; Database Access**:
   - Click **Add New Database User**.
   - Choose **Password** authentication.
   - Set a strong username (e.g., `localhire_app`) and generate a secure password.
   - Assign the **Read and write to any database** privilege.
4. Under **Security &rarr; Network Access**:
   - Click **Add IP Address**.
   - For local development: Add your current public IP address.
   - **For production deployment (Render/cloud hosting):** Click **Allow Access from Anywhere (`0.0.0.0/0`)** since cloud container providers rotate dynamic outbound IP addresses.
5. Under **Deployment &rarr; Database &rarr; Connect**:
   - Choose **Drivers** &rarr; Driver: **Node.js**, Version: **5.5 or later**.
   - Copy your connection string. It will look like:
     ```text
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/localhire?retryWrites=true&w=majority
     ```
6. Replace `<username>` and `<password>` with your database user credentials.
7. Paste this connection string into your `server/.env` as `MONGODB_URI`.

> **Note on Graceful Degradation:**  
> If `MONGODB_URI` is not configured or if the cluster is temporarily unreachable, LocalHire starts cleanly without crashing and serves public job listings via its internal read-only seed store. Mutation endpoints (registration, application submission) will safely return `HTTP 503 DATABASE_UNAVAILABLE` rather than corrupting state.

---

## 🔑 Environment Variables

### Backend Configuration (`server/.env`)

| Variable Name | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `5000` | Port on which Express listens. On Render, Render injects this automatically. |
| `NODE_ENV` | Yes | `development` | Environment mode (`development` or `production`). Enables secure cookie flags in production. |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Allowed CORS origin. In production, set to your Vercel URL (e.g. `https://localhire.vercel.app`). Supports comma-separated origins. |
| `FRONTEND_URL` | Optional | Same as `CLIENT_URL` | Fallback alias for `CLIENT_URL`. |
| `MONGODB_URI` | Yes (for data) | `""` | MongoDB Atlas SRV connection URI. |
| `JWT_SECRET` | Yes | *Dev default* | Cryptographic signing key for JWT tokens (minimum 32 random characters). |
| `JWT_EXPIRES_IN` | Optional | `7d` | Token expiration duration string (e.g. `7d`, `24h`). |
| `LLM_PROVIDER` | Optional | `gemini` | AI provider: `gemini` or `openai`. |
| `LLM_API_KEY` | Optional | `""` | API key for Gemini or OpenAI to enable live AI Career features. |
| `LLM_MODEL` | Optional | `gemini-1.5-flash` | Primary LLM model identifier. |
| `LLM_FALLBACK_MODEL` | Optional | `gemini-1.5-flash-8b` | Fallback model used automatically when primary experiences high demand. |
| `LLM_MAX_RETRIES` | Optional | `3` | Maximum automatic retries with exponential backoff on transient errors. |
| `LLM_RETRY_DELAY_MS` | Optional | `500` | Base retry delay in milliseconds. |
| `LLM_TIMEOUT_MS` | Optional | `45000` | Maximum timeout before aborting AI provider requests. |

### Frontend Configuration (`client/.env`)

| Variable Name | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes (in prod) | `/api` | Base URL of backend API. In production on Vercel, set to: `https://<render-service-name>.onrender.com/api`. |

---

## 🔒 Authentication & Authorization

LocalHire implements a multi-tier, role-based access control (RBAC) security model:

### Roles:
- **`jobseeker`**: Candidates seeking local openings. Can browse vacancies, maintain candidate profile, submit job applications, track progress, access notifications, and interact with the AI Career Assistant.
- **`recruiter`**: Regional employers and hiring managers. Can post and manage their company's job openings, review applicants, update candidate statuses, schedule interviews, and inspect recruitment analytics.
- **`admin`**: System administrators. Full access to platform summary metrics, user account moderation (suspension/reactivation), employer verification queue, job listing moderation, and audit logging.

### Session & Token Architecture:
- Upon successful authentication (`/api/auth/register` or `/api/auth/login`), the server issues a signed JWT containing `{ userId, email, role }`.
- The token is attached as an **HTTP-only cookie** (`localhire_token`) with:
  - `httpOnly: true` (prevents JavaScript access and mitigates XSS token theft).
  - `secure: true` in production (enforces HTTPS transport).
  - `sameSite: 'none'` in production (enables cross-site cookie delivery between Vercel and Render).
  - `sameSite: 'lax'` in development.
- Tokens are also returned in response bodies to support HTTP header-based authorization (`Authorization: Bearer <token>`).
- Public registration strictly denies registration with `role: 'admin'`. Administrator accounts can only be provisioned via server CLI.

---

## 📡 Verified API Endpoints

All endpoints are derived directly from the application's Express router implementations:

### Health & System
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Basic service metadata, version, and district focus. |
| `GET` | `/api/health` | Public | System status, uptime, and database connection state. |

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new candidate (`jobseeker`) or employer (`recruiter`). |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Sign in with email and password. 5 failed attempts lock for 5 minutes. |
| `POST` | `/api/auth/logout` | Public | Clear HTTP-only session cookie. |
| `GET` | `/api/auth/me` | Authenticated | Restore current authenticated user profile. |
| `GET` | `/api/auth/test/jobseeker` | `jobseeker`, `admin` | Verification endpoint for candidate access. |
| `GET` | `/api/auth/test/recruiter` | `recruiter`, `admin` | Verification endpoint for recruiter access. |
| `GET` | `/api/auth/test/admin` | `admin` | Verification endpoint for administrator access. |

### Job Listings (`/api/jobs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/jobs` | Public | Search and filter published vacancies with pagination. |
| `GET` | `/api/jobs/:id` | Public | Retrieve full details of a specific opening. |
| `GET` | `/api/jobs/recruiter/my-jobs` | `recruiter`, `admin` | Retrieve openings posted by the authenticated recruiter. |
| `POST` | `/api/jobs` | `recruiter`, `admin` | Create and publish a new job vacancy. |
| `PUT` | `/api/jobs/:id` | `recruiter`, `admin` | Update job opening (requires listing ownership). |
| `DELETE` | `/api/jobs/:id` | `recruiter`, `admin` | Remove job opening (requires listing ownership). |

### Candidate Profiles (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Authenticated | Retrieve current job seeker profile and completeness score. |
| `PUT` | `/api/users/profile` | Authenticated | Update candidate profile details (sanitizes against role tampering). |
| `GET` | `/api/users/jobseeker/:id` | Authenticated | Review public candidate profile (respects recruiter visibility flags). |

### Job Applications (`/api/applications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/applications` | `jobseeker` | Submit an application for an active, published opening. |
| `GET` | `/api/applications/my` | `jobseeker`, `admin` | Retrieve candidate's personal application history. |
| `GET` | `/api/applications/job/:jobId` | `recruiter`, `admin` | Retrieve all applications submitted for a recruiter's opening. |
| `GET` | `/api/applications/:id` | Applicant, Recruiter, Admin | Retrieve a single application with status history and notes. |
| `PATCH` | `/api/applications/:id/status` | `recruiter`, `admin` | Advance application status (`Shortlisted`, `Interview Scheduled`, etc.). |

### Recruiter Management (`/api/recruiter`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recruiter/summary` | `recruiter`, `admin` | Recruiter dashboard metrics and verification status. |
| `GET` | `/api/recruiter/profile` | `recruiter`, `admin` | Retrieve company profile and contact details. |
| `PUT` | `/api/recruiter/profile` | `recruiter`, `admin` | Update company profile (sanitized against privilege escalation). |
| `GET` | `/api/recruiter/analytics` | `recruiter`, `admin` | Pipeline conversion rates and per-job applicant statistics. |
| `GET` | `/api/recruiter/interviews` | `recruiter`, `admin` | Retrieve all scheduled candidate interviews across openings. |

### Administrative Moderation (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/summary` | `admin` | Platform-wide aggregate metrics and moderation counters. |
| `GET` | `/api/admin/users` | `admin` | Paginated user management with search and status filters. |
| `GET` | `/api/admin/users/:id` | `admin` | Inspect user account details. |
| `PUT` | `/api/admin/users/:id/status` | `admin` | Suspend or reactivate a user account with recorded reason. |
| `GET` | `/api/admin/employers/verification-queue` | `admin` | List employers pending verification. |
| `PUT` | `/api/admin/employers/:id/verification` | `admin` | Approve or reject employer verification with feedback. |
| `GET` | `/api/admin/jobs` | `admin` | List job postings for administrative moderation. |
| `PUT` | `/api/admin/jobs/:id/moderate` | `admin` | Approve, reject, flag, or unpublish a job listing. |
| `GET` | `/api/admin/audit-logs` | `admin` | Retrieve timestamped audit logs of all administrative actions. |

### AI Career Assistant (`/api/ai`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ai/status` | `jobseeker`, `admin` | Check whether AI provider is configured and active. |
| `POST` | `/api/ai/chat` | `jobseeker`, `admin` | Interactive conversational career counseling. |
| `POST` | `/api/ai/profile-review` | `jobseeker`, `admin` | AI feedback on candidate summary, skills, and portfolio. |
| `POST` | `/api/ai/skill-gap` | `jobseeker`, `admin` | 4-week learning roadmap and gap analysis for target roles. |
| `POST` | `/api/ai/interview/questions` | `jobseeker`, `admin` | Role-specific practice interview questions. |
| `POST` | `/api/ai/interview/feedback` | `jobseeker`, `admin` | STAR-method evaluation of candidate practice answers. |

### Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | Paginated notifications for current user. |
| `GET` | `/api/notifications/unread-count` | Authenticated | Unread notification count for badge display. |
| `PATCH` | `/api/notifications/:id/read` | Recipient only | Mark a single notification as read. |
| `PATCH` | `/api/notifications/read-all` | Recipient only | Mark all notifications as read. |

---

## 🤖 AI Career Assistant: Setup & Known Limitations

The AI Career Assistant provides regional candidates with customized interview preparation, resume reviews, and learning roadmaps tailored to West Godavari district opportunities.

### Architecture & Resiliency:
- **Rate Limiting:** Sliding-window rate limiter restricted to 15 requests/minute per user.
- **Provider Support:** Compatible with Google Gemini REST API and OpenAI `/v1/chat/completions`.
- **Automatic Fallback:** Includes bounded exponential backoff with random jitter (up to 3 retries) and automatic switching to a secondary fallback model if the primary model returns HTTP 503 or 429.

### Known Limitation & Verified Resolution:
> [!WARNING]
> **Previous HTTP 503 Overload Error:**  
> During testing with experimental or overloaded model names (such as internal previews), Google's Gemini API returned `HTTP 503 Service Unavailable` due to high server demand or non-existent endpoints.  
>  
> **Verified Resolution for Production:**
> 1. Set `LLM_PROVIDER=gemini`.
> 2. Set `LLM_MODEL=gemini-1.5-flash` in `server/.env`. The `gemini-1.5-flash` model has the highest free-tier quota, lowest latency, and most consistent uptime on Google AI Studio.
> 3. Set `LLM_FALLBACK_MODEL=gemini-1.5-flash-8b` to ensure secondary fallback when regional traffic spikes.
> 4. Ensure `LLM_API_KEY` is a valid API key obtained from [Google AI Studio](https://aistudio.google.com/app/apikey).
> 5. If using OpenAI instead, set `LLM_PROVIDER=openai`, `LLM_MODEL=gpt-4o-mini`, and provide an OpenAI key.

---

## 📄 File & CV Handling Architecture

In the current version:
- The `Application` and `User` models support resume links via `resumeUrl`.
- **How it works:** Candidates enter or link a validated remote HTTP/HTTPS document URL (e.g., Google Drive public share link, OneDrive, Dropbox, personal portfolio, or hosted PDF).
- **Why this architecture:** This avoids reliance on local disk storage in ephemeral cloud hosting environments (such as Render or Heroku free tiers, where files written to local disk are wiped whenever containers restart or redeploy).
- **Future Roadmap:** Multipart file upload using `multer` paired with persistent cloud object storage (AWS S3, Cloudinary, or Supabase Storage) is planned for a dedicated storage release.

---

## 🧪 Testing & Production Build

### Running Backend Tests
LocalHire includes 161 automated backend tests across 32 suites verifying all auth, job, application, profile, recruiter, admin, notification, and localization systems:

```powershell
cd D:\LocalHire\server
npm test
```
**Actual Test Results:**
```text
ℹ tests 161
ℹ suites 32
ℹ pass 161
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

### Running Frontend Production Build
The frontend uses Vite to compile, tree-shake, and minify JavaScript and CSS assets:

```powershell
cd D:\LocalHire\client
npm run build
```
**Actual Build Results:**
```text
✓ 91 modules transformed.
dist/index.html                   1.10 kB │ gzip:   0.58 kB
dist/assets/index-Des9Puq6.css  101.23 kB │ gzip:  16.40 kB
dist/assets/index-Baj3Lois.js   635.85 kB │ gzip: 173.35 kB
✓ built in 423ms
```

---

## 🌐 Production Deployment Guide

Deploying LocalHire requires three interconnected services:
1. **MongoDB Atlas** (Cloud Database)
2. **Render** (Node.js/Express Backend API)
3. **Vercel** (React/Vite Frontend SPA)

### 1. MongoDB Atlas (Database)
1. In your Atlas Cluster, create a dedicated production database user under **Database Access**.
2. Under **Network Access**, ensure `0.0.0.0/0` (Allow Access from Anywhere) is active so Render's cloud containers can connect.
3. Copy your connection string:
   `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/localhire?retryWrites=true&w=majority`

### 2. Render (Backend API)
1. Sign in to [Render](https://render.com) and click **New + &rarr; Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `localhire-api`
   - **Region:** Singapore or Frankfurt (closest to India on Render)
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free or Starter
4. Expand **Advanced &rarr; Health Check Path:**
   - Set to: `/api/health`
5. Under **Environment Variables**, add the following keys:
   - `NODE_ENV` = `production`
   - `PORT` = `5000` *(Render sets this automatically, but explicitly defining it is safe)*
   - `CLIENT_URL` = `https://<your-vercel-app-name>.vercel.app` *(update once Vercel is created)*
   - `MONGODB_URI` = `<your-mongodb-atlas-uri>`
   - `JWT_SECRET` = `<generate-a-strong-64-character-random-secret>`
   - `JWT_EXPIRES_IN` = `7d`
   - `LLM_PROVIDER` = `gemini`
   - `LLM_API_KEY` = `<your-google-ai-studio-key>`
   - `LLM_MODEL` = `gemini-1.5-flash`
   - `LLM_FALLBACK_MODEL` = `gemini-1.5-flash-8b`
6. Click **Create Web Service**.
7. Once deployed, note your Render service URL: `https://localhire-api.onrender.com`.

### 3. Vercel (Frontend SPA)
1. Sign in to [Vercel](https://vercel.com) and click **Add New &rarr; Project**.
2. Import your GitHub repository.
3. In project configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://<your-render-service-name>.onrender.com/api`
     *(Example: `https://localhire-api.onrender.com/api`)*
5. Click **Deploy**.
6. Once deployment finishes, copy your Vercel URL (e.g. `https://localhire.vercel.app`).
7. **Final Handshake:** Go back to your Render dashboard &rarr; `localhire-api` &rarr; **Environment** &rarr; update `CLIENT_URL` with your exact Vercel URL (e.g. `https://localhire.vercel.app`) without trailing slashes. Save changes to trigger a redeploy.

---

## 🛡️ Security Practices & Troubleshooting

### Security Safeguards Implemented:
1. **Never Commit Secrets:** Real `.env` files are ignored by `.gitignore`.
2. **Credential Masking:** Connection URIs automatically mask credentials in logs (`mongodb+srv://***:***@...`).
3. **No Public Admin Creation:** `role: 'admin'` is explicitly blocked during public registration.
4. **Credential Stuffing Rate Limiter:** Failed sign-ins track consecutive failures and enforce temporary IP locks.
5. **Secure Cookie Handling:** `httpOnly: true`, `secure: true` in production, with `sameSite: 'none'` for cross-domain Vercel/Render requests.

### Troubleshooting Common Issues:

#### Issue 1: CORS Blocked Error in Browser Console
- **Symptom:** `Access to fetch at 'https://...onrender.com/api' from origin 'https://...vercel.app' has been blocked by CORS policy`.
- **Cause:** Render `CLIENT_URL` does not match the frontend Vercel URL.
- **Fix:** In Render settings, verify `CLIENT_URL` is exactly `https://<your-app>.vercel.app` (do not add a trailing `/`).

#### Issue 2: Page Refresh on Vercel Gives 404 Not Found
- **Symptom:** Navigating to `/student/dashboard` works, but refreshing the page produces `404: NOT_FOUND`.
- **Cause:** Single Page Application (SPA) routing requires non-file requests to rewrite to `/index.html`.
- **Fix:** Ensure `client/vercel.json` exists with the rewrite rule:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

#### Issue 3: MongoDB Atlas IP Whitelist Connection Error
- **Symptom:** `Initial connection failed: Could not connect to any servers in your MongoDB Atlas cluster`.
- **Cause:** Outbound IP address is not whitelisted in MongoDB Atlas Network Access.
- **Fix:** In MongoDB Atlas &rarr; Network Access &rarr; Add IP Address &rarr; Select `0.0.0.0/0` (Allow Access from Anywhere) with a strong database user password.

#### Issue 4: AI Career Assistant Returns HTTP 503
- **Symptom:** `AI model is currently experiencing high demand. Please try again in a moment.`
- **Cause:** The selected model is experiencing regional congestion or `LLM_MODEL` is set to an unsupported model.
- **Fix:** Set `LLM_MODEL=gemini-1.5-flash` and `LLM_FALLBACK_MODEL=gemini-1.5-flash-8b` in your environment variables.

---

## 🤝 Contribution Guidelines

We welcome community contributions to improve LocalHire!

1. **Fork the Repository:** Create a personal fork on GitHub.
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/regional-town-filter
   ```
3. **Preserve Coding Standards:**
   - Adhere to existing Vanilla CSS design tokens in `client/src/styles/variables.css`.
   - Maintain Telugu (`te.js`) and English (`en.js`) translation dictionary parity.
   - Do not commit `.env` files or credentials.
4. **Run Test Suites Before Submitting:**
   ```bash
   # In server/
   npm test
   # In client/
   npm run build
   ```
5. **Open a Pull Request:** Provide a clear summary of your enhancements, testing evidence, and any database schema impacts.

---

## 📜 License

This project is licensed under the **ISC License** as declared in [`package.json`](file:///D:/LocalHire/package.json).

```text
ISC License

Copyright (c) 2026 LocalHire Team

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```
