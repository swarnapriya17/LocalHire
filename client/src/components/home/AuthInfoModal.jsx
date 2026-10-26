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
        <div style={{ background: '#F3EFFF', border: '1px solid #DDD6FE', padding: '1rem', borderRadius: 10, fontSize: '0.88rem', color: '#17365D', lineHeight: 1.5 }}>
          🛡️ <strong>Development Roadmap Notice:</strong> LocalHire is currently in Stage 2 (Homepage & UI Architecture). Full backend JWT authentication, password hashing with bcrypt, and role-based access control will be deployed in <strong>Stage 3</strong>.
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#526B85', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
            Select Account Role:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <button
              type="button"
              style={{
                background: selectedRole === 'seeker' ? '#E9F9F8' : '#FFFFFF',
                border: selectedRole === 'seeker' ? '1px solid var(--primary-teal)' : '1px solid #E1EDF3',
                borderRadius: 8,
                padding: '0.75rem',
                color: selectedRole === 'seeker' ? '#0F766E' : '#526B85',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedRole('seeker')}
            >
              👨‍💼 Job Seeker
            </button>

            <button
              type="button"
              style={{
                background: selectedRole === 'employer' ? '#E9F9F8' : '#FFFFFF',
                border: selectedRole === 'employer' ? '1px solid var(--primary-teal)' : '1px solid #E1EDF3',
                borderRadius: 8,
                padding: '0.75rem',
                color: selectedRole === 'employer' ? '#0F766E' : '#526B85',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedRole('employer')}
            >
              🏢 Recruiter
            </button>

            <button
              type="button"
              style={{
                background: selectedRole === 'admin' ? '#E9F9F8' : '#FFFFFF',
                border: selectedRole === 'admin' ? '1px solid var(--primary-teal)' : '1px solid #E1EDF3',
                borderRadius: 8,
                padding: '0.75rem',
                color: selectedRole === 'admin' ? '#0F766E' : '#526B85',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedRole('admin')}
            >
              ⚙️ Administrator
            </button>
          </div>
        </div>

        <form onSubmit={handleDemoSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#526B85', display: 'block', marginBottom: '0.25rem' }}>
              Email or Mobile Number
            </label>
            <input
              type="text"
              placeholder="e.g. user@example.com"
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1px solid #E1EDF3',
                borderRadius: 8,
                padding: '0.65rem 0.85rem',
                color: '#17365D',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#526B85', display: 'block', marginBottom: '0.25rem' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1px solid #E1EDF3',
                borderRadius: 8,
                padding: '0.65rem 0.85rem',
                color: '#17365D',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '0.5rem',
              background: 'var(--primary-teal, #0F9D96)',
              border: 'none',
              borderRadius: 8,
              padding: '0.75rem',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(15, 157, 150, 0.25)',
            }}
          >
            Sign In (Stage 3 Preview) →
          </button>
        </form>
      </div>
    </Modal>
  );
}
