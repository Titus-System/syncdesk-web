import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeUserLevel } from '@/features/users/api/user-service'

export function useRemoveUserLevelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, levelId }) => removeUserLevel({ userId, levelId }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-levels', userId] })
    },
  })
}
