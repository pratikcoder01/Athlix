import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/protected/ProtectedRoute';

// Public Pages
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup'; // Register Page
import About from '../pages/About';

// Authenticated Pages
import Dashboard from '../pages/Dashboard';
import Feed from '../pages/Feed';
import Profile from '../pages/Profile';
import Discovery from '../pages/Discovery'; // Discover Coaches
import Gyms from '../pages/Gyms';           // Discover Academies
import Bookings from '../pages/Bookings';
import Tournaments from '../pages/Tournaments';

// Admin Pages
import UserManagement from '../pages/UserManagement';
import TournamentManagement from '../pages/TournamentManagement';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Authenticated Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/discovery"
        element={
          <ProtectedRoute>
            <Discovery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gyms"
        element={
          <ProtectedRoute>
            <Gyms />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments"
        element={
          <ProtectedRoute>
            <Tournaments />
          </ProtectedRoute>
        }
      />

      {/* Admin Specific Routes */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tournaments"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <TournamentManagement />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
