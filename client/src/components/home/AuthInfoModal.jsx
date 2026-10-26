import React, { useState } from 'react';
import Modal from '../common/Modal';

export default function AuthInfoModal({ isOpen, onClose, onShowToast }) {
  const [selectedRole, setSelectedRole] = useState('seeker');

  const handleDemoSignIn = (e) => {
    e.preventDefault();
    if (onShowToast) {
      onShowToast(
        `Stage 2 Notice: Real JWT authentication & role-based login (${selectedRole.toUpperCase()}) will be activated in Stage 3.`,
        'info'
      );
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="LocalHire Member Access"
      subtitle="Connecting Candidates, Verified Employers & Administrators"
      maxWidth="580px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(167, 139, 250, 0.35)', padding: '1rem', borderRadius: 10, fontSize: '0.88rem', color: '#DDD6FE', lineHeight: 1.5 }}>
          🛡️ <strong>Development Roadmap Notice:</strong> LocalHire is currently in Stage 2 (Homepage & UI Architecture). Full backend JWT authentication, password hashing with bcrypt, and role-based access control will be deployed in <strong>Stage 3</strong>.
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
            Select Account Role:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <button
              type="button"
              style={{
                background: selectedRole === 'seeker' ? 'rgba(124, 58, 237, 0.3)' : 'rgba(11, 16, 32, 0.6)',
                border: selectedRole === 'seeker' ? '1px solid #A78BFA' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '0.75rem',
                color: '#F8FAFC',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedRole('seeker')}
            >
              👨‍💼 Job Seeker
            </button>

            <button
              type="button"
              style={{
                background: selectedRole === 'employer' ? 'rgba(124, 58, 237, 0.3)' : 'rgba(11, 16, 32, 0.6)',
                border: selectedRole === 'employer' ? '1px solid #A78BFA' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '0.75rem',
                color: '#F8FAFC',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedRole('employer')}
            >
              🏢 Recruiter
            </button>

            <button
              type="button"
              style={{
                background: selectedRole === 'admin' ? 'rgba(124, 58, 237, 0.3)' : 'rgba(11, 16, 32, 0.6)',
                border: selectedRole === 'admin' ? '1px solid #A78BFA' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '0.75rem',
                color: '#F8FAFC',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedRole('admin')}
            >
              ⚙️ Administrator
            </button>
          </div>
        </div>

        <form onSubmit={handleDemoSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
              Email or Mobile Number
            </label>
            <input
              type="text"
              placeholder="e.g. user@example.com"
              style={{
                width: '100%',
                background: 'rgba(11, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 8,
                padding: '0.65rem 0.85rem',
                color: '#F8FAFC',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              style={{
                width: '100%',
                background: 'rgba(11, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 8,
                padding: '0.65rem 0.85rem',
                color: '#F8FAFC',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '0.5rem',
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              border: 'none',
              borderRadius: 8,
              padding: '0.75rem',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            Sign In (Stage 3 Preview) →
          </button>
        </form>
      </div>
    </Modal>
  );
}
