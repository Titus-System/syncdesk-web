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
  Loader2,
  AlertTriangle,
  UserRound,
  ClipboardList,
  CircleDot,
  Settings,
  BarChart3,
  MessageCircle,
  Lock,
  X,
  Check,
  Pencil,
  Trash2,
  Send,
  RefreshCcw,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useTicketQuery } from '@/features/ticket/hooks/useTicketQuery'
import { useUpdateTicketStatusMutation } from '@/features/ticket/hooks/useUpdateTicketStatusMutation'
import { useCommentsQuery } from '@/features/ticket/hooks/useCommentsQuery'
import { useCreateCommentMutation } from '@/features/ticket/hooks/useCreateCommentMutation'
import { useUpdateCommentMutation } from '@/features/ticket/hooks/useUpdateCommentMutation'
import { useDeleteCommentMutation } from '@/features/ticket/hooks/useDeleteCommentMutation'

const STATUS_OPTIONS = [
  { value: 'open',                   label: 'Aberto'                },
  { value: 'in_progress',            label: 'Em Andamento'          },
  { value: 'waiting_for_provider',   label: 'Aguardando Fornecedor' },
  { value: 'waiting_for_validation', label: 'Aguardando Validação'  },
  { value: 'finished',               label: 'Finalizado'            },
]

const ALLOWED_TRANSITIONS = {
  open:                   ['in_progress'],
  in_progress:            ['waiting_for_provider', 'waiting_for_validation', 'finished'],
  waiting_for_provider:   ['in_progress'],
  waiting_for_validation: ['in_progress', 'finished'],
  finished:               [],
}

