import { useMutation } from '@tanstack/react-query'
import { forgotPassword } from '@/features/auth/api/auth-service'

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: forgotPassword
  })
}