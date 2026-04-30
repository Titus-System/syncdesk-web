import { http } from '@/lib/http'

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

function normalizeObjectResponse(data) {
  return data?.data ?? data
}

export async function getUsers() {
  const { data } = await http.get('/users')
  return normalizeListResponse(data)
}

export async function getUserById(userId) {
  const { data } = await http.get(`/users/${userId}`)
  return normalizeObjectResponse(data)
}

export async function getRoles() {
  const { data } = await http.get('/roles')
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data)) return data
  return []
}

export async function createUser(payload) {
  const { data } = await http.post('/users', payload)
  return normalizeObjectResponse(data)
}

export async function patchUser({ userId, payload }) {
  const { data } = await http.patch(`/users/${userId}`, payload)
  return normalizeObjectResponse(data)
}

export async function deleteUser(userId) {
  const { data } = await http.delete(`/users/${userId}`)
  return normalizeObjectResponse(data)
}

export async function patchUserRoles({ userId, addRoleIds = [], removeRoleIds = [] }) {
  const { data } = await http.patch(`/users/${userId}/roles`, {
    add_role_ids: addRoleIds,
    remove_role_ids: removeRoleIds,
  })
  return normalizeObjectResponse(data)
}