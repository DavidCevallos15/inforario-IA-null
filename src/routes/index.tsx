import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { LandingPage } from '../pages/LandingPage';
import { SchedulePage } from '../components/pages/SchedulePage';
import LoginPage from '../components/pages/LoginPage';
import ProfilePage from '../components/pages/ProfilePage';
import AboutPage from '../components/AboutPage';
import { ProtectedRoute, PublicOnlyRoute } from '../components/common/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        
        {/* Auth routes - redirect if already logged in */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage 
                onLogin={() => window.location.href = '/dashboard'} 
                onBack={() => window.location.href = '/'} 
              />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <LoginPage 
                onLogin={() => window.location.href = '/dashboard'} 
                onBack={() => window.location.href = '/'} 
              />
            </PublicOnlyRoute>
          }
        />
        
        {/* Dashboard - requires auth, redirect to landing for guests */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireAuth={true} redirectTo="/">
              <LandingPage />
            </ProtectedRoute>
          }
        />
        
        {/* Schedule view - accessible to everyone */}
        <Route path="/schedule/:id" element={<SchedulePage />} />
        
        {/* Profile - requires auth */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute requireAuth={true} redirectTo="/login">
              <ProfilePage 
                onBack={() => window.location.href = '/'} 
                onLogout={() => window.location.href = '/'} 
              />
            </ProtectedRoute>
          }
        />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
