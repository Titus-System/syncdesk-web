import { useQuery } from '@tanstack/react-query'
import { getChatSessions } from '@/features/chat/api/chat-service'

export function useChatSessionsQuery(search) {
  return useQuery({
    queryKey: ['chat', 'sessions', search],
    queryFn: () => getChatSessions(search)
  })
}