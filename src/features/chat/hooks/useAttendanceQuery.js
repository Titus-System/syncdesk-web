import { useQuery } from '@tanstack/react-query'
import { getAttendanceById } from '@/features/chat/api/chat-service'

export function useAttendanceQuery(triageId, options = {}) {
  const { enabled: optionEnabled = true, ...queryOptions } = options

  return useQuery({
    queryKey: ['chatbot', 'attendance', triageId],
    queryFn: () => getAttendanceById(triageId),
    retry: false,
    staleTime: 30000,
    ...queryOptions,
    enabled: Boolean(triageId) && optionEnabled
  })
}