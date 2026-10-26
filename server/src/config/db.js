import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

/**
 * Mask sensitive credentials from MongoDB URI for safe logging
 */
export function maskMongoUri(uri) {
  if (!uri) return '';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

/**
 * Configure Mongoose connection event listeners
 */
let listenersAttached = false;
function attachConnectionListeners() {
  if (listenersAttached) return;

  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log(`✅ [MongoDB Atlas] Connected to database: "${mongoose.connection.name}"`);
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error(`❌ [MongoDB Atlas] Connection Error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('⚠️  [MongoDB Atlas] Disconnected from database cluster.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('🔄 [MongoDB Atlas] Reconnected to database cluster.');
  });

  listenersAttached = true;
}

/**
 * Connect to MongoDB Atlas
 * Handles connection lifecycle safely without exposing credentials or crashing
 */
export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (!config.mongoUri) {
    console.warn('⚠️  [MongoDB Atlas] MONGODB_URI is not set in server/.env.');
    console.warn('ℹ️  Authentication persistence requires MongoDB Atlas. Configure MONGODB_URI in server/.env.');
    isConnected = false;
    return false;
  }

  attachConnectionListeners();

  try {
    const masked = maskMongoUri(config.mongoUri);
    console.log(`🔌 [MongoDB Atlas] Connecting to cluster: ${masked}...`);

    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true, // Build unique indexes in dev
    });

    isConnected = conn.connection.readyState === 1;
    console.log(`✅ [MongoDB Atlas] Connection established successfully: host=${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error(`❌ [MongoDB Atlas] Initial connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🔌 [MongoDB Atlas] Database connection closed.');
  }
}

/**
 * Check if active database connection exists
 */
export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Get safe database status for health reporting without leaking credentials
 */
export function getDatabaseStatus() {
  const readyStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const stateCode = mongoose.connection.readyState;
  const connected = stateCode === 1;

  return {
    connected,
    status: readyStates[stateCode] || 'unknown',
    provider: 'MongoDB Atlas',
    databaseName: connected ? mongoose.connection.name : null,
    clusterHost: connected ? mongoose.connection.host : null,
  };
}

/**
 * Middleware ensuring database connection is active before processing data mutations
 */
export function requireDb(req, res, next) {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      error: {
        statusCode: 503,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection required: MONGODB_URI is not configured or reachable. Persistent user accounts require an active MongoDB Atlas connection.',
      },
    });
  }
  next();
}
