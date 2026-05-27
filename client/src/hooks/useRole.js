import { useAuthStore } from '@/store/authStore';

/**
 * Returns boolean flags for role-based access checks.
 */
export const useRole = () => {
  const { user } = useAuthStore();
  return {
    isUser: user?.role === 'user',
    isContributor: user?.role === 'contributor',
    isAdmin: user?.role === 'admin',
    isContributorOrAdmin: user?.role === 'contributor' || user?.role === 'admin',
    role: user?.role,
  };
};