export default function ModificarChamado() {
  const navigate     = useNavigate()
  const { ticketId } = useParams()
  const clearSession = useAuthStore((state) => state.clearSession)
  const loggedUser   = useAuthStore((state) => state.user)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const menuRef = useRef(null)

  const ticketQuery                = useTicketQuery(ticketId)
  const updateTicketStatusMutation = useUpdateTicketStatusMutation()

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuPerfilAberto(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  if (ticketQuery.isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[var(--bg-page)] font-bold text-[#500D0D] animate-pulse uppercase">Carregando chamado...</div>
  }
  if (ticketQuery.isError || !ticketQuery.data) {
    return <div className="flex h-screen items-center justify-center bg-[var(--bg-page)] font-bold text-red-500 uppercase">Erro ao carregar chamado</div>
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
  ticket, ticketId, menuPerfilAberto, setMenuPerfilAberto, menuRef,
  onLogout, navigate, updateTicketStatusMutation, loggedUser,
}) {
  const currentStatus    = ticket?.status || 'open'
  const assignedAgent    = getAssignedAgent(ticket)
  const hasAssignedAgent = Boolean(assignedAgent.id)

  const [status,       setStatus      ] = useState(currentStatus)
  const [errorMessage, setErrorMessage] = useState('')

  const commentsQuery         = useCommentsQuery(ticketId)
  const createCommentMutation = useCreateCommentMutation(ticketId)
  const updateCommentMutation = useUpdateCommentMutation(ticketId)
  const deleteCommentMutation = useDeleteCommentMutation(ticketId)

  const [novoComentario,   setNovoComentario  ] = useState('')
  const [isInternal,       setIsInternal      ] = useState(false)
  const [editingComment,   setEditingComment  ] = useState(null)
  const [deletingCommentId,setDeletingCommentId] = useState(null)

  const messagesEndRef = useRef(null)

  useEffect(() => { setStatus(ticket?.status || 'open') }, [ticket])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [commentsQuery.data])

  const availableStatusOptions = useMemo(() => {
    const nextStatuses  = ALLOWED_TRANSITIONS[currentStatus] || []
    const currentOption = STATUS_OPTIONS.find((o) => o.value === currentStatus)
    return [
      ...(currentOption ? [currentOption] : []),
      ...STATUS_OPTIONS.filter((o) => nextStatuses.includes(o.value)),
    ]
  }, [currentStatus])

  const isStatusChanged  = status !== currentStatus
  const isSubmitDisabled = !hasAssignedAgent || !isStatusChanged || updateTicketStatusMutation.isPending

  async function handleUpdate(event) {
    event.preventDefault()
    setErrorMessage('')
    if (!hasAssignedAgent) { setErrorMessage('Este chamado ainda não foi assumido. Pegue o chamado antes de alterar o status.'); return }
    if (!isStatusChanged)  { setErrorMessage('Selecione um novo status para salvar.'); return }
    try {
      await updateTicketStatusMutation.mutateAsync({ ticketId, payload: { status } })
      navigate('/chamados', { replace: true })
    } catch (error) {
      const detail = error?.response?.data?.detail
      setErrorMessage(detail?.[0]?.msg || error?.response?.data?.message || String(detail || '') || 'Erro ao atualizar status do chamado.')
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
    } catch { /* silencia */ }
  }

  async function handleSaveEdit() {
    if (!editingComment) return
    try {
      await updateCommentMutation.mutateAsync({ ticketId, commentId: editingComment.commentId, payload: { author: editingComment.author, text: editingComment.text, internal: editingComment.internal } })
      setEditingComment(null)
    } catch { /* silencia */ }
  }

  async function handleConfirmDelete(commentId) {
    try {
      await deleteCommentMutation.mutateAsync({ ticketId, commentId })
      setDeletingCommentId(null)
    } catch { setDeletingCommentId(null) }
  }

  const comments  = commentsQuery.data ?? []
  const ticketRef = `#${String(ticket?.id || '').slice(-5).toUpperCase().padStart(5, '0')}`

  return (
    <div className="flex h-screen bg-[var(--bg-page)] font-sans overflow-hidden text-[var(--text-primary)]">
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
                  <NavItem icon={<Ticket size={16} />} label="Chamados" active onClick={() => navigate('/chamados')} />
                  <NavItem icon={<BarChart3 size={16} />} label="Relatórios" onClick={() => navigate('/relatorios')} />
                  <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => navigate('/chat')} />
                </nav>
              </div>
            </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-[var(--bg-sidebar)] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs"></span>
            <span className="text-[10px] bg-white/15 px-2.5 py-1 rounded-lg font-bold text-white">
              {ticket?.status === 'finished' ? 'Finalizado' : 'Ativo'} · Chamado {ticketRef}
            </span>
          </div>
          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setMenuPerfilAberto((v) => !v)}
              className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
              <UserIcon size={16} className="text-white/90" />
            </button>
            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-60 bg-[var(--bg-sidebar)] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                <div className="px-4 py-3 border-b border-white/10 mb-1">
                  <p className="text-sm font-bold text-white truncate">{loggedUser?.name || 'Usuário'}</p>
                  <p className="text-[11px] text-white/50 truncate">{loggedUser?.email || ''}</p>
                </div>
                <button type="button" onClick={() => { setMenuPerfilAberto(false); navigate('/configuracoes') }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-white/70 hover:bg-white/10 rounded-xl transition-colors uppercase">
                  <Settings size={14} /> Configurações
                </button>
                <button type="button" onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase">
                  <LogOut size={14} /> Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="w-full max-w-5xl mx-auto">

            {/* Page title + save */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">{ticket?.description || 'Detalhes do Chamado'}</h1>
                <p className="text-xs text-[var(--text-faint)] mt-0.5">Chamado {ticketRef}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigate('/chamados')}
                  className="text-xs font-bold text-[var(--text-muted)] px-4 py-2.5 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-all">
                  Cancelar
                </button>
                <button type="button" onClick={handleUpdate} disabled={isSubmitDisabled}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-40">
                  {updateTicketStatusMutation.isPending ? <><Loader2 className="animate-spin" size={13} />Salvando...</> : <><Save size={13} />Salvar Alterações</>}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
              {/* Left: ticket info + discussion */}
              <div className="flex flex-col gap-5">
                {/* Ticket details */}
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <ClipboardList size={14} className="text-[var(--accent-text)]" />
                    <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Detalhes do Chamado</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoBlock label="Nome do Chamado (Assunto)" value={ticket?.description || '—'} />
                    <InfoBlock label="Nome da Empresa"           value={ticket?.client?.company || ticket?.client?.name || '—'} />
                    <InfoBlock label="Situação do Chamado"       value={formatStatusLabel(ticket?.status)} />
                    <InfoBlock label="Requerente"                value={ticket?.client?.name || '—'} />
                    <InfoBlock label="Dia da Abertura"           value={formatDate(ticket?.creation_date)} />
                    <InfoBlock label="Categoria"                 value={formatTicketType(ticket?.type)} />
                    <InfoBlock label="Nível de Prioridade"       value={formatCriticality(ticket?.criticality)} />
                  </div>
                  <div className="mt-4">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">Descrição</label>
                    <div className="w-full min-h-[100px] px-4 py-3 border border-[var(--border-default)] rounded-xl bg-[var(--bg-subtle)] text-sm text-[var(--text-secondary)] leading-relaxed">
                      {ticket?.description || 'Sem descrição.'}
                    </div>
                  </div>
                </div>

                {/* Discussion */}
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-[var(--border-subtle)]">
                    <MessageCircle size={14} className="text-[var(--accent-text)]" />
                    <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Discussão (Conversa)</h2>
                    <span className="ml-auto text-[10px] text-[var(--text-faint)] font-bold">
                      {comments.length} {comments.length === 1 ? 'mensagem' : 'mensagens'}
                    </span>
                  </div>

                  <div className="px-6 py-5 flex flex-col gap-5 min-h-[200px] max-h-[360px] overflow-y-auto">
                    {commentsQuery.isLoading && <p className="text-center text-[var(--text-faint)] text-sm italic">Carregando mensagens...</p>}
                    {!commentsQuery.isLoading && !comments.length && <p className="text-center text-[var(--text-faint)] text-sm italic">0 mensagens</p>}

                    {comments.map((comment) => {
                      const isTeam    = comment.internal
                      const isEditing = editingComment?.commentId === comment.comment_id
                      const isDeleting = deletingCommentId === comment.comment_id

                      return (
                        <div key={comment.comment_id} className={`flex flex-col ${isTeam ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] font-bold text-[var(--text-faint)] mb-1 px-1 flex items-center gap-1.5">
                            {isTeam ? 'Equipe de Suporte' : (comment.author || 'Cliente')}
                            {isTeam && <span className="text-orange-500 flex items-center gap-0.5"><Lock size={9} /> Interno</span>}
                          </span>

                          {isEditing ? (
                            <div className="w-full max-w-[75%] flex flex-col gap-2">
                              <textarea autoFocus value={editingComment.text} rows={3}
                                onChange={(e) => setEditingComment((p) => ({ ...p, text: e.target.value }))}
                                className="w-full px-3 py-2 border border-[var(--accent)] rounded-xl text-sm outline-none resize-none" />
                              <div className="flex items-center gap-2 justify-end">
                                <button type="button" onClick={() => setEditingComment((p) => ({ ...p, internal: !p.internal }))}
                                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${editingComment.internal ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-[var(--border-default)] text-[var(--text-faint)]'}`}>
                                  <Lock size={10} />{editingComment.internal ? 'Interno' : 'Público'}
                                </button>
                                <button type="button" onClick={() => setEditingComment(null)} className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors"><X size={14} /></button>
                                <button type="button" onClick={handleSaveEdit} disabled={updateCommentMutation.isPending || !editingComment.text.trim()}
                                  className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white disabled:opacity-50 hover:bg-[var(--accent-hover)] transition-colors">
                                  {updateCommentMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Salvar
                                </button>
                              </div>
                            </div>
                          ) : isDeleting ? (
                            <div className="max-w-[75%] px-4 py-3 rounded-2xl border border-red-200 bg-red-50">
                              <p className="text-xs text-red-700 font-medium mb-2">Excluir esta mensagem?</p>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => handleConfirmDelete(comment.comment_id)} disabled={deleteCommentMutation.isPending}
                                  className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                                  {deleteCommentMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Excluir
                                </button>
                                <button type="button" onClick={() => setDeletingCommentId(null)} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-gray-200 transition-colors">Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <div className="group relative max-w-[75%]">
                              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isTeam ? 'bg-[var(--accent)] text-white rounded-tr-sm' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-tl-sm'}`}>
                                {comment.text}
                              </div>
                              <div className={`absolute top-1 ${isTeam ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} hidden group-hover:flex items-center gap-1`}>
                                <button type="button" onClick={() => setEditingComment({ commentId: comment.comment_id, text: comment.text, internal: comment.internal, author: comment.author })}
                                  className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-faint)] hover:text-[var(--accent-text)] hover:border-[var(--accent)] transition-colors shadow-sm">
                                  <Pencil size={12} />
                                </button>
                                <button type="button" onClick={() => setDeletingCommentId(comment.comment_id)}
                                  className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-faint)] hover:text-red-500 hover:border-red-300 transition-colors shadow-sm">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          )}

                          {!isEditing && comment.date && (
                            <span className="text-[9px] text-[var(--text-faint)] mt-1 px-1">
                              {new Date(comment.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendComment} className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center gap-3">
                    <button type="button" onClick={() => setIsInternal((v) => !v)}
                      className={`shrink-0 p-2 rounded-xl border transition-all ${isInternal ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-faint)] hover:text-[var(--text-muted)]'}`}>
                      <Lock size={14} />
                    </button>
                    <input type="text" value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)}
                      placeholder={isInternal ? 'Nota interna (só para a equipe)...' : 'Digite sua mensagem...'}
                      className="flex-1 px-4 py-2.5 border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] bg-[var(--bg-card)] transition-colors" />
                    <button type="submit" disabled={!novoComentario.trim() || createCommentMutation.isPending}
                      className="shrink-0 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white p-2.5 rounded-xl transition-all">
                      {createCommentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: status + team */}
              <div className="flex flex-col gap-4">
                {/* Status control */}
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CircleDot size={14} className="text-[var(--accent-text)]" />
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Controle de Status</h3>
                  </div>

                  {/* Assigned agent */}
                  <div className="flex items-center gap-3 bg-[var(--bg-subtle)] rounded-xl p-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                      <UserRound size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{assignedAgent.name || 'Sem responsável'}</p>
                      <p className="text-[10px] text-[var(--text-faint)]">{assignedAgent.label}</p>
                    </div>
                  </div>

                  {!hasAssignedAgent && (
                    <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 mb-4">
                      <AlertTriangle size={13} className="text-orange-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-orange-700">Chamado não assumido. Pegue o chamado antes de alterar o status.</p>
                    </div>
                  )}

                  <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">Situação do Chamado</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value)}
                        disabled={!hasAssignedAgent || updateTicketStatusMutation.isPending}
                        className="w-full px-3.5 py-2.5 border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-faint)] transition-colors">
                        {availableStatusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <p className="text-[10px] text-[var(--text-faint)] mt-1.5">Apenas transições válidas são exibidas.</p>
                    </div>
                    {errorMessage && <p className="text-red-500 text-xs font-medium">{errorMessage}</p>}
                  </form>
                </div>

                {/* Assigned team */}
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <UserRound size={14} className="text-[var(--accent-text)]" />
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Equipe Atribuída</h3>
                  </div>
                  {hasAssignedAgent ? (
                    <div className="flex items-center gap-3 p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs">
                        {assignedAgent.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{assignedAgent.name}</p>
                        <p className="text-[10px] text-[var(--text-faint)]">{assignedAgent.label}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-faint)] italic">Nenhum atendente atribuído.</p>
                  )}
                </div>

                {/* Annexes placeholder */}
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList size={14} className="text-[var(--accent-text)]" />
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Anexos</h3>
                  </div>
                  <p className="text-xs text-[var(--text-faint)] italic">Nenhum anexo disponível.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center items-center gap-2 text-[var(--text-faint)] uppercase text-[10px] font-bold">
              <RefreshCcw size={12} /> Atualização via API
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getAssignedAgent(ticket) {
  const directId   = ticket?.assigned_agent_id   ?? ticket?.assignedAgentId   ?? null
  const directName = ticket?.assigned_agent_name  ?? ticket?.assignedAgentName ?? null
  if (directId || directName) return { id: directId ? String(directId) : null, name: directName || 'Atendente atribuído', label: 'Responsável atual' }
  const history       = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []
  const latestHistory = history.length ? history[history.length - 1] : null
  if (latestHistory) return { id: latestHistory.agent_id ? String(latestHistory.agent_id) : null, name: latestHistory.name || 'Atendente atribuído', label: latestHistory.level || 'Responsável atual' }
  return { id: null, name: null, label: 'Sem atendente' }
}

function formatStatusLabel(status) {
  if (typeof status === 'object' && status !== null) return status.name || status.value || 'Não informado'
  const map = { open: 'Aberto', in_progress: 'Em Andamento', waiting_for_provider: 'Aguardando Fornecedor', waiting_for_validation: 'Aguardando Validação', finished: 'Finalizado' }
  return map[status] || status || 'Não informado'
}

function formatCriticality(v) { 
  if (typeof v === 'object' && v !== null) return v.name || v.label || 'Não informada'
  return { high: 'Alta', medium: 'Média', low: 'Baixa' }[v] || v || 'Não informada' 
}

function formatTicketType(v)  { 
  if (typeof v === 'object' && v !== null) return v.name || v.label || 'Não informado'
  return { issue: 'Problema', access: 'Acesso', new_feature: 'Nova Funcionalidade', request: 'Solicitação' }[v] || v || 'Não informado' 
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function InfoBlock({ label, value }) {
  let displayValue = value;
  if (typeof value === 'object' && value !== null) {
    displayValue = value.name || value.label || value.description || JSON.stringify(value);
  }

  return (
    <div>
      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5">{label}</label>
      <div className="w-full px-3.5 py-2.5 border border-[var(--border-default)] rounded-xl bg-[var(--bg-subtle)] text-sm text-[var(--text-secondary)]">
        {displayValue}
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${active ? 'bg-[var(--accent)] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
      {icon} {label}
    </button>
  )
}