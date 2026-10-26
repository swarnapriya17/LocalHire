import { getDatabaseStatus } from '../config/db.js';

/**
 * Health check controller
 * Provides system status, uptime, service metadata, and database connection status
 */
export const getHealth = (req, res) => {
  const dbStatus = getDatabaseStatus();

  const healthData = {
    status: dbStatus.connected ? 'healthy' : 'degraded',
    service: 'LocalHire API',
    tagline: 'Local Jobs. Limitless Opportunities.',
    districtFocus: 'West Godavari, Andhra Pradesh',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
  };

  return res.status(200).json(healthData);
};
