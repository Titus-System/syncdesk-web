import { useQuery } from '@tanstack/react-query'
import { getChatMessages } from '@/features/chat/api/chat-service'

export function useChatMessagesQuery(sessionId) {
  return useQuery({
    queryKey: ['chat', 'messages', sessionId],
    queryFn: () => getChatMessages(sessionId),
    enabled: Boolean(sessionId)
  })
}