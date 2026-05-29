import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assumeConversation } from '@/features/chat/api/chat-service'

export function useAssumeChatSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assumeConversation,
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'active-conversations'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })

      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversation', chatId] })
      }
    }
  })
}