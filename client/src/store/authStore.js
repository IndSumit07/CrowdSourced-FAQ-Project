import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/axios";
import { initSocket, disconnectSocket } from "@/lib/socket";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken) => {
        localStorage.setItem("accessToken", accessToken);
        set({ user, accessToken, isAuthenticated: true });
        // Initialize socket after login
        initSocket(user.id, user.role);
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : state.user,
        }));
      },

      clearAuth: () => {
        localStorage.removeItem("accessToken");
        disconnectSocket();
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", credentials);
          get().setAuth(data.data.user, data.data.accessToken);
          return { success: true };
        } catch (err) {
          return {
            success: false,
            message: err.response?.data?.message || "Login failed",
          };
        } finally {
          set({ isLoading: false });
        }
      },

      googleLogin: async (accessToken) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/google", { accessToken });
          get().setAuth(data.data.user, data.data.accessToken);
          return { success: true };
        } catch (err) {
          return {
            success: false,
            message: err.response?.data?.message || "Google sign-in failed",
          };
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/register", payload);
          get().setAuth(data.data.user, data.data.accessToken);
          return { success: true };
        } catch (err) {
          return {
            success: false,
            message: err.response?.data?.message || "Registration failed",
          };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {}
        get().clearAuth();
      },

      // Re-hydrate socket on app load if already authenticated
      initializeSocket: () => {
        const { user, isAuthenticated } = get();
        if (isAuthenticated && user) {
          initSocket(user.id, user.role);
        }
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Listen for forced logout from axios interceptor
window.addEventListener("auth:logout", () => {
  useAuthStore.getState().clearAuth();
});
