import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@/features/users/api/user-service'

export function useUsersQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  })
}