import { useQuery } from '@tanstack/react-query'
import { getCompanies } from '@/features/companies/api/company-service'

export function useCompaniesQuery({ page = 1, limit = 100 } = {}) {
  return useQuery({
    queryKey: ['companies', { page, limit }],
    queryFn: () => getCompanies({ page, limit }),
    staleTime: 60_000
  })
}
