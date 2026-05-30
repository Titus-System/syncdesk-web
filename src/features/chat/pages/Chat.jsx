import { useEffect, useMemo, useRef, useState } from 'react'
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
  AlertCircle,
  Send,
  Hand,
  Flag,
  Mail
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useActiveConversationsQuery } from '@/features/chat/hooks/useActiveConversationsQuery'
import { useGetPaginatedMessages } from '@/features/chat/hooks/useGetPaginatedMessages'
import { useLiveChatWebSocket } from '@/features/chat/hooks/useLiveChatWebSocket'
import { useAttendanceQuery } from '@/features/chat/hooks/useAttendanceQuery'
import { decodeJwtPayload } from '@/shared/utils/jwt'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { matchesConversationSearch } from '@/features/chat/utils/searchConversations'

const VIEW_FILTERS = [
  { key: 'mine', label: 'Meus atuais'    },
  { key: 'all',  label: 'Todos os atuais' },
]

export default function Chat() {
  const navigate     = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const authUser     = useAuthStore((state) => state.user)
  const accessToken  = useAuthStore((state) => state.accessToken)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const [search,           setSearch          ] = useState('')
  const [selectedChatId,   setSelectedChatId  ] = useState(null)
  const [messageInput,     setMessageInput    ] = useState('')
  const [viewFilter,       setViewFilter      ] = useState('mine')

  const menuRef             = useRef(null)
  const messagesViewportRef = useRef(null)

  const debouncedSearch = useDebouncedValue(search, 300)
  const tokenPayload    = useMemo(() => decodeJwtPayload(accessToken), [accessToken])

  const currentUserId    = String(authUser?.id ?? tokenPayload?.sub ?? '')
  const currentRoleNames = useMemo(() => getCurrentRoleNames(authUser, tokenPayload), [authUser, tokenPayload])
  const isAdmin          = currentRoleNames.includes('admin')

  const conversationsQuery = useActiveConversationsQuery('', { refetchInterval: 5000 })
  const allConversations   = conversationsQuery.data ?? []

  const currentConversations = useMemo(
    () => allConversations.filter((c) => !c?.needs_assume),
    [allConversations]
  )
  const myCurrentConversations = useMemo(
    () => currentConversations.filter((c) => isConversationAssignedToUser(c, currentUserId)),
    [currentConversations, currentUserId]
  )
  const sourceConversations = useMemo(
    () => viewFilter === 'all' ? currentConversations : myCurrentConversations,
    [currentConversations, myCurrentConversations, viewFilter]
  )
  const visibleConversations = useMemo(
    () => sourceConversations.filter((c) => matchesConversationSearch(c, debouncedSearch)),
    [sourceConversations, debouncedSearch]
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuPerfilAberto(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const assignedAgentId          = getAssignedAgentId(activeConversation)
  const isAssignedToCurrentUser  = Boolean(activeConversation && assignedAgentId && currentUserId && assignedAgentId === currentUserId)
  const isAssignedToAnotherAgent = Boolean(activeConversation && assignedAgentId && currentUserId && assignedAgentId !== currentUserId)

  const canReadHistory = Boolean(activeConversation?.ticket_id && (isAssignedToCurrentUser || isAdmin))
  const canConnectLive = Boolean(activeConversation?.chat_id && activeConversation?.can_join_live && isAssignedToCurrentUser)

  const attendanceQuery = useAttendanceQuery(activeConversation?.triage_id)

  const paginatedMessagesQuery = useGetPaginatedMessages(activeConversation?.ticket_id ?? null, 20, { enabled: canReadHistory })

  const historyMessages = useMemo(() => {
    const pages = paginatedMessagesQuery.data?.pages ?? []
    return dedupeMessages(pages.slice().reverse().flatMap((page) => page?.messages ?? []))
  }, [paginatedMessagesQuery.data])

  const { connectionStatus, liveMessages, sendMessage, lastError } = useLiveChatWebSocket({
    chatId:  activeConversation?.chat_id ?? null,
    enabled: canConnectLive,
  })

  const triageTimeline = useMemo(() => {
    const triage = attendanceQuery.data?.triage ?? []
    return triage.flatMap((item, index) => {
      const timeline = [{ id: `triage-question-${index}`, kind: 'triage-bot',  content: item.question }]
      if (item.answer_text || item.answer_value) {
        timeline.push({ id: `triage-answer-${index}`, kind: 'triage-user', content: item.answer_text || item.answer_value })
      }
      return timeline
    })
  }, [attendanceQuery.data])

  const messages = useMemo(
    () => dedupeMessages([...historyMessages, ...liveMessages]).filter(shouldRenderMessage),
    [historyMessages, liveMessages]
  )

  const canSendMessage = Boolean(canConnectLive && isAssignedToCurrentUser && connectionStatus === 'connected')

  useEffect(() => { setMessageInput('') }, [activeChatId])
  useEffect(() => {
    if (!messagesViewportRef.current) return
    messagesViewportRef.current.scrollTop = messagesViewportRef.current.scrollHeight
  }, [activeChatId, liveMessages.length, triageTimeline.length])

  function handleLogout() { clearSession(); navigate('/login', { replace: true }) }

  function handleSendMessage() {
    const content = messageInput.trim()
    if (!activeConversation || !content || !canSendMessage) return
    const sent = sendMessage({ type: 'text', content })
    if (sent) setMessageInput('')
  }

  const totalCurrentCount = currentConversations.length
  const myCurrentCount    = myCurrentConversations.length

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
            <span className="text-white/50 font-medium text-sm pb-1">Histórico de Logs</span>
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
        <aside className="w-[260px] flex flex-col shrink-0 gap-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-[var(--accent-text)]" />
            <h2 className="font-bold text-xs text-white/90 uppercase tracking-wide">Sessões Ativas</h2>
            <span className="ml-auto bg-[var(--accent)] text-[9px] px-2 py-0.5 rounded-full text-white font-bold tracking-wider">
              {totalCurrentCount} Live
            </span>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1.5 bg-black/20 p-1 rounded-xl">
            {[{ key: 'mine', label: 'Todas' }, { key: 'all', label: 'Sinalizadas' }, { key: 'errors', label: 'Erros' }].map((tab) => (
              <button key={tab.key} type="button" onClick={() => { if (tab.key !== 'errors') setViewFilter(tab.key) }}
                className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                  (tab.key === 'errors' ? false : viewFilter === tab.key) ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-0.5">
            {conversationsQuery.isLoading && <SidebarInfoBox text="Carregando atendimentos..." />}
            {conversationsQuery.isError   && <SidebarInfoBox text="Não foi possível carregar os atendimentos." error />}

            {!conversationsQuery.isLoading && !conversationsQuery.isError && !sourceConversations.length && (
              <SidebarInfoBox text={viewFilter === 'mine' ? 'Você não possui atendimentos atuais.' : 'Nenhum atendimento atual.'} />
            )}

            {visibleConversations.map((conversation) => (
              <SessionItem
                key={getConversationId(conversation)}
                active={getConversationId(conversation) === activeChatId}
                user={getConversationUserName(conversation)}
                message={getConversationLastMessage(conversation)}
                time={getConversationTimeLabel(conversation)}
                status={getConversationStatusLabel(conversation, currentUserId)}
                onClick={() => setSelectedChatId(getConversationId(conversation))}
              />
            ))}
          </div>
        </aside>

        {/* Main chat */}
        <main className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-[var(--bg-page)] border border-white/5">
          {/* Chat header */}
          <div className="bg-[var(--accent)] px-5 py-4 flex items-center gap-3 shrink-0 rounded-t-2xl">
            <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center shrink-0">
              <User size={20} className="text-[var(--accent-text)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h3 className="text-white font-bold text-base truncate">
                  {activeConversation ? getConversationUserName(activeConversation) : 'Nenhum atendimento selecionado'}
                </h3>
                {activeConversation && (
                  <span className="bg-white/20 text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-white/20">
                    Autenticado
                  </span>
                )}
                {activeConversation && <ConnectionBadge status={connectionStatus} disabled={!canConnectLive} />}
              </div>
              <p className="text-white/80 text-[11px] truncate mt-0.5 font-medium">
                {activeConversation
                  ? `ID da Sessão: ${activeConversation.chat_id ?? 'sess_902130'} | Localização: Nova York, EUA`
                  : 'Selecione um atendimento para visualizar detalhes'}
              </p>
            </div>
            {activeConversation && (
              <div className="flex items-center gap-2.5 shrink-0">
                <button type="button"
                  className="text-xs font-bold bg-white text-[var(--accent-text)] px-4 py-2.5 rounded-xl shadow-sm hover:bg-white/90 transition-all flex items-center gap-2">
                  <Hand size={14} /> Intervenção Manual
                </button>
                <button type="button"
                  className="text-xs font-bold bg-white text-[var(--accent-text)] px-4 py-2.5 rounded-xl shadow-sm hover:bg-white/90 transition-all flex items-center gap-2">
                  <Flag size={14} /> Sinalizar Sessão
                </button>
              </div>
            )}
          </div>

          {/* Messages viewport */}
          <div ref={messagesViewportRef} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 bg-[var(--bg-page)] relative">
            {!activeConversation && !conversationsQuery.isLoading && (
              <EmptyPanel text="Selecione um atendimento para visualizar a conversa." />
            )}

            {activeConversation && (
              <div className="text-center my-4">
                <span className="bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)] text-[9px] font-bold uppercase px-4 py-1.5 rounded-full tracking-wider">
                  YESTERDAY, 14:20
                </span>
              </div>
            )}

            {activeConversation && Boolean(triageTimeline.length) && (
              <div className="mb-4">
                <div className="text-center text-[9px] font-bold uppercase text-[var(--text-faint)] mb-3">Histórico da triagem</div>
                <div className="flex flex-col gap-3">
                  {triageTimeline.map((item) => <TriageBubble key={item.id} item={item} />)}
                </div>
              </div>
            )}

            {activeConversation && attendanceQuery.isLoading && <PanelText text="Carregando histórico da triagem..." />}

            {activeConversation && !canReadHistory && (
              <NoticeCard text="Este atendimento está com outro atendente. Apenas o responsável consegue abrir o histórico completo do chat." />
            )}

            {activeConversation && canReadHistory && (
              <>
                {paginatedMessagesQuery.hasNextPage && (
                  <div className="flex justify-center">
                    <button type="button" onClick={() => paginatedMessagesQuery.fetchNextPage()}
                      disabled={paginatedMessagesQuery.isFetchingNextPage}
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
                    clientId={activeConversation?.client_id ?? activeConversation?.clientId}
                    clientName={activeConversation?.client_name}
                  />
                ))}
              </>
            )}
          </div>

          {/* Input bar */}
          <div className="p-4 bg-[var(--accent)] rounded-b-2xl">
            <div className="bg-[var(--bg-card)] rounded-xl p-1.5 flex items-center gap-2 shadow-md">
              <input type="text" value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage() } }}
                disabled={!canSendMessage}
                placeholder={getInputPlaceholder({ activeConversation, connectionStatus, isAssignedToCurrentUser, isAssignedToAnotherAgent })}
                className="flex-1 px-4 py-2.5 text-sm text-[var(--text-primary)] bg-transparent focus:outline-none placeholder:text-[var(--text-faint)]" />
              
              <button type="button" disabled className="p-2 text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors">
                <Paperclip size={20} />
              </button>
              <button type="button" onClick={handleSendMessage}
                disabled={!canSendMessage || !messageInput.trim()}
                className="bg-[var(--accent)] disabled:bg-[var(--accent)]/50 text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2">
                Enviar
              </button>
            </div>
            {(lastError || (activeConversation && !isAssignedToCurrentUser)) && (
              <p className="text-center text-[10px] text-white/80 font-medium mt-3 tracking-wide">
                {lastError || getFooterHelperText({ activeConversation, isAssignedToAnotherAgent })}
              </p>
            )}
          </div>
        </main>

        {/* Right shortcuts */}
        <aside className="w-[180px] shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <LayoutGrid size={14} className="text-[var(--accent-text)]" />
            <h2 className="font-bold text-xs text-white/90">Atalhos</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <QuickAction icon={<History size={20} />} label="Full Logs" />
            <QuickAction icon={<Mail size={20} />} label="Transfer" />
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SidebarInfoBox({ text, error = false }) {
  return (
    <div className={`p-3.5 rounded-xl text-xs ${error ? 'text-orange-300 bg-black/30' : 'text-white/60 bg-black/20'}`}>
      {error && <AlertCircle size={12} className="mb-1 text-orange-400" />}
      {text}
    </div>
  )
}

function EmptyPanel({ text }) {
  return (
    <div className="h-full flex items-center justify-center text-center text-[var(--text-faint)] text-sm px-6">{text}</div>
  )
}

function PanelText({ text, error = false }) {
  return <div className={`text-center text-sm ${error ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>{text}</div>
}

function NoticeCard({ text }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-5 text-center text-[var(--text-muted)] text-sm shadow-sm">{text}</div>
  )
}

function SessionItem({ active, user, message, time, status, onClick }) {
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
      </div>
      <p className={`text-[10px] line-clamp-1 mb-2 ${active ? 'text-white/80' : 'text-white/50'}`}>"{message}"</p>
      <div className={`flex justify-between items-center ${active ? 'text-white/70' : 'text-white/40'}`}>
        <span className="text-[9px] font-bold">{time}</span>
        <ArchiveRestore size={12} />
      </div>
    </button>
  )
}

function QuickAction({ icon, label }) {
  return (
    <button type="button"
      className="bg-[var(--bg-card)] text-[var(--accent-text)] flex flex-col items-center justify-center p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform group w-full border border-[var(--border-subtle)]">
      <div className="text-[var(--accent-text)] mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-tight opacity-90 text-[var(--text-primary)]">{label}</span>
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

function ChatMessageBubble({ message, currentUserId, clientId, clientName }) {
  const outgoing     = isOutgoingMessage(message, currentUserId, clientId)
  const systemMsg    = isSystemMessage(message)
  const content      = getMessageContent(message)
  const time         = formatMessageTime(message)
  const senderLabel  = getMessageSenderLabel(message, currentUserId, clientId, clientName)

  if (systemMsg) {
    return (
      <div className="self-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)] bg-[var(--bg-card)] rounded-full px-4 py-1.5 border border-[var(--border-default)] shadow-sm">{content}</div>
    )
  }

  // Verifica se quem enviou a mensagem (da direita) foi o robô para usar um ícone diferente
  const isBot = outgoing && (message?.is_bot || message?.role === 'bot' || String(message?.sender_name).toLowerCase().includes('bot') || String(message?.sender_type).toLowerCase() === 'bot')

  return (
    <div className={`flex gap-3 max-w-[80%] ${outgoing ? 'self-end flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 mt-auto mb-2 ${outgoing ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card)] border border-[var(--border-default)]'}`}>
        {outgoing ? (isBot ? <Bot size={15} /> : <User size={15} />) : <User size={15} className="text-[var(--text-faint)]" />}
      </div>
      <div className={`flex flex-col ${outgoing ? 'items-end' : ''}`}>
        <div className={`relative p-4 pb-8 rounded-2xl text-sm leading-relaxed shadow-sm min-w-[200px] ${
          outgoing 
            ? 'bg-[var(--bg-sidebar)] text-white rounded-br-sm border border-[var(--border-strong)]/20' 
            : 'bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border-default)]'
        }`}>
          {content}
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
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider hidden`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${presentation.dotClass}`} />
      {presentation.label}
    </span>
  )
}

// ─── utility stubs (same logic as original) ──────────────────────────────────

function getCurrentRoleNames(authUser, tokenPayload) {
  const fromUserObjects = Array.isArray(authUser?.roles)
    ? authUser.roles.map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean) : []
  const fromUserNames = Array.isArray(authUser?.role_names) ? authUser.role_names : []
  const fromToken     = Array.isArray(tokenPayload?.roles)  ? tokenPayload.roles  : []
  return [...fromUserObjects, ...fromUserNames, ...fromToken].map((r) => String(r).toLowerCase())
}
function getConversationId(c)           { return c?.chat_id ?? c?.id ?? null }
function getAssignedAgentId(c) {
  const raw = c?.assigned_agent_id ?? c?.assignedAgentId ?? c?.agent_id ?? c?.agentId
  return raw != null ? String(raw) : null
}
function isConversationAssignedToUser(c, uid) {
  if (!c || !uid) return false
  return getAssignedAgentId(c) === String(uid)
}
function getConversationUserName(c)     { return c?.client_name  ?? c?.clientName   ?? 'Usuário' }
function getConversationLastMessage(c)  { return c?.last_message ?? c?.lastMessage  ?? '—'       }
function getConversationTimeLabel(c) {
  const d = c?.last_message_at ?? c?.created_at
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Agora'
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h`
}
function getConversationStatusLabel(c, uid) {
  if (!getAssignedAgentId(c))                               return null
  if (isConversationAssignedToUser(c, uid))                 return 'Live'
  return 'IDLE'
}
function getSessionStatusClass(status, active) {
  if (status === 'Live' && !active) return 'text-orange-400 bg-transparent'
  if (status === 'Live' && active) return 'text-white bg-white/20'
  return 'text-white/40'
}
function getConversationOwnershipLabel({ activeConversation, isAssignedToCurrentUser, isAssignedToAnotherAgent }) {
  if (isAssignedToCurrentUser)  return 'Atribuído a mim'
  if (isAssignedToAnotherAgent) return 'Outro agente'
  return 'Não atribuído'
}
function getConnectionPresentation(status) {
  const map = {
    connected:    { containerClass: 'bg-green-100 text-green-700',  dotClass: 'bg-green-500',  label: 'Conectado'    },
    connecting:   { containerClass: 'bg-yellow-100 text-yellow-700',dotClass: 'bg-yellow-400', label: 'Conectando'   },
    disconnected: { containerClass: 'bg-red-100 text-red-600',      dotClass: 'bg-red-500',    label: 'Desconectado' },
    idle:         { containerClass: 'bg-[var(--bg-muted)] text-[var(--text-muted)]',    dotClass: 'bg-gray-400',   label: 'Inativo'      },
  }
  return map[status] || map.idle
}
function getInputPlaceholder({ activeConversation, connectionStatus, isAssignedToCurrentUser, isAssignedToAnotherAgent }) {
  if (!activeConversation)       return 'Selecione um atendimento...'
  if (isAssignedToAnotherAgent)  return 'Atendimento em outro agente...'
  if (!isAssignedToCurrentUser)  return 'Você deve clicar em "Intervenção Manual" para assumir...'
  if (connectionStatus !== 'connected') return 'Aguardando conexão...'
  return 'Assuma o controle e digite uma mensagem...'
}
function getFooterHelperText({ activeConversation, isAssignedToAnotherAgent }) {
  if (!activeConversation)       return ''
  if (isAssignedToAnotherAgent)  return 'Atendimento em outro agente'
  return 'Você deve clicar em "Intervenção Manual" para assumir o controle desta sessão.'
}
function getMessageId(m)      { return m?.id ?? m?.message_id ?? m?.msg_id ?? Math.random().toString() }

function isOutgoingMessage(m, uid, clientId) {
  const senderId = String(m?.sender_id ?? m?.senderId ?? '')
  
  // 1. Se for o cliente, fica na esquerda (incoming = false)
  if (clientId && senderId === String(clientId)) return false
  if (m?.sender_type === 'client' || m?.role === 'user' || m?.role === 'client') return false

  // 2. Se for o atendente atual, direita (outgoing = true)
  if (senderId === String(uid)) return true

  // 3. Se for URA/Bot, direita
  if (m?.is_bot || m?.role === 'bot' || m?.sender_type === 'bot' || senderId === 'bot') return true
  
  // (Fallback) Se o nome remeter a um bot
  const senderName = String(m?.sender_name ?? m?.senderName ?? '').toLowerCase()
  if (senderName.includes('bot') || senderName.includes('ura') || senderName.includes('sync')) return true

  // 4. Se for outro atendente, direita também
  if (m?.sender_type === 'agent' || m?.role === 'agent') return true

  // Default: assume que não é o atendente nem a URA, então joga pro lado do cliente (esquerda)
  return false
}

function isSystemMessage(m)   { return m?.type === 'system' || m?.kind === 'system' }
function getMessageContent(m) { return m?.content ?? m?.text ?? m?.message ?? '' }
function formatMessageTime(m) {
  const d = m?.created_at ?? m?.timestamp ?? m?.time
  if (!d) return ''
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function getMessageSenderLabel(m, uid, clientId, clientName) {
  const senderId = String(m?.sender_id ?? m?.senderId ?? '')
  
  if (senderId === String(uid)) return 'Você'
  
  // Retorna nome do bot se aplicável
  if (m?.is_bot || m?.role === 'bot' || m?.sender_type === 'bot' || String(m?.sender_name).toLowerCase().includes('bot')) {
    return m?.sender_name || 'Bot / URA'
  }

  // Identifica outros suportes
  if (m?.sender_type === 'agent' || m?.role === 'agent') {
    return m?.sender_name || 'Outro Suporte'
  }

  // Retorna o cliente
  return clientName || m?.sender_name || 'Cliente'
}

function dedupeMessages(msgs) {
  const seen = new Set()
  return msgs.filter((m) => { const id = getMessageId(m); if (seen.has(id)) return false; seen.add(id); return true })
}
function shouldRenderMessage(m) { return Boolean(getMessageContent(m)) }
function shortId(id) { return id ? `#${String(id).slice(-5).toUpperCase()}` : '—' }