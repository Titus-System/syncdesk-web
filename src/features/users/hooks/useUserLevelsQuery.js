// src/features/users/hooks/useUserLevelsQuery.js
import { useQuery } from '@tanstack/react-query'
import { getUserLevels } from '@/features/users/api/user-service'

export function useUserLevelsQuery(userId) {
  return useQuery({
    queryKey: ['user-levels', userId],
    queryFn: () => getUserLevels(userId),
    enabled: Boolean(userId),
  })
}