import React, { useState, useEffect } from 'react';
import styles from './IntroAnimation.module.css';

export default function IntroAnimation({ onStartReveal, onComplete }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // 2. Check if intro has already run in this browsing session
    const hasSeenIntro = sessionStorage.getItem('localhire_intro_seen');

    if (hasSeenIntro || prefersReducedMotion) {
      if (onStartReveal) onStartReveal();
      if (onComplete) onComplete();
      return;
    }

    // First visit in session: show intro
    setShouldRender(true);

    // Sequence timing:
    // 0.0s - 0.6s: Logo reveals with smooth fade-in & scale
    // 0.6s - 1.5s: Tagline reveals smoothly
    // 1.6s: Trigger homepage hero & search reveal as intro begins dissolution
    const revealTimer = setTimeout(() => {
      setFadingOut(true);
      if (onStartReveal) onStartReveal();
    }, 1650);

    // 2.1s: Complete transition, mark session storage, unmount intro
    const completeTimer = setTimeout(() => {
      setShouldRender(false);
      sessionStorage.setItem('localhire_intro_seen', 'true');
      if (onComplete) onComplete();
    }, 2150);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [onStartReveal, onComplete]);

  const handleSkip = () => {
    setFadingOut(true);
    if (onStartReveal) onStartReveal();
    setTimeout(() => {
      setShouldRender(false);
      sessionStorage.setItem('localhire_intro_seen', 'true');
      if (onComplete) onComplete();
    }, 150);
  };

  if (!shouldRender) return null;

  return (
    <aside 
      className={`${styles.introOverlay} ${fadingOut ? styles.introFadingOut : ''}`}
      aria-label="LocalHire Intro Reveal"
      role="status"
      aria-live="polite"
    >
      <div className={styles.introContent}>
        {/* Step 1: Logo Reveal (Smooth fade-in + subtle scale) */}
        <div className={styles.logoWrapper}>
          <div className={styles.logoBadge}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <h1 className={styles.brandTitle}>LocalHire</h1>
        </div>

        {/* Regional Indicator */}
        <div className={styles.regionalPill}>
          <span>📍</span> West Godavari District, Andhra Pradesh
        </div>

        {/* Step 2: Tagline Reveal (Appears smoothly after logo) */}
        <div className={styles.taglineWrapper}>
          <p className={styles.taglineText}>
            Local Jobs. Limitless Opportunities.
          </p>
        </div>
      </div>

      {/* Non-blocking Skip Action */}
      <button 
        type="button"
        className={styles.skipButton} 
        onClick={handleSkip}
        aria-label="Skip introduction animation"
      >
        Skip ✕
      </button>
    </aside>
  );
}
