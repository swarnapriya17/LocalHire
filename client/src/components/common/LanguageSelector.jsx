import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './LanguageSelector.module.css';

export default function LanguageSelector({ className = '' }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`${styles.selectorWrapper} ${className}`} role="group" aria-label="Language selection">
      <button
        type="button"
        className={`${styles.langBtn} ${language === 'en' ? styles.activeLang : ''}`}
        onClick={() => setLanguage('en')}
        title="Switch to English"
        aria-pressed={language === 'en'}
      >
        <span className={styles.langIcon}>🇬🇧</span>
        <span>EN</span>
      </button>

      <button
        type="button"
        className={`${styles.langBtn} ${language === 'te' ? styles.activeLang : ''}`}
        onClick={() => setLanguage('te')}
        title="తెలుగులోకి మార్చండి"
        aria-pressed={language === 'te'}
      >
        <span className={styles.langIcon}>🇮🇳</span>
        <span>తెలుగు</span>
      </button>
    </div>
  );
}
