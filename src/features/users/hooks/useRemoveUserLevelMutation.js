// src/features/users/hooks/useRemoveUserLevelMutation.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserLevels } from '@/features/users/api/user-service'

export function useRemoveUserLevelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, levelId }) => {
      const { data } = await api.delete(`/api/users/${userId}/levels/${levelId}`)
      return data
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-levels', userId] })
    },
  })
}