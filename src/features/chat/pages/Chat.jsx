import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  TrendingUp,
  Search,
  User,
  Radio,
  ArchiveRestore,
  Bot,
  Paperclip,
  LogOut,
  Settings,
  AlertCircle,
  Hand,
  Flag,
  Mail,
  ShieldAlert,
  Loader2,
  FileText
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePresignUpload, useConfirmUpload, useGetDownloadUrl } from '@titus-system/syncdesk'
import { useAuthStore } from '@/stores/auth-stores'
import { useNotificationStore } from '@/stores/notification-store'
import { useActiveConversationsQuery } from '@/features/chat/hooks/useActiveConversationsQuery'
import { useGetPaginatedMessages } from '@/features/chat/hooks/useGetPaginatedMessages'
import { useLiveChatWebSocket } from '@/features/chat/hooks/useLiveChatWebSocket'
import { useAttendanceQuery } from '@/features/chat/hooks/useAttendanceQuery'
import { useAssumeChatSessionMutation } from '@/features/chat/hooks/useAssumeChatSessionMutation'
import { decodeJwtPayload } from '@/shared/utils/jwt'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { matchesConversationSearch } from '@/features/chat/utils/searchConversations'

const VIEW_FILTERS = [
  { key: 'queue', label: 'Fila' },
  { key: 'mine', label: 'Meus atuais' },
  { key: 'all', label: 'Todos os atuais' }
]

export default function Chat() {
  const navigate = useNavigate()

  const clearSession = useAuthStore((state) => state.clearSession)
  const authUser = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  
  // Lógica de Notificações
  const clearUnreadChatMessages = useNotificationStore((state) => state.clearUnreadChatMessages)
  const unreadByChatId = useNotificationStore((state) => state.unreadByChatId)
  const clearChatNotification = useNotificationStore((state) => state.clearChatNotification)
  const setActiveNotificationChatId = useNotificationStore((state) => state.setActiveChatId)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [messageInput, setMessageInput] = useState('')
  const [viewFilter, setViewFilter] = useState('mine')
  
  // Estados para fila e otimismo
  const [assumeError, setAssumeError] = useState(null)
  const [pendingAssumeChatId, setPendingAssumeChatId] = useState(null)
  const [optimisticMessages, setOptimisticMessages] = useState([])

  const menuRef = useRef(null)
  const messagesViewportRef = useRef(null)
  
  // Refs de controle de scroll e ordem
  const shouldStickToBottomRef = useRef(true)
  const lastActiveChatIdRef = useRef(null)
  const previousMessagesSignatureRef = useRef('')
  const liveArrivalOrderRef = useRef(new Map())
  const nextLiveArrivalOrderRef = useRef(1)
  const nextOptimisticOrderRef = useRef(1)

  const debouncedSearch = useDebouncedValue(search, 300)

  const tokenPayload = useMemo(() => {
    if (!accessToken) return null
    return decodeJwtPayload(accessToken)
  }, [accessToken])

  const currentUserId = String(
    authUser?.id ??
    tokenPayload?.sub ??
    tokenPayload?.user_id ??
    tokenPayload?.userId ??
    ''
  )

  const currentRoleNames = useMemo(
    () => getCurrentRoleNames(authUser, tokenPayload),
    [authUser, tokenPayload]
  )

  const isAdmin = currentRoleNames.includes('admin')

  const conversationsQuery = useActiveConversationsQuery('', {
    enabled: Boolean(accessToken),
    refetchInterval: 10000,
    staleTime: 5000,
    retry: false
  })

  const assumeConversationMutation = useAssumeChatSessionMutation()
  const { mutateAsync: presignUpload, isPending: isUploadingFile } = usePresignUpload()
  const { mutateAsync: confirmUpload } = useConfirmUpload()

  const allConversations = useMemo(() => conversationsQuery.data ?? [], [conversationsQuery.data])

  const queueConversations = useMemo(
    () => allConversations.filter((c) => isConversationAvailable(c)),
    [allConversations]
  )

  const myCurrentConversations = useMemo(
    () => allConversations.filter((c) => isConversationAssignedToUser(c, currentUserId)),
    [allConversations, currentUserId]
  )

  const sourceConversations = useMemo(() => {
    if (viewFilter === 'queue') return queueConversations
    if (viewFilter === 'all') return allConversations
    return myCurrentConversations
  }, [allConversations, myCurrentConversations, queueConversations, viewFilter])

  const visibleConversations = useMemo(
    () => sourceConversations.filter((c) => matchesConversationSearch(c, debouncedSearch)),
    [sourceConversations, debouncedSearch]
  )

  const activeChatId = useMemo(() => {
    if (!visibleConversations.length) return null
    const selectedExists = visibleConversations.some((c) => getConversationId(c) === selectedChatId)
    if (selectedExists) return selectedChatId
    return getConversationId(visibleConversations[0])
  }, [visibleConversations, selectedChatId])

  const activeConversation = useMemo(
    () => visibleConversations.find((c) => getConversationId(c) === activeChatId) ?? null,
    [visibleConversations, activeChatId]
  )

  const assignedAgentId = getAssignedAgentId(activeConversation)
  const activeConversationClosed = isConversationClosed(activeConversation)

  const isAssignedToCurrentUser = Boolean(
    activeConversation && assignedAgentId && currentUserId && assignedAgentId === currentUserId
  )

  const isAssignedToAnotherAgent = Boolean(
    activeConversation && assignedAgentId && currentUserId && assignedAgentId !== currentUserId
  )

  const activeConversationIsAvailable = Boolean(activeConversation && isConversationAvailable(activeConversation))

  const canAssumeConversation = Boolean(
    getConversationId(activeConversation) &&
    activeConversationIsAvailable &&
    !isAssignedToCurrentUser &&
    !isAssignedToAnotherAgent &&
    !pendingAssumeChatId
  )

  const canReadHistory = Boolean(activeConversation?.ticket_id && (isAssignedToCurrentUser || isAdmin))
  
  const canConnectLive = Boolean(
    getConversationId(activeConversation) &&
    activeConversation?.can_join_live &&
    isAssignedToCurrentUser &&
    !activeConversationClosed
  )

  const attendanceQuery = useAttendanceQuery(activeConversation?.triage_id, {
    enabled: canReadHistory
  })

  const paginatedMessagesQuery = useGetPaginatedMessages(
    activeConversation?.ticket_id ?? null,
    20,
    { enabled: canReadHistory }
  )

  const historyMessages = useMemo(() => {
    const pages = paginatedMessagesQuery.data?.pages ?? []
    return prepareHistoryMessages(pages.slice().reverse().flatMap((page) => page?.messages ?? []))
  }, [paginatedMessagesQuery.data])

  const { connectionStatus, liveMessages, sendMessage, lastError } = useLiveChatWebSocket({
    chatId: getConversationId(activeConversation),
    enabled: canConnectLive
  })

  const liveMessagesWithArrivalOrder = useMemo(() => {
    return (liveMessages ?? []).map((message) => {
      const key = getMessageIdentityKey(message)
      if (!liveArrivalOrderRef.current.has(key)) {
        liveArrivalOrderRef.current.set(key, nextLiveArrivalOrderRef.current)
        nextLiveArrivalOrderRef.current += 1
      }
      return { ...message, __source: 'live', __arrivalOrder: liveArrivalOrderRef.current.get(key) }
    })
  }, [liveMessages])

  // Lógica de reconciliação Otimista
  useEffect(() => {
    if (!optimisticMessages.length) return

    setOptimisticMessages((currentOptimisticMessages) => {
      const nextOptimisticMessages = reconcileOptimisticMessages({
        confirmedMessages: [...historyMessages, ...liveMessagesWithArrivalOrder],
        optimisticMessages: currentOptimisticMessages
      })

      const unchanged =
        nextOptimisticMessages.length === currentOptimisticMessages.length &&
        nextOptimisticMessages.every((message, index) => getMessageId(message) === getMessageId(currentOptimisticMessages[index]))

      return unchanged ? currentOptimisticMessages : nextOptimisticMessages
    })
  }, [historyMessages, liveMessagesWithArrivalOrder, optimisticMessages.length])

  const triageTimeline = useMemo(() => {
    const triage = Array.isArray(attendanceQuery.data?.triage) ? attendanceQuery.data.triage : []
    return triage.flatMap((item, index) => {
      const timeline = [{ id: `triage-question-${index}`, kind: 'triage-bot', content: item.question }]
      if (item.answer_text || item.answer_value) {
        timeline.push({ id: `triage-answer-${index}`, kind: 'triage-user', content: item.answer_text || item.answer_value })
      }
      return timeline.filter((t) => Boolean(t.content))
    })
  }, [attendanceQuery.data])

  const messages = useMemo(() => {
    return buildChatTimeline({
      historyMessages,
      liveMessages: liveMessagesWithArrivalOrder,
      optimisticMessages
    }).filter(shouldRenderMessage)
  }, [historyMessages, liveMessagesWithArrivalOrder, optimisticMessages])

  const messagesSignature = useMemo(() => messages.map((m) => getMessageId(m)).join('|'), [messages])

  const canSendMessage = Boolean(
    canConnectLive && isAssignedToCurrentUser && connectionStatus === 'connected' && !activeConversationClosed
  )

  const totalCurrentCount = allConversations.length
  const queueCount = queueConversations.length
  const myCurrentCount = myCurrentConversations.length

  const scrollMessagesToBottom = useCallback((behavior = 'auto') => {
    window.requestAnimationFrame(() => {
      const viewport = messagesViewportRef.current
      if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior })
    })
  }, [])

  const handleMessagesViewportScroll = useCallback(() => {
    const viewport = messagesViewportRef.current
    if (viewport) shouldStickToBottomRef.current = isViewportNearBottom(viewport)
  }, [])

  // Limpa notificações ao montar
  useEffect(() => {
    clearUnreadChatMessages()
  }, [clearUnreadChatMessages])

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuPerfilAberto(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reseta estados locais ao mudar de chat
  useEffect(() => {
    setActiveNotificationChatId(activeChatId)

    if (activeChatId) {
      clearChatNotification(activeChatId)
    }

    return () => {
      setActiveNotificationChatId(null)
    }
  }, [activeChatId, clearChatNotification, setActiveNotificationChatId])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && activeChatId) {
        clearChatNotification(activeChatId)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeChatId, clearChatNotification])

  useEffect(() => {
    setMessageInput('')
    setAssumeError(null)
    setOptimisticMessages([])
    shouldStickToBottomRef.current = true
    liveArrivalOrderRef.current = new Map()
    nextLiveArrivalOrderRef.current = 1
    nextOptimisticOrderRef.current = 1
    previousMessagesSignatureRef.current = ''
  }, [activeChatId])

  useEffect(() => {
    if (activeConversation && !isAssignedToCurrentUser) setMessageInput('')
  }, [activeConversation, isAssignedToCurrentUser])

  useLayoutEffect(() => {
    const viewport = messagesViewportRef.current
    if (!viewport) return

    const chatChanged = lastActiveChatIdRef.current !== activeChatId
    const messagesChanged = previousMessagesSignatureRef.current !== messagesSignature
    const shouldScroll = chatChanged || shouldStickToBottomRef.current || previousMessagesSignatureRef.current === ''

    if (messagesChanged && shouldScroll) {
      scrollMessagesToBottom(chatChanged ? 'auto' : 'smooth')
    }
    if (chatChanged) scrollMessagesToBottom('auto')

    lastActiveChatIdRef.current = activeChatId
    previousMessagesSignatureRef.current = messagesSignature
  }, [activeChatId, messagesSignature, scrollMessagesToBottom])

  function handleLogout() { clearSession(); navigate('/login', { replace: true }) }

  const handleAssumeConversation = useCallback(async () => {
    const chatId = getConversationId(activeConversation)
    if (!chatId || !canAssumeConversation) return

    try {
      setPendingAssumeChatId(chatId)
      setAssumeError(null)

      await assumeConversationMutation.mutateAsync(chatId)
      await conversationsQuery.refetch()

      setSelectedChatId(chatId)
      setViewFilter('mine')
      shouldStickToBottomRef.current = true
      scrollMessagesToBottom('auto')
    } catch (error) {
      setAssumeError(error?.response?.data?.detail || 'Não foi possível assumir este atendimento.')
      await conversationsQuery.refetch()
    } finally {
      setPendingAssumeChatId(null)
    }
  }, [activeConversation, assumeConversationMutation, canAssumeConversation, conversationsQuery, scrollMessagesToBottom])

  const handleSendMessage = useCallback(() => {
    const content = messageInput.trim()
    const chatId = getConversationId(activeConversation)
    if (!activeConversation || !chatId || !content || !canSendMessage) return

    const sent = sendMessage({ type: 'text', content })
    if (!sent) return

    const optimisticOrder = nextOptimisticOrderRef.current
    nextOptimisticOrderRef.current += 1

    setOptimisticMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `optimistic-${chatId}-${Date.now()}-${optimisticOrder}`,
        conversation_id: chatId,
        sender_id: currentUserId,
        type: 'text',
        content,
        timestamp: new Date().toISOString(),
        __source: 'optimistic',
        __arrivalOrder: optimisticOrder
      }
    ])

    setMessageInput('')
    shouldStickToBottomRef.current = true
    scrollMessagesToBottom('smooth')
  }, [activeConversation, canSendMessage, currentUserId, messageInput, sendMessage, scrollMessagesToBottom])

  const handleFileUpload = useCallback(async (fileObj) => {
    const chatId = getConversationId(activeConversation)
    if (!activeConversation || !chatId || !fileObj || !canSendMessage) return

    try {
      const presignData = await presignUpload({
        filename: fileObj.name,
        content_type: fileObj.type || "application/octet-stream",
        size_bytes: fileObj.size,
        context: "live_chat_message",
        context_ref: { conversation_id: chatId },
      })

      const formData = new FormData()
      Object.entries(presignData.fields).forEach(([key, value]) => formData.append(key, value))
      formData.append("file", fileObj)

      const minioResponse = await fetch(presignData.upload_url, { method: presignData.method, body: formData })
      if (!minioResponse.ok) throw new Error("Falha ao subir arquivo para o storage")

      await confirmUpload(presignData.file_id)

      const sent = sendMessage({
        type: 'file',
        content: fileObj.name,
        file_id: presignData.file_id,
        mime_type: fileObj.type || "application/octet-stream",
        filename: fileObj.name
      })

      if (sent) {
        const optimisticOrder = nextOptimisticOrderRef.current
        nextOptimisticOrderRef.current += 1
        setOptimisticMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `optimistic-${chatId}-${Date.now()}-${optimisticOrder}`,
            conversation_id: chatId,
            sender_id: currentUserId,
            type: 'file',
            content: fileObj.name,
            file_id: presignData.file_id,
            mime_type: fileObj.type || "application/octet-stream",
            filename: fileObj.name,
            timestamp: new Date().toISOString(),
            __source: 'optimistic',
            __arrivalOrder: optimisticOrder
          }
        ])
        shouldStickToBottomRef.current = true
        setTimeout(() => scrollMessagesToBottom('smooth'), 100)
      }
    } catch (err) {
      console.error("Upload error:", err)
      setAssumeError("Erro ao enviar arquivo. Tente novamente.")
    }
  }, [activeConversation, canSendMessage, currentUserId, sendMessage, scrollMessagesToBottom, presignUpload, confirmUpload])

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-sidebar)] text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="h-[60px] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-8">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-sm"><TrendingUp size={16} className="text-white" /></div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
          </button>

          <nav className="flex items-center gap-6">
            <span className="text-[var(--accent-text)] font-semibold text-sm border-b-2 border-[#D14D1D] pb-1">Console ao Vivo</span>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sessions..."
              className="w-full bg-white/10 border border-white/15 text-white text-xs py-2 pl-9 pr-4 rounded-lg focus:outline-none focus:border-white/30 placeholder:text-white/40 transition-all" />
          </div>

          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setMenuPerfilAberto((v) => !v)}
              className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all">
              <User size={16} className="text-white/80" />
            </button>

            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-60 bg-[var(--bg-sidebar)] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                <div className="px-4 py-3 border-b border-white/10 mb-1">
                  <p className="text-sm font-bold text-white truncate">{authUser?.name || 'Usuário'}</p>
                  <p className="text-[11px] text-white/50 truncate">{authUser?.email || ''}</p>
                </div>
                <button type="button" onClick={() => { setMenuPerfilAberto(false); navigate('/configuracoes') }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-white/70 hover:bg-white/10 rounded-xl transition-colors uppercase">
                  <Settings size={14} /> Configurações
                </button>
                <button type="button" onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase">
                  <LogOut size={14} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden px-5 pb-5 pt-4 gap-4">
        {/* Sessions sidebar */}
        <aside className="w-[400px] flex flex-col shrink-0 gap-3">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-[var(--accent-text)]" />
            <h2 className="font-bold text-xs text-white/90 uppercase tracking-wide">Sessões Ativas</h2>
            <span className="ml-auto bg-[var(--accent)] text-[9px] px-2 py-0.5 rounded-full text-white font-bold tracking-wider">
              {totalCurrentCount} Ativos
            </span>
          </div>

          <div className="flex gap-1.5 bg-black/20 p-1 rounded-xl">
            {VIEW_FILTERS.map((tab) => {
              const isActive = viewFilter === tab.key
              const count = getFilterCount(tab.key, { queueCount, myCurrentCount, totalCurrentCount })

              return (
                <button key={tab.key} type="button" onClick={() => setViewFilter(tab.key)}
                  className={`flex-1 rounded-lg py-1.5 text-[10px] flex flex-col items-center justify-center font-bold uppercase tracking-wide transition-all ${
                    isActive ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                  }`}>
                  <span className="leading-tight">{tab.label}</span>
                  <span className="text-[9px] opacity-80 mt-0.5">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-0.5">
            {conversationsQuery.isLoading && <SidebarInfoBox text="Carregando atendimentos..." />}
            {conversationsQuery.isError && <SidebarInfoBox text="Não foi possível carregar os atendimentos." error />}

            {!conversationsQuery.isLoading && !conversationsQuery.isError && !sourceConversations.length && (
              <SidebarInfoBox text={getEmptySidebarText(viewFilter)} />
            )}

            {!conversationsQuery.isLoading && !conversationsQuery.isError && Boolean(sourceConversations.length) && !visibleConversations.length && Boolean(debouncedSearch) && (
              <SidebarInfoBox text={`Nenhum resultado para "${debouncedSearch}".`} />
            )}

            {visibleConversations.map((conversation) => {
              const conversationId = getConversationId(conversation)
              return (
                <SessionItem
                  key={conversationId}
                  active={conversationId === activeChatId}
                  user={getConversationUserName(conversation)}
                  message={getConversationLastMessage(conversation)}
                  time={getConversationTimeLabel(conversation)}
                  status={getConversationStatusLabel(conversation, currentUserId)}
                  unreadCount={unreadByChatId[conversationId] ?? 0}
                  onClick={() => {
                    clearChatNotification(conversationId)
                    setSelectedChatId(conversationId)
                  }}
                />
              )
            })}
          </div>
        </aside>

        {/* Main chat */}
        <main className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-[var(--bg-page)] border border-white/5">
          <div className="bg-[var(--accent)] px-5 py-4 flex justify-between items-center gap-3 shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-[var(--bg-card)] shadow-sm rounded-full flex items-center justify-center shrink-0">
                <User size={20} className="text-[var(--accent-text)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="text-white font-bold text-base truncate">
                    {activeConversation ? getConversationUserName(activeConversation) : 'Nenhum atendimento selecionado'}
                  </h3>
                  {activeConversation && (
                    <span className="bg-white/20 text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-white/20">
                      {getConversationOwnershipLabel({ activeConversation, isAssignedToCurrentUser, isAssignedToAnotherAgent })}
                    </span>
                  )}
                  {activeConversation && <ConnectionBadge status={connectionStatus} disabled={!canConnectLive} />}
                </div>
                <p className="text-white/80 text-[11px] truncate mt-0.5 font-medium">
                  {activeConversation
                    ? `Ticket ${shortId(activeConversation.ticket_id)} • ${activeConversation.product || 'Sem produto'}`
                    : 'Selecione um atendimento para visualizar detalhes'}
                </p>
              </div>
            </div>

            {activeConversation && canAssumeConversation && (
              <button type="button" onClick={handleAssumeConversation} disabled={Boolean(pendingAssumeChatId)}
                className="shrink-0 inline-flex items-center gap-2 text-xs font-bold bg-[var(--bg-card)] text-[var(--accent-text)] px-4 py-2.5 rounded-xl shadow-sm hover:opacity-90 disabled:opacity-60 transition-all border border-[var(--border-default)]">
                {pendingAssumeChatId ? <LoaderInline /> : <Hand size={14} />}
                {pendingAssumeChatId ? 'Assumindo...' : 'Assumir atendimento'}
              </button>
            )}
          </div>

          <div ref={messagesViewportRef} onScroll={handleMessagesViewportScroll} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 bg-[var(--bg-page)] relative">
            <div className="mt-auto flex flex-col gap-4">
              {!activeConversation && !conversationsQuery.isLoading && (
                <EmptyPanel text="Selecione um atendimento para visualizar a conversa." />
              )}

              {activeConversation && activeConversationIsAvailable && !isAssignedToCurrentUser && (
                <NoticeCard icon={<Hand size={22} />} title="Atendimento disponível na fila" text="Este atendimento foi aberto pela URA e ainda não possui responsável. Assuma o atendimento para responder em tempo real." />
              )}

              {activeConversation && isAssignedToAnotherAgent && (
                <NoticeCard icon={<ShieldAlert size={22} />} title="Atendimento em andamento" text="Este atendimento já está atribuído a outro atendente. Você pode localizá-lo nesta tela, mas apenas o responsável consegue responder em tempo real." />
              )}

              {activeConversation && activeConversationClosed && (
                <NoticeCard icon={<ArchiveRestore size={22} />} title="Atendimento encerrado" text="Este atendimento foi encerrado. O histórico permanece disponível, mas novas mensagens não podem ser enviadas." />
              )}

              {activeConversation && Boolean(triageTimeline.length) && canReadHistory && (
                <div className="mb-4">
                  <div className="text-center text-[9px] font-bold uppercase text-[var(--text-faint)] mb-3">Histórico da triagem</div>
                  <div className="flex flex-col gap-3">
                    {triageTimeline.map((item) => <TriageBubble key={item.id} item={item} />)}
                  </div>
                </div>
              )}

              {activeConversation && canReadHistory && Boolean(triageTimeline.length) && !attendanceQuery.isLoading && (
                <ConversationSectionDivider />
              )}

              {activeConversation && attendanceQuery.isLoading && canReadHistory && <PanelText text="Carregando histórico da triagem..." />}
              {activeConversation && attendanceQuery.isError && canReadHistory && <PanelText text="Não foi possível carregar o histórico da triagem." error />}

              {activeConversation && canReadHistory && (
                <>
                  {paginatedMessagesQuery.hasNextPage && (
                    <div className="flex justify-center">
                      <button type="button" onClick={() => paginatedMessagesQuery.fetchNextPage()} disabled={paginatedMessagesQuery.isFetchingNextPage}
                        className="text-xs font-bold text-[var(--accent-text)] bg-[var(--bg-card)] border border-[var(--border-default)] rounded-full px-4 py-2 shadow-sm hover:bg-[var(--bg-hover)] disabled:opacity-60">
                        {paginatedMessagesQuery.isFetchingNextPage ? 'Carregando...' : 'Carregar mensagens anteriores'}
                      </button>
                    </div>
                  )}

                  {paginatedMessagesQuery.isLoading && !messages.length && <PanelText text="Carregando histórico do chat..." />}
                  {paginatedMessagesQuery.isError && <PanelText text="Não foi possível carregar o histórico desta conversa." error />}
                  
                  {!paginatedMessagesQuery.isLoading && !messages.length && !paginatedMessagesQuery.isError && (
                    <EmptyPanel text="Nenhuma mensagem humana encontrada para este atendimento." />
                  )}

                  {messages.map((message) => (
                    <ChatMessageBubble
                      key={getMessageId(message)}
                      message={message}
                      currentUserId={currentUserId}
                      clientName={activeConversation?.client_name}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          <MessageComposer
            value={messageInput}
            onChange={setMessageInput}
            onSend={handleSendMessage}
            disabled={!canSendMessage}
            activeConversation={activeConversation}
            connectionStatus={connectionStatus}
            isAssignedToCurrentUser={isAssignedToCurrentUser}
            isAssignedToAnotherAgent={isAssignedToAnotherAgent}
            activeConversationIsAvailable={activeConversationIsAvailable}
            activeConversationClosed={activeConversationClosed}
            onUpload={handleFileUpload}
            isUploadingFile={isUploadingFile}
            lastError={lastError}
            assumeError={assumeError}
          />
        </main>
      </div>
    </div>
  )
}

// ─── sub-components com CSS Global ───────────────────────────────────────────

function MessageComposer({
  value, onChange, onSend, disabled, activeConversation, connectionStatus, isAssignedToCurrentUser,
  isAssignedToAnotherAgent, activeConversationIsAvailable, activeConversationClosed, lastError, assumeError, onUpload, isUploadingFile
}) {
  const fileInputRef = React.useRef(null)
  const helperText = lastError || assumeError || getFooterHelperText({ activeConversation, isAssignedToCurrentUser, isAssignedToAnotherAgent, activeConversationIsAvailable, activeConversationClosed })

  return (
    <div className="p-4 bg-[var(--accent)] rounded-b-2xl">
      <div className="bg-[var(--bg-card)] rounded-xl p-1.5 flex items-center gap-2 shadow-md">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSend() } }}
          disabled={disabled}
          placeholder={getInputPlaceholder({ activeConversation, connectionStatus, isAssignedToCurrentUser, isAssignedToAnotherAgent, activeConversationIsAvailable, activeConversationClosed })}
          className="flex-1 px-4 py-2.5 text-sm text-[var(--text-primary)] bg-transparent focus:outline-none placeholder:text-[var(--text-faint)] disabled:cursor-not-allowed" />
        
        <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0])
            e.target.value = ''
          }
        }} />

        <button type="button" disabled={disabled || isUploadingFile} onClick={() => fileInputRef.current?.click()}
          className="p-2 text-[var(--text-faint)] disabled:cursor-not-allowed hover:text-[var(--text-secondary)] transition-colors flex items-center justify-center">
          {isUploadingFile ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
        </button>

        <button type="button" onClick={onSend} disabled={disabled || !value.trim()}
          className="bg-[var(--accent)] disabled:bg-[var(--accent)]/50 text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2">
          Enviar
        </button>
      </div>

      {helperText && (
        <p className="text-center text-[10px] text-white/80 font-medium mt-3 tracking-wide">
          {helperText}
        </p>
      )}
    </div>
  )
}

function SidebarInfoBox({ text, error = false }) {
  return (
    <div className={`p-3.5 rounded-xl text-xs ${error ? 'text-orange-300 bg-black/30' : 'text-white/60 bg-black/20'}`}>
      {error && <AlertCircle size={12} className="mb-1 text-orange-400" />}
      {text}
    </div>
  )
}

function EmptyPanel({ text }) {
  return <div className="h-full flex items-center justify-center text-center text-[var(--text-faint)] text-sm px-6">{text}</div>
}

function PanelText({ text, error = false }) {
  return <div className={`text-center text-sm ${error ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>{text}</div>
}

function NoticeCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-5 text-center text-[var(--text-muted)] text-sm shadow-sm">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--accent-text)]">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-xs leading-relaxed text-[var(--text-muted)]">{text}</p>
    </div>
  )
}

function SessionItem({ active, user, message, time, status, unreadCount = 0, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-3.5 rounded-xl cursor-pointer transition-all border ${active ? 'bg-[var(--accent)] border-[var(--accent)] shadow-lg' : 'bg-black/20 border-white/5 hover:bg-black/30'}`}>
      <div className="flex justify-between items-start mb-1.5 gap-2">
        <h4 className="text-xs font-bold truncate text-white">{user}</h4>
        {status && (
          <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest shrink-0 ${getSessionStatusClass(status, active)}`}>
            {status}
          </span>
        )}

        {unreadCount > 0 && (
          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black leading-none text-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      <p className={`text-[10px] line-clamp-1 mb-2 ${active ? 'text-white/80' : 'text-white/50'}`}>"{message}"</p>
      <div className={`flex justify-between items-center ${active ? 'text-white/70' : 'text-white/40'}`}>
        <span className="text-[9px] font-bold">{time}</span>
        <ArchiveRestore size={12} />
      </div>
    </button>
  )
}

function TriageBubble({ item }) {
  const isBot = item.kind === 'triage-bot'
  return (
    <div className={`flex ${isBot ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isBot ? 'bg-[var(--bg-sidebar)] text-white border border-[var(--border-default)]/20' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-default)]'}`}>
        <div className="text-[9px] font-bold uppercase mb-1 opacity-70 tracking-widest">{isBot ? 'URA' : 'Cliente'}</div>
        <div>{item.content}</div>
      </div>
    </div>
  )
}

function FileAttachment({ fileId, filename, mimeType }) {
  const { data, isLoading, isError } = useGetDownloadUrl(fileId, true)
  if (isLoading) return <div className="flex items-center gap-2 text-sm text-[var(--text-faint)]"><Loader2 size={16} className="animate-spin" /> Carregando arquivo...</div>
  if (isError || !data?.url) return <div className="flex items-center gap-2 text-sm text-red-500"><ShieldAlert size={16}/> Erro ao carregar arquivo</div>

  const isImage = mimeType?.startsWith('image/')
  if (isImage) {
    return (
      <a href={data.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img src={data.url} alt={filename || 'Imagem anexada'} className="max-w-full max-h-60 rounded-lg object-contain shadow-sm hover:opacity-90 transition-opacity" />
      </a>
    )
  }

  return (
    <a href={data.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 p-3 bg-black/10 hover:bg-black/20 rounded-lg transition-colors overflow-hidden">
      <FileText size={24} className="shrink-0" />
      <span className="truncate text-sm font-medium underline underline-offset-2">{filename || 'Visualizar Arquivo'}</span>
    </a>
  )
}

function ChatMessageBubble({ message, currentUserId, clientName }) {
  const outgoing = isOutgoingMessage(message, currentUserId)
  const systemMsg = isSystemMessage(message)
  const content = getMessageContent(message)
  const time = formatMessageTime(message)
  const senderLabel = getMessageSenderLabel(message, currentUserId, clientName)

  if (systemMsg) {
    return (
      <div className="self-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)] bg-[var(--bg-card)] rounded-full px-4 py-1.5 border border-[var(--border-default)] shadow-sm">
        {content}
      </div>
    )
  }

  const isBot = outgoing && (message?.is_bot || message?.role === 'bot' || String(message?.sender_name).toLowerCase().includes('bot'))

  return (
    <div className={`flex gap-3 max-w-[80%] ${outgoing ? 'self-end flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 mt-auto mb-2 ${outgoing ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card)] border border-[var(--border-default)]'}`}>
        {outgoing ? (isBot ? <Bot size={15} /> : <User size={15} />) : <User size={15} className="text-[var(--text-faint)]" />}
      </div>

      <div className={`flex flex-col ${outgoing ? 'items-end' : ''}`}>
        <div className={`relative p-4 pb-8 rounded-2xl text-sm leading-relaxed shadow-sm min-w-[200px] break-words whitespace-pre-wrap ${
          outgoing 
            ? 'bg-[var(--bg-sidebar)] text-white rounded-br-sm border border-[var(--border-strong)]/20' 
            : 'bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border-default)]'
        }`}>
          {message.type === 'file' ? (
            <FileAttachment fileId={message.file_id ?? message.content} filename={message.filename} mimeType={message.mime_type} />
          ) : (
            content
          )}
          <span className={`absolute bottom-2.5 ${outgoing ? 'right-4' : 'left-4'} text-[9px] opacity-50 font-semibold tracking-wide`}>
            {time} • {senderLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

function ConnectionBadge({ status, disabled }) {
  const presentation = getConnectionPresentation(disabled ? 'idle' : status)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${presentation.containerClass}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${presentation.dotClass}`} />
      {presentation.label}
    </span>
  )
}

function LoaderInline() {
  return <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
}

function ConversationSectionDivider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-[var(--border-default)]" />
      <div className="flex items-center gap-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] px-4 py-2 shadow-sm">
        <User size={14} className="text-[var(--accent-text)]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          Início do atendimento humano
        </span>
      </div>
      <div className="h-px flex-1 bg-[var(--border-default)]" />
    </div>
  )
}

// ─── Utility functions ─────────────────────────────────────────────────────────

function getCurrentRoleNames(authUser, tokenPayload) {
  const fromUserObjects = Array.isArray(authUser?.roles) ? authUser.roles.map(r => (typeof r === 'string' ? r : r?.name)).filter(Boolean) : []
  const fromUserNames = Array.isArray(authUser?.role_names) ? authUser.role_names : []
  const fromTokenRoles = Array.isArray(tokenPayload?.roles) ? tokenPayload.roles : []
  const fromTokenRoleNames = Array.isArray(tokenPayload?.role_names) ? tokenPayload.role_names : []
  return [...fromUserObjects, ...fromUserNames, ...fromTokenRoles, ...fromTokenRoleNames].map(r => (typeof r === 'string' ? r : r?.name)).filter(Boolean).map(r => String(r).toLowerCase())
}
function getConversationId(c) { const raw = c?.chat_id ?? c?.id ?? null; return raw != null ? String(raw) : null }
function getAssignedAgentId(c) { const raw = c?.assigned_agent_id ?? c?.assignedAgentId ?? c?.agent_id ?? c?.agentId; return raw != null ? String(raw) : null }
function isConversationAssignedToUser(c, uid) { if (!c || !uid) return false; return getAssignedAgentId(c) === String(uid) }
function isConversationClosed(c) {
  if (!c) return false;
  const status = String(c?.status ?? c?.ticket_status ?? c?.ticketStatus ?? '').toLowerCase()
  return Boolean(c?.finished_at) || Boolean(c?.closed_at) || ['finished', 'closed', 'cancelled', 'resolved'].includes(status)
}
function isConversationAvailable(c) {
  if (!c || isConversationClosed(c)) return false;
  if (getAssignedAgentId(c)) return false;
  return Boolean(c?.needs_assume) || !getAssignedAgentId(c)
}
function getConversationUserName(c) { return c?.client_name ?? c?.clientName ?? 'Usuário' }
function getConversationLastMessage(c) { return c?.last_message ?? c?.description ?? 'Sem mensagens' }
function getConversationTimeLabel(c) { return formatRelativeTime(c?.last_message_at ?? c?.created_at ?? c?.started_at) }
function getConversationStatusLabel(c, uid) {
  if (isConversationClosed(c)) return 'FECHADO'
  if (isConversationAssignedToUser(c, uid)) return 'MEU ATUAL'
  if (getAssignedAgentId(c)) return 'EM OUTRO'
  return 'NA FILA'
}
function getSessionStatusClass(status, active) {
  if (status === 'MEU ATUAL' && !active) return 'text-green-400 bg-transparent'
  if (status === 'MEU ATUAL' && active) return 'text-white bg-white/20'
  if (status === 'EM OUTRO') return 'text-gray-400'
  if (status === 'FECHADO') return 'text-red-400'
  return 'text-yellow-400'
}
function getConversationOwnershipLabel({ activeConversation, isAssignedToCurrentUser, isAssignedToAnotherAgent }) {
  if (!activeConversation) return ''
  if (isConversationClosed(activeConversation)) return 'Atendimento encerrado'
  if (isAssignedToCurrentUser) return 'Atribuído a você'
  if (isAssignedToAnotherAgent) return 'Atribuído a outro atendente'
  return 'Disponível na fila'
}
function getConnectionPresentation(status) {
  const map = {
    connected:    { containerClass: 'bg-green-100 text-green-700',  dotClass: 'bg-green-500',  label: 'Ao vivo'    },
    connecting:   { containerClass: 'bg-yellow-100 text-yellow-700',dotClass: 'bg-yellow-400', label: 'Conectando'   },
    error:        { containerClass: 'bg-red-100 text-red-700',      dotClass: 'bg-red-500',    label: 'Erro' },
    disconnected: { containerClass: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',      dotClass: 'bg-[var(--border-default)]',    label: 'Desconectado' },
    idle:         { containerClass: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]', dotClass: 'bg-[var(--border-default)]', label: 'Inativo' },
  }
  return map[status] || map.idle
}
function getInputPlaceholder({ activeConversation, connectionStatus, isAssignedToCurrentUser, isAssignedToAnotherAgent, activeConversationIsAvailable, activeConversationClosed }) {
  if (!activeConversation) return 'Selecione um atendimento...'
  if (activeConversationClosed) return 'Atendimento encerrado...'
  if (activeConversationIsAvailable && !isAssignedToCurrentUser) return 'Assuma o atendimento para responder...'
  if (isAssignedToAnotherAgent) return 'Este atendimento está com outro atendente...'
  if (!isAssignedToCurrentUser) return 'Somente o responsável pode enviar mensagens...'
  if (connectionStatus !== 'connected') return 'Aguardando conexão WebSocket...'
  return 'Digite uma mensagem...'
}
function getFooterHelperText({ activeConversation, isAssignedToCurrentUser, isAssignedToAnotherAgent, activeConversationIsAvailable, activeConversationClosed }) {
  if (!activeConversation) return ''
  if (activeConversationClosed) return 'Este atendimento está encerrado. Novas mensagens estão bloqueadas.'
  if (activeConversationIsAvailable && !isAssignedToCurrentUser) return 'Assuma o atendimento para iniciar a conversa em tempo real.'
  if (isAssignedToAnotherAgent) return 'Este atendimento foi atribuído a outro atendente.'
  if (!isAssignedToCurrentUser) return 'Somente o responsável pelo atendimento pode responder em tempo real.'
  return ''
}
function getFilterCount(filterKey, counts) {
  if (filterKey === 'queue') return counts.queueCount
  if (filterKey === 'mine') return counts.myCurrentCount
  return counts.totalCurrentCount
}
function getEmptySidebarText(viewFilter) {
  if (viewFilter === 'queue') return 'Nenhum atendimento disponível na fila.'
  if (viewFilter === 'mine') return 'Você não possui atendimentos atuais.'
  return 'Nenhum atendimento atual disponível.'
}

// ─── Timeline Builders and Optimistic Mergers ────────────────────────────────
function prepareHistoryMessages(messages) {
  const timeline = []
  messages.forEach((message, index) => {
    pushMessageIfUnique(timeline, { ...message, __source: 'history', __historyOrder: index })
  })
  return timeline.sort(compareHistoryMessages)
}
function buildChatTimeline({ historyMessages, liveMessages, optimisticMessages }) {
  const timeline = []
  const orderedHistoryMessages = [...historyMessages].sort(compareHistoryMessages)
  const orderedLiveMessages = [...liveMessages].sort(compareArrivalMessages)
  const orderedOptimisticMessages = [...optimisticMessages].sort(compareArrivalMessages)

  const confirmedMessages = [...orderedHistoryMessages, ...orderedLiveMessages]
  const remainingOptimisticMessages = reconcileOptimisticMessages({ confirmedMessages, optimisticMessages: orderedOptimisticMessages })

  orderedHistoryMessages.forEach((m) => pushMessageIfUnique(timeline, m))
  orderedLiveMessages.forEach((m) => pushMessageIfUnique(timeline, m))
  remainingOptimisticMessages.forEach((m) => pushMessageIfUnique(timeline, m))

  return timeline
}
function reconcileOptimisticMessages({ confirmedMessages, optimisticMessages }) {
  const remainingOptimisticMessages = [...optimisticMessages]
  confirmedMessages.forEach((confirmedMessage) => {
    const matchingIndex = remainingOptimisticMessages.findIndex((optimisticMessage) => isOptimisticConfirmedByMessage(optimisticMessage, confirmedMessage))
    if (matchingIndex >= 0) remainingOptimisticMessages.splice(matchingIndex, 1)
  })
  return remainingOptimisticMessages
}
function isOptimisticConfirmedByMessage(optimisticMessage, confirmedMessage) {
  if (!optimisticMessage || !confirmedMessage) return false
  if (optimisticMessage?.__source !== 'optimistic' || confirmedMessage?.__source === 'optimistic') return false

  const optContent = normalizeMessageContent(getMessageContent(optimisticMessage))
  const confContent = normalizeMessageContent(getMessageContent(confirmedMessage))
  if (!optContent || optContent !== confContent) return false

  if (getMessageSenderId(optimisticMessage) !== getMessageSenderId(confirmedMessage)) return false

  const optTime = getTimestampValue(optimisticMessage)
  const confTime = getTimestampValue(confirmedMessage)
  if (!Number.isFinite(optTime) || !Number.isFinite(confTime)) return true
  return Math.abs(optTime - confTime) <= (6 * 60 * 60 * 1000)
}
function pushMessageIfUnique(timeline, message) {
  if (!message) return
  if (!timeline.some((cm) => areEquivalentMessages(cm, message))) timeline.push(message)
}
function compareHistoryMessages(a, b) {
  const dateA = getTimestampValue(a), dateB = getTimestampValue(b)
  if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) return dateA - dateB
  return Number(a?.__historyOrder ?? 0) - Number(b?.__historyOrder ?? 0)
}
function compareArrivalMessages(a, b) {
  const orderA = Number(a?.__arrivalOrder), orderB = Number(b?.__arrivalOrder)
  if (Number.isFinite(orderA) && Number.isFinite(orderB) && orderA !== orderB) return orderA - orderB
  const dateA = getTimestampValue(a), dateB = getTimestampValue(b)
  if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) return dateA - dateB
  return 0
}
function areEquivalentMessages(a, b) {
  const idA = getStableMessageId(a), idB = getStableMessageId(b)
  if (idA && idB && idA === idB) return true

  if (a?.__source === 'optimistic' || b?.__source === 'optimistic') {
    return isOptimisticConfirmedByMessage(a?.__source === 'optimistic' ? a : b, a?.__source === 'optimistic' ? b : a)
  }

  const contentA = normalizeMessageContent(getMessageContent(a)), contentB = normalizeMessageContent(getMessageContent(b))
  if (!contentA || !contentB || contentA !== contentB) return false

  if (getMessageSenderId(a) !== getMessageSenderId(b)) return false

  const timeA = getTimestampValue(a), timeB = getTimestampValue(b)
  if (Number.isFinite(timeA) && Number.isFinite(timeB)) return Math.abs(timeA - timeB) <= 30000
  return false
}
function normalizeMessageContent(content) { return String(content ?? '').trim() }
function getStableMessageId(message) {
  const raw = message?.message_id ?? message?.messageId ?? message?.id ?? message?._id ?? null; return raw != null ? String(raw) : null
}
function getMessageIdentityKey(message) {
  const stableId = getStableMessageId(message); if (stableId) return `id:${stableId}`
  const timestamp = getTimestampValue(message)
  return `fallback:${getMessageSenderId(message)}:${normalizeMessageContent(getMessageContent(message))}${Number.isFinite(timestamp) ? `:${Math.floor(timestamp / 1000)}` : ''}`
}
function getMessageId(message) {
  return getStableMessageId(message) || `${message?.conversation_id ?? message?.chat_id ?? 'chat'}-${message?.__source ?? 'message'}-${message?.__arrivalOrder ?? message?.__historyOrder ?? ''}-${getMessageSenderId(message)}-${getMessageContent(message)}-${getMessageTimestamp(message) ?? ''}`
}
function getMessageSenderId(message) { return String(message?.sender_id ?? message?.senderId ?? message?.sender?.id ?? message?.user_id ?? message?.userId ?? message?.author_id ?? message?.authorId ?? '') }
function getMessageContent(message) { return message?.content ?? message?.message ?? message?.text ?? '' }
function getMessageTimestamp(message) { return message?.timestamp ?? message?.created_at ?? message?.createdAt ?? null }
function getTimestampValue(message) { const rawDate = getMessageTimestamp(message); if (!rawDate) return Number.NaN; const time = new Date(rawDate).getTime(); return Number.isNaN(time) ? Number.NaN : time }
function isSystemMessage(message) { return getMessageSenderId(message) === 'System' || message?.type === 'system' || message?.kind === 'system' }
function shouldRenderMessage(message) {
  if (!isSystemMessage(message)) return Boolean(getMessageContent(message))
  const content = getMessageContent(message).toLowerCase()
  return !(content.includes('joined to chat room') || content.includes('joined chat room'))
}
function isOutgoingMessage(message, currentUserId) {
  if (!currentUserId) return false
  return getMessageSenderId(message) === String(currentUserId)
}
function getMessageSenderLabel(message, currentUserId, clientName) {
  if (isSystemMessage(message)) return 'Sistema'
  if (isOutgoingMessage(message, currentUserId)) return 'Você'
  return clientName || 'Cliente'
}
function formatMessageTime(message) {
  const rawDate = getMessageTimestamp(message)
  if (!rawDate) return '--:--'
  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function formatRelativeTime(rawDate) {
  if (!rawDate) return '--'
  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) return '--'
  const diffMinutes = Math.max(Math.floor((Date.now() - date.getTime()) / 60000), 0)
  if (diffMinutes < 1) return 'Agora'
  if (diffMinutes < 60) return `Há ${diffMinutes} min`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Há ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  return `Há ${diffDays} d`
}
function shortId(value) {
  if (!value) return '--'
  return String(value).slice(-6).toUpperCase()
}
function isViewportNearBottom(element, threshold = 120) {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
}