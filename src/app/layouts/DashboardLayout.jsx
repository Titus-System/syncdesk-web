import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useNotificationStore } from '@/stores/notification-store'
import { useChatNotificationsPolling } from '@/features/chat/hooks/useChatNotificationsPolling'
import { useTicketUpdateNotifications } from '@/features/ticket/hooks/useTicketUpdateNotifications'
import { useIsAdminRole } from '@/shared/hooks/useIsAdminRole'
import { useIsStaffRole } from '@/shared/hooks/useIsStaffRole'
import { useNotificationTitle } from '@/shared/hooks/useNotificationTitle'

export default function DashboardLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const unreadChatMessages = useNotificationStore((state) => state.unreadChatMessages)
  const isAdminRole = useIsAdminRole()
  const isStaffRole = useIsStaffRole()
  const location = useLocation()

  useChatNotificationsPolling({
    enabled: isAuthenticated && isStaffRole
  })

  useTicketUpdateNotifications({
    enabled: isAuthenticated && isStaffRole && isAdminRole
  })

  useNotificationTitle(unreadChatMessages)

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
