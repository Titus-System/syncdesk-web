// src/features/users/hooks/useAddUserLevelMutation.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserLevels } from '@/features/users/api/user-service'

export function useAddUserLevelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, levelId }) => {
      const { data } = await api.post(`/api/users/${userId}/levels/${levelId}`)
      return data
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-levels', userId] })
    },
  })
}