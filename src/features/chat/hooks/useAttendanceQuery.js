import { useQuery } from '@tanstack/react-query'
import { getAttendanceById } from '@/features/chat/api/chat-service'

export function useAttendanceQuery(triageId) {
  return useQuery({
    queryKey: ['chatbot', 'attendance', triageId],
    queryFn: () => getAttendanceById(triageId),
    enabled: Boolean(triageId)
  })
}