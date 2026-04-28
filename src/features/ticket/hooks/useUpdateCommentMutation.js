import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateComment, deleteComment } from '@/features/ticket/api/comment-service'

export function useDeleteCommentMutation(ticketId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] })
    },
  })
}