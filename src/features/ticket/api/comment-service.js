import { http } from '@/lib/http'

function normalizeListResponse(data) {
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data)) return data
  return []
}

function normalizeObjectResponse(data) {
  return data?.data ?? data
}

export async function getComments(ticketId) {
  const { data } = await http.get(`/tickets/${ticketId}/comments`)
  return normalizeListResponse(data)
}

export async function createComment({ ticketId, payload }) {
  const { data } = await http.post(`/tickets/${ticketId}/comments`, payload)
  return normalizeObjectResponse(data)
}

export async function updateComment({ ticketId, commentId, payload }) {
  const { data } = await http.patch(`/tickets/${ticketId}/comments/${commentId}`, payload)
  return normalizeObjectResponse(data)
}

export async function deleteComment({ ticketId, commentId }) {
  const { data } = await http.delete(`/tickets/${ticketId}/comments/${commentId}`)
  return normalizeObjectResponse(data)
}