import { http } from '@/lib/http'

function normalizePaginatedResponse(data, fallback = {}) {
  const payload = data?.data ?? data ?? {}
  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    total: Number(payload.total ?? 0),
    page: Number(payload.page ?? fallback.page ?? 1),
    limit: Number(payload.limit ?? fallback.limit ?? 20)
  }
}

function normalizeObjectResponse(data) {
  return data?.data ?? data
}

export async function getCompanies({ page = 1, limit = 100 } = {}) {
  const { data } = await http.get('/companies/', { params: { page, limit } })
  return normalizePaginatedResponse(data, { page, limit })
}

export async function getCompanyById(companyId) {
  const { data } = await http.get(`/companies/${companyId}`)
  return normalizeObjectResponse(data)
}

export async function getCompanyUsers(companyId, { page = 1, limit = 20 } = {}) {
  const { data } = await http.get(`/companies/${companyId}/users`, {
    params: { page, limit }
  })
  return normalizePaginatedResponse(data, { page, limit })
}

export async function addUsersToCompany({ companyId, userIds }) {
  const { data } = await http.post(`/companies/${companyId}/users`, {
    user_ids: userIds
  })
  return normalizeObjectResponse(data)
}

export async function removeUserFromCompany({ companyId, userId }) {
  const { data } = await http.delete(`/companies/${companyId}/users/${userId}`)
  return normalizeObjectResponse(data)
}
