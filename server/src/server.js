import app from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = config.port;

// Initialize database connection before accepting incoming traffic
try {
  await connectDB();
} catch (err) {
  console.warn(`[MongoDB Atlas] Database initialization notice: ${err.message}`);
}

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 LocalHire Backend Server is running!`);
  console.log(`📍 Environment:  ${config.nodeEnv}`);
  console.log(`🌐 Local URL:    http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth API:     http://localhost:${PORT}/api/auth`);
  console.log(`===============================================`);
});

// Graceful shutdown handling
const shutdown = async () => {
  console.log('\n🛑 Gracefully shutting down LocalHire server...');
  try {
    await disconnectDB();
  } catch (err) {
    console.error(`Error closing database connection: ${err.message}`);
  }
  server.close(() => {
    console.log('✅ LocalHire server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
