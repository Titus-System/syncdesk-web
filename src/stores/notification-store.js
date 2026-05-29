import { create } from 'zustand'

function normalizeCount(count) {
  const numericCount = Number(count)

  if (!Number.isFinite(numericCount)) {
    return 0
  }

  return Math.max(0, numericCount)
}

export const useNotificationStore = create((set) => ({
  unreadChatMessages: 0,
  ticketUpdates: 0,
  incrementUnreadChatMessages: () =>
    set((state) => ({
      unreadChatMessages: state.unreadChatMessages + 1
    })),
  clearUnreadChatMessages: () => set({ unreadChatMessages: 0 }),
  incrementTicketUpdates: () =>
    set((state) => ({
      ticketUpdates: state.ticketUpdates + 1
    })),
  clearTicketUpdates: () => set({ ticketUpdates: 0 }),
  setTicketUpdates: (count) => set({ ticketUpdates: normalizeCount(count) }),
  resetNotifications: () =>
    set({
      unreadChatMessages: 0,
      ticketUpdates: 0
    })
}))
