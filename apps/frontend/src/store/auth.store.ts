import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  name: string | null;
  email: string | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: { id: string; name: string; email: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      name: null,
      email: null,
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setUser: (user) =>
        set({ userId: user.id, name: user.name, email: user.email }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          name: null,
          email: null,
        }),
    }),
    { name: "reportbuilder-auth" },
  ),
);
