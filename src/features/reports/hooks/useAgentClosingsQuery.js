import { useQuery } from '@tanstack/react-query'
import { http } from '@/lib/http'

export function useAgentClosingsQuery(params = {}) {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== 'Todos')
  )

  return useQuery({
    queryKey: ['tickets', 'dashboard', 'agent-closings', queryParams],
    queryFn: async () => {
      const res = await http.get('/tickets/dashboard/agent-closings', { params: queryParams })
      return res.data?.data ?? res.data ?? {}
    },
    staleTime: 30_000,
  })
}