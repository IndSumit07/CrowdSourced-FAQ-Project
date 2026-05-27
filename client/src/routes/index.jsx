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
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import ProfilePage from '../pages/ProfilePage';

// Dynamic Router for Dashboard based on Role
const DashboardRouter = () => {
  const { user } = useAuthStore();
  if (user?.role === 'admin') return <AdminDashboard />;
  return <UserDashboard />;
};

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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      
      {/* Protected Routes inside DashboardLayout */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/contributions" element={<ContributorDashboard />} />
        <Route path="/faqs" element={<FAQPage />} />
        <Route path="/ask" element={<AskQueryPage />} />
        <Route path="/feed" element={<LiveContributorFeed />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
