import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendChatMessage } from '@/features/chat/api/chat-service'

export function useSendChatMessageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', variables.sessionId] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] })
    }
  })
}