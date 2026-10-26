import React, { useState, useEffect } from 'react';
import { healthService } from '../services/api';
import styles from './StarterPage.module.css';

export default function StarterPage() {
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState('checking'); // 'checking' | 'connected' | 'error'
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const pingBackend = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const data = await healthService.getHealth();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealth(data);
      setStatus('connected');
      setLastChecked(new Date().toLocaleTimeString());
      setErrorMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Unable to reach backend server');
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    pingBackend();
  }, []);

  return (
    <div className={styles.pageWrapper}>
      {/* Hero Section */}
      <section className={`${styles.heroSection} animate-fade-in`}>
        <div className={styles.badgeGlow}>
          <span>🌟</span> West Godavari Employment Network
        </div>
        
        <h1 className={styles.heroTitle}>
          <span className={styles.gradientText}>Local Jobs.</span>{' '}
          <span className={styles.accentGradient}>Limitless Opportunities.</span>
        </h1>

        <p className={styles.heroSubtitle}>
          LocalHire connects job seekers with verified employers across{' '}
          <span className={styles.highlightDistrict}>West Godavari district, Andhra Pradesh</span>.
          Bridging high-growth tech talent, local commercial enterprises, and fresh graduates with life-changing careers.
        </p>
      </section>

      {/* Backend API Health Monitor */}
      <section className={styles.healthCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <span>⚡</span> Backend Connectivity Status
          </div>
          
          <div className={`
            ${styles.statusIndicator} 
            ${status === 'connected' ? styles.statusConnected : ''}
            ${status === 'checking' ? styles.statusPending : ''}
            ${status === 'error' ? styles.statusError : ''}
          `}>
            <span className={styles.pingDot}></span>
            {status === 'connected' && `Operational (${latency !== null ? `${latency}ms` : '200 OK'})`}
            {status === 'checking' && 'Connecting to API...'}
            {status === 'error' && 'Backend Offline / Error'}
          </div>
        </div>

        <div className={styles.healthGrid}>
          <div className={styles.healthMetric}>
            <div className={styles.metricLabel}>Service Name</div>
            <div className={styles.metricValue}>{health?.service || 'LocalHire API'}</div>
          </div>

          <div className={styles.healthMetric}>
            <div className={styles.metricLabel}>District Focus</div>
            <div className={styles.metricValue}>{health?.districtFocus || 'West Godavari, AP'}</div>
          </div>

          <div className={styles.healthMetric}>
            <div className={styles.metricLabel}>API Version</div>
            <div className={styles.metricValue}>{health?.version ? `v${health.version}` : 'v1.0.0'}</div>
          </div>

          <div className={styles.healthMetric}>
            <div className={styles.metricLabel}>Server Uptime</div>
            <div className={styles.metricValue}>
              {health?.uptimeSeconds !== undefined ? `${health.uptimeSeconds}s` : 'Active'}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 8 }}>
            ⚠️ <strong>Connection Warning:</strong> {errorMessage}. Make sure the backend server is running on port 5000.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <button 
            className={styles.pingButton} 
            onClick={pingBackend} 
            disabled={isPinging}
            aria-label="Ping backend health endpoint"
          >
            <span>🔄</span> {isPinging ? 'Pinging /api/health...' : 'Test Backend Ping'}
          </button>
          
          {lastChecked && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Last response checked at: {lastChecked}
            </span>
          )}
        </div>
      </section>

      {/* Target Segments Focus */}
      <h2 className={styles.sectionTitle}>Built for West Godavari's Workforce</h2>
      <p className={styles.sectionSubtitle}>
        Empowering local talent and enterprises with modern hiring solutions.
      </p>

      <div className={styles.focusGrid}>
        <div className={styles.focusCard}>
          <div className={styles.cardIcon}>💻</div>
          <h3 className={styles.cardHead}>IT & Software Jobs</h3>
          <p className={styles.cardDesc}>
            Full-stack developers, QA engineers, cloud specialists, and remote tech roles for regional talent.
          </p>
        </div>

        <div className={styles.focusCard}>
          <div className={styles.cardIcon}>🏢</div>
          <h3 className={styles.cardHead}>Non-IT & Corporate</h3>
          <p className={styles.cardDesc}>
            Banking, administrative, finance, logistics, sales, and supply chain management positions.
          </p>
        </div>

        <div className={styles.focusCard}>
          <div className={styles.cardIcon}>🌾</div>
          <h3 className={styles.cardHead}>Local Business & Agro</h3>
          <p className={styles.cardDesc}>
            Aquaculture, agriculture processing, retail, hospitality, and local manufacturing enterprises.
          </p>
        </div>

        <div className={styles.focusCard}>
          <div className={styles.cardIcon}>🎓</div>
          <h3 className={styles.cardHead}>Fresher Opportunities</h3>
          <p className={styles.cardDesc}>
            Graduate trainees, internships, campus matches, and skill-based first-job placements.
          </p>
        </div>
      </div>

      {/* Project Foundation Status */}
      <section className={styles.checklistCard}>
        <h3 className={styles.checklistTitle}>
          <span>🛡️</span> Project Foundation & Environment Setup
        </h3>
        <div className={styles.checklistGrid}>
          <div className={styles.checkItem}>
            <span className={styles.checkBadge}>✓</span>
            <div><strong>Vite + React 19 Frontend</strong>: Modular routing, modern CSS architecture</div>
          </div>
          <div className={styles.checkItem}>
            <span className={styles.checkBadge}>✓</span>
            <div><strong>Node.js & Express API</strong>: REST routing, CORS, and centralized error handling</div>
          </div>
          <div className={styles.checkItem}>
            <span className={styles.checkBadge}>✓</span>
            <div><strong>Development Proxy</strong>: Direct communication between :5173 and :5000</div>
          </div>
          <div className={styles.checkItem}>
            <span className={styles.checkBadge}>✓</span>
            <div><strong>Security & Envs</strong>: Safe .env.example templates; secrets and keys gitignored</div>
          </div>
        </div>
      </section>
    </div>
  );
}
