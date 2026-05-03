import { useMutation, useQueryClient } from '@tanstack/react-query'
import { takeTicket } from '@/features/ticket/api/ticket-service'

export function useTakeTicketMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: takeTicket,
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'active-conversations'] })
    }
  })
}