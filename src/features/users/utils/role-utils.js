export const ROLE_OPTIONS = [
  { key: 'admin', label: 'Administrador', roleId: 1 },
  { key: 'user', label: 'Usuário comum', roleId: 2 },
  { key: 'agent', label: 'Atendente', roleId: 3 },
  { key: 'client', label: 'Cliente', roleId: 4 }
]

export const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'Todas as roles' },
  { value: 'admin', label: 'Administrador' },
  { value: 'user', label: 'Usuário comum' },
  { value: 'agent', label: 'Atendente' },
  { value: 'client', label: 'Cliente' },
  { value: 'unknown', label: 'Desconhecido' }
]

export function getRoleInfo(user) {
  if (!user) {
    return { key: 'unknown', name: 'Desconhecido', isAdmin: false }
  }

  const roles = []

  if (user.role_id != null) {
    roles.push({ id: Number(user.role_id) })
  }

  if (user.roleId != null) {
    roles.push({ id: Number(user.roleId) })
  }

  if (Array.isArray(user.role_ids)) {
    user.role_ids.forEach((id) => {
      roles.push({ id: Number(id) })
    })
  }

  if (Array.isArray(user.roles_ids)) {
    user.roles_ids.forEach((id) => {
      roles.push({ id: Number(id) })
    })
  }

  if (Array.isArray(user.roles)) {
    user.roles.forEach((role) => {
      if (typeof role === 'string') {
        roles.push({ name: role.toLowerCase() })
      } else {
        roles.push({
          id: role?.id != null ? Number(role.id) : null,
          name: role?.name?.toLowerCase()
        })
      }
    })
  }

  if (Array.isArray(user.role_names)) {
    user.role_names.forEach((name) => {
      roles.push({ name: String(name).toLowerCase() })
    })
  }

  if (Array.isArray(user.roles_names)) {
    user.roles_names.forEach((name) => {
      roles.push({ name: String(name).toLowerCase() })
    })
  }

  if (Array.isArray(user.roleNames)) {
    user.roleNames.forEach((name) => {
      roles.push({ name: String(name).toLowerCase() })
    })
  }

  if (Array.isArray(user.rolesNames)) {
    user.rolesNames.forEach((name) => {
      roles.push({ name: String(name).toLowerCase() })
    })
  }

  if (typeof user.role === 'string') {
    roles.push({ name: user.role.toLowerCase() })
  } else if (user.role) {
    roles.push({
      id: user.role?.id != null ? Number(user.role.id) : null,
      name: user.role?.name?.toLowerCase()
    })
  }

  if (user.role_name) {
    roles.push({ name: String(user.role_name).toLowerCase() })
  }

  if (user.roleName) {
    roles.push({ name: String(user.roleName).toLowerCase() })
  }

  const hasAdmin = roles.some((role) => role.id === 1 || role.name?.includes('admin'))
  if (hasAdmin) {
    return { key: 'admin', name: 'Administrador', isAdmin: true }
  }

  const hasUser = roles.some(
    (role) =>
      role.id === 2 ||
      role.name?.includes('user') ||
      role.name?.includes('usuario') ||
      role.name?.includes('usuário')
  )
  if (hasUser) {
    return { key: 'user', name: 'Usuário comum', isAdmin: false }
  }

  const hasAgent = roles.some(
    (role) =>
      role.id === 3 ||
      role.name?.includes('agent') ||
      role.name?.includes('atendente')
  )
  if (hasAgent) {
    return { key: 'agent', name: 'Atendente', isAdmin: false }
  }

  const hasClient = roles.some(
    (role) =>
      role.id === 4 ||
      role.name?.includes('client') ||
      role.name?.includes('cliente')
  )
  if (hasClient) {
    return { key: 'client', name: 'Cliente', isAdmin: false }
  }

  return { key: 'unknown', name: 'Desconhecido', isAdmin: false }
}