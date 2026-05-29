import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Ticket,
  MessageSquare,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  Hand,
  Settings,
  Lock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useTicketsQuery } from '@/features/ticket/hooks/useTicketsQuery'
import { useTakeTicketMutation } from '@/features/ticket/hooks/useTakeTicketMutation'
import { useActiveConversationsQuery } from '@/features/chat/hooks/useActiveConversationsQuery'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { decodeJwtPayload } from '@/shared/utils/jwt'

const PAGE_SIZE = 10
const FETCH_LIMIT = 100

const VIEW_OPTIONS = [
  { value: 'queue', label: 'Fila aberta' },
  { value: 'mine', label: 'Meus chamados' },
  { value: 'all', label: 'Todos' }
]

export default function Chamados() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const currentUser = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const [search, setSearch] = useState('')
  const [viewFilter, setViewFilter] = useState('queue')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [pendingTicketId, setPendingTicketId] = useState(null)
  const [page, setPage] = useState(1)

  const menuPerfilRef = useRef(null)
  const debouncedSearch = useDebouncedValue(search, 300)

  const normalizedSearch = debouncedSearch.trim().toLowerCase()

  const tokenPayload = useMemo(() => {
    if (!accessToken) {
      return null
    }

    return decodeJwtPayload(accessToken)
  }, [accessToken])

  const currentUserId = String(currentUser?.id ?? tokenPayload?.sub ?? '')
  const querySource = viewFilter === 'queue' ? 'queue' : 'all'

  const ticketsQuery = useTicketsQuery(
    {
      source: querySource,
      page: 1,
      page_size: FETCH_LIMIT,
      fetchAll: true,
      paginated: true,
      unassigned_only: viewFilter === 'queue' ? true : undefined
    },
    {
      refetchInterval: 15000,
      staleTime: 10000,
      retry: false
    }
  )

  const activeConversationsQuery = useActiveConversationsQuery('', {
    refetchInterval: 15000,
    staleTime: 10000,
    retry: false
  })

  const takeTicketMutation = useTakeTicketMutation()

  const ticketItems = useMemo(() => {
    return Array.isArray(ticketsQuery.data?.items) ? ticketsQuery.data.items : []
  }, [ticketsQuery.data])

  const conversationByTicketId = useMemo(() => {
    const map = new Map()
    const conversations = activeConversationsQuery.data ?? []

    for (const conversation of conversations) {
      if (conversation?.ticket_id) {
        map.set(String(conversation.ticket_id), conversation)
      }
    }

    return map
  }, [activeConversationsQuery.data])

  const enrichedTickets = useMemo(() => {
    const preserveQueueAvailability = viewFilter === 'queue'

    return ticketItems.map((ticket) =>
      enrichTicketWithConversation(
        ticket,
        conversationByTicketId.get(String(ticket?.id)),
        preserveQueueAvailability
      )
    )
  }, [ticketItems, conversationByTicketId, viewFilter])

  const filteredTickets = useMemo(() => {
    return enrichedTickets
      .filter((ticket) => {
        if (viewFilter === 'queue') {
          return isQueueTicketVisible(ticket)
        }

        if (viewFilter === 'mine') {
          return getAssignedAgentId(ticket) === currentUserId
        }

        return true
      })
      .filter((ticket) => {
        if (!normalizedSearch) {
          return true
        }

        return [
          getTicketClientName(ticket),
          getTicketClientEmail(ticket),
          getTicketProduct(ticket),
          getTicketDescription(ticket),
          getAssignedAgentName(ticket, currentUserId),
          getTicketStatusLabel(getTicketStatus(ticket)),
          getTicketCriticalityLabel(ticket?.criticality),
          getTicketTypeLabel(ticket?.type)
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      })
      .sort((a, b) => {
        const dateA = new Date(a?.creation_date ?? 0).getTime()
        const dateB = new Date(b?.creation_date ?? 0).getTime()

        return dateB - dateA
      })
  }, [enrichedTickets, normalizedSearch, viewFilter, currentUserId])

  const totalTickets = filteredTickets.length
  const totalPages = Math.max(Math.ceil(totalTickets / PAGE_SIZE), 1)

  const visibleTickets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredTickets.slice(start, start + PAGE_SIZE)
  }, [filteredTickets, page])

  useEffect(() => {
    setPage(1)
  }, [viewFilter, normalizedSearch])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuPerfilRef.current && !menuPerfilRef.current.contains(event.target)) {
        setMenuPerfilAberto(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined
    }

    const timeout = setTimeout(() => {
      setFeedbackMessage('')
    }, 4000)

    return () => clearTimeout(timeout)
  }, [feedbackMessage])

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  function handleViewFilterChange(event) {
    setViewFilter(event.target.value)
    setPage(1)
  }

  function handleSearchChange(event) {
    setSearch(event.target.value)
    setPage(1)
  }

  async function handleTakeTicket(ticket) {
    const ticketId = ticket?.id

    if (!ticketId || !isTicketAvailableInQueue(ticket)) {
      setFeedbackMessage('Este chamado não está disponível para assumir.')
      return
    }

    try {
      setPendingTicketId(ticketId)

      await takeTicketMutation.mutateAsync(ticketId)

      await Promise.allSettled([
        ticketsQuery.refetch(),
        activeConversationsQuery.refetch()
      ])

      setFeedbackMessage('Chamado atribuído com sucesso.')
      setViewFilter('mine')
      setPage(1)
    } catch (error) {
      const status = error?.response?.status

      if (status === 409) {
        setFeedbackMessage('Este chamado já foi assumido ou não está mais disponível na fila.')
      } else {
        setFeedbackMessage(
          error?.response?.data?.detail || 'Não foi possível assumir o chamado.'
        )
      }

      await Promise.allSettled([
        ticketsQuery.refetch(),
        activeConversationsQuery.refetch()
      ])
    } finally {
      setPendingTicketId(null)
    }
  }

  const isLoading = ticketsQuery.isLoading
  const isError = ticketsQuery.isError

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden text-[#1E293B]">
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <Ticket size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              SyncDesk
            </span>
          </div>

          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => navigate('/')} />
            <NavItem icon={<Users size={16} />} label="Usuários" onClick={() => navigate('/usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" active onClick={() => navigate('/chamados')} />
            <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => navigate('/chat')} />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <div className="relative" ref={menuPerfilRef}>
              <button
                type="button"
                onClick={() => setMenuPerfilAberto((value) => !value)}
                className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <UserIcon size={20} className="text-white/90" />
              </button>

              {menuPerfilAberto && (
                <div className="absolute right-0 top-12 w-60 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                  <div className="px-4 py-3 border-b border-white/10 mb-1">
                    <p className="text-sm font-bold text-white truncate">
                      {currentUser?.name || 'Usuário'}
                    </p>
                    <p className="text-[11px] text-white/50 truncate">
                      {currentUser?.email || ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuPerfilAberto(false)
                      navigate('/configuracoes')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-white/70 hover:bg-white/10 rounded-xl transition-colors uppercase"
                  >
                    <Settings size={14} />
                    Configurações
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase"
                  >
                    <LogOut size={14} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="flex justify-between items-end mb-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Chamados
              </h1>
              <p className="text-sm text-gray-500 mt-1.5 font-medium opacity-60">
                Visualize a fila, assuma chamados e acompanhe o andamento.
              </p>
            </div>
          </div>

          <div className="w-full h-[1.5px] bg-gray-300/40 mb-6" />

          {feedbackMessage && (
            <div className="mb-6 rounded-xl bg-[#FFF4EE] border border-[#BD3B0F]/20 px-4 py-3 text-sm text-[#7A2E12] font-medium">
              {feedbackMessage}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/60">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Buscar por cliente, produto, descrição ou responsável"
                    className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-700 outline-none focus:border-[#BD3B0F]"
                  />
                </div>

                <div className="relative">
                  <Filter
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <select
                    value={viewFilter}
                    onChange={handleViewFilterChange}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-700 outline-none focus:border-[#BD3B0F]"
                  >
                    {VIEW_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-20 text-center text-gray-400 italic font-semibold">
                Carregando chamados...
              </div>
            ) : isError ? (
              <div className="p-20 text-center flex flex-col items-center gap-4 text-red-500 font-semibold">
                <ShieldAlert size={40} />
                <span>Erro ao carregar chamados.</span>
              </div>
            ) : !visibleTickets.length ? (
              <div className="p-16 text-center text-gray-500 font-medium">
                Nenhum chamado encontrado para os filtros selecionados.
              </div>
            ) : (
              <>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-xs text-gray-500 font-semibold">
                      <th className="py-4 px-6">Cliente</th>
                      <th className="py-4 px-6">Produto</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Responsável</th>
                      <th className="py-4 px-6 text-right">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {visibleTickets.map((ticket) => {
                      const ticketId = ticket.id
                      const ticketStatus = getTicketStatus(ticket)
                      const assignedAgentId = getAssignedAgentId(ticket)
                      const assignedAgentName = getAssignedAgentName(ticket, currentUserId)
                      const isCurrentUserTicket = assignedAgentId === currentUserId
                      const isAvailable = isTicketAvailableInQueue(ticket)
                      const isPending = pendingTicketId === ticketId

                      return (
                        <tr key={ticketId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {getTicketClientName(ticket)}
                              </p>
                              <p className="text-xs text-gray-500 font-medium line-clamp-1">
                                {getTicketDescription(ticket)}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium mt-1">
                                {getTicketClientEmail(ticket)}
                              </p>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900">
                                {getTicketProduct(ticket)}
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium">
                                {getTicketTypeLabel(ticket.type)} • {getTicketCriticalityLabel(ticket.criticality)}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <StatusBadge status={ticketStatus} />
                          </td>

                          <td className="py-4 px-6">
                            <ResponsibleCell
                              assignedAgentId={assignedAgentId}
                              assignedAgentName={assignedAgentName}
                              isCurrentUserTicket={isCurrentUserTicket}
                            />
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {isAvailable && (
                                <button
                                  type="button"
                                  onClick={() => handleTakeTicket(ticket)}
                                  disabled={isPending}
                                  className="bg-[#BD3B0F] hover:bg-[#9a2f0d] disabled:bg-[#BD3B0F]/60 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-all"
                                >
                                  {isPending ? <LoaderInline /> : <Hand size={14} />}
                                  {isPending ? 'Assumindo...' : 'Pegar chamado'}
                                </button>
                              )}

                              {!isAvailable && isCurrentUserTicket && (
                                <button
                                  type="button"
                                  disabled
                                  className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-2 cursor-not-allowed"
                                >
                                  <CheckCircle2 size={14} />
                                  Você pegou
                                </button>
                              )}

                              {!isAvailable && assignedAgentId && !isCurrentUserTicket && (
                                <button
                                  type="button"
                                  disabled
                                  className="bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-2 cursor-not-allowed"
                                >
                                  <Lock size={14} />
                                  Bloqueado
                                </button>
                              )}

                              {!isAvailable && !assignedAgentId && isTicketTerminal(ticket) && (
                                <button
                                  type="button"
                                  disabled
                                  className="bg-gray-100 text-gray-500 border border-gray-200 text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-2 cursor-not-allowed"
                                >
                                  <Lock size={14} />
                                  Encerrado
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => navigate(`/chamados/${ticketId}/editar`)}
                                className="border border-gray-200 hover:border-[#BD3B0F] hover:text-[#BD3B0F] text-gray-500 text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
                              >
                                Abrir
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <PaginationControls
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalTickets}
                  visibleCount={visibleTickets.length}
                  onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
                  onNext={() => setPage((current) => Math.min(current + 1, totalPages))}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  visibleCount,
  onPrevious,
  onNext
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = totalItems === 0 ? 0 : Math.min(start + visibleCount - 1, totalItems)

  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
      <p className="text-xs font-medium text-gray-500">
        Mostrando {start} - {end} de {totalItems} chamados
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500">
            Página {page} de {totalPages}
          </span>

          <button
            type="button"
            onClick={onPrevious}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#BD3B0F] hover:text-[#BD3B0F] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
          >
            <ChevronLeft size={14} />
            Anterior
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#BD3B0F] hover:text-[#BD3B0F] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
          >
            Próxima
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

function enrichTicketWithConversation(ticket, conversation, preserveQueueAvailability = false) {
  if (!conversation) {
    return ticket
  }

  if (preserveQueueAvailability && ticket?.unassigned === true) {
    return {
      ...ticket,
      active_chat_id: conversation?.chat_id ?? null
    }
  }

  return {
    ...ticket,
    assigned_agent_id:
      ticket?.assigned_agent_id ??
      ticket?.assignedAgentId ??
      ticket?.assignee_id ??
      conversation?.assigned_agent_id ??
      conversation?.agent_id ??
      null,
    assigned_agent_name:
      ticket?.assigned_agent_name ??
      ticket?.assignedAgentName ??
      ticket?.assignee_name ??
      conversation?.assigned_agent_name ??
      conversation?.agent_name ??
      null,
    active_chat_id: conversation?.chat_id ?? null
  }
}

function getTicketStatus(ticket) {
  return String(ticket?.status ?? '').toLowerCase()
}

function getTicketStatusLabel(status) {
  const labelMap = {
    awaiting_assignment: 'Aguardando atribuição',
    open: 'Aberto',
    assigned: 'Atribuído',
    in_progress: 'Em andamento',
    waiting_for_customer: 'Aguardando cliente',
    waiting_customer: 'Aguardando cliente',
    waiting_for_provider: 'Aguardando fornecedor',
    waiting_for_validation: 'Aguardando validação',
    resolved: 'Resolvido',
    closed: 'Fechado',
    finished: 'Finalizado',
    cancelled: 'Cancelado'
  }

  return labelMap[status] || status || 'Sem status'
}

function getTicketClientName(ticket) {
  return ticket?.client?.name ?? 'Cliente'
}

function getTicketClientEmail(ticket) {
  return ticket?.client?.email ?? 'E-mail não informado'
}

function getTicketProduct(ticket) {
  return ticket?.product ?? 'Sem produto'
}

function getTicketDescription(ticket) {
  return ticket?.description ?? 'Sem descrição'
}

function getTicketTypeLabel(type) {
  const value = String(type ?? '').toLowerCase()

  const labelMap = {
    issue: 'Problema',
    question: 'Dúvida',
    request: 'Solicitação',
    incident: 'Incidente',
    access: 'Acesso',
    new_feature: 'Nova funcionalidade'
  }

  return labelMap[value] || type || 'Tipo não informado'
}

function getTicketCriticalityLabel(criticality) {
  const value = String(criticality ?? '').toLowerCase()

  const labelMap = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica'
  }

  return labelMap[value] || criticality || 'Sem criticidade'
}

function getAssignedAgentId(ticket) {
  const directValue =
    ticket?.assigned_agent_id ??
    ticket?.assignedAgentId ??
    ticket?.assignee_id ??
    ticket?.agent_id ??
    ticket?.agentId ??
    ticket?.current_agent?.agent_id ??
    ticket?.currentAgent?.agentId

  if (directValue != null) {
    return String(directValue)
  }

  const history = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []
  const latestActiveEntry = [...history].reverse().find((entry) => !entry?.exit_date)

  if (latestActiveEntry?.agent_id != null) {
    return String(latestActiveEntry.agent_id)
  }

  return null
}

function getAssignedAgentName(ticket, currentUserId) {
  const assignedAgentId = getAssignedAgentId(ticket)

  if (assignedAgentId && assignedAgentId === currentUserId) {
    return 'Você'
  }

  const directValue =
    ticket?.assigned_agent_name ??
    ticket?.assignedAgentName ??
    ticket?.assignee_name ??
    ticket?.agent_name ??
    ticket?.agentName ??
    ticket?.current_agent?.name ??
    ticket?.currentAgent?.name

  if (directValue) {
    return directValue
  }

  const history = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []
  const latestActiveEntry = [...history].reverse().find((entry) => !entry?.exit_date)

  return latestActiveEntry?.name ?? null
}

function isTicketTerminal(ticket) {
  const status = getTicketStatus(ticket)

  return ['finished', 'closed', 'cancelled', 'resolved'].includes(status)
}

function isQueueTicketVisible(ticket) {
  if (!ticket || isTicketTerminal(ticket)) {
    return false
  }

  if (ticket?.unassigned === true) {
    return true
  }

  const assignedAgentId = getAssignedAgentId(ticket)

  if (assignedAgentId) {
    return false
  }

  return ['awaiting_assignment', 'open'].includes(getTicketStatus(ticket))
}

function isTicketAvailableInQueue(ticket) {
  return isQueueTicketVisible(ticket)
}

function ResponsibleCell({ assignedAgentId, assignedAgentName, isCurrentUserTicket }) {
  if (!assignedAgentId) {
    return (
      <div className="flex flex-col">
        <span className="text-sm text-gray-900">
          Disponível na fila
        </span>
        <span className="text-[11px] text-gray-400 font-medium">
          Aguardando atendimento
        </span>
      </div>
    )
  }

  if (isCurrentUserTicket) {
    return (
      <div className="flex flex-col">
        <span className="text-sm text-green-700 font-semibold">
          Você
        </span>
        <span className="text-[11px] text-green-600 font-medium">
          Chamado atribuído a você
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-900">
        {assignedAgentName || 'Responsável atribuído'}
      </span>
      <span className="text-[11px] text-gray-400 font-medium">
        Já assumido
      </span>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${active
          ? 'bg-[#BD3B0F] text-white shadow-md'
          : 'text-white/60 hover:bg-white/10 hover:text-white'
        }`}
    >
      {icon}
      {label}
    </button>
  )
}

function StatusBadge({ status }) {
  const classMap = {
    awaiting_assignment: 'bg-orange-50 text-orange-700',
    open: 'bg-orange-50 text-orange-700',
    assigned: 'bg-sky-50 text-sky-700',
    in_progress: 'bg-blue-50 text-blue-700',
    waiting_for_customer: 'bg-yellow-50 text-yellow-700',
    waiting_customer: 'bg-yellow-50 text-yellow-700',
    waiting_for_provider: 'bg-yellow-50 text-yellow-700',
    waiting_for_validation: 'bg-purple-50 text-purple-700',
    resolved: 'bg-green-50 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
    finished: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700'
  }

  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full ${classMap[status] || 'bg-gray-100 text-gray-600'
        }`}
    >
      {getTicketStatusLabel(status)}
    </span>
  )
}

function LoaderInline() {
  return (
    <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
  )
}