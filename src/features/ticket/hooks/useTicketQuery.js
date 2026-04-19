import { useQuery } from '@tanstack/react-query'
import { getTicketById } from '@/features/ticket/api/ticket-service'

export function useTicketQuery(ticketId, options = {}) {
  return useQuery({
    queryKey: ['tickets', ticketId],
    queryFn: () => getTicketById(ticketId),
    enabled: Boolean(ticketId),
    ...options
  })
}