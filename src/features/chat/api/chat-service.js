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

export async function getActiveConversations(search = '') {
  const params = search ? { search } : undefined
  const { data } = await http.get('/conversations/active', { params })
  return normalizeListResponse(data)
}

export async function getPaginatedMessages(ticketId, { page = 1, limit = 20 } = {}) {
  const { data } = await http.get(`/conversations/ticket/${ticketId}/messages`, {
    params: { page, limit }
  })

  const payload = normalizeObjectResponse(data)

  return {
    messages: Array.isArray(payload?.messages) ? payload.messages : [],
    total: payload?.total ?? 0,
    page: payload?.page ?? page,
    limit: payload?.limit ?? limit,
    has_next: Boolean(payload?.has_next)
  }
}

export async function assumeConversation(chatId) {
  const { data } = await http.post(`/conversations/${chatId}/assume`)
  return normalizeObjectResponse(data)
}

export async function takeTicket(ticketId) {
  const { data } = await http.post(`/tickets/${ticketId}/take`)
  return normalizeObjectResponse(data)
}

export async function getAttendanceById(triageId) {
  const { data } = await http.get(`/chatbot/${triageId}`)
  return normalizeObjectResponse(data)
}