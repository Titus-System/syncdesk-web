import { useMutation, useQueryClient } from '@tanstack/react-query'
import { takeTicket } from '@/features/ticket/api/ticket-service'

export function useTakeTicketMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: takeTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['active-conversations'] })
    }
  })
}