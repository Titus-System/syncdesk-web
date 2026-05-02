import { useQuery } from '@tanstack/react-query'
import { getComments } from '@/features/ticket/api/comment-service'

export function useCommentsQuery(ticketId) {
  return useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => getComments(ticketId),
    enabled: Boolean(ticketId),
  })
}