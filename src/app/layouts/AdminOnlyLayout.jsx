import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useWebAccessRole } from '@/shared/hooks/useWebAccessRole'

export default function AdminOnlyLayout() {
  const { isAdmin } = useWebAccessRole()
  const location = useLocation()

  if (!isAdmin) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}