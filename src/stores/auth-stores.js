import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setSession: ({ user, accessToken, refreshToken }) =>
        set({
          user: user || null,
          accessToken: accessToken || null,
          refreshToken: refreshToken || null,
          isAuthenticated: Boolean(accessToken)
        }),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        })
    }),
    {
      name: 'syncdesk-auth',
      storage: createJSONStorage(() => localStorage)
    }
  )
)