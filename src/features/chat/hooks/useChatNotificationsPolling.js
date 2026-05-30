import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getActiveConversations, getPaginatedMessages } from '@/features/chat/api/chat-service'
import { playNotificationSound } from '@/features/chat/utils/play-notification-sound'
import { decodeJwtPayload } from '@/shared/utils/jwt'
import { useAuthStore } from '@/stores/auth-stores'
import { useNotificationStore } from '@/stores/notification-store'

const CHAT_NOTIFICATION_POLLING_INTERVAL = 4000

function getConversationId(conversation) {
  return conversation?.chat_id ?? conversation?.id ?? conversation?.conversation_id ?? null
}

function getTicketId(conversation) {
  return conversation?.ticket_id ?? conversation?.ticketId ?? null
}

function getLastMessageAt(conversation) {
  return (
    conversation?.last_message_at ??
    conversation?.lastMessageAt ??
    conversation?.updated_at ??
    conversation?.updatedAt ??
    null
  )
}

function getMessageCount(conversation) {
  const count = Number(conversation?.message_count ?? conversation?.messageCount)
  return Number.isFinite(count) ? count : null
}

function getCurrentUserId(user, tokenPayload) {
  return String(
    user?.id ??
    tokenPayload?.sub ??
    tokenPayload?.user_id ??
    tokenPayload?.userId ??
    ''
  )
}

function getMessageSenderId(message) {
  return String(
    message?.sender_id ??
    message?.senderId ??
    message?.sender?.id ??
    message?.user_id ??
    message?.userId ??
    ''
  )
}

function getMessageConversationId(message) {
  return String(
    message?.conversation_id ??
    message?.conversationId ??
    message?.chat_id ??
    message?.chatId ??
    ''
  )
}

function getMessageTimestamp(message) {
  return message?.timestamp ?? message?.created_at ?? message?.createdAt ?? null
}

function buildConversationSnapshot(conversations) {
  const snapshot = new Map()

  conversations.forEach((conversation) => {
    const chatId = getConversationId(conversation)

    if (!chatId) {
      return
    }

    snapshot.set(String(chatId), {
      chatId: String(chatId),
      ticketId: getTicketId(conversation),
      messageCount: getMessageCount(conversation),
      lastMessageAt: getLastMessageAt(conversation)
    })
  })

  return snapshot
}

function hasConversationChanged(previous, next) {
  if (!previous) {
    return true
  }

  if (
    next.messageCount != null &&
    previous.messageCount != null &&
    next.messageCount > previous.messageCount
  ) {
    return true
  }

  return Boolean(
    next.lastMessageAt &&
    next.lastMessageAt !== previous.lastMessageAt
  )
}

function getNewestConversationMessage(messages, chatId) {
  const matchingMessages = messages.filter((message) => {
    const messageConversationId = getMessageConversationId(message)
    return !messageConversationId || messageConversationId === String(chatId)
  })

  return matchingMessages
    .slice()
    .sort((a, b) => {
      const dateA = new Date(getMessageTimestamp(a) ?? 0).getTime()
      const dateB = new Date(getMessageTimestamp(b) ?? 0).getTime()
      return dateB - dateA
    })[0] ?? null
}

function shouldIgnoreMessage(message, currentUserId) {
  const senderId = getMessageSenderId(message)

  if (!senderId || senderId === 'System') {
    return true
  }

  return Boolean(currentUserId && senderId === currentUserId)
}

export function useChatNotificationsPolling({ enabled }) {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const activeChatId = useNotificationStore((state) => state.activeChatId)
  const incrementChatUnread = useNotificationStore((state) => state.incrementChatUnread)

  const previousSnapshotRef = useRef(null)
  const checkedMessageIdsRef = useRef(new Set())

  const currentUserId = useMemo(() => {
    return getCurrentUserId(user, decodeJwtPayload(accessToken))
  }, [accessToken, user])

  const activeConversationsQuery = useQuery({
    queryKey: ['chat', 'notification-polling', 'active-conversations'],
    queryFn: () => getActiveConversations(''),
    enabled,
    refetchInterval: enabled ? CHAT_NOTIFICATION_POLLING_INTERVAL : false,
    refetchIntervalInBackground: true,
    staleTime: 0,
    retry: false
  })

  useEffect(() => {
    if (!enabled) {
      previousSnapshotRef.current = null
      checkedMessageIdsRef.current = new Set()
      return
    }

    if (!activeConversationsQuery.isSuccess) {
      return
    }

    const conversations = activeConversationsQuery.data ?? []
    const nextSnapshot = buildConversationSnapshot(conversations)
    const previousSnapshot = previousSnapshotRef.current

    if (!previousSnapshot) {
      previousSnapshotRef.current = nextSnapshot
      return
    }

    const changedConversations = [...nextSnapshot.values()].filter((conversationState) =>
      hasConversationChanged(previousSnapshot.get(conversationState.chatId), conversationState)
    )

    if (!changedConversations.length) {
      previousSnapshotRef.current = nextSnapshot
      return
    }

    let cancelled = false

    async function notifyChangedConversations() {
      for (const conversationState of changedConversations) {
        if (!conversationState.ticketId) {
          continue
        }

        const messagesPage = await getPaginatedMessages(conversationState.ticketId, {
          page: 1,
          limit: 5
        })

        if (cancelled) {
          return
        }

        const newestMessage = getNewestConversationMessage(
          messagesPage.messages,
          conversationState.chatId
        )

        if (!newestMessage || shouldIgnoreMessage(newestMessage, currentUserId)) {
          continue
        }

        const messageId = String(
          newestMessage?.id ??
          `${conversationState.chatId}-${getMessageTimestamp(newestMessage)}-${newestMessage?.content ?? ''}`
        )

        if (checkedMessageIdsRef.current.has(messageId)) {
          continue
        }

        checkedMessageIdsRef.current.add(messageId)

        const isActiveVisibleConversation =
          activeChatId === conversationState.chatId &&
          document.visibilityState === 'visible'

        if (isActiveVisibleConversation) {
          continue
        }

        incrementChatUnread(conversationState.chatId)
        playNotificationSound()
      }
    }

    notifyChangedConversations().catch(() => undefined)
    previousSnapshotRef.current = nextSnapshot

    return () => {
      cancelled = true
    }
  }, [
    activeChatId,
    activeConversationsQuery.data,
    activeConversationsQuery.isSuccess,
    currentUserId,
    enabled,
    incrementChatUnread
  ])
}
