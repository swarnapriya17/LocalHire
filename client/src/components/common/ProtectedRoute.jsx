import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show clean dark loading state while checking session with backend
  if (loading) {
    return (
      <div 
        style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          color: '#A78BFA'
        }}
      >
        <div 
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(124, 58, 237, 0.25)',
            borderTopColor: '#7C3AED',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} 
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>Verifying LocalHire session...</span>
      </div>
    );
  }

  // Not logged in -> Redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in, but lacking required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const roleDashboardMap = {
      jobseeker: '/student/dashboard',
      recruiter: '/recruiter/dashboard',
      admin: '/admin/dashboard',
    };
    const userDashboardPath = roleDashboardMap[user.role] || '/';

    return (
      <div style={{ maxWidth: '640px', margin: '4rem auto', padding: '2rem' }}>
        <div 
          style={{
            background: '#111A2E',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 16,
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⛔</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '0.5rem' }}>
            Access Restricted
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            You are signed in as <strong>{user.name}</strong> with the account role{' '}
            <span style={{ color: '#A78BFA', fontWeight: 700 }}>"{user.role}"</span>.
            This area requires one of the following roles: [{allowedRoles.join(', ')}].
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to={userDashboardPath}
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                color: '#FFFFFF',
                padding: '0.75rem 1.5rem',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.92rem',
                textDecoration: 'none'
              }}
            >
              Go to Your Authorized Dashboard →
            </Link>
            <Link
              to="/"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#F8FAFC',
                padding: '0.75rem 1.25rem',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.92rem',
                textDecoration: 'none'
              }}
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
