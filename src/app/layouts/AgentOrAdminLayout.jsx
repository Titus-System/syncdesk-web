import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useWebAccessRole } from '@/shared/hooks/useWebAccessRole'

export default function AgentOrAdminLayout() {
  const { canAccessWeb } = useWebAccessRole()
  const location = useLocation()

  if (!canAccessWeb) {
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