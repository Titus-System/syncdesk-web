// src/features/users/hooks/useAddUserLevelMutation.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addUserLevel } from '@/features/users/api/user-service'

export function useAddUserLevelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, levelId }) => addUserLevel({ userId, levelId }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-levels', userId] })
    },
  })
}