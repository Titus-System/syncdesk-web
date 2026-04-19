import { configureLibrary } from '@titus-system/syncdesk'
import { env } from '@/lib/env'
import { useAuthStore } from '@/stores/auth-store'

let configured = false

export function configureSyncdesk() {
  if (configured) return

  configureLibrary({
    baseURL: env.apiUrl,
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    onTokensRefreshed: (newAccess, newRefresh) => {
      const currentUser = useAuthStore.getState().user

      useAuthStore.getState().setSession({
        user: currentUser,
        accessToken: newAccess,
        refreshToken: newRefresh
      })
    },
    onUnauthorized: () => {
      useAuthStore.getState().clearSession()
      window.location.href = '/login'
    }
  })

  configured = true
}