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

function getWebSocketProtocols(accessToken) {
  if (!accessToken) {
    return undefined
  }

  return ['access_token', accessToken]
}

function getSafeWsUrl(wsUrl) {
  if (!wsUrl) {
    return ''
  }

  try {
    const url = new URL(wsUrl)
    url.search = ''
    return url.toString()
  } catch {
    return wsUrl
  }
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

function extractMessageFromPayload(payload) {
  if (!payload) {
    return null
  }

  if (payload?.meta?.success === false || payload?.status >= 400) {
    return null
  }

  if (payload?.data?.id || payload?.data?.content) {
    return payload.data
  }

  if (payload?.message?.id || payload?.message?.content) {
    return payload.message
  }

  if (payload?.id || payload?.content) {
    return payload
  }

  return null
}

export function useLiveChatWebSocket({ chatId, enabled = true }) {
  const accessToken = useAuthStore((state) => state.accessToken)

  const socketRef = useRef(null)

  const [connectionStatus, setConnectionStatus] = useState('idle')
  const [liveMessages, setLiveMessages] = useState([])
  const [lastError, setLastError] = useState(null)

  const wsUrl = useMemo(() => {
    if (!chatId || !accessToken) {
      return null
    }

    return buildLiveChatWsUrl(chatId)
  }, [accessToken, chatId])

  useEffect(() => {
    setLiveMessages([])
    setLastError(null)

    if (!enabled || !chatId || !accessToken || !wsUrl) {
      setConnectionStatus('idle')
      return undefined
    }

    let active = true
    let opened = false
    let socket

    setConnectionStatus('connecting')

    try {
      const protocols = getWebSocketProtocols(accessToken)
      socket = protocols ? new WebSocket(wsUrl, protocols) : new WebSocket(wsUrl)
    } catch {
      setConnectionStatus('error')
      setLastError('Não foi possível iniciar a conexão WebSocket.')
      return undefined
    }

    socketRef.current = socket

    socket.onopen = () => {
      if (!active) {
        return
      }

      opened = true
      setConnectionStatus('connected')
      setLastError(null)
    }

    socket.onmessage = (event) => {
      if (!active) {
        return
      }

      try {
        const payload = JSON.parse(event.data)

        if (payload?.meta?.success === false || payload?.status >= 400) {
          setLastError(payload?.detail || 'Erro na comunicação em tempo real.')
          return
        }

        const message = extractMessageFromPayload(payload)

        if (!message || shouldIgnoreSystemJoinMessage(message)) {
          return
        }

        setLiveMessages((current) => {
          const nextId = getMessageId(message)

          if (current.some((item) => getMessageId(item) === nextId)) {
            return current
          }

          return [...current, message]
        })
      } catch {
        setLastError('Não foi possível interpretar a mensagem recebida.')
      }
    }

    socket.onerror = () => {
      if (!active) {
        return
      }

      setConnectionStatus('error')
      setLastError(`Falha na conexão WebSocket em ${getSafeWsUrl(wsUrl)}`)
    }

    socket.onclose = (event) => {
      if (!active) {
        return
      }

      socketRef.current = null

      if (!opened) {
        setConnectionStatus('error')
        setLastError(
          `Handshake WebSocket recusado em ${getSafeWsUrl(wsUrl)}. Verifique autenticação, permissão e vínculo do usuário com a conversa.`
        )
        return
      }

      setConnectionStatus('disconnected')

      if (!event.wasClean) {
        setLastError(
          `WebSocket encerrado de forma inesperada. Código: ${event.code || 'sem código'}`
        )
      }
    }

    return () => {
      active = false

      if (socketRef.current) {
        socketRef.current.close(1000, 'Chat changed or component unmounted')
        socketRef.current = null
      }

      setConnectionStatus('idle')
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