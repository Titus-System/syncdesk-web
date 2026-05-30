import { useEffect } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'

/**
 * ThemeProvider
 * Adiciona/remove a classe .dark no <html>.
 * Toda a lógica de cores fica no globals.css via CSS vars.
 * Importe globals.css no seu main.jsx:  import './globals.css'
 */
export function ThemeProvider({ children }) {
  const tema = useThemeStore((state) => state.tema)

  useEffect(() => {
    if (tema === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [tema])

  return children
}