import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-stores'

function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') {
      return null
    }

    const parts = token.split('.')
    if (parts.length < 2) {
      return null
    }

    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json = atob(padded)

    return JSON.parse(json)
  } catch {
    return null
  }
}

function extractRoleIds(user) {
  const ids = new Set()

  if (user?.role_id) ids.add(Number(user.role_id))
  if (user?.roleId) ids.add(Number(user.roleId))

  if (Array.isArray(user?.role_ids)) {
    user.role_ids.forEach((id) => ids.add(Number(id)))
  }

  if (Array.isArray(user?.roles)) {
    user.roles.forEach((role) => {
      if (role?.id) ids.add(Number(role.id))
    })
  }

  if (user?.role?.id) {
    ids.add(Number(user.role.id))
  }

  return [...ids]
}

function extractRoleNames(user, tokenPayload) {
  const names = new Set()

  if (typeof user?.role === 'string') {
    names.add(user.role.toLowerCase())
  }

  if (typeof user?.role_name === 'string') {
    names.add(user.role_name.toLowerCase())
  }

  if (user?.role?.name) {
    names.add(String(user.role.name).toLowerCase())
  }

  if (Array.isArray(user?.roles)) {
    user.roles.forEach((role) => {
      if (typeof role === 'string') {
        names.add(role.toLowerCase())
      } else if (role?.name) {
        names.add(String(role.name).toLowerCase())
      }
    })
  }

  if (Array.isArray(tokenPayload?.roles)) {
    tokenPayload.roles.forEach((role) => {
      names.add(String(role).toLowerCase())
    })
  }

  if (typeof tokenPayload?.role === 'string') {
    names.add(tokenPayload.role.toLowerCase())
  }

  return [...names]
}

export function useIsAdminRole() {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)

  return useMemo(() => {
    const tokenPayload = decodeJwtPayload(accessToken)
    const roleIds = extractRoleIds(user)
    const roleNames = extractRoleNames(user, tokenPayload)

    if (roleIds.includes(1)) {
      return true
    }

    return roleNames.some((name) => name.includes('admin'))
  }, [accessToken, user])
}