import { useInfiniteQuery } from '@tanstack/react-query'
import { getPaginatedMessages } from '@/features/chat/api/chat-service'

export function useGetPaginatedMessages(ticketId, limit = 20, options = {}) {
  const { enabled: optionEnabled = true, ...queryOptions } = options
  const enabled = Boolean(ticketId) && optionEnabled

  return useInfiniteQuery({
    queryKey: ['chat', 'messages', ticketId, limit],
    queryFn: ({ pageParam = 1 }) => getPaginatedMessages(ticketId, { page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage?.has_next ? lastPage.page + 1 : undefined),
    enabled,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...queryOptions
  })
}