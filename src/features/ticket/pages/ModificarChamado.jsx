import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Ticket,
  MessageSquare,
  User as UserIcon,
  LogOut,
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
import { useNotificationStore } from '@/stores/notification-store'
import { useTicketQuery } from '@/features/ticket/hooks/useTicketQuery'
import { useUpdateTicketStatusMutation } from '@/features/ticket/hooks/useUpdateTicketStatusMutation'
import { useAssignTicketMutation } from '@/features/ticket/hooks/useAssignTicketMutation'
import { useCommentsQuery } from '@/features/ticket/hooks/useCommentsQuery'
import { useCreateCommentMutation } from '@/features/ticket/hooks/useCreateCommentMutation'
import { useUpdateCommentMutation } from '@/features/ticket/hooks/useUpdateCommentMutation'
import { useDeleteCommentMutation } from '@/features/ticket/hooks/useDeleteCommentMutation'
import { useUsersQuery } from '@/features/users/hooks/useUsersQuery'
import NotificationBadge from '@/shared/components/NotificationBadge'

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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  if (ticketQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-page)] font-bold text-[var(--accent)] animate-pulse uppercase tracking-widest">
        Carregando chamado...
      </div>
    )
  }

  if (ticketQuery.isError || !ticketQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-page)] font-bold text-red-500 uppercase tracking-widest">
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
  const unreadChatMessages = useNotificationStore((state) => state.unreadChatMessages)
  const ticketUpdates = useNotificationStore((state) => state.ticketUpdates)
  const clearTicketUpdates = useNotificationStore((state) => state.clearTicketUpdates)

  const currentStatus = getTicketStatus(ticket)
  const assignedAgent = getAssignedAgent(ticket)
  const hasAssignedAgent = Boolean(assignedAgent.id)
  const isFinished = isTerminalStatus(currentStatus)

  const [status, setStatus] = useState(currentStatus)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Assign Modal States
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
  const isSubmitDisabled = !hasAssignedAgent || !isStatusChanged || updateTicketStatusMutation.isPending || isFinished

  const comments = commentsQuery.data ?? []
  const assignActionLabel = hasAssignedAgent ? 'Escalonar chamado' : 'Atribuir responsável'
  const ticketRef = `#${String(ticket?.id || '').slice(-5).toUpperCase().padStart(5, '0')}`

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

    const confirmed = window.confirm(`Confirma ${assignActionLabel.toLowerCase()} para ${selectedUserName}?`)
    if (!confirmed) return

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
    if (!text) return

    try {
      await createCommentMutation.mutateAsync({ ticketId, payload: { text, internal: isInternal } })
      setNovoComentario('')
      setIsInternal(false)
    } catch { /* silence */ }
  }

  async function handleSaveEdit() {
    if (!editingComment) return
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
    } catch { /* silence */ }
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
    <div className="flex h-screen bg-[var(--bg-page)] font-sans overflow-hidden text-[var(--text-primary)] relative">
      {/* Sidebar */}
      <aside className="w-60 bg-[var(--bg-sidebar)] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-sm">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
          </div>

          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => navigate('/')} />
            <NavItem icon={<Users size={16} />} label="Usuários" onClick={() => navigate('/usuarios')} />
            <NavItem
              icon={<Ticket size={16} />}
              label="Chamados"
              active
              badgeCount={ticketUpdates}
              onClick={() => {
                clearTicketUpdates()
                navigate('/chamados')
              }}
            />
            <NavItem icon={<BarChart3 size={16} />} label="Relatórios" onClick={() => navigate('/relatorios')} />
            <NavItem
              icon={<MessageSquare size={16} />}
              label="Chat"
              badgeCount={unreadChatMessages}
              onClick={() => navigate('/chat')}
            />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative">
        {/* Header */}
        <header className="bg-[var(--bg-sidebar)] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/15 px-2.5 py-1 rounded-lg font-bold text-white uppercase tracking-wider">
              {ticket?.status === 'finished' ? 'Finalizado' : 'Ativo'} · Ticket {ticketRef}
            </span>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuPerfilAberto((value) => !value)}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
            >
              <UserIcon size={16} className="text-white/90" />
            </button>

            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-60 bg-[var(--bg-sidebar)] border border-white/10 rounded-2xl p-2 shadow-2xl z-[50]">
                <div className="px-4 py-3 border-b border-white/10 mb-1">
                  <p className="text-sm font-bold text-white truncate">{loggedUser?.name || 'Usuário'}</p>
                  <p className="text-[11px] text-white/50 truncate">{loggedUser?.email || ''}</p>
                </div>
                <button type="button" onClick={() => { setMenuPerfilAberto(false); navigate('/configuracoes') }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-white/70 uppercase hover:bg-white/10 rounded-xl transition-colors">
                  <Settings size={14} /> Configurações
                </button>
                <button type="button" onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 uppercase hover:bg-white/10 rounded-xl transition-colors">
                  <LogOut size={14} /> Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="w-full max-w-6xl mx-auto">
            
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">{ticket?.description || 'Detalhes do Chamado'}</h1>
                <p className="text-xs text-[var(--text-faint)] mt-0.5">Ticket {ticketRef}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openAssignModal}
                  disabled={isFinished}
                  className="flex items-center gap-2 text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 uppercase rounded-xl px-4 py-2.5 shadow-sm transition-all"
                >
                  {hasAssignedAgent ? <ArrowRightLeft size={14} /> : <UserCheck size={14} />}
                  {assignActionLabel}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/chamados')}
                  className="text-xs font-bold text-[var(--text-muted)] px-4 py-2.5 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-all flex items-center gap-2"
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6">
              
              {/* Left Column */}
              <div className="flex flex-col gap-6">
                
                {/* Info Card */}
                <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <ClipboardList size={16} className="text-[var(--accent-text)]" />
                    <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Informações do Chamado</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoBlock label="Produto" value={ticket?.product || 'Não informado'} />
                    <InfoBlock label="Tipo" value={formatTicketType(ticket?.type)} />
                    <InfoBlock label="Criticidade" value={formatCriticality(ticket?.criticality)} />
                    <InfoBlock label="Status Atual" value={formatStatusLabel(ticket?.status)} />
                    <InfoBlock label="Cliente" value={ticket?.client?.name || 'Não informado'} />
                    <InfoBlock label="E-mail do Cliente" value={ticket?.client?.email || 'Não informado'} />
                  </div>

                  <div className="mt-5">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Descrição</label>
                    <div className="w-full min-h-[100px] px-4 py-3 border border-[var(--border-default)] rounded-xl bg-[var(--bg-subtle)] text-sm text-[var(--text-secondary)] leading-relaxed">
                      {ticket?.description || 'Sem descrição.'}
                    </div>
                  </div>
                </section>

                {/* Discussions / Comments */}
                <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden flex flex-col h-[500px]">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] shrink-0">
                    <MessageCircle size={16} className="text-[var(--accent-text)]" />
                    <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Discussão (Conversa)</h2>
                    <span className="ml-auto text-[10px] text-[var(--text-faint)] font-bold uppercase">
                      {comments.length} {comments.length === 1 ? 'mensagem' : 'mensagens'}
                    </span>
                  </div>

                  <div className="flex-1 px-6 py-5 flex flex-col gap-5 overflow-y-auto">
                    {commentsQuery.isLoading && <p className="text-center text-[var(--text-faint)] text-sm italic font-medium">Carregando mensagens...</p>}
                    {!commentsQuery.isLoading && !comments.length && <p className="text-center text-[var(--text-faint)] text-sm italic font-medium">Nenhuma mensagem ainda.</p>}

                    {comments.map((comment) => {
                      const commentId = getCommentId(comment)
                      const isTeam = Boolean(comment.internal)
                      const isEditing = editingComment?.commentId === commentId
                      const isDeleting = deletingCommentId === commentId

                      return (
                        <div key={commentId} className={`flex flex-col ${isTeam ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] font-bold text-[var(--text-faint)] mb-1 px-1 flex items-center gap-1.5 uppercase tracking-wide">
                            {isTeam ? 'Equipe de Suporte' : comment.author || 'Cliente'}
                            {isTeam && (
                              <span className="inline-flex items-center gap-0.5 text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                                <Lock size={9} /> Interno
                              </span>
                            )}
                          </span>

                          {isEditing ? (
                            <div className="w-full max-w-[80%] flex flex-col gap-2">
                              <textarea autoFocus value={editingComment.text} rows={3}
                                onChange={(e) => setEditingComment((prev) => ({ ...prev, text: e.target.value }))}
                                className="w-full px-3 py-2 border border-[var(--accent)] rounded-xl text-sm outline-none resize-none bg-[var(--bg-page)] text-[var(--text-primary)]" />
                              
                              <div className="flex items-center gap-2 justify-end">
                                <button type="button" onClick={() => setEditingComment((prev) => ({ ...prev, internal: !prev.internal }))}
                                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all ${editingComment.internal ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-[var(--border-default)] text-[var(--text-faint)] bg-[var(--bg-card)]'}`}>
                                  <Lock size={10} /> {editingComment.internal ? 'Interno' : 'Público'}
                                </button>
                                <button type="button" onClick={() => setEditingComment(null)} className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors"><X size={15} /></button>
                                <button type="button" onClick={handleSaveEdit} disabled={updateCommentMutation.isPending || !editingComment.text.trim()}
                                  className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white disabled:opacity-50 hover:bg-[var(--accent-hover)] transition-colors">
                                  {updateCommentMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Salvar
                                </button>
                              </div>
                            </div>
                          ) : isDeleting ? (
                            <div className={`max-w-[80%] px-4 py-3 rounded-2xl border border-red-200 bg-red-50 ${isTeam ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                              <p className="text-xs text-red-700 font-medium mb-2">Excluir esta mensagem?</p>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => handleConfirmDelete(commentId)} disabled={deleteCommentMutation.isPending}
                                  className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                                  {deleteCommentMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Excluir
                                </button>
                                <button type="button" onClick={() => setDeletingCommentId(null)} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <div className="group relative max-w-[80%]">
                              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isTeam ? 'bg-[var(--accent)] text-white rounded-tr-sm shadow-sm' : 'bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] rounded-tl-sm shadow-sm'}`}>
                                {comment.text}
                              </div>
                              <div className={`absolute top-1 ${isTeam ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} hidden group-hover:flex items-center gap-1`}>
                                <button type="button" onClick={() => setEditingComment({ commentId, text: comment.text, internal: comment.internal, author: comment.author })}
                                  className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-faint)] hover:text-[var(--accent-text)] hover:border-[var(--accent)] transition-colors shadow-sm">
                                  <Pencil size={13} />
                                </button>
                                <button type="button" onClick={() => setDeletingCommentId(commentId)}
                                  className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-faint)] hover:text-red-500 hover:border-red-300 transition-colors shadow-sm">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          )}

                          {!isEditing && (
                            <span className="text-[9px] text-[var(--text-faint)] font-medium mt-1 px-1">
                              {formatDateTime(comment.date)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendComment} className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center gap-3 shrink-0">
                    <button type="button" onClick={() => setIsInternal((v) => !v)} title={isInternal ? 'Nota interna' : 'Mensagem pública'}
                      className={`shrink-0 p-2 rounded-xl border transition-all ${isInternal ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-faint)] hover:text-[var(--text-muted)]'}`}>
                      <Lock size={15} />
                    </button>
                    <input type="text" value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)}
                      placeholder={isInternal ? 'Nota interna...' : 'Digite sua mensagem...'}
                      className="flex-1 px-4 py-2.5 border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] bg-[var(--bg-subtle)] transition-colors" />
                    <button type="submit" disabled={!novoComentario.trim() || createCommentMutation.isPending}
                      className="shrink-0 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-sm">
                      {createCommentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </form>
                </section>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                
                {/* Control Status */}
                <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <CircleDot size={16} className="text-[var(--accent-text)]" />
                    <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Controles</h2>
                  </div>

                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 mb-5">
                    <div className="text-[10px] font-bold uppercase text-[var(--text-faint)] mb-2 tracking-wider">Responsável Atual</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                        <UserRound size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{assignedAgent.name || 'Não assumido'}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{assignedAgent.label}</p>
                      </div>
                    </div>
                  </div>

                  {!hasAssignedAgent && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-700 flex items-start gap-2 mb-5 leading-relaxed">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <div>Atribua um responsável antes de alterar o status.</div>
                    </div>
                  )}

                  {isFinished && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700 flex items-start gap-2 mb-5 leading-relaxed">
                      <Check size={14} className="shrink-0 mt-0.5" />
                      <div>Este chamado está finalizado.</div>
                    </div>
                  )}

                  <form className="flex flex-col gap-5" onSubmit={handleUpdate}>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Novo Status</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={!hasAssignedAgent || updateTicketStatusMutation.isPending || isFinished}
                        className="w-full px-4 py-2.5 border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-faint)] bg-[var(--bg-subtle)] transition-colors">
                        {availableStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {errorMessage && <p className="text-red-500 text-xs font-medium">{errorMessage}</p>}

                    <button type="submit" disabled={isSubmitDisabled}
                      className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs uppercase tracking-wide disabled:opacity-50 transition-all">
                      {updateTicketStatusMutation.isPending ? <><Loader2 className="animate-spin" size={14} /> Salvando...</> : <><Save size={14} /> Salvar Alterações</>}
                    </button>
                  </form>
                </section>

                {/* History */}
                <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] shrink-0">
                    <History size={16} className="text-[var(--accent-text)]" />
                    <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Histórico</h2>
                    <span className="ml-auto text-[10px] font-bold text-[var(--text-faint)] uppercase">
                      {ticketHistory.length} regs
                    </span>
                  </div>

                  <div className="flex-1 px-6 py-5 overflow-y-auto">
                    {!ticketHistory.length ? (
                      <p className="text-center text-[var(--text-faint)] text-sm italic font-medium mt-4">Nenhum responsável registrado.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {ticketHistory.map((item, index) => (
                          <div key={`${item.agent_id}-${item.assignment_date}-${index}`} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[var(--text-primary)] truncate">{item.name || 'Atendente'}</p>
                                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Nível: {item.level || '—'}</p>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${item.exit_date ? 'bg-[var(--bg-muted)] text-[var(--text-faint)]' : 'bg-green-100 text-green-700'}`}>
                                {item.exit_date ? 'Encerrado' : 'Atual'}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1 text-[10px] text-[var(--text-secondary)] mb-2">
                              <div><span className="font-bold text-[var(--text-muted)]">Início:</span> {formatDateTime(item.assignment_date)}</div>
                              <div><span className="font-bold text-[var(--text-muted)]">Fim:</span> {item.exit_date ? formatDateTime(item.exit_date) : '—'}</div>
                            </div>

                            {item.transfer_reason && (
                              <div className="mt-2 text-[10px] text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg p-2 leading-relaxed">
                                <span className="font-bold text-[var(--text-muted)]">Motivo: </span>{item.transfer_reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
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

              </div>
            </div>

            <div className="mt-8 flex justify-center items-center gap-2 text-[var(--text-faint)] uppercase text-[10px] font-bold tracking-widest">
              <RefreshCcw size={12} /> Atualização via API
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

      {/* Modal Atribuição */}
      {assignModalOpen && (
        <div className="absolute inset-0 z-[999] bg-black/50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[var(--border-subtle)] flex flex-col max-h-full">
            <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-subtle)] shrink-0">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{assignActionLabel}</h3>
                <p className="text-xs text-[var(--text-faint)] mt-1">Selecione o novo responsável e informe o motivo.</p>
              </div>
              <button type="button" onClick={() => setAssignModalOpen(false)} className="p-2 text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                <div className="text-[10px] font-bold uppercase text-[var(--text-faint)] mb-2 tracking-wider">Responsável atual</div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{assignedAgent.name || 'Sem responsável'}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{assignedAgent.label}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Novo responsável</label>
                <select value={selectedAssigneeId} onChange={(e) => setSelectedAssigneeId(e.target.value)} disabled={usersQuery.isLoading || assignTicketMutation.isPending}
                  className="w-full px-4 py-3 border border-[var(--border-default)] rounded-xl outline-none focus:border-[var(--accent)] bg-[var(--bg-subtle)] text-sm text-[var(--text-primary)] transition-all">
                  <option value="">{usersQuery.isLoading ? 'Carregando usuários...' : 'Selecione um usuário'}</option>
                  {eligibleAssignees.map((user) => (
                    <option key={user.id} value={user.id}>{getUserDisplayName(user)} - {getUserRoleLabel(user)}</option>
                  ))}
                </select>
                {!usersQuery.isLoading && eligibleAssignees.length === 0 && (
                  <p className="text-[10px] text-orange-600 mt-2 font-medium">Nenhum usuário elegível (admin, agent, N1-N3) encontrado.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Motivo obrigatório</label>
                <textarea value={assignReason} onChange={(e) => setAssignReason(e.target.value)} rows={3} disabled={assignTicketMutation.isPending}
                  placeholder="Explique o motivo da alteração..."
                  className="w-full px-4 py-3 border border-[var(--border-default)] rounded-xl outline-none resize-none focus:border-[var(--accent)] bg-[var(--bg-subtle)] text-sm text-[var(--text-primary)] transition-all" />
              </div>

              {assignErrorMessage && <p className="text-sm text-red-500 font-medium">{assignErrorMessage}</p>}

              <div className="flex justify-end items-center gap-3 pt-2">
                <button type="button" onClick={() => setAssignModalOpen(false)} disabled={assignTicketMutation.isPending}
                  className="text-xs font-bold text-[var(--text-muted)] uppercase px-4 py-3 hover:text-[var(--text-primary)] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={assignTicketMutation.isPending || !selectedAssigneeId || !assignReason.trim()}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wide transition-all shadow-sm">
                  {assignTicketMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <><ArrowRightLeft size={14} /> Confirmar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componentes Auxiliares & Helpers ────────────────────────────────────────

function InfoBlock({ label, value }) {
  let displayValue = value
  if (typeof value === 'object' && value !== null) displayValue = value.name || value.label || value.description || JSON.stringify(value)

  return (
    <div>
      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">{label}</label>
      <div className="w-full px-4 py-3 border border-[var(--border-default)] rounded-xl bg-[var(--bg-subtle)] text-sm text-[var(--text-secondary)] truncate">
        {displayValue}
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick, badgeCount = 0 }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
        active ? 'bg-[var(--accent)] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}>
      {icon} 
      <span className="flex-1 text-left">{label}</span>
      <NotificationBadge count={badgeCount} />
    </button>
  )
}

function normalizeUsers(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data?.items)) return data.data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

function getApiErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  if (typeof detail === 'string') return detail
  return error?.response?.data?.message || fallback
}

function getTicketStatus(ticket) { return String(ticket?.status ?? 'open').toLowerCase() }
function isTerminalStatus(status) { return ['finished', 'closed', 'cancelled', 'resolved'].includes(String(status).toLowerCase()) }

function getAssignedAgent(ticket) {
  const directId = ticket?.assigned_agent_id ?? ticket?.assignedAgentId ?? null
  const directName = ticket?.assigned_agent_name ?? ticket?.assignedAgentName ?? null
  if (directId || directName) return { id: directId ? String(directId) : null, name: directName || 'Atendente atribuído', label: 'Responsável atual' }
  const history = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []
  const activeHistory = [...history].reverse().find((item) => !item.exit_date)
  const latestHistory = activeHistory || (history.length ? history[history.length - 1] : null)
  if (latestHistory) return { id: latestHistory.agent_id ? String(latestHistory.agent_id) : null, name: latestHistory.name || 'Atendente atribuído', label: latestHistory.level || 'Responsável atual' }
  return { id: null, name: null, label: 'Sem atendente' }
}

function getRoleNames(user) {
  const roles = []
  if (Array.isArray(user?.roles)) {
    for (const role of user.roles) {
      if (typeof role === 'string') roles.push(role)
      else if (role?.name) roles.push(role.name)
    }
  }
  if (Array.isArray(user?.role_names)) roles.push(...user.role_names)
  if (user?.role) roles.push(user.role)
  return roles.map((role) => String(role).trim().toLowerCase()).filter(Boolean)
}

function canUserReceiveTicket(user) {
  const roles = getRoleNames(user)
  return roles.some((role) => ['admin', 'agent', 'n1', 'n2', 'n3'].includes(role))
}

function getUserDisplayName(user) { return user?.name || user?.username || user?.email || 'Usuário' }
function getUserRoleLabel(user) {
  const roles = getRoleNames(user)
  if (!roles.length) return 'Sem papel'
  return roles.map((role) => role.toUpperCase()).join(', ')
}

function getCommentId(comment) { return String(comment?.comment_id ?? comment?.id ?? `${comment?.date}-${comment?.text}`) }

function formatStatusLabel(status) {
  const value = String(status ?? '').toLowerCase()
  const map = { open: 'Aberto', awaiting_assignment: 'Aguardando atribuição', assigned: 'Atribuído', in_progress: 'Em andamento', waiting_for_customer: 'Aguardando cliente', waiting_customer: 'Aguardando cliente', waiting_for_provider: 'Aguardando fornecedor', waiting_for_validation: 'Aguardando validação', resolved: 'Resolvido', closed: 'Fechado', finished: 'Finalizado', cancelled: 'Cancelado' }
  return map[value] || status || 'Não informado'
}

function formatCriticality(value) {
  const normalized = String(value ?? '').toLowerCase()
  const map = { high: 'Alta', medium: 'Média', low: 'Baixa', critical: 'Crítica' }
  return map[normalized] || value || 'Não informada'
}

function formatTicketType(value) {
  const normalized = String(value ?? '').toLowerCase()
  const map = { issue: 'Problema', request: 'Solicitação', access: 'Acesso', question: 'Dúvida', incident: 'Incidente', new_feature: 'Nova funcionalidade' }
  return map[normalized] || value || 'Não informado'
}

function formatDateTime(rawDate) {
  if (!rawDate) return 'Não informado'
  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) return 'Não informado'
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

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

function NavItem({ icon, label, active, onClick, badgeCount = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white' : 'text-white/60 hover:bg-white/10'
        }`}
    >
      {icon}
      <span>{label}</span>
      <NotificationBadge count={badgeCount} />
    </button>
  )
}
