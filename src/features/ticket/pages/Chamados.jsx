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
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ArrowRight,
  Hand,
  Settings,
  BarChart3,
  Plus,
  MoreVertical
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useTicketsQuery } from '@/features/ticket/hooks/useTicketsQuery'
import { useTakeTicketMutation } from '@/features/ticket/hooks/useTakeTicketMutation'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'

const VIEW_OPTIONS = [
  { value: 'all',       label: 'Todos os Chamados' },
  { value: 'mine',      label: 'Atribuídos a Mim'  },
  { value: 'queue',     label: 'Não Atribuídos'    },
  { value: 'escalated', label: 'Escalonados'       },
]

export default function Chamados() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const currentUser = useAuthStore((state) => state.user)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const [search, setSearch] = useState('')
  const [viewFilter, setViewFilter] = useState('all')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [pendingTicketId, setPendingTicketId] = useState(null)

  const menuPerfilRef = useRef(null)
  const debouncedSearch = useDebouncedValue(search, 300)

  const ticketsQuery = useTicketsQuery({}, { refetchInterval: 5000 })
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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!feedbackMessage) return
    const timeout = setTimeout(() => setFeedbackMessage(''), 4000)
    return () => clearTimeout(timeout)
  }, [feedbackMessage])

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  const queueCounts = useMemo(() => {
    const q = tickets.filter((t) => !getAssignedAgentId(t) && getTicketStatus(t) !== 'finished')
    return {
      issues:   q.filter((t) => t?.type === 'issue').length,
      requests: q.filter((t) => t?.type === 'request').length,
    }
  }, [tickets])

  const filteredTickets = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase()
    return tickets
      .filter((ticket) => {
        const assignedAgentId = getAssignedAgentId(ticket)
        const isFinished = getTicketStatus(ticket) === 'finished'
        if (viewFilter === 'queue')     return !assignedAgentId && !isFinished
        if (viewFilter === 'mine')      return assignedAgentId === currentUserId
        if (viewFilter === 'escalated') return ticket?.criticality === 'high'
        return true
      })
      .filter((ticket) => {
        if (!normalizedSearch) return true
        return [
          getTicketClientName(ticket),
          getTicketProduct(ticket),
          getTicketDescription(ticket),
          getAssignedAgentName(ticket),
          getTicketStatusLabel(getTicketStatus(ticket)),
        ].join(' ').toLowerCase().includes(normalizedSearch)
      })
      .sort((a, b) => new Date(b?.creation_date ?? 0) - new Date(a?.creation_date ?? 0))
  }, [tickets, debouncedSearch, viewFilter, currentUserId])

  async function handleTakeTicket(ticketId) {
    try {
      setPendingTicketId(ticketId)
      await takeTicketMutation.mutateAsync(ticketId)
      await ticketsQuery.refetch()
      setFeedbackMessage('Chamado atribuído com sucesso.')
    } catch (error) {
      setFeedbackMessage(error?.response?.data?.detail || 'Não foi possível assumir o chamado.')
    } finally {
      setPendingTicketId(null)
    }
  }

  return (
    <div className="flex h-screen bg-[var(--bg-page)] font-sans overflow-hidden text-[var(--text-primary)]">
      {/* Sidebar */}
      <aside className="w-60 bg-[var(--bg-sidebar)] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-sm">
              <Ticket size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
          </div>
      
          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => navigate('/')} />
            <NavItem icon={<Users size={16} />} label="Usuários" onClick={() => navigate('/usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados"  active onClick={() => navigate('/chamados')} />
            <NavItem icon={<BarChart3 size={16} />} label="Relatórios" onClick={() => navigate('/relatorios')} />
            <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => navigate('/chat')} />
          </nav>
        </div>
        
        {/* Team queues */}
        <div className="mt-auto px-3 pb-6">
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-3 px-1">Filas da Equipe</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
              <span className="text-[11px] text-white/70 font-medium">Problemas</span>
              <span className="text-[10px] font-bold bg-[var(--accent)] text-white rounded-full w-5 h-5 flex items-center justify-center">
                {queueCounts.issues}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
              <span className="text-[11px] text-white/70 font-medium">Solicitações</span>
              <span className="text-[10px] font-bold bg-white/20 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {queueCounts.requests}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-[var(--bg-sidebar)] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <h1 className="text-base font-bold text-white tracking-tight"></h1>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tickets..."
                className="bg-white/10 border border-white/15 text-white text-xs placeholder:text-white/40 rounded-lg pl-8 pr-4 py-1.5 w-52 outline-none focus:bg-white/15 transition-all"
              />
            </div>
            
            <div className="relative" ref={menuPerfilRef}>
              <button
                type="button"
                onClick={() => setMenuPerfilAberto((v) => !v)}
                className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <UserIcon size={16} className="text-white/90" />
              </button>
              {menuPerfilAberto && (
                <div className="absolute right-0 top-12 w-60 bg-[var(--bg-sidebar)] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                  <div className="px-4 py-3 border-b border-white/10 mb-1">
                    <p className="text-sm font-bold text-white truncate">{currentUser?.name || 'Usuário'}</p>
                    <p className="text-[11px] text-white/50 truncate">{currentUser?.email || ''}</p>
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

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-0 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-1 shadow-sm">
              {VIEW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setViewFilter(opt.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    viewFilter === opt.value
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate('/chamados/novo')}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold py-2 px-5 rounded-xl shadow-sm flex items-center gap-2 transition-all"
            >
              <Plus size={15} /> New Ticket
            </button>
          </div>

          {feedbackMessage && (
            <div className="mb-5 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/20 px-4 py-3 text-sm text-[var(--accent-text)] font-medium">
              {feedbackMessage}
            </div>
          )}

          {/* Ticket list */}
          <div className="flex flex-col gap-3">
            {ticketsQuery.isLoading ? (
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-16 text-center text-[var(--text-faint)] italic font-semibold">
                Carregando chamados...
              </div>
            ) : ticketsQuery.isError ? (
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-16 text-center flex flex-col items-center gap-4 text-red-500 font-semibold">
                <ShieldAlert size={40} />
                <span>Erro ao carregar chamados.</span>
              </div>
            ) : !filteredTickets.length ? (
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-16 text-center text-[var(--text-muted)] font-medium">
                Nenhum chamado encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const ticketId = ticket.id
                const ticketStatus = getTicketStatus(ticket)
                const assignedAgentName = getAssignedAgentName(ticket)
                const assignedAgentId = getAssignedAgentId(ticket)
                const buttonState = getTakeButtonState({ ticket, currentUserId })
                const ticketRef = `TKT-${String(ticketId || '').slice(-4).toUpperCase().padStart(4, '0')}`

                return (
                  <div key={ticketId} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center gap-4 hover:shadow-md hover:border-[var(--border-default)] transition-all">
                    <TicketIcon status={ticketStatus} criticality={ticket?.criticality} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[var(--text-faint)] shrink-0">{ticketRef}</span>
                        <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {getTicketDescription(ticket)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <StatusBadge status={ticketStatus} />
                        {assignedAgentName
                          ? <span className="text-[11px] text-[var(--text-muted)]">Atribuído a: <span className="font-semibold text-[var(--text-secondary)]">{assignedAgentName}</span></span>
                          : <span className="text-[11px] text-[var(--text-faint)]">Aguardando atribuição</span>
                        }
                        <span className="text-[11px] text-[var(--text-faint)]">{formatTimeAgo(ticket?.creation_date)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge criticality={ticket?.criticality} />
                      <button
                        type="button"
                        onClick={() => { if (!buttonState.disabled) handleTakeTicket(ticketId) }}
                        disabled={buttonState.disabled}
                        className={`text-[11px] font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all ${
                          buttonState.variant === 'primary'
                            ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-sm'
                            : buttonState.variant === 'success'
                              ? 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed'
                              : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-default)] cursor-not-allowed'
                        }`}
                      >
                        {pendingTicketId === ticketId ? <LoaderInline /> : <Hand size={12} />}
                        {pendingTicketId === ticketId ? 'Assumindo...' : buttonState.label}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/chamados/${ticketId}/editar`)}
                        className="border border-[var(--border-default)] hover:border-[var(--accent)] hover:text-[var(--accent-text)] text-[var(--text-faint)] text-[11px] font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all"
                      >
                        Abrir <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getTicketStatus(ticket) { return String(ticket?.status ?? '').toLowerCase() }
function getTicketStatusLabel(status) {
  return { open: 'Aberto', in_progress: 'Em andamento', waiting_for_provider: 'Aguardando fornecedor', waiting_for_validation: 'Aguardando validação', finished: 'Finalizado' }[status] || status
}
function getTicketClientName(ticket)  { return ticket?.client?.name ?? 'Cliente' }
function getTicketProduct(ticket)     { return ticket?.product ?? 'Sem produto' }
function getTicketDescription(ticket) { return ticket?.description ?? 'Sem descrição' }
function getAssignedAgentId(ticket) {
  const direct = ticket?.assigned_agent_id ?? ticket?.assignedAgentId
  if (direct != null) return String(direct)
  const history = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []
  const latest = history.length ? history[history.length - 1] : null
  return latest?.agent_id != null ? String(latest.agent_id) : null
}
function getAssignedAgentName(ticket) {
  const direct = ticket?.assigned_agent_name ?? ticket?.assignedAgentName
  if (direct) return direct
  const history = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []
  const latest = history.length ? history[history.length - 1] : null
  return latest?.name ?? null
}
function getTakeButtonState({ ticket, currentUserId }) {
  const assignedAgentId = getAssignedAgentId(ticket)
  const status = getTicketStatus(ticket)
  if (status === 'finished')          return { label: 'Finalizado',     disabled: true,  variant: 'neutral' }
  if (!assignedAgentId)               return { label: 'Pegar chamado',  disabled: false, variant: 'primary' }
  if (assignedAgentId === currentUserId) return { label: 'Em seu nome', disabled: true,  variant: 'success' }
  return { label: 'Em atendimento', disabled: true, variant: 'neutral' }
}
function formatTimeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Agora'
  if (mins < 60) return `Há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Há ${hours}h`
  return `Há ${Math.floor(hours / 24)}d`
}

// ─── components ─────────────────────────────────────────────────────────────

function TicketIcon({ status, criticality }) {
  if (status === 'finished')
    return <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0"><CheckCircle2 size={18} className="text-green-500" /></div>
  if (criticality === 'high' || status === 'open')
    return <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0"><AlertTriangle size={18} className="text-orange-500" /></div>
  if (status === 'in_progress')
    return <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0"><ShieldAlert size={18} className="text-red-500" /></div>
  return <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><CircleDot size={18} className="text-blue-500" /></div>
}

function PriorityBadge({ criticality }) {
  const map = {
    high:   { label: 'ALTA PRIORIDADE', cls: 'bg-orange-100 text-orange-700' },
    medium: { label: 'MÉDIO',           cls: 'bg-[var(--bg-muted)] text-[var(--text-muted)]'    },
    low:    { label: 'BAIXA',           cls: 'bg-teal-50 text-teal-700'     },
  }
  const p = map[criticality] || map.medium
  return <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${p.cls}`}>{p.label}</span>
}

function StatusBadge({ status }) {
  const classMap = {
    open:                    'bg-orange-50 text-orange-600',
    in_progress:             'bg-blue-50 text-blue-600',
    waiting_for_provider:    'bg-yellow-50 text-yellow-700',
    waiting_for_validation:  'bg-purple-50 text-purple-700',
    finished:                'bg-green-50 text-green-700',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${classMap[status] || 'bg-[var(--bg-muted)] text-[var(--text-muted)]'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {getTicketStatusLabel(status)}
    </span>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
        active ? 'bg-[var(--accent)] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  )
}

function LoaderInline() {
  return <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
}