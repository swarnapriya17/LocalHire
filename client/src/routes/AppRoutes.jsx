import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import StudentDashboard from '../pages/StudentDashboard';
import JobSeekerProfilePage from '../pages/JobSeekerProfilePage';
import RecruiterDashboard from '../pages/RecruiterDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import AiCareerAssistantPage from '../pages/AiCareerAssistantPage';
import StarterPage from '../pages/StarterPage';
import ProtectedRoute from '../components/common/ProtectedRoute';
import MainLayout from '../layouts/MainLayout';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Role-Protected Dashboards & Profile */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['jobseeker', 'admin']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['jobseeker', 'admin']}>
            <JobSeekerProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Phase 10: AI Career Assistant */}
      <Route
        path="/student/ai-assistant"
        element={
          <ProtectedRoute allowedRoles={['jobseeker', 'admin']}>
            <AiCareerAssistantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-assistant"
        element={<Navigate to="/student/ai-assistant" replace />}
      />
      <Route
        path="/jobseeker/ai-assistant"
        element={<Navigate to="/student/ai-assistant" replace />}
      />

      {/* Jobseeker alias routes */}
      <Route
        path="/jobseeker/dashboard"
        element={<Navigate to="/student/dashboard" replace />}
      />
      <Route
        path="/jobseeker/profile"
        element={<Navigate to="/student/profile" replace />}
      />

      <Route
        path="/recruiter/dashboard"
        element={
          <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Preserved Stage 1 System Health & Verification Monitor */}
      <Route
        path="/status"
        element={
          <MainLayout>
            <StarterPage />
          </MainLayout>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
