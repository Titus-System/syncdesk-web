import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { env } from '@/lib/env'
import { useAuthStore } from '@/stores/auth-stores'

function buildLiveChatWsUrl(chatId) {
  const url = new URL(env.apiUrl)

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = `${url.pathname.replace(/\/$/, '')}/live_chat/room/${chatId}`
  url.search = ''

  return url.toString()
}

function getMessageId(message) {
  return message?.id ?? `${message?.conversation_id}-${message?.timestamp}-${message?.content}`
}

function shouldIgnoreSystemJoinMessage(message) {
  const senderId = String(message?.sender_id ?? '')
  const content = String(message?.content ?? '').toLowerCase()

  if (senderId !== 'System') {
    return false
  }

  return content.includes('joined to chat room') || content.includes('joined chat room')
}

export function useLiveChatWebSocket({ chatId, enabled = true }) {
  const accessToken = useAuthStore((state) => state.accessToken)

  const socketRef = useRef(null)
  const [connectionStatus, setConnectionStatus] = useState('idle')
  const [liveMessages, setLiveMessages] = useState([])
  const [lastError, setLastError] = useState(null)

  const wsUrl = useMemo(() => {
    if (!chatId) {
      return null
    }

    return buildLiveChatWsUrl(chatId)
  }, [chatId])

  useEffect(() => {
    setLiveMessages([])
    setLastError(null)

    if (!enabled || !chatId || !accessToken || !wsUrl) {
      setConnectionStatus('idle')
      return undefined
    }

    setConnectionStatus('connecting')

    const socket = new WebSocket(wsUrl, ['access_token', accessToken])
    socketRef.current = socket

    socket.onopen = () => {
      setConnectionStatus('connected')
      setLastError(null)
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)

        if (payload?.meta?.success && payload?.data) {
          const message = payload.data

          if (shouldIgnoreSystemJoinMessage(message)) {
            return
          }

          setLiveMessages((current) => {
            const nextId = getMessageId(message)

            if (current.some((item) => getMessageId(item) === nextId)) {
              return current
            }

            return [...current, message]
          })

          return
        }

        if (payload?.meta?.success === false || payload?.status) {
          setLastError(payload?.detail || 'Erro na comunicação em tempo real.')
        }
      } catch {
        setLastError('Não foi possível interpretar a mensagem recebida.')
      }
    }

    socket.onerror = () => {
      setConnectionStatus('error')
      setLastError('Falha na conexão WebSocket.')
    }

    socket.onclose = () => {
      setConnectionStatus('disconnected')
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [accessToken, chatId, enabled, wsUrl])

  const sendMessage = useCallback((payload) => {
    const socket = socketRef.current

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setLastError('Conexão WebSocket indisponível.')
      return false
    }

    socket.send(JSON.stringify(payload))
    return true
  }, [])

  return {
    connectionStatus,
    liveMessages,
    sendMessage,
    lastError
  }
}