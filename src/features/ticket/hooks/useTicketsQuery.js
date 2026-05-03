import { useQuery } from '@tanstack/react-query'
import { getQueueTickets, getTickets } from '@/features/ticket/api/ticket-service'

export function useTicketsQuery(params = {}, options = {}) {
  const { source = 'all', ...queryParams } = params

  return useQuery({
    queryKey: ['tickets', source, queryParams],
    queryFn: () => (source === 'queue' ? getQueueTickets(queryParams) : getTickets(queryParams)),
    retry: false,
    staleTime: 10000,
    refetchOnWindowFocus: false,
    ...options
  })
}