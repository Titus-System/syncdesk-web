import { useMutation } from '@tanstack/react-query'
import { login } from '@/features/auth/api/auth-service'
import { useAuthStore } from '@/stores/auth-stores'
import { decodeJwtPayload } from '@/shared/utils/jwt'

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const tokenPayload = decodeJwtPayload(data?.access_token)

      const derivedUser = tokenPayload?.sub
        ? {
          id: tokenPayload.sub,
          roles: Array.isArray(tokenPayload.roles) ? tokenPayload.roles : []
        }
        : null

      const user = data?.user
        ? {
          ...derivedUser,
          ...data.user
        }
        : derivedUser

      setSession({
        user,
        accessToken: data?.access_token || null,
        refreshToken: data?.refresh_token || null
      })
    }
  })
}