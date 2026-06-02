import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App'
import AppProviders from '@/app/providers'
import { configureSyncdesk } from '@/lib/syncdesk'

configureSyncdesk()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
)