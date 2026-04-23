import { http } from '@/lib/http'

function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.items)) {
    return data.items
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

function normalizeObjectResponse(data) {
  return data?.data ?? data
}

export async function getTickets(params = {}) {
  const { data } = await http.get('/tickets/', { params })
  return normalizeListResponse(data)
}

export async function getTicketById(ticketId) {
  const { data } = await http.get(`/tickets/${ticketId}`)
  return normalizeObjectResponse(data)
}

export async function createTicket(payload) {
  const { data } = await http.post('/tickets/', payload)
  return normalizeObjectResponse(data)
}

export async function updateTicketStatus({ ticketId, payload }) {
  const { data } = await http.patch(`/tickets/${ticketId}/status`, payload)
  return normalizeObjectResponse(data)
}

export async function takeTicket(ticketId) {
  const { data } = await http.post(`/tickets/${ticketId}/take`)
  return normalizeObjectResponse(data)
}