import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useIsStaffRole } from '@/shared/hooks/useIsStaffRole'

export default function DashboardLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isStaffRole = useIsStaffRole()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isStaffRole) {
    return (
      <Navigate
        to="/acesso-restrito-web"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}