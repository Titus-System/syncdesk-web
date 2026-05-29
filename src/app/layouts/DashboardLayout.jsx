import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useTicketUpdateNotifications } from '@/features/ticket/hooks/useTicketUpdateNotifications'
import { useIsAdminRole } from '@/shared/hooks/useIsAdminRole'
import { useIsStaffRole } from '@/shared/hooks/useIsStaffRole'

export default function DashboardLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAdminRole = useIsAdminRole()
  const isStaffRole = useIsStaffRole()
  const location = useLocation()

  useTicketUpdateNotifications({
    enabled: isAuthenticated && isStaffRole && isAdminRole
  })

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
