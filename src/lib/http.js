import axios from 'axios'
import { env } from '@/lib/env'
import { useAuthStore } from '@/stores/auth-stores'

export const http = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000
})

http.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession()

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)