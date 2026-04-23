import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}