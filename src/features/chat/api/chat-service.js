import { http } from '@/lib/http'

function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.items)) {
    return data.items
  }

  if (Array.isArray(data?.data?.items)) {
    return data.data.items
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

function normalizeObjectResponse(data) {
  return data?.data ?? data
}

function isNotFoundError(error) {
  return error?.response?.status === 404
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
    total: Number(payload?.total ?? 0),
    page: Number(payload?.page ?? page),
    limit: Number(payload?.limit ?? limit),
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
  if (!triageId) {
    return null
  }

  try {
    const { data } = await http.get(`/chatbot/${triageId}`)
    return normalizeObjectResponse(data)
  } catch (error) {
    if (isNotFoundError(error)) {
      return null
    }

    throw error
  }
}

export async function getChatSessions(search = '') {
  return getActiveConversations(search)
}

export async function getChatMessages(ticketId) {
  const result = await getPaginatedMessages(ticketId, { page: 1, limit: 100 })
  return result.messages
}

export async function flagChatSession() {
  throw new Error('A API atual do backend não possui endpoint REST para sinalizar sessão de chat.')
}

export async function sendChatMessage() {
  throw new Error('O envio de mensagens do chat ao vivo deve ser feito via WebSocket.')
}