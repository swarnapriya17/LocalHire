import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../translations/en';
import te from '../translations/te';

const translations = {
  en,
  te,
};

const LanguageContext = createContext();

const STORAGE_KEY = 'localhire_preferred_language';

/**
 * Helper to traverse nested translation object with dot notation (e.g. 'nav.home')
 */
function getNestedValue(obj, keyPath) {
  if (!obj || !keyPath) return undefined;
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'te' || saved === 'en') return saved;
    } catch {
      // localStorage may be restricted
    }
    return 'en';
  });

  const setLanguage = (newLang) => {
    if (newLang !== 'en' && newLang !== 'te') return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // Ignore
    }
  }, [language]);

  /**
   * Translate a key path with automatic fallback to English and optional custom fallback
   */
  const t = (keyPath, fallback = '') => {
    const activeDict = translations[language];
    const val = getNestedValue(activeDict, keyPath);
    if (val !== undefined) return val;

    // Fallback to English dictionary
    if (language !== 'en') {
      const enVal = getNestedValue(translations.en, keyPath);
      if (enVal !== undefined) return enVal;
    }

    return fallback || keyPath;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages: ['en', 'te'] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
