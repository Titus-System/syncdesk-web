import { useQuery } from '@tanstack/react-query'
import { getTickets } from '@/features/ticket/api/ticket-service'

export function useTicketsQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => getTickets(params),
    ...options
  })
}