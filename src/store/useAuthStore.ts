import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "../api/auth";
import type { AuthUser } from "../types";

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const userResponse = await authAPI.login({ email, password });
          
          if (!userResponse?.access_token) {
            return { success: false, error: "Login failed. Please try again." };
          }

          const { user, access_token } = userResponse;

          // Check if user is super admin
          if (!user.isSuperAdmin) {
            set({ isLoading: false });
            return { success: false, error: "Access denied. Only Super Admins can access this portal." };
          }

          localStorage.setItem("admin-auth-token", access_token);

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          const message = error?.response?.data?.message || error.message || "An error occurred during login";
          return { success: false, error: message };
        }
      },

      logout: () => {
        localStorage.clear();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      },

      initializeAuth: async () => {
        try {
          const token = localStorage.getItem("admin-auth-token");
          const currentState = get();

          if (token && !currentState.user) {
            set({ isLoading: true });
            const user = await authAPI.getCurrentUser();
            
            if (user && user.isSuperAdmin) {
              set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              localStorage.clear();
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } else if (token && currentState.user) {
            try {
              const user = await authAPI.getCurrentUser();
              if (user && user.isSuperAdmin) {
                set({ isAuthenticated: true });
              } else {
                throw new Error("Not a super admin");
              }
            } catch (error) {
              localStorage.clear();
              set({
                user: null,
                token: null,
                isAuthenticated: false,
              });
            }
          }
        } catch (error) {
          localStorage.clear();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "admin-auth-storage",
      version: 1,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
