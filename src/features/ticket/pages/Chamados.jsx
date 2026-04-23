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
  Hand
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useTicketsQuery } from '@/features/ticket/hooks/useTicketsQuery'
import { useTakeTicketMutation } from '@/features/ticket/hooks/useTakeTicketMutation'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'

const VIEW_OPTIONS = [
  { value: 'queue', label: 'Fila aberta' },
  { value: 'mine', label: 'Meus chamados' },
  { value: 'all', label: 'Todos' }
]

export default function Chamados() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const currentUser = useAuthStore((state) => state.user)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const [search, setSearch] = useState('')
  const [viewFilter, setViewFilter] = useState('queue')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [pendingTicketId, setPendingTicketId] = useState(null)

  const menuPerfilRef = useRef(null)

  const debouncedSearch = useDebouncedValue(search, 300)

  const ticketsQuery = useTicketsQuery(
    {},
    {
      refetchInterval: 5000
    }
  )

  const takeTicketMutation = useTakeTicketMutation()
  const tickets = ticketsQuery.data ?? []
  const currentUserId = String(currentUser?.id ?? '')

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
      return
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

  const filteredTickets = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase()

    return tickets
      .filter((ticket) => {
        const assignedAgentId = getAssignedAgentId(ticket)
        const isFinished = getTicketStatus(ticket) === 'finished'

        if (viewFilter === 'queue') {
          return !assignedAgentId && !isFinished
        }

        if (viewFilter === 'mine') {
          return assignedAgentId === currentUserId
        }

        return true
      })
      .filter((ticket) => {
        if (!normalizedSearch) {
          return true
        }

        return [
          getTicketClientName(ticket),
          getTicketProduct(ticket),
          getTicketDescription(ticket),
          getAssignedAgentName(ticket),
          getTicketStatusLabel(getTicketStatus(ticket))
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
  }, [tickets, debouncedSearch, viewFilter, currentUserId])

  async function handleTakeTicket(ticketId) {
    try {
      setPendingTicketId(ticketId)
      await takeTicketMutation.mutateAsync(ticketId)
      await ticketsQuery.refetch()
      setFeedbackMessage('Chamado atribuído com sucesso.')
    } catch (error) {
      setFeedbackMessage(
        error?.response?.data?.detail || 'Não foi possível assumir o chamado.'
      )
    } finally {
      setPendingTicketId(null)
    }
  }

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden text-[#1E293B]">
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <Ticket size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
          </div>

          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem
              icon={<LayoutDashboard size={16} />}
              label="Dashboard"
              onClick={() => navigate('/')}
            />
            <NavItem
              icon={<Users size={16} />}
              label="Usuários"
              onClick={() => navigate('/usuarios')}
            />
            <NavItem
              icon={<Ticket size={16} />}
              label="Chamados"
              active
              onClick={() => navigate('/chamados')}
            />
            <NavItem
              icon={<MessageSquare size={16} />}
              label="Chat"
              onClick={() => navigate('/chat')}
            />
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
                <div className="absolute right-0 top-12 w-48 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase"
                  >
                    <LogOut size={14} />
                    Sair da Conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="flex justify-between items-end mb-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Chamados</h1>
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
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
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
                    onChange={(event) => setViewFilter(event.target.value)}
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

            {ticketsQuery.isLoading ? (
              <div className="p-20 text-center text-gray-400 italic font-semibold">
                Carregando chamados...
              </div>
            ) : ticketsQuery.isError ? (
              <div className="p-20 text-center flex flex-col items-center gap-4 text-red-500 font-semibold">
                <ShieldAlert size={40} />
                <span>Erro ao carregar chamados.</span>
              </div>
            ) : !filteredTickets.length ? (
              <div className="p-16 text-center text-gray-500 font-medium">
                Nenhum chamado encontrado para os filtros selecionados.
              </div>
            ) : (
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
                  {filteredTickets.map((ticket) => {
                    const ticketId = ticket.id
                    const ticketStatus = getTicketStatus(ticket)
                    const assignedAgentId = getAssignedAgentId(ticket)
                    const assignedAgentName = getAssignedAgentName(ticket)
                    const buttonState = getTakeButtonState({
                      ticket,
                      currentUserId
                    })

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
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-900">
                            {getTicketProduct(ticket)}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <StatusBadge status={ticketStatus} />
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900">
                              {assignedAgentName || 'Disponível na fila'}
                            </span>
                            {assignedAgentId && (
                              <span className="text-[11px] text-gray-400 font-medium">
                                {assignedAgentId === currentUserId ? 'Atribuído a você' : 'Já assumido'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (buttonState.disabled) {
                                  return
                                }
                                handleTakeTicket(ticketId)
                              }}
                              disabled={buttonState.disabled}
                              className={`text-xs font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-all ${buttonState.variant === 'primary'
                                  ? 'bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white'
                                  : buttonState.variant === 'success'
                                    ? 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200 cursor-not-allowed'
                                } disabled:opacity-100`}
                            >
                              {pendingTicketId === ticketId ? (
                                <LoaderInline />
                              ) : (
                                <Hand size={14} />
                              )}
                              {pendingTicketId === ticketId ? 'Assumindo...' : buttonState.label}
                            </button>

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
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function getTicketStatus(ticket) {
  return String(ticket?.status ?? '').toLowerCase()
}

function getTicketStatusLabel(status) {
  const labelMap = {
    open: 'Aberto',
    in_progress: 'Em andamento',
    waiting_for_provider: 'Aguardando fornecedor',
    waiting_for_validation: 'Aguardando validação',
    finished: 'Finalizado'
  }

  return labelMap[status] || status
}

function getTicketClientName(ticket) {
  return ticket?.client?.name ?? 'Cliente'
}

function getTicketProduct(ticket) {
  return ticket?.product ?? 'Sem produto'
}

function getTicketDescription(ticket) {
  return ticket?.description ?? 'Sem descrição'
}

function getAssignedAgentId(ticket) {
  const directValue = ticket?.assigned_agent_id ?? ticket?.assignedAgentId
  if (directValue != null) {
    return String(directValue)
  }

  const history = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []
  const latestEntry = history.length ? history[history.length - 1] : null

  if (latestEntry?.agent_id != null) {
    return String(latestEntry.agent_id)
  }

  return null
}

function getAssignedAgentName(ticket) {
  const directValue = ticket?.assigned_agent_name ?? ticket?.assignedAgentName
  if (directValue) {
    return directValue
  }

  const history = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []
  const latestEntry = history.length ? history[history.length - 1] : null

  return latestEntry?.name ?? null
}

function getTakeButtonState({ ticket, currentUserId }) {
  const assignedAgentId = getAssignedAgentId(ticket)
  const status = getTicketStatus(ticket)

  if (status === 'finished') {
    return {
      label: 'Finalizado',
      disabled: true,
      variant: 'neutral'
    }
  }

  if (!assignedAgentId) {
    return {
      label: 'Pegar chamado',
      disabled: false,
      variant: 'primary'
    }
  }

  if (assignedAgentId === currentUserId) {
    return {
      label: 'Em seu nome',
      disabled: true,
      variant: 'success'
    }
  }

  return {
    label: 'Em atendimento',
    disabled: true,
    variant: 'neutral'
  }
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'
        }`}
    >
      {icon}
      {label}
    </button>
  )
}

function StatusBadge({ status }) {
  const labelMap = {
    open: 'Aberto',
    in_progress: 'Em andamento',
    waiting_for_provider: 'Aguardando fornecedor',
    waiting_for_validation: 'Aguardando validação',
    finished: 'Finalizado'
  }

  const classMap = {
    open: 'bg-orange-50 text-orange-700',
    in_progress: 'bg-blue-50 text-blue-700',
    waiting_for_provider: 'bg-yellow-50 text-yellow-700',
    waiting_for_validation: 'bg-purple-50 text-purple-700',
    finished: 'bg-green-50 text-green-700'
  }

  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${classMap[status] || 'bg-gray-100 text-gray-600'}`}>
      {labelMap[status] || status}
    </span>
  )
}

function LoaderInline() {
  return <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
}