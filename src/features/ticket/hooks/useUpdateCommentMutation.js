import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateComment } from '@/features/ticket/api/comment-service'

export function useUpdateCommentMutation(ticketId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] })
    },
  })
}