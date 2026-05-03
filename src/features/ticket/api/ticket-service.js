import { http } from '@/lib/http'

function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.data?.items)) {
    return data.data.items
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

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

export async function getTickets(params = {}) {
  const { source, ...requestParams } = params

  if (source === 'queue') {
    return getQueueTickets(requestParams)
  }

  const { data } = await http.get('/tickets/', {
    params: cleanParams(requestParams)
  })

  return normalizeListResponse(data)
}

export async function getQueueTickets(params = {}) {
  const { data } = await http.get('/tickets/queue', {
    params: cleanParams(params)
  })

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

export async function updateTicket({ ticketId, payload }) {
  const { data } = await http.patch(`/tickets/${ticketId}`, payload)
  return normalizeObjectResponse(data)
}

export async function takeTicket(ticketId) {
  const { data } = await http.post(`/tickets/${ticketId}/take`)
  return normalizeObjectResponse(data)
}

export async function assignTicket({ ticketId, payload }) {
  const { data } = await http.post(`/tickets/${ticketId}/assign`, payload)
  return normalizeObjectResponse(data)
}

export async function escalateTicket({ ticketId, payload }) {
  const { data } = await http.post(`/tickets/${ticketId}/escalate`, payload)
  return normalizeObjectResponse(data)
}

export async function transferTicket({ ticketId, payload }) {
  const { data } = await http.post(`/tickets/${ticketId}/transfer`, payload)
  return normalizeObjectResponse(data)
}

export async function getTicketHistory(ticketId) {
  const { data } = await http.get(`/tickets/${ticketId}/history`)
  return normalizeListResponse(data)
}