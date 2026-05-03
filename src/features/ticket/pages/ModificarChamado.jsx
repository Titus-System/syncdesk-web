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
  Settings,
  MessageCircle,
  Lock,
  Check,
  Trash2,
  Pencil,
  Send,
  X,
  ArrowRightLeft,
  History,
  UserCheck
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useTicketQuery } from '@/features/ticket/hooks/useTicketQuery'
import { useUpdateTicketStatusMutation } from '@/features/ticket/hooks/useUpdateTicketStatusMutation'
import { useAssignTicketMutation } from '@/features/ticket/hooks/useAssignTicketMutation'
import { useCommentsQuery } from '@/features/ticket/hooks/useCommentsQuery'
import { useCreateCommentMutation } from '@/features/ticket/hooks/useCreateCommentMutation'
import { useUpdateCommentMutation } from '@/features/ticket/hooks/useUpdateCommentMutation'
import { useDeleteCommentMutation } from '@/features/ticket/hooks/useDeleteCommentMutation'
import { useUsersQuery } from '@/features/users/hooks/useUsersQuery'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Aberto' },
  { value: 'awaiting_assignment', label: 'Aguardando atribuição' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'waiting_for_provider', label: 'Aguardando fornecedor' },
  { value: 'waiting_for_validation', label: 'Aguardando validação' },
  { value: 'finished', label: 'Finalizado' }
]

const ALLOWED_TRANSITIONS = {
  open: ['awaiting_assignment', 'in_progress'],
  awaiting_assignment: ['in_progress'],
  in_progress: ['awaiting_assignment', 'waiting_for_provider', 'waiting_for_validation', 'finished'],
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
      refetchTicket={ticketQuery.refetch}
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
  loggedUser,
  refetchTicket
}) {
  const currentStatus = getTicketStatus(ticket)
  const assignedAgent = getAssignedAgent(ticket)
  const hasAssignedAgent = Boolean(assignedAgent.id)
  const isFinished = isTerminalStatus(currentStatus)

  const [status, setStatus] = useState(currentStatus)
  const [errorMessage, setErrorMessage] = useState('')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('')
  const [assignReason, setAssignReason] = useState('')
  const [assignErrorMessage, setAssignErrorMessage] = useState('')

  const usersQuery = useUsersQuery()
  const assignTicketMutation = useAssignTicketMutation()

  const commentsQuery = useCommentsQuery(ticketId)
  const createCommentMutation = useCreateCommentMutation(ticketId)
  const updateCommentMutation = useUpdateCommentMutation(ticketId)
  const deleteCommentMutation = useDeleteCommentMutation(ticketId)

  const [novoComentario, setNovoComentario] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [deletingCommentId, setDeletingCommentId] = useState(null)

  const messagesEndRef = useRef(null)

  const users = useMemo(() => normalizeUsers(usersQuery.data), [usersQuery.data])

  const eligibleAssignees = useMemo(() => {
    return users
      .filter((user) => canUserReceiveTicket(user))
      .filter((user) => String(user?.id) !== String(assignedAgent.id ?? ''))
      .sort((a, b) => getUserDisplayName(a).localeCompare(getUserDisplayName(b)))
  }, [users, assignedAgent.id])

  const ticketHistory = useMemo(() => {
    const historyItems = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []

    return historyItems
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a?.assignment_date ?? 0).getTime()
        const dateB = new Date(b?.assignment_date ?? 0).getTime()
        return dateB - dateA
      })
  }, [ticket?.agent_history])

  const availableStatusOptions = useMemo(() => {
    const nextStatuses = ALLOWED_TRANSITIONS[currentStatus] || []
    const currentOption = STATUS_OPTIONS.find((option) => option.value === currentStatus)

    return [
      ...(currentOption ? [currentOption] : [{ value: currentStatus, label: formatStatusLabel(currentStatus) }]),
      ...STATUS_OPTIONS.filter((option) => nextStatuses.includes(option.value))
    ]
  }, [currentStatus])

  const isStatusChanged = status !== currentStatus
  const isSubmitDisabled =
    !hasAssignedAgent ||
    !isStatusChanged ||
    updateTicketStatusMutation.isPending ||
    isFinished

  const comments = commentsQuery.data ?? []
  const assignActionLabel = hasAssignedAgent ? 'Escalonar chamado' : 'Atribuir responsável'

  useEffect(() => {
    setStatus(getTicketStatus(ticket))
  }, [ticket])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [commentsQuery.data])

  function openAssignModal() {
    setSelectedAssigneeId('')
    setAssignReason('')
    setAssignErrorMessage('')
    setAssignModalOpen(true)
  }

  async function handleAssignSubmit(event) {
    event.preventDefault()
    setAssignErrorMessage('')

    if (!selectedAssigneeId) {
      setAssignErrorMessage('Selecione um atendente ou administrador.')
      return
    }

    if (!assignReason.trim()) {
      setAssignErrorMessage('Informe o motivo da alteração de responsável.')
      return
    }

    const selectedUser = eligibleAssignees.find((user) => String(user.id) === String(selectedAssigneeId))
    const selectedUserName = selectedUser ? getUserDisplayName(selectedUser) : 'usuário selecionado'

    const confirmed = window.confirm(
      `Confirma ${assignActionLabel.toLowerCase()} para ${selectedUserName}?`
    )

    if (!confirmed) {
      return
    }

    try {
      await assignTicketMutation.mutateAsync({
        ticketId,
        payload: {
          agent_id: selectedAssigneeId,
          reason: assignReason.trim()
        }
      })

      setAssignModalOpen(false)
      setSelectedAssigneeId('')
      setAssignReason('')
      await refetchTicket?.()
    } catch (error) {
      setAssignErrorMessage(getApiErrorMessage(error, 'Não foi possível alterar o responsável do chamado.'))
    }
  }

  async function handleUpdate(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!hasAssignedAgent) {
      setErrorMessage('Este chamado ainda não foi assumido por um atendente. Atribua um responsável antes de alterar o status.')
      return
    }

    if (!isStatusChanged) {
      setErrorMessage('Selecione um novo status para salvar.')
      return
    }

    try {
      await updateTicketStatusMutation.mutateAsync({ ticketId, payload: { status } })
      await refetchTicket?.()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Erro ao atualizar status do chamado.'))
    }
  }

  async function handleSendComment(event) {
    event.preventDefault()

    const text = novoComentario.trim()

    if (!text) {
      return
    }

    try {
      await createCommentMutation.mutateAsync({
        ticketId,
        payload: { text, internal: isInternal }
      })

      setNovoComentario('')
      setIsInternal(false)
    } catch {
      return
    }
  }

  async function handleSaveEdit() {
    if (!editingComment) {
      return
    }

    try {
      await updateCommentMutation.mutateAsync({
        ticketId,
        commentId: editingComment.commentId,
        payload: {
          author: editingComment.author,
          text: editingComment.text,
          internal: editingComment.internal
        }
      })

      setEditingComment(null)
    } catch {
      return
    }
  }

  async function handleConfirmDelete(commentId) {
    try {
      await deleteCommentMutation.mutateAsync({ ticketId, commentId })
      setDeletingCommentId(null)
    } catch {
      setDeletingCommentId(null)
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
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => navigate('/')} />
            <NavItem icon={<Users size={16} />} label="Usuários" onClick={() => navigate('/usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" active onClick={() => navigate('/chamados')} />
            <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => navigate('/chat')} />
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
                  onClick={() => {
                    setMenuPerfilAberto(false)
                    navigate('/configuracoes')
                  }}
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
          <div className="w-full max-w-6xl mx-auto">
            <div className="mb-6 flex justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 uppercase">Editar Chamado</h1>
                <p className="text-gray-500 text-sm mt-1.5 opacity-60">
                  Ticket {String(ticket?.id || '').slice(-8).toUpperCase()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openAssignModal}
                  disabled={isFinished}
                  className="flex items-center gap-2 text-xs font-bold text-white bg-[#BD3B0F] hover:bg-[#9a2f0d] disabled:opacity-50 disabled:hover:bg-[#BD3B0F] uppercase rounded-lg px-4 py-3 shadow-sm"
                >
                  {hasAssignedAgent ? <ArrowRightLeft size={16} /> : <UserCheck size={16} />}
                  {assignActionLabel}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/chamados')}
                  className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#500D0D] uppercase"
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.85fr] gap-6">
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10">
                <div className="flex items-center gap-2 mb-6">
                  <ClipboardList size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-lg font-bold text-gray-900">Informações do Chamado</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoBlock label="Produto" value={ticket?.product || 'Não informado'} />
                  <InfoBlock label="Tipo" value={formatTicketType(ticket?.type)} />
                  <InfoBlock label="Criticidade" value={formatCriticality(ticket?.criticality)} />
                  <InfoBlock label="Status Atual" value={formatStatusLabel(ticket?.status)} />
                  <InfoBlock label="Cliente" value={ticket?.client?.name || 'Não informado'} />
                  <InfoBlock label="E-mail do Cliente" value={ticket?.client?.email || 'Não informado'} />
                </div>

                <div className="mt-8">
                  <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">Descrição</label>
                  <div className="w-full min-h-[140px] px-4 py-4 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-700 leading-6">
                    {ticket?.description || 'Sem descrição.'}
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10">
                <div className="flex items-center gap-2 mb-6">
                  <CircleDot size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-lg font-bold text-gray-900">Controle de Status</h2>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-4">
                    <div className="text-[11px] font-bold uppercase text-gray-500 mb-2">Responsável Atual</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
                        <UserRound size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {assignedAgent.name || 'Chamado ainda não assumido'}
                        </p>
                        <p className="text-xs text-gray-500">{assignedAgent.label}</p>
                      </div>
                    </div>
                  </div>

                  {!hasAssignedAgent && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-orange-700 flex items-start gap-3">
                      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                      <div>Este chamado ainda não possui responsável. Atribua um atendente antes de alterar o status.</div>
                    </div>
                  )}

                  {isFinished && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700 flex items-start gap-3">
                      <Check size={18} className="shrink-0 mt-0.5" />
                      <div>Este chamado foi finalizado e não aceita novas alterações operacionais.</div>
                    </div>
                  )}

                  <form className="flex flex-col gap-6" onSubmit={handleUpdate}>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">Novo Status</label>
                      <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        disabled={!hasAssignedAgent || updateTicketStatusMutation.isPending || isFinished}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#BD3B0F] disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {availableStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-2">Apenas transições válidas são exibidas.</p>
                    </div>

                    {errorMessage && (
                      <p className="text-red-500 text-sm font-medium">{errorMessage}</p>
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

            <section className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-8 pt-8 pb-4 border-b border-gray-100">
                <History size={18} className="text-[#BD3B0F]" />
                <h2 className="text-lg font-bold text-gray-900">Histórico de responsáveis</h2>
                <span className="ml-auto text-[10px] font-bold text-gray-400">
                  {ticketHistory.length} {ticketHistory.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              <div className="px-8 py-6">
                {!ticketHistory.length ? (
                  <p className="text-center text-gray-400 text-sm italic">
                    Nenhum responsável registrado para este chamado.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {ticketHistory.map((item, index) => (
                      <div
                        key={`${item.agent_id}-${item.assignment_date}-${index}`}
                        className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {item.name || 'Atendente'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Nível: {item.level || 'Não informado'}
                            </p>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.exit_date ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'}`}>
                            {item.exit_date ? 'Encerrado' : 'Responsável atual'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs text-gray-500">
                          <div>
                            <span className="font-bold text-gray-600">Entrada: </span>
                            {formatDateTime(item.assignment_date)}
                          </div>
                          <div>
                            <span className="font-bold text-gray-600">Saída: </span>
                            {item.exit_date ? formatDateTime(item.exit_date) : 'Em aberto'}
                          </div>
                        </div>

                        {item.transfer_reason && (
                          <div className="mt-3 text-xs text-gray-600 bg-white border border-gray-100 rounded-lg p-3">
                            <span className="font-bold">Motivo: </span>
                            {item.transfer_reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-8 pt-8 pb-4 border-b border-gray-100">
                <MessageCircle size={18} className="text-[#BD3B0F]" />
                <h2 className="text-lg font-bold text-gray-900">Discussão</h2>
                <span className="ml-auto text-[10px] font-bold text-gray-400">
                  {comments.length} {comments.length === 1 ? 'mensagem' : 'mensagens'}
                </span>
              </div>

              <div className="px-8 py-6 flex flex-col gap-5 min-h-[180px] max-h-[400px] overflow-y-auto">
                {commentsQuery.isLoading && (
                  <p className="text-center text-gray-400 text-sm italic">Carregando mensagens...</p>
                )}

                {!commentsQuery.isLoading && comments.length === 0 && (
                  <p className="text-center text-gray-400 text-sm italic">Nenhuma mensagem ainda.</p>
                )}

                {comments.map((comment) => {
                  const commentId = getCommentId(comment)
                  const isTeam = Boolean(comment.internal)
                  const isEditing = editingComment?.commentId === commentId
                  const isDeleting = deletingCommentId === commentId

                  return (
                    <div
                      key={commentId}
                      className={`flex flex-col ${isTeam ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] font-bold text-gray-400 mb-1 px-1 flex items-center gap-1.5">
                        {isTeam ? 'Equipe de Suporte' : comment.author || 'Cliente'}
                        {isTeam && (
                          <span className="inline-flex items-center gap-0.5 text-orange-500">
                            <Lock size={9} />
                            Interno
                          </span>
                        )}
                      </span>

                      {isEditing ? (
                        <div className="w-full max-w-[75%] flex flex-col gap-2">
                          <textarea
                            autoFocus
                            value={editingComment.text}
                            onChange={(event) =>
                              setEditingComment((previous) => ({
                                ...previous,
                                text: event.target.value
                              }))
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-[#BD3B0F] rounded-xl text-sm outline-none resize-none text-gray-800"
                          />

                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingComment((previous) => ({
                                  ...previous,
                                  internal: !previous.internal
                                }))
                              }
                              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${editingComment.internal
                                  ? 'border-orange-400 bg-orange-50 text-orange-600'
                                  : 'border-gray-200 text-gray-400'
                                }`}
                            >
                              <Lock size={10} />
                              {editingComment.internal ? 'Interno' : 'Público'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingComment(null)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <X size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              disabled={updateCommentMutation.isPending || !editingComment.text.trim()}
                              className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[#BD3B0F] text-white disabled:opacity-50 hover:bg-[#9a2f0d] transition-colors"
                            >
                              {updateCommentMutation.isPending ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Check size={12} />
                              )}
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : isDeleting ? (
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl border border-red-200 bg-red-50 ${isTeam ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                          <p className="text-xs text-red-700 font-medium mb-2">Excluir esta mensagem?</p>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(commentId)}
                              disabled={deleteCommentMutation.isPending}
                              className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {deleteCommentMutation.isPending ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <Trash2 size={11} />
                              )}
                              Excluir
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingCommentId(null)}
                              className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative max-w-[75%]">
                          <div
                            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isTeam
                                ? 'bg-[#BD3B0F] text-white rounded-tr-sm'
                                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                              }`}
                          >
                            {comment.text}
                          </div>

                          <div className={`absolute top-1 ${isTeam ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} hidden group-hover:flex items-center gap-1`}>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingComment({
                                  commentId,
                                  text: comment.text,
                                  internal: comment.internal,
                                  author: comment.author
                                })
                              }
                              className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-[#BD3B0F] hover:border-[#BD3B0F] transition-colors shadow-sm"
                              title="Editar"
                            >
                              <Pencil size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingCommentId(commentId)}
                              className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-400 transition-colors shadow-sm"
                              title="Excluir"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}

                      {!isEditing && (
                        <span className="text-[9px] text-gray-300 mt-1 px-1">
                          {formatDateTime(comment.date)}
                        </span>
                      )}
                    </div>
                  )
                })}

                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendComment}
                className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => setIsInternal((value) => !value)}
                  title={isInternal ? 'Nota interna' : 'Mensagem pública'}
                  className={`shrink-0 p-2 rounded-lg border transition-all ${isInternal
                      ? 'border-orange-400 bg-orange-50 text-orange-600'
                      : 'border-gray-200 bg-white text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <Lock size={15} />
                </button>

                <input
                  type="text"
                  value={novoComentario}
                  onChange={(event) => setNovoComentario(event.target.value)}
                  placeholder={isInternal ? 'Nota interna...' : 'Digite sua mensagem...'}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#BD3B0F] bg-white transition-colors"
                />

                <button
                  type="submit"
                  disabled={!novoComentario.trim() || createCommentMutation.isPending}
                  className="shrink-0 bg-[#BD3B0F] hover:bg-[#9a2f0d] disabled:opacity-50 text-white p-3 rounded-xl transition-all"
                >
                  {createCommentMutation.isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </section>

            <div className="mt-10 flex justify-center items-center gap-2 text-gray-400 uppercase text-[10px] font-bold">
              <RefreshCcw size={14} />
              Atualização via API
            </div>
          </div>
        </div>
      </main>

      {assignModalOpen && (
        <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {assignActionLabel}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Selecione o novo responsável e informe o motivo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 flex flex-col gap-5">
              <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-4">
                <div className="text-[11px] font-bold uppercase text-gray-500 mb-2">
                  Responsável atual
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {assignedAgent.name || 'Sem responsável'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {assignedAgent.label}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-2 uppercase">
                  Novo responsável
                </label>

                <select
                  value={selectedAssigneeId}
                  onChange={(event) => setSelectedAssigneeId(event.target.value)}
                  disabled={usersQuery.isLoading || assignTicketMutation.isPending}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#BD3B0F] disabled:bg-gray-100"
                >
                  <option value="">
                    {usersQuery.isLoading ? 'Carregando usuários...' : 'Selecione um usuário'}
                  </option>

                  {eligibleAssignees.map((user) => (
                    <option key={user.id} value={user.id}>
                      {getUserDisplayName(user)} - {getUserRoleLabel(user)}
                    </option>
                  ))}
                </select>

                {!usersQuery.isLoading && eligibleAssignees.length === 0 && (
                  <p className="text-xs text-orange-600 mt-2">
                    Nenhum usuário elegível encontrado. Apenas usuários com papel admin, agent, N1, N2 ou N3 podem receber chamados.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-2 uppercase">
                  Motivo obrigatório
                </label>

                <textarea
                  value={assignReason}
                  onChange={(event) => setAssignReason(event.target.value)}
                  rows={4}
                  disabled={assignTicketMutation.isPending}
                  placeholder="Explique o motivo do escalonamento ou transferência..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none resize-none focus:border-[#BD3B0F] disabled:bg-gray-100 text-sm"
                />
              </div>

              {assignErrorMessage && (
                <p className="text-sm text-red-500 font-medium">
                  {assignErrorMessage}
                </p>
              )}

              <div className="flex justify-end items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  disabled={assignTicketMutation.isPending}
                  className="text-xs font-bold text-gray-400 uppercase px-4 py-3"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={assignTicketMutation.isPending || !selectedAssigneeId || !assignReason.trim()}
                  className="bg-[#BD3B0F] hover:bg-[#9a2f0d] disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 text-xs uppercase"
                >
                  {assignTicketMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft size={16} />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function normalizeUsers(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.items)) {
    return data.items
  }

  if (Array.isArray(data?.data?.items)) {
    return data.data.items
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

function getApiErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail

  if (Array.isArray(detail) && detail[0]?.msg) {
    return detail[0].msg
  }

  if (typeof detail === 'string') {
    return detail
  }

  return error?.response?.data?.message || fallback
}

function getTicketStatus(ticket) {
  return String(ticket?.status ?? 'open').toLowerCase()
}

function isTerminalStatus(status) {
  return ['finished', 'closed', 'cancelled', 'resolved'].includes(String(status).toLowerCase())
}

function getAssignedAgent(ticket) {
  const directId = ticket?.assigned_agent_id ?? ticket?.assignedAgentId ?? null
  const directName = ticket?.assigned_agent_name ?? ticket?.assignedAgentName ?? null

  if (directId || directName) {
    return {
      id: directId ? String(directId) : null,
      name: directName || 'Atendente atribuído',
      label: 'Responsável atual'
    }
  }

  const history = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []
  const activeHistory = [...history].reverse().find((item) => !item.exit_date)
  const latestHistory = activeHistory || (history.length ? history[history.length - 1] : null)

  if (latestHistory) {
    return {
      id: latestHistory.agent_id ? String(latestHistory.agent_id) : null,
      name: latestHistory.name || 'Atendente atribuído',
      label: latestHistory.level || 'Responsável atual'
    }
  }

  return { id: null, name: null, label: 'Sem atendente' }
}

function getRoleNames(user) {
  const roles = []

  if (Array.isArray(user?.roles)) {
    for (const role of user.roles) {
      if (typeof role === 'string') {
        roles.push(role)
      } else if (role?.name) {
        roles.push(role.name)
      }
    }
  }

  if (Array.isArray(user?.role_names)) {
    roles.push(...user.role_names)
  }

  if (user?.role) {
    roles.push(user.role)
  }

  return roles.map((role) => String(role).trim().toLowerCase()).filter(Boolean)
}

function canUserReceiveTicket(user) {
  const roles = getRoleNames(user)

  return roles.some((role) => ['admin', 'agent', 'n1', 'n2', 'n3'].includes(role))
}

function getUserDisplayName(user) {
  return user?.name || user?.username || user?.email || 'Usuário'
}

function getUserRoleLabel(user) {
  const roles = getRoleNames(user)

  if (!roles.length) {
    return 'Sem papel'
  }

  return roles.map((role) => role.toUpperCase()).join(', ')
}

function getCommentId(comment) {
  return String(comment?.comment_id ?? comment?.id ?? `${comment?.date}-${comment?.text}`)
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">{label}</label>
      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-700">
        {value}
      </div>
    </div>
  )
}

function formatStatusLabel(status) {
  const value = String(status ?? '').toLowerCase()

  const map = {
    open: 'Aberto',
    awaiting_assignment: 'Aguardando atribuição',
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

  return map[value] || status || 'Não informado'
}

function formatCriticality(value) {
  const normalized = String(value ?? '').toLowerCase()

  const map = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
    critical: 'Crítica'
  }

  return map[normalized] || value || 'Não informada'
}

function formatTicketType(value) {
  const normalized = String(value ?? '').toLowerCase()

  const map = {
    issue: 'Problema',
    request: 'Solicitação',
    access: 'Acesso',
    question: 'Dúvida',
    incident: 'Incidente',
    new_feature: 'Nova funcionalidade'
  }

  return map[normalized] || value || 'Não informado'
}

function formatDateTime(rawDate) {
  if (!rawDate) {
    return 'Não informado'
  }

  const date = new Date(rawDate)

  if (Number.isNaN(date.getTime())) {
    return 'Não informado'
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white' : 'text-white/60 hover:bg-white/10'
        }`}
    >
      {icon}
      {label}
    </button>
  )
}