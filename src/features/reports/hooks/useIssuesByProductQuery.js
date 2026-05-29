import { useQuery } from '@tanstack/react-query'
import { http } from '@/lib/http'

export function useIssuesByProductQuery(params = {}) {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== '')
  )

  return useQuery({
    queryKey: ['tickets', 'dashboard', 'issues-by-product', queryParams],
    queryFn: async () => {
      const res = await http.get('/tickets/dashboard/issues-by-product', { params: queryParams })
      return res.data?.data ?? res.data ?? {}
    },
    staleTime: 30_000,
  })
}