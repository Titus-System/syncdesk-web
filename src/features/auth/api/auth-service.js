import { http } from '@/lib/http'

function normalizeResponse(data) {
  return data?.data ?? data
}

export async function login(payload) {
  const { data } = await http.post('/auth/login', payload)
  return normalizeResponse(data)
}

export async function forgotPassword(payload) {
  const { data } = await http.post('/auth/forgot-password', payload)
  return normalizeResponse(data)
}

export async function resetPassword(payload) {
  const { data } = await http.post('/auth/reset-password', payload)
  return normalizeResponse(data)
}