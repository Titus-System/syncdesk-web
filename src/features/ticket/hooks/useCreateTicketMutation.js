import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTicket } from '@/features/ticket/api/ticket-service'

export function useCreateTicketMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    }
  })
}