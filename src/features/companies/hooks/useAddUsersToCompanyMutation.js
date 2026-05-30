import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addUsersToCompany } from '@/features/companies/api/company-service'

export function useAddUsersToCompanyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addUsersToCompany,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies', variables.companyId, 'users'] })
      variables.userIds?.forEach((userId) => {
        queryClient.invalidateQueries({ queryKey: ['users', userId] })
      })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
}
