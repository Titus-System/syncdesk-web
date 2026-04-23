import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchUser } from '@/features/users/api/user-service'

export function usePatchUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: patchUser,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] })
    }
  })
}