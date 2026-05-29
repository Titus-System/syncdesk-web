import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deactivateUser } from '@/features/users/api/user-service'
 
export function useDeactivateUserMutation() {
  const queryClient = useQueryClient()
 
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', userId] })
    }
  })
}
 