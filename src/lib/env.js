const apiUrl = import.meta.env.VITE_API_URL
const appName = import.meta.env.VITE_APP_NAME || 'SyncDesk'

if (!apiUrl) {
  throw new Error('VITE_API_URL não foi definida')
}

export const env = {
  apiUrl,
  appName
}