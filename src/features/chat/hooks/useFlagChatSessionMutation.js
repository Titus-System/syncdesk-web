import { useMutation, useQueryClient } from '@tanstack/react-query'
import { flagChatSession } from '@/features/chat/api/chat-service'

export function useFlagChatSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: flagChatSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] })
    }
  })
}