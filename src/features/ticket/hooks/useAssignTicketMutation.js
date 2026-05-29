import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignTicket } from '@/features/ticket/api/ticket-service'

export function useAssignTicketMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignTicket,
    onSuccess: (_, variables) => {
      const ticketId = variables?.ticketId

      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['chat'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'active-conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] })

      if (ticketId) {
        queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] })
        queryClient.invalidateQueries({ queryKey: ['comments', ticketId] })
      }
    }
  })
}