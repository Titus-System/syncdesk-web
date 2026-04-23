import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUser } from '@/features/users/api/user-service'

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
}