// src/features/users/hooks/useUserLevelsQuery.js
import { useQuery } from '@tanstack/react-query'
import { getUserLevels } from '@/features/users/api/user-service'

export function useUserLevelsQuery(userId) {
  return useQuery({
    queryKey: ['user-levels', userId],
    queryFn: async () => {
      const { data } = await api.get(`/api/users/${userId}/levels`)
      // A API retorna { data: "string" } mas esperamos uma lista; adapte se necessário
      return Array.isArray(data?.data) ? data.data : []
    },
    enabled: Boolean(userId),
  })
}
 