import { useQuery } from '@tanstack/react-query'
import { getActiveConversations } from '@/features/chat/api/chat-service'

export function useActiveConversationsQuery(search = '', options = {}) {
  return useQuery({
    queryKey: ['chat', 'active-conversations', search],
    queryFn: () => getActiveConversations(search),
    ...options
  })
}