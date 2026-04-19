import { useInfiniteQuery } from '@tanstack/react-query'
import { getPaginatedMessages } from '@/features/chat/api/chat-service'

export function useGetPaginatedMessages(ticketId, limit = 20, options = {}) {
  const enabled = Boolean(ticketId) && (options.enabled ?? true)

  return useInfiniteQuery({
    queryKey: ['chat', 'messages', ticketId, limit],
    queryFn: ({ pageParam = 1 }) => getPaginatedMessages(ticketId, { page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage?.has_next ? lastPage.page + 1 : undefined),
    enabled
  })
}