import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Ticket,
  User as UserIcon,
  LogOut,
  MessageSquare,
  Save,
  ArrowLeft,
  RefreshCcw,
  Loader2,
  AlertTriangle,
  UserRound,
  ClipboardList,
  CircleDot,
  Settings
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useTicketQuery } from '@/features/ticket/hooks/useTicketQuery'
import { useUpdateTicketStatusMutation } from '@/features/ticket/hooks/useUpdateTicketStatusMutation'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'waiting_for_provider', label: 'Aguardando fornecedor' },
  { value: 'waiting_for_validation', label: 'Aguardando validação' },
  { value: 'finished', label: 'Finalizado' }
]

const ALLOWED_TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['waiting_for_provider', 'waiting_for_validation', 'finished'],
  waiting_for_provider: ['in_progress'],
  waiting_for_validation: ['in_progress', 'finished'],
  finished: []
}

export default function ModificarChamado() {
  const navigate = useNavigate()
  const { ticketId } = useParams()
  const clearSession = useAuthStore((state) => state.clearSession)
  const loggedUser = useAuthStore((state) => state.user)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const menuRef = useRef(null)

  const ticketQuery = useTicketQuery(ticketId)
  const updateTicketStatusMutation = useUpdateTicketStatusMutation()

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

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  if (ticketQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4EAD9] font-bold text-[#500D0D] animate-pulse uppercase">
        Carregando chamado...
      </div>
    )
  }

  if (ticketQuery.isError || !ticketQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4EAD9] font-bold text-red-500 uppercase">
        Erro ao carregar chamado
      </div>
    )
  }

  return (
    <ModificarChamadoForm
      ticket={ticketQuery.data}
      ticketId={ticketId}
      menuPerfilAberto={menuPerfilAberto}
      setMenuPerfilAberto={setMenuPerfilAberto}
      menuRef={menuRef}
      onLogout={handleLogout}
      navigate={navigate}
      updateTicketStatusMutation={updateTicketStatusMutation}
      loggedUser={loggedUser}
    />
  )
}

function ModificarChamadoForm({
  ticket,
  ticketId,
  menuPerfilAberto,
  setMenuPerfilAberto,
  menuRef,
  onLogout,
  navigate,
  updateTicketStatusMutation,
  loggedUser
}) {
  const currentStatus = ticket?.status || 'open'
  const assignedAgent = getAssignedAgent(ticket)
  const hasAssignedAgent = Boolean(assignedAgent.id)

  const [status, setStatus] = useState(currentStatus)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    setStatus(ticket?.status || 'open')
  }, [ticket])

  const availableStatusOptions = useMemo(() => {
    const nextStatuses = ALLOWED_TRANSITIONS[currentStatus] || []
    const currentOption = STATUS_OPTIONS.find((option) => option.value === currentStatus)

    return [
      ...(currentOption ? [currentOption] : []),
      ...STATUS_OPTIONS.filter((option) => nextStatuses.includes(option.value))
    ]
  }, [currentStatus])

  const isStatusChanged = status !== currentStatus
  const isSubmitDisabled =
    !hasAssignedAgent ||
    !isStatusChanged ||
    updateTicketStatusMutation.isPending

  async function handleUpdate(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!hasAssignedAgent) {
      setErrorMessage(
        'Este chamado ainda não foi assumido por um atendente. Pegue o chamado antes de alterar o status.'
      )
      return
    }

    if (!isStatusChanged) {
      setErrorMessage('Selecione um novo status para salvar.')
      return
    }

    try {
      await updateTicketStatusMutation.mutateAsync({
        ticketId,
        payload: { status }
      })

      navigate('/chamados', { replace: true })
    } catch (error) {
      const detail = error?.response?.data?.detail
      const message =
        detail?.[0]?.msg ||
        error?.response?.data?.message ||
        String(detail || '') ||
        'Erro ao atualizar status do chamado.'

      setErrorMessage(message)
    }
  }

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden text-[#1E293B]">
      <aside className="w-64 bg-[#500D0D] flex flex-col justify-between text-white/90 shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-2 rounded-xl">
              <LayoutDashboard size={24} />
            </div>
            <span className="text-white font-bold text-sm uppercase">SyncDesk</span>
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

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0">
          <div className="flex-1" />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuPerfilAberto((value) => !value)}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20"
            >
              <UserIcon size={20} />
            </button>

            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-60 bg-[#500D0D] border border-white/10 rounded-2xl p-2 shadow-2xl z-[50]">
                <div className="px-4 py-3 border-b border-white/10 mb-1">
                  <p className="text-sm font-bold text-white truncate">{loggedUser?.name || 'Usuário'}</p>
                  <p className="text-[11px] text-white/50 truncate">{loggedUser?.email || ''}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setMenuPerfilAberto(false); navigate('/configuracoes') }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-white/70 uppercase hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Settings size={14} />
                  Configurações
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 uppercase hover:bg-white/10 rounded-xl transition-colors"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="w-full max-w-5xl mx-auto">
            <div className="mb-6 flex justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 uppercase">
                  Editar Chamado
                </h1>
                <p className="text-gray-500 text-sm mt-1.5 opacity-60">
                  Ticket {String(ticket?.id || '').slice(-8).toUpperCase()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/chamados')}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#500D0D] uppercase"
              >
                <ArrowLeft size={16} />
                Voltar
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.85fr] gap-6">
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10">
                <div className="flex items-center gap-2 mb-6">
                  <ClipboardList size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Informações do Chamado
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoBlock label="Produto" value={ticket?.product || 'Não informado'} />
                  <InfoBlock label="Tipo" value={formatTicketType(ticket?.type)} />
                  <InfoBlock
                    label="Criticidade"
                    value={formatCriticality(ticket?.criticality)}
                  />
                  <InfoBlock
                    label="Status Atual"
                    value={formatStatusLabel(ticket?.status)}
                  />
                  <InfoBlock
                    label="Cliente"
                    value={ticket?.client?.name || 'Não informado'}
                  />
                  <InfoBlock
                    label="E-mail do Cliente"
                    value={ticket?.client?.email || 'Não informado'}
                  />
                </div>

                <div className="mt-8">
                  <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">
                    Descrição
                  </label>
                  <div className="w-full min-h-[140px] px-4 py-4 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-700 leading-6">
                    {ticket?.description || 'Sem descrição.'}
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10">
                <div className="flex items-center gap-2 mb-6">
                  <CircleDot size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Controle de Status
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-4">
                    <div className="text-[11px] font-bold uppercase text-gray-500 mb-2">
                      Responsável Atual
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
                        <UserRound size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {assignedAgent.name || 'Chamado ainda não assumido'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assignedAgent.label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!hasAssignedAgent && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-orange-700 flex items-start gap-3">
                      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                      <div>
                        Este chamado ainda não foi assumido por um atendente.
                        Pegue o chamado antes de alterar o status.
                      </div>
                    </div>
                  )}

                  <form className="flex flex-col gap-6" onSubmit={handleUpdate}>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">
                        Novo Status
                      </label>

                      <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        disabled={!hasAssignedAgent || updateTicketStatusMutation.isPending}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#BD3B0F] disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {availableStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <p className="text-xs text-gray-400 mt-2">
                        Apenas transições válidas são exibidas.
                      </p>
                    </div>

                    {errorMessage && (
                      <p className="text-red-500 text-sm font-medium">
                        {errorMessage}
                      </p>
                    )}

                    <div className="flex justify-end items-center gap-5">
                      <button
                        type="button"
                        onClick={() => navigate('/chamados')}
                        className="text-xs font-bold text-gray-400 uppercase"
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitDisabled}
                        className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white font-bold py-3 px-10 rounded-lg shadow-lg flex items-center gap-2 text-sm uppercase disabled:opacity-50 disabled:hover:bg-[#BD3B0F]"
                      >
                        {updateTicketStatusMutation.isPending ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Salvar Alterações
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </div>

            <div className="mt-10 flex justify-center items-center gap-2 text-gray-400 uppercase text-[10px] font-bold">
              <RefreshCcw size={14} />
              Atualização via API
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function getAssignedAgent(ticket) {
  const directId =
    ticket?.assigned_agent_id ??
    ticket?.assignedAgentId ??
    null

  const directName =
    ticket?.assigned_agent_name ??
    ticket?.assignedAgentName ??
    null

  if (directId || directName) {
    return {
      id: directId ? String(directId) : null,
      name: directName || 'Atendente atribuído',
      label: 'Responsável atual'
    }
  }

  const history = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []
  const latestHistory = history.length ? history[history.length - 1] : null

  if (latestHistory) {
    return {
      id: latestHistory.agent_id ? String(latestHistory.agent_id) : null,
      name: latestHistory.name || 'Atendente atribuído',
      label: latestHistory.level || 'Responsável atual'
    }
  }

  return {
    id: null,
    name: null,
    label: 'Sem atendente'
  }
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">
        {label}
      </label>
      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-700">
        {value}
      </div>
    </div>
  )
}

function formatStatusLabel(status) {
  const map = {
    open: 'Aberto',
    in_progress: 'Em andamento',
    waiting_for_provider: 'Aguardando fornecedor',
    waiting_for_validation: 'Aguardando validação',
    finished: 'Finalizado'
  }

  return map[status] || status || 'Não informado'
}

function formatCriticality(value) {
  const map = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  }

  return map[value] || value || 'Não informada'
}

function formatTicketType(value) {
  const map = {
    issue: 'Problema',
    access: 'Acesso',
    new_feature: 'Nova funcionalidade'
  }

  return map[value] || value || 'Não informado'
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white' : 'text-white/60 hover:bg-white/10'
        }`}
    >
      {icon} {label}
    </button>
  )
}