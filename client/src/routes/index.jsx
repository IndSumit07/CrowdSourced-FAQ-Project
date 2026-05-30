import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

import HomePage from '../pages/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import FAQPage from '../pages/FAQPage';
import AskQueryPage from '../pages/AskQueryPage';
import LiveContributorFeed from '../pages/LiveContributorFeed';
import DashboardLayout from '../components/layout/DashboardLayout';
import UserDashboard from '../pages/dashboard/UserDashboard';
import ContributorDashboard from '../pages/dashboard/ContributorDashboard';
import ProfilePage from '../pages/ProfilePage';

// A wrapper for routes that require authentication
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// A wrapper for routes that should only be accessible when NOT authenticated (like Login)
export const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public route for non-authenticated users (shows FAQs only)
const PublicDashboard = () => {
  return <UserDashboard />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Routes inside DashboardLayout */}
      <Route element={<DashboardLayout />}>
        {/* Public dashboard pages */}
        <Route path="/faqs" element={<FAQPage />} />
        <Route path="/ask" element={<AskQueryPage />} />
        <Route path="/feed" element={<LiveContributorFeed />} />

        {/* Dashboard - public, FAQs on top for everyone */}
        <Route path="/dashboard" element={<PublicDashboard />} />
        <Route path="/contributions" element={<ProtectedRoute><ContributorDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
