import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { configureLibrary } from '@titus-system/syncdesk'


configureLibrary({
  baseURL: 'http://api.syncdesk.pro:8000/api', 

  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),

  onTokensRefreshed: (newAccess, newRefresh) => {
    if (newAccess) localStorage.setItem('access_token', newAccess);
    if (newRefresh) localStorage.setItem('refresh_token', newRefresh);
    console.log("Tokens atualizados no LocalStorage");
  },

  onUnauthorized: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)