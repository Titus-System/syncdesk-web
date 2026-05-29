import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchUserRoles } from '@/features/users/api/user-service'

export function usePatchUserRolesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: patchUserRoles,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] })
    }
  })
}