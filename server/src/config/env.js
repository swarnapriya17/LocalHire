import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'localhire_dev_jwt_secret_key_change_in_production_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: 'localhire_token',
  cookieMaxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  isProduction: process.env.NODE_ENV === 'production',
  // Phase 10: AI Career Assistant LLM Configuration
  llmApiKey: process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '',
  llmProvider: process.env.LLM_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : 'gemini'),
  llmModel: process.env.LLM_MODEL || (process.env.LLM_PROVIDER === 'openai' ? 'gpt-4o-mini' : 'gemini-3.8-flash'),
  llmFallbackModel: process.env.LLM_FALLBACK_MODEL || (process.env.LLM_PROVIDER === 'openai' ? '' : 'gemini-3.5-flash'),
  llmMaxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3', 10),
  llmRetryDelayMs: parseInt(process.env.LLM_RETRY_DELAY_MS || '500', 10),
  llmApiUrl: process.env.LLM_API_URL || '',
  llmTimeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || '45000', 10),
};
