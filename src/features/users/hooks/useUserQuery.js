import { useQuery } from '@tanstack/react-query'
import { getUserById } from '@/features/users/api/user-service'

export function useUserQuery(userId) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => getUserById(userId),
    enabled: Boolean(userId)
  })
}