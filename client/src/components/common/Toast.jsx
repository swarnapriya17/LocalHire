import React, { useEffect } from 'react';
import styles from './Toast.module.css';

export default function Toast({ message, type = 'info', icon = '✨', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={styles.toastContainer}>
      <div className={`${styles.toast} ${type === 'success' ? styles.toastSuccess : styles.toastInfo}`} role="status">
        <span className={styles.toastIcon}>{icon}</span>
        <span className={styles.toastMessage}>{message}</span>
        <button 
          className={styles.toastClose} 
          onClick={onClose} 
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
