import { useQuery } from '@tanstack/react-query'
import { getRoles } from '@/features/users/api/user-service'

export function useRolesQuery() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    staleTime: 1000 * 60 * 10,
  })
}