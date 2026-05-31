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
  unreadByChatId: {},
  activeChatId: null,
  ticketUpdates: 0,
  incrementUnreadChatMessages: () =>
    set((state) => ({
      unreadChatMessages: state.unreadChatMessages + 1
    })),
  incrementChatUnread: (chatId) =>
    set((state) => {
      if (!chatId) {
        return {
          unreadChatMessages: state.unreadChatMessages + 1
        }
      }

      const key = String(chatId)

      return {
        unreadChatMessages: state.unreadChatMessages + 1,
        unreadByChatId: {
          ...state.unreadByChatId,
          [key]: normalizeCount(state.unreadByChatId[key]) + 1
        }
      }
    }),
  clearChatNotification: (chatId) =>
    set((state) => {
      if (!chatId) {
        return state
      }

      const key = String(chatId)
      const currentCount = normalizeCount(state.unreadByChatId[key])

      if (!currentCount) {
        return state
      }

      const nextUnreadByChatId = { ...state.unreadByChatId }
      delete nextUnreadByChatId[key]

      return {
        unreadChatMessages: Math.max(0, state.unreadChatMessages - currentCount),
        unreadByChatId: nextUnreadByChatId
      }
    }),
  clearUnreadChatMessages: () =>
    set({
      unreadChatMessages: 0,
      unreadByChatId: {}
    }),
  setActiveChatId: (chatId) => set({ activeChatId: chatId ? String(chatId) : null }),
  incrementTicketUpdates: () =>
    set((state) => ({
      ticketUpdates: state.ticketUpdates + 1
    })),
  clearTicketUpdates: () => set({ ticketUpdates: 0 }),
  setTicketUpdates: (count) => set({ ticketUpdates: normalizeCount(count) }),
  resetNotifications: () =>
    set({
      unreadChatMessages: 0,
      unreadByChatId: {},
      activeChatId: null,
      ticketUpdates: 0
    })
}))
