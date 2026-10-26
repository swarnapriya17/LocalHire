import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Normalize and collect permitted origins (supports comma-separated URLs and strips accidental trailing slashes)
const configuredOrigins = (config.clientUrl || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    config.clientUrl ? config.clientUrl.trim().replace(/\/$/, '') : '',
    config.clientUrl ? config.clientUrl.trim() : '',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ])
).filter(Boolean);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root route - Basic Service Info
app.get('/', (req, res) => {
  res.json({
    name: 'LocalHire API Server',
    tagline: 'Local Jobs. Limitless Opportunities.',
    district: 'West Godavari District, Andhra Pradesh',
    status: 'online',
    healthCheck: '/api/health',
    version: '1.0.0',
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Fallback 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
