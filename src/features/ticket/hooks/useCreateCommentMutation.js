import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createComment } from '@/features/ticket/api/comment-service'

export function useCreateCommentMutation(ticketId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] })
    },
  })
}