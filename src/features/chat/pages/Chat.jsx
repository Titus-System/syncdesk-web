import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  TrendingUp,
  Search,
  User,
  Radio,
  ArchiveRestore,
  Bot,
  Paperclip,
  LayoutGrid,
  History,
  LogOut,
  Settings,
  Hand,
  ShieldAlert
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useActiveConversationsQuery } from '@/features/chat/hooks/useActiveConversationsQuery'
import { useGetPaginatedMessages } from '@/features/chat/hooks/useGetPaginatedMessages'
import { useLiveChatWebSocket } from '@/features/chat/hooks/useLiveChatWebSocket'
import { useAttendanceQuery } from '@/features/chat/hooks/useAttendanceQuery'
import { useAssumeChatSessionMutation } from '@/features/chat/hooks/useAssumeChatSessionMutation'
import { decodeJwtPayload } from '@/shared/utils/jwt'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { matchesConversationSearch } from '@/features/chat/utils/searchConversations'

const VIEW_FILTERS = [
  { key: 'queue', label: 'Fila disponível' },
  { key: 'mine', label: 'Meus atuais' },
  { key: 'all', label: 'Todos os atuais' }
]

export default function Chat() {
  const navigate = useNavigate()

  const clearSession = useAuthStore((state) => state.clearSession)
  const authUser = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [messageInput, setMessageInput] = useState('')
  const [viewFilter, setViewFilter] = useState('mine')
  const [assumeError, setAssumeError] = useState(null)
  const [pendingAssumeChatId, setPendingAssumeChatId] = useState(null)
  const [optimisticMessages, setOptimisticMessages] = useState([])

  const menuRef = useRef(null)
  const messagesViewportRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)
  const lastActiveChatIdRef = useRef(null)
  const previousMessagesSignatureRef = useRef('')
  const liveArrivalOrderRef = useRef(new Map())
  const nextLiveArrivalOrderRef = useRef(1)
  const nextOptimisticOrderRef = useRef(1)

  const debouncedSearch = useDebouncedValue(search, 300)

  const tokenPayload = useMemo(() => {
    if (!accessToken) {
      return null
    }

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

  const allConversations = useMemo(() => {
    return conversationsQuery.data ?? []
  }, [conversationsQuery.data])

  const queueConversations = useMemo(
    () => allConversations.filter((conversation) => isConversationAvailable(conversation)),
    [allConversations]
  )

  const myCurrentConversations = useMemo(
    () =>
      allConversations.filter((conversation) =>
        isConversationAssignedToUser(conversation, currentUserId)
      ),
    [allConversations, currentUserId]
  )

  const sourceConversations = useMemo(() => {
    if (viewFilter === 'queue') {
      return queueConversations
    }

    if (viewFilter === 'all') {
      return allConversations
    }

    return myCurrentConversations
  }, [allConversations, myCurrentConversations, queueConversations, viewFilter])

  const visibleConversations = useMemo(() => {
    return sourceConversations.filter((conversation) =>
      matchesConversationSearch(conversation, debouncedSearch)
    )
  }, [sourceConversations, debouncedSearch])

  const activeChatId = useMemo(() => {
    if (!visibleConversations.length) {
      return null
    }

    const selectedExists = visibleConversations.some(
      (conversation) => getConversationId(conversation) === selectedChatId
    )

    if (selectedExists) {
      return selectedChatId
    }

    return getConversationId(visibleConversations[0])
  }, [visibleConversations, selectedChatId])

  const activeConversation = useMemo(
    () =>
      visibleConversations.find(
        (conversation) => getConversationId(conversation) === activeChatId
      ) ?? null,
    [visibleConversations, activeChatId]
  )

  const assignedAgentId = getAssignedAgentId(activeConversation)
  const activeConversationClosed = isConversationClosed(activeConversation)

  const isAssignedToCurrentUser = Boolean(
    activeConversation &&
    assignedAgentId &&
    currentUserId &&
    assignedAgentId === currentUserId
  )

  const isAssignedToAnotherAgent = Boolean(
    activeConversation &&
    assignedAgentId &&
    currentUserId &&
    assignedAgentId !== currentUserId
  )

  const activeConversationIsAvailable = Boolean(
    activeConversation && isConversationAvailable(activeConversation)
  )

  const canAssumeConversation = Boolean(
    getConversationId(activeConversation) &&
    activeConversationIsAvailable &&
    !isAssignedToCurrentUser &&
    !isAssignedToAnotherAgent &&
    !pendingAssumeChatId
  )

  const canReadHistory = Boolean(
    activeConversation?.ticket_id &&
    (isAssignedToCurrentUser || isAdmin)
  )

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
    {
      enabled: canReadHistory
    }
  )

  const historyMessages = useMemo(() => {
    const pages = paginatedMessagesQuery.data?.pages ?? []

    return prepareHistoryMessages(
      pages
        .slice()
        .reverse()
        .flatMap((page) => page?.messages ?? [])
    )
  }, [paginatedMessagesQuery.data])

  const {
    connectionStatus,
    liveMessages,
    sendMessage,
    lastError
  } = useLiveChatWebSocket({
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

      return {
        ...message,
        __source: 'live',
        __arrivalOrder: liveArrivalOrderRef.current.get(key)
      }
    })
  }, [liveMessages])

  useEffect(() => {
    if (!optimisticMessages.length) {
      return
    }

    setOptimisticMessages((currentOptimisticMessages) => {
      const filtered = currentOptimisticMessages.filter((optimisticMessage) => {
        const foundInLive = liveMessagesWithArrivalOrder.some((liveMessage) =>
          areEquivalentMessages(optimisticMessage, liveMessage)
        )

        const foundInHistory = historyMessages.some((historyMessage) =>
          areEquivalentMessages(optimisticMessage, historyMessage)
        )

        return !foundInLive && !foundInHistory
      })

      return filtered.length === currentOptimisticMessages.length
        ? currentOptimisticMessages
        : filtered
    })
  }, [historyMessages, liveMessagesWithArrivalOrder, optimisticMessages.length])

  const triageTimeline = useMemo(() => {
    const triage = Array.isArray(attendanceQuery.data?.triage)
      ? attendanceQuery.data.triage
      : []

    return triage.flatMap((item, index) => {
      const timeline = [
        {
          id: `triage-question-${index}`,
          kind: 'triage-bot',
          content: item.question
        }
      ]

      if (item.answer_text || item.answer_value) {
        timeline.push({
          id: `triage-answer-${index}`,
          kind: 'triage-user',
          content: item.answer_text || item.answer_value
        })
      }

      return timeline.filter((timelineItem) => Boolean(timelineItem.content))
    })
  }, [attendanceQuery.data])

  const messages = useMemo(() => {
    return buildChatTimeline({
      historyMessages,
      liveMessages: liveMessagesWithArrivalOrder,
      optimisticMessages
    }).filter(shouldRenderMessage)
  }, [historyMessages, liveMessagesWithArrivalOrder, optimisticMessages])

  const messagesSignature = useMemo(() => {
    return messages.map((message) => getMessageId(message)).join('|')
  }, [messages])

  const canSendMessage = Boolean(
    canConnectLive &&
    isAssignedToCurrentUser &&
    connectionStatus === 'connected' &&
    !activeConversationClosed
  )

  const totalCurrentCount = allConversations.length
  const queueCount = queueConversations.length
  const myCurrentCount = myCurrentConversations.length

  const scrollMessagesToBottom = useCallback((behavior = 'auto') => {
    window.requestAnimationFrame(() => {
      const viewport = messagesViewportRef.current

      if (!viewport) {
        return
      }

      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior
      })
    })
  }, [])

  const handleMessagesViewportScroll = useCallback(() => {
    const viewport = messagesViewportRef.current

    if (!viewport) {
      return
    }

    shouldStickToBottomRef.current = isViewportNearBottom(viewport)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
    if (activeConversation && !isAssignedToCurrentUser) {
      setMessageInput('')
    }
  }, [activeConversation, isAssignedToCurrentUser])

  useLayoutEffect(() => {
    const viewport = messagesViewportRef.current

    if (!viewport) {
      return
    }

    const chatChanged = lastActiveChatIdRef.current !== activeChatId
    const messagesChanged = previousMessagesSignatureRef.current !== messagesSignature

    const shouldScroll =
      chatChanged ||
      shouldStickToBottomRef.current ||
      previousMessagesSignatureRef.current === ''

    if (messagesChanged && shouldScroll) {
      scrollMessagesToBottom(chatChanged ? 'auto' : 'smooth')
    }

    if (chatChanged) {
      scrollMessagesToBottom('auto')
    }

    lastActiveChatIdRef.current = activeChatId
    previousMessagesSignatureRef.current = messagesSignature
  }, [activeChatId, messagesSignature, scrollMessagesToBottom])

  const handleLogout = useCallback(() => {
    clearSession()
    navigate('/login', { replace: true })
  }, [clearSession, navigate])

  const handleNavigateHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleAssumeConversation = useCallback(async () => {
    const chatId = getConversationId(activeConversation)

    if (!chatId || !canAssumeConversation) {
      return
    }

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
      setAssumeError(
        error?.response?.data?.detail ||
        'Não foi possível assumir este atendimento.'
      )

      await conversationsQuery.refetch()
    } finally {
      setPendingAssumeChatId(null)
    }
  }, [
    activeConversation,
    assumeConversationMutation,
    canAssumeConversation,
    conversationsQuery,
    scrollMessagesToBottom
  ])

  const handleSendMessage = useCallback(() => {
    const content = messageInput.trim()
    const chatId = getConversationId(activeConversation)

    if (!activeConversation || !chatId || !content || !canSendMessage) {
      return
    }

    const sent = sendMessage({
      type: 'text',
      content
    })

    if (!sent) {
      return
    }

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
  }, [
    activeConversation,
    canSendMessage,
    currentUserId,
    messageInput,
    sendMessage,
    scrollMessagesToBottom
  ])

  return (
    <div className="flex flex-col h-screen bg-[#4A0E0E] text-white font-sans overflow-hidden">
      <header className="h-[64px] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-50 bg-[#4A0E0E]">
        <div className="flex items-center gap-10">
          <button
            type="button"
            onClick={handleNavigateHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="p-5 flex items-center gap-3">
              <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
                <TrendingUp size={18} className="text-white" />
              </div>
              <span className="text-white font-bold text-sm uppercase tracking-wider">
                SyncDesk
              </span>
            </div>
          </button>

          <nav className="flex items-center gap-8">
            <span className="text-[#D14D1D] font-medium text-sm border-b-2 border-[#D14D1D] pb-1">
              Console ao Vivo
            </span>
            <span className="text-white/60 font-medium text-sm pb-1">
              Histórico de Atendimento
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative w-[300px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300/80"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar atendimentos atuais..."
              className="w-full bg-black/20 border border-white/30 text-white text-sm py-1.5 pl-10 pr-4 rounded-lg focus:outline-none focus:border-white/50 transition-all placeholder:text-gray-300/60"
            />
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuPerfilAberto((value) => !value)}
              className="w-9 h-9 bg-white/10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <User size={20} className="text-white/80" />
            </button>

            {menuPerfilAberto && (
              <ProfileMenu
                user={authUser}
                onSettings={() => {
                  setMenuPerfilAberto(false)
                  navigate('/configuracoes')
                }}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-6">
        <aside className="w-[320px] flex flex-col shrink-0 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Radio size={16} className="text-[#D14D1D]" />
            <h2 className="font-bold text-sm text-white/90">Atendimentos Atuais</h2>
            <span className="ml-auto bg-black/40 text-[10px] px-2 py-0.5 rounded-full text-white/60">
              {totalCurrentCount} ativos
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {VIEW_FILTERS.map((filter) => {
              const isActive = viewFilter === filter.key
              const count = getFilterCount(filter.key, {
                queueCount,
                myCurrentCount,
                totalCurrentCount
              })

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setViewFilter(filter.key)}
                  className={`rounded-xl px-2 py-2 text-[9px] font-bold uppercase tracking-wider transition-all ${isActive
                    ? 'bg-[#D14D1D] text-white shadow-md'
                    : 'bg-black/20 text-white/70 hover:bg-black/30'
                    }`}
                >
                  <div className="leading-tight">{filter.label}</div>
                  <div className="mt-1 opacity-80">{count}</div>
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {conversationsQuery.isLoading && (
              <SidebarInfoBox text="Carregando atendimentos..." />
            )}

            {conversationsQuery.isError && (
              <SidebarInfoBox text="Não foi possível carregar os atendimentos." error />
            )}

            {!conversationsQuery.isLoading &&
              !conversationsQuery.isError &&
              !sourceConversations.length && (
                <SidebarInfoBox text={getEmptySidebarText(viewFilter)} />
              )}

            {!conversationsQuery.isLoading &&
              !conversationsQuery.isError &&
              Boolean(sourceConversations.length) &&
              !visibleConversations.length &&
              Boolean(debouncedSearch) && (
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
                  onClick={() => setSelectedChatId(conversationId)}
                />
              )
            })}
          </div>
        </aside>

        <main className="flex-1 flex flex-col rounded-2xl overflow-hidden mt-4 shadow-xl">
          <div className="bg-[#F3EAD8] px-6 py-4 flex justify-between items-center shrink-0 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center">
                <User size={20} className="text-gray-400" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="text-gray-800 font-bold text-sm truncate">
                    {activeConversation
                      ? getConversationUserName(activeConversation)
                      : 'Nenhum atendimento selecionado'}
                  </h3>

                  {activeConversation && (
                    <span className="bg-[#D14D1D] text-white text-[9px] px-2 py-0.5 rounded-md font-bold uppercase">
                      {getConversationOwnershipLabel({
                        activeConversation,
                        isAssignedToCurrentUser,
                        isAssignedToAnotherAgent
                      })}
                    </span>
                  )}

                  {activeConversation && (
                    <ConnectionBadge
                      status={connectionStatus}
                      disabled={!canConnectLive}
                    />
                  )}
                </div>

                <p className="text-gray-500 text-[10px] truncate">
                  {activeConversation
                    ? `Ticket ${shortId(activeConversation.ticket_id)} • ${activeConversation.product || 'Sem produto'} • ${activeConversation.client_email || 'E-mail não informado'}`
                    : 'Selecione um atendimento para visualizar detalhes'}
                </p>
              </div>
            </div>

            {activeConversation && canAssumeConversation && (
              <button
                type="button"
                onClick={handleAssumeConversation}
                disabled={Boolean(pendingAssumeChatId)}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#D14D1D] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#b03f18] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pendingAssumeChatId ? <LoaderInline /> : <Hand size={14} />}
                {pendingAssumeChatId ? 'Assumindo...' : 'Assumir atendimento'}
              </button>
            )}
          </div>

          <div
            ref={messagesViewportRef}
            onScroll={handleMessagesViewportScroll}
            className="flex-1 overflow-y-auto bg-[#F3EAD8] custom-scrollbar [overflow-anchor:none]"
          >
            <div className="min-h-full p-8 flex flex-col">
              <div className="mt-auto flex flex-col gap-4">
                {!activeConversation && !conversationsQuery.isLoading && (
                  <EmptyPanel text="Selecione um atendimento para visualizar a conversa." />
                )}

                {activeConversation && activeConversationIsAvailable && !isAssignedToCurrentUser && (
                  <NoticeCard
                    icon={<Hand size={22} />}
                    title="Atendimento disponível na fila"
                    text="Este atendimento foi aberto pela URA e ainda não possui responsável. Assuma o atendimento para responder em tempo real."
                  />
                )}

                {activeConversation && isAssignedToAnotherAgent && (
                  <NoticeCard
                    icon={<ShieldAlert size={22} />}
                    title="Atendimento em andamento"
                    text="Este atendimento já está atribuído a outro atendente. Você pode localizá-lo nesta tela, mas apenas o responsável consegue responder em tempo real."
                  />
                )}

                {activeConversation && activeConversationClosed && (
                  <NoticeCard
                    icon={<ArchiveRestore size={22} />}
                    title="Atendimento encerrado"
                    text="Este atendimento foi encerrado. O histórico permanece disponível, mas novas mensagens não podem ser enviadas."
                  />
                )}

                {activeConversation && Boolean(triageTimeline.length) && canReadHistory && (
                  <div className="mb-6">
                    <div className="text-center text-[10px] font-bold uppercase text-gray-400 mb-4">
                      Histórico da triagem
                    </div>

                    <div className="flex flex-col gap-3">
                      {triageTimeline.map((item) => (
                        <TriageBubble key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {activeConversation &&
                  canReadHistory &&
                  Boolean(triageTimeline.length) &&
                  !attendanceQuery.isLoading && (
                    <ConversationSectionDivider />
                  )}

                {activeConversation && attendanceQuery.isLoading && canReadHistory && (
                  <PanelText text="Carregando histórico da triagem..." />
                )}

                {activeConversation && attendanceQuery.isError && canReadHistory && (
                  <PanelText text="Não foi possível carregar o histórico da triagem." error />
                )}

                {activeConversation && canReadHistory && (
                  <>
                    {paginatedMessagesQuery.hasNextPage && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => paginatedMessagesQuery.fetchNextPage()}
                          disabled={paginatedMessagesQuery.isFetchingNextPage}
                          className="text-xs font-bold text-[#4A0E0E] bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                        >
                          {paginatedMessagesQuery.isFetchingNextPage
                            ? 'Carregando...'
                            : 'Carregar mensagens anteriores'}
                        </button>
                      </div>
                    )}

                    {paginatedMessagesQuery.isLoading && !messages.length && (
                      <PanelText text="Carregando histórico do chat..." />
                    )}

                    {paginatedMessagesQuery.isError && (
                      <PanelText text="Não foi possível carregar o histórico desta conversa." error />
                    )}

                    {!paginatedMessagesQuery.isLoading &&
                      !messages.length &&
                      !paginatedMessagesQuery.isError && (
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
            lastError={lastError}
            assumeError={assumeError}
          />
        </main>

        <aside className="w-[180px] shrink-0 mt-4">
          <div className="flex items-center gap-2 mb-6">
            <LayoutGrid size={16} className="text-[#D14D1D]" />
            <h2 className="font-bold text-sm text-white/90">Atalhos</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <QuickAction icon={<History size={18} />} label="Full Logs" />
          </div>
        </aside>
      </div>
    </div>
  )
}

function ProfileMenu({ user, onSettings, onLogout }) {
  return (
    <div className="absolute right-0 top-12 w-60 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
      <div className="px-4 py-3 border-b border-white/10 mb-1">
        <p className="text-sm font-bold text-white truncate">
          {user?.name || 'Usuário'}
        </p>
        <p className="text-[11px] text-white/50 truncate">
          {user?.email || ''}
        </p>
      </div>

      <button
        type="button"
        onClick={onSettings}
        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-white/70 hover:bg-white/10 rounded-xl transition-colors uppercase"
      >
        <Settings size={14} />
        Configurações
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase"
      >
        <LogOut size={14} />
        Sair
      </button>
    </div>
  )
}

function MessageComposer({
  value,
  onChange,
  onSend,
  disabled,
  activeConversation,
  connectionStatus,
  isAssignedToCurrentUser,
  isAssignedToAnotherAgent,
  activeConversationIsAvailable,
  activeConversationClosed,
  lastError,
  assumeError
}) {
  const helperText =
    lastError ||
    assumeError ||
    getFooterHelperText({
      activeConversation,
      isAssignedToCurrentUser,
      isAssignedToAnotherAgent,
      activeConversationIsAvailable,
      activeConversationClosed
    })

  return (
    <div className="p-6 bg-[#D14D1D]">
      <div className="bg-white rounded-xl p-2 flex items-center gap-2 border border-[#D14D1D]/20 shadow-md">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onSend()
            }
          }}
          disabled={disabled}
          placeholder={getInputPlaceholder({
            activeConversation,
            connectionStatus,
            isAssignedToCurrentUser,
            isAssignedToAnotherAgent,
            activeConversationIsAvailable,
            activeConversationClosed
          })}
          className="flex-1 px-4 py-2 text-sm text-gray-600 focus:outline-none placeholder:text-gray-400 disabled:bg-white disabled:cursor-not-allowed"
        />

        <button
          type="button"
          disabled
          className="p-2 text-gray-400 disabled:cursor-not-allowed"
        >
          <Paperclip size={20} />
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="bg-[#D14D1D] disabled:bg-[#D14D1D]/50 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#b03f18] transition-all disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </div>

      {helperText && (
        <p className="text-center text-[10px] text-white font-bold mt-3 uppercase opacity-90 tracking-tighter">
          {helperText}
        </p>
      )}
    </div>
  )
}

function SidebarInfoBox({ text, error = false }) {
  return (
    <div className={`p-4 rounded-xl bg-black/20 text-xs ${error ? 'text-orange-300' : 'text-white/70'}`}>
      {text}
    </div>
  )
}

function EmptyPanel({ text }) {
  return (
    <div className="min-h-[240px] flex items-center justify-center text-center text-gray-500 text-sm">
      {text}
    </div>
  )
}

function PanelText({ text, error = false }) {
  return (
    <div className={`text-center text-sm ${error ? 'text-red-500' : 'text-gray-500'}`}>
      {text}
    </div>
  )
}

function NoticeCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm shadow-sm">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-[#D14D1D]">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-gray-800 mb-1">
        {title}
      </h3>
      <p className="text-xs leading-relaxed text-gray-500">
        {text}
      </p>
    </div>
  )
}

function SessionItem({ active, user, message, time, status, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl cursor-pointer transition-all ${active
        ? 'bg-[#D14D1D] shadow-lg scale-[1.02]'
        : 'bg-black/20 hover:bg-black/30'
        }`}
    >
      <div className="flex justify-between items-start mb-1 gap-2">
        <h4 className="text-xs font-bold truncate text-white">
          {user}
        </h4>

        {status && (
          <span
            className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black ${getSessionStatusClass(
              status
            )}`}
          >
            {status}
          </span>
        )}
      </div>

      <p className="text-[10px] text-white/60 line-clamp-1 mb-2">
        "{message}"
      </p>

      <div className="flex justify-between items-center opacity-40">
        <span className="text-[9px] font-bold tracking-tighter">
          {time}
        </span>
        <ArchiveRestore size={10} />
      </div>
    </button>
  )
}

function QuickAction({ icon, label }) {
  return (
    <button
      type="button"
      className="bg-white text-[#4A0E0E] flex flex-col items-center justify-center p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform group"
    >
      <div className="text-[#D14D1D] mb-1 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tighter opacity-80">
        {label}
      </span>
    </button>
  )
}

function TriageBubble({ item }) {
  const isBot = item.kind === 'triage-bot'

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isBot
          ? 'bg-orange-100 text-[#4A0E0E] border border-orange-200'
          : 'bg-slate-200 text-slate-700 border border-slate-300'
          }`}
      >
        <div className="text-[9px] font-bold uppercase mb-1 opacity-70">
          {isBot ? 'URA' : 'Cliente'}
        </div>
        <div>{item.content}</div>
      </div>
    </div>
  )
}

function ChatMessageBubble({ message, currentUserId, clientName }) {
  const outgoing = isOutgoingMessage(message, currentUserId)
  const systemMessage = isSystemMessage(message)
  const content = getMessageContent(message)
  const time = formatMessageTime(message)
  const senderLabel = getMessageSenderLabel(message, currentUserId, clientName)

  if (systemMessage) {
    return (
      <div className="self-center text-[11px] text-gray-400 bg-white/70 rounded-full px-3 py-1 border border-gray-200">
        {content}
      </div>
    )
  }

  return (
    <div className={`flex w-fit gap-3 max-w-[82%] ${outgoing ? 'self-end flex-row-reverse' : 'self-start'}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 ${outgoing
          ? 'bg-[#4A0E0E] text-white'
          : 'bg-white border border-gray-200'
          }`}
      >
        {outgoing ? <Bot size={16} /> : <User size={16} className="text-gray-400" />}
      </div>

      <div className={`flex flex-col ${outgoing ? 'items-end' : 'items-start'}`}>
        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${outgoing
            ? 'bg-[#4A0E0E] text-white rounded-tr-none'
            : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
            }`}
        >
          {content}
        </div>

        <span className={`text-[10px] text-gray-400 mt-1 font-medium ${outgoing ? 'mr-1' : 'ml-1'}`}>
          {time} • {senderLabel}
        </span>
      </div>
    </div>
  )
}

function ConnectionBadge({ status, disabled }) {
  const presentation = getConnectionPresentation(disabled ? 'idle' : status)

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold uppercase ${presentation.containerClass}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${presentation.dotClass}`} />
      {presentation.label}
    </span>
  )
}

function LoaderInline() {
  return (
    <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
  )
}

function getCurrentRoleNames(authUser, tokenPayload) {
  const fromUserObjects = Array.isArray(authUser?.roles)
    ? authUser.roles
      .map((role) => (typeof role === 'string' ? role : role?.name))
      .filter(Boolean)
    : []

  const fromUserNames = Array.isArray(authUser?.role_names)
    ? authUser.role_names
    : []

  const fromTokenRoles = Array.isArray(tokenPayload?.roles)
    ? tokenPayload.roles
    : []

  const fromTokenRoleNames = Array.isArray(tokenPayload?.role_names)
    ? tokenPayload.role_names
    : []

  return [
    ...fromUserObjects,
    ...fromUserNames,
    ...fromTokenRoles,
    ...fromTokenRoleNames
  ]
    .map((role) => (typeof role === 'string' ? role : role?.name))
    .filter(Boolean)
    .map((role) => String(role).toLowerCase())
}

function getConversationId(conversation) {
  const raw = conversation?.chat_id ?? conversation?.id ?? null
  return raw != null ? String(raw) : null
}

function getAssignedAgentId(conversation) {
  const raw =
    conversation?.assigned_agent_id ??
    conversation?.assignedAgentId ??
    conversation?.agent_id ??
    conversation?.agentId

  return raw != null ? String(raw) : null
}

function isConversationAssignedToUser(conversation, currentUserId) {
  if (!conversation || !currentUserId) {
    return false
  }

  return getAssignedAgentId(conversation) === String(currentUserId)
}

function isConversationAvailable(conversation) {
  if (!conversation || isConversationClosed(conversation)) {
    return false
  }

  if (getAssignedAgentId(conversation)) {
    return false
  }

  return Boolean(conversation?.needs_assume) || !getAssignedAgentId(conversation)
}

function isConversationClosed(conversation) {
  if (!conversation) {
    return false
  }

  const status = String(
    conversation?.status ??
    conversation?.ticket_status ??
    conversation?.ticketStatus ??
    ''
  ).toLowerCase()

  return Boolean(conversation?.finished_at) ||
    Boolean(conversation?.closed_at) ||
    ['finished', 'closed', 'cancelled', 'resolved'].includes(status)
}

function getConversationUserName(conversation) {
  return conversation?.client_name ?? conversation?.clientName ?? 'Usuário'
}

function getConversationLastMessage(conversation) {
  return conversation?.last_message ?? conversation?.description ?? 'Sem mensagens'
}

function getConversationTimeLabel(conversation) {
  return formatRelativeTime(
    conversation?.last_message_at ??
    conversation?.created_at ??
    conversation?.started_at
  )
}

function getConversationStatusLabel(conversation, currentUserId) {
  if (isConversationClosed(conversation)) {
    return 'FECHADO'
  }

  if (isConversationAssignedToUser(conversation, currentUserId)) {
    return 'MEU ATUAL'
  }

  if (getAssignedAgentId(conversation)) {
    return 'EM OUTRO'
  }

  return 'NA FILA'
}

function getConversationOwnershipLabel({
  activeConversation,
  isAssignedToCurrentUser,
  isAssignedToAnotherAgent
}) {
  if (!activeConversation) {
    return ''
  }

  if (isConversationClosed(activeConversation)) {
    return 'Atendimento encerrado'
  }

  if (isAssignedToCurrentUser) {
    return 'Atribuído a você'
  }

  if (isAssignedToAnotherAgent) {
    return 'Atribuído a outro atendente'
  }

  return 'Disponível na fila'
}

function getSessionStatusClass(status) {
  if (status === 'MEU ATUAL') {
    return 'bg-green-500/20 text-green-200'
  }

  if (status === 'EM OUTRO') {
    return 'bg-gray-500/20 text-gray-200'
  }

  if (status === 'FECHADO') {
    return 'bg-red-500/20 text-red-100'
  }

  return 'bg-yellow-500/20 text-yellow-100'
}

function prepareHistoryMessages(messages) {
  const timeline = []

  messages.forEach((message, index) => {
    const normalizedMessage = {
      ...message,
      __source: 'history',
      __historyOrder: index
    }

    pushMessageIfUnique(timeline, normalizedMessage)
  })

  return timeline.sort(compareHistoryMessages)
}

function buildChatTimeline({
  historyMessages,
  liveMessages,
  optimisticMessages
}) {
  const timeline = []

  const orderedHistoryMessages = [...historyMessages].sort(compareHistoryMessages)
  const orderedLiveMessages = [...liveMessages].sort(compareArrivalMessages)
  const orderedOptimisticMessages = [...optimisticMessages].sort(compareArrivalMessages)

  orderedHistoryMessages.forEach((message) => {
    pushMessageIfUnique(timeline, message)
  })

  orderedLiveMessages.forEach((message) => {
    pushMessageIfUnique(timeline, message)
  })

  orderedOptimisticMessages.forEach((message) => {
    pushMessageIfUnique(timeline, message)
  })

  return timeline
}

function pushMessageIfUnique(timeline, message) {
  if (!message) {
    return
  }

  const duplicated = timeline.some((currentMessage) =>
    areEquivalentMessages(currentMessage, message)
  )

  if (!duplicated) {
    timeline.push(message)
  }
}

function compareHistoryMessages(a, b) {
  const dateA = getTimestampValue(a)
  const dateB = getTimestampValue(b)

  if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) {
    return dateA - dateB
  }

  return Number(a?.__historyOrder ?? 0) - Number(b?.__historyOrder ?? 0)
}

function compareArrivalMessages(a, b) {
  const orderA = Number(a?.__arrivalOrder)
  const orderB = Number(b?.__arrivalOrder)

  if (Number.isFinite(orderA) && Number.isFinite(orderB) && orderA !== orderB) {
    return orderA - orderB
  }

  const dateA = getTimestampValue(a)
  const dateB = getTimestampValue(b)

  if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) {
    return dateA - dateB
  }

  return 0
}

function areEquivalentMessages(a, b) {
  const idA = getStableMessageId(a)
  const idB = getStableMessageId(b)

  if (idA && idB && idA === idB) {
    return true
  }

  const contentA = normalizeMessageContent(getMessageContent(a))
  const contentB = normalizeMessageContent(getMessageContent(b))

  if (!contentA || !contentB || contentA !== contentB) {
    return false
  }

  const senderA = getMessageSenderId(a)
  const senderB = getMessageSenderId(b)

  if (!senderA || !senderB || senderA !== senderB) {
    return false
  }

  const timeA = getTimestampValue(a)
  const timeB = getTimestampValue(b)

  if (Number.isFinite(timeA) && Number.isFinite(timeB)) {
    return Math.abs(timeA - timeB) <= 30000
  }

  return true
}

function normalizeMessageContent(content) {
  return String(content ?? '').trim()
}

function getStableMessageId(message) {
  const raw =
    message?.message_id ??
    message?.messageId ??
    message?.id ??
    message?._id ??
    null

  return raw != null ? String(raw) : null
}

function getMessageIdentityKey(message) {
  const stableId = getStableMessageId(message)

  if (stableId) {
    return `id:${stableId}`
  }

  const sender = getMessageSenderId(message)
  const content = normalizeMessageContent(getMessageContent(message))
  const timestamp = getTimestampValue(message)

  if (Number.isFinite(timestamp)) {
    return `fallback:${sender}:${content}:${Math.floor(timestamp / 1000)}`
  }

  return `fallback:${sender}:${content}`
}

function getMessageId(message) {
  const stableId = getStableMessageId(message)

  if (stableId) {
    return stableId
  }

  return `${message?.conversation_id ?? message?.chat_id ?? 'chat'}-${message?.__source ?? 'message'}-${message?.__arrivalOrder ?? message?.__historyOrder ?? ''}-${getMessageSenderId(message)}-${getMessageContent(message)}-${getMessageTimestamp(message) ?? ''}`
}

function getMessageSenderId(message) {
  const raw =
    message?.sender_id ??
    message?.senderId ??
    message?.sender?.id ??
    message?.user_id ??
    message?.userId ??
    message?.author_id ??
    message?.authorId ??
    ''

  return String(raw)
}

function getMessageContent(message) {
  return message?.content ?? message?.message ?? message?.text ?? ''
}

function getMessageTimestamp(message) {
  return message?.timestamp ?? message?.created_at ?? message?.createdAt ?? null
}

function getTimestampValue(message) {
  const rawDate = getMessageTimestamp(message)

  if (!rawDate) {
    return Number.NaN
  }

  const date = new Date(rawDate)
  const time = date.getTime()

  return Number.isNaN(time) ? Number.NaN : time
}

function isSystemMessage(message) {
  return getMessageSenderId(message) === 'System'
}

function shouldRenderMessage(message) {
  if (!isSystemMessage(message)) {
    return true
  }

  const content = getMessageContent(message).toLowerCase()

  return !(
    content.includes('joined to chat room') ||
    content.includes('joined chat room')
  )
}

function isOutgoingMessage(message, currentUserId) {
  if (!currentUserId) {
    return false
  }

  return getMessageSenderId(message) === String(currentUserId)
}

function getMessageSenderLabel(message, currentUserId, clientName) {
  if (isSystemMessage(message)) {
    return 'Sistema'
  }

  if (isOutgoingMessage(message, currentUserId)) {
    return 'Você'
  }

  return clientName || 'Cliente'
}

function formatMessageTime(message) {
  const rawDate = getMessageTimestamp(message)

  if (!rawDate) {
    return '--:--'
  }

  const date = new Date(rawDate)

  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatRelativeTime(rawDate) {
  if (!rawDate) {
    return '--'
  }

  const date = new Date(rawDate)

  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0)

  if (diffMinutes < 1) {
    return 'Agora'
  }

  if (diffMinutes < 60) {
    return `Há ${diffMinutes} min`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `Há ${diffHours} h`
  }

  const diffDays = Math.floor(diffHours / 24)

  return `Há ${diffDays} d`
}

function shortId(value) {
  if (!value) {
    return '--'
  }

  return String(value).slice(-6).toUpperCase()
}

function isViewportNearBottom(element, threshold = 120) {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
}

function getInputPlaceholder({
  activeConversation,
  connectionStatus,
  isAssignedToCurrentUser,
  isAssignedToAnotherAgent,
  activeConversationIsAvailable,
  activeConversationClosed
}) {
  if (!activeConversation) {
    return 'Selecione um atendimento...'
  }

  if (activeConversationClosed) {
    return 'Atendimento encerrado...'
  }

  if (activeConversationIsAvailable && !isAssignedToCurrentUser) {
    return 'Assuma o atendimento para responder...'
  }

  if (isAssignedToAnotherAgent) {
    return 'Este atendimento está com outro atendente...'
  }

  if (!isAssignedToCurrentUser) {
    return 'Somente o responsável pode enviar mensagens...'
  }

  if (connectionStatus !== 'connected') {
    return 'Aguardando conexão WebSocket...'
  }

  return 'Digite uma mensagem...'
}

function getFooterHelperText({
  activeConversation,
  isAssignedToCurrentUser,
  isAssignedToAnotherAgent,
  activeConversationIsAvailable,
  activeConversationClosed
}) {
  if (!activeConversation) {
    return ''
  }

  if (activeConversationClosed) {
    return 'Este atendimento está encerrado. Novas mensagens estão bloqueadas.'
  }

  if (activeConversationIsAvailable && !isAssignedToCurrentUser) {
    return 'Assuma o atendimento para iniciar a conversa em tempo real.'
  }

  if (isAssignedToAnotherAgent) {
    return 'Este atendimento foi atribuído a outro atendente.'
  }

  if (!isAssignedToCurrentUser) {
    return 'Somente o responsável pelo atendimento pode responder em tempo real.'
  }

  return ''
}

function getConnectionPresentation(status) {
  switch (status) {
    case 'connected':
      return {
        label: 'Ao vivo',
        containerClass: 'bg-green-100 text-green-700',
        dotClass: 'bg-green-500'
      }

    case 'connecting':
      return {
        label: 'Conectando',
        containerClass: 'bg-yellow-100 text-yellow-700',
        dotClass: 'bg-yellow-500'
      }

    case 'error':
      return {
        label: 'Erro',
        containerClass: 'bg-red-100 text-red-700',
        dotClass: 'bg-red-500'
      }

    case 'disconnected':
      return {
        label: 'Desconectado',
        containerClass: 'bg-gray-200 text-gray-700',
        dotClass: 'bg-gray-500'
      }

    default:
      return {
        label: 'Inativo',
        containerClass: 'bg-gray-200 text-gray-700',
        dotClass: 'bg-gray-400'
      }
  }
}

function ConversationSectionDivider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-gray-300" />

      <div className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 shadow-sm">
        <User size={14} className="text-[#D14D1D]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          Início do atendimento humano
        </span>
      </div>

      <div className="h-px flex-1 bg-gray-300" />
    </div>
  )
}

function getFilterCount(filterKey, counts) {
  if (filterKey === 'queue') {
    return counts.queueCount
  }

  if (filterKey === 'mine') {
    return counts.myCurrentCount
  }

  return counts.totalCurrentCount
}

function getEmptySidebarText(viewFilter) {
  if (viewFilter === 'queue') {
    return 'Nenhum atendimento disponível na fila.'
  }

  if (viewFilter === 'mine') {
    return 'Você não possui atendimentos atuais.'
  }

  return 'Nenhum atendimento atual disponível.'
}