import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateComment, deleteComment } from '@/features/ticket/api/comment-service'

export function useUpdateCommentMutation(ticketId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] })
    },
  })
}