import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeUserFromCompany } from '@/features/companies/api/company-service'

export function useRemoveUserFromCompanyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeUserFromCompany,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies', variables.companyId, 'users'] })
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
}
