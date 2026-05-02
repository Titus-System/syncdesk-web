import { useMutation } from '@tanstack/react-query'
import { login } from '@/features/auth/api/auth-service'
import { useAuthStore } from '@/stores/auth-stores'
import { decodeJwtPayload } from '@/shared/utils/jwt'
import { getUserById } from '@/features/users/api/user-service'

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      const tokenPayload = decodeJwtPayload(data?.access_token)

      const derivedUser = tokenPayload?.sub
        ? {
          id: tokenPayload.sub,
          roles: Array.isArray(tokenPayload.roles) ? tokenPayload.roles : []
        }
        : null

      const partialUser = data?.user
        ? { ...derivedUser, ...data.user }
        : derivedUser

      setSession({
        user: partialUser,
        accessToken: data?.access_token || null,
        refreshToken: data?.refresh_token || null
      })

      if (partialUser?.id) {
        try {
          const fullUser = await getUserById(partialUser.id)
          if (fullUser) {
            setSession({
              user: { ...partialUser, ...fullUser },
              accessToken: data?.access_token || null,
              refreshToken: data?.refresh_token || null
            })
          }
        } catch {
        }
      }
    }
  })
}