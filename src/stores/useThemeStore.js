import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      tema: 'light',
      setTema: (novoTema) => set({ tema: novoTema }),
    }),
    {
      name: 'theme-storage', // Nome da chave no localStorage
    }
  )
)