import { useQuery } from '@tanstack/react-query'
import { http } from '@/lib/http'

export function useTicketsDashboardQuery(type = 'issue') {
  return useQuery({
    queryKey: ['tickets', 'dashboard', type],
    queryFn: async () => {
      const res = await http.get('/tickets/dashboard', { params: { type } })
      return res.data?.data ?? res.data ?? {}
    },
    staleTime: 30_000,
  })
}