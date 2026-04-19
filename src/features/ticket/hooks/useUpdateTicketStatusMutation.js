import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTicketStatus } from '@/features/ticket/api/ticket-service'

export function useUpdateTicketStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTicketStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.ticketId] })
    }
  })
}