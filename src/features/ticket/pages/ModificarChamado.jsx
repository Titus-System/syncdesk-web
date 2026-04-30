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
  Send,
  Lock,
  MessageCircle,
  Pencil,
  Trash2,
  Check,
  X,
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
  { value: 'open',                   label: 'Aberto'                 },
  { value: 'in_progress',            label: 'Em andamento'           },
  { value: 'waiting_for_provider',   label: 'Aguardando fornecedor'  },
  { value: 'waiting_for_validation', label: 'Aguardando validação'   },
  { value: 'finished',               label: 'Finalizado'             },
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

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const menuRef = useRef(null)

  const ticketQuery                = useTicketQuery(ticketId)
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
}) {
  const currentStatus    = ticket?.status || 'open'
  const assignedAgent    = getAssignedAgent(ticket)
  const hasAssignedAgent = Boolean(assignedAgent.id)

  const [status,       setStatus      ] = useState(currentStatus)
  const [errorMessage, setErrorMessage] = useState('')

  // — comentários —
  const commentsQuery          = useCommentsQuery(ticketId)
  const createCommentMutation  = useCreateCommentMutation(ticketId)
  const updateCommentMutation  = useUpdateCommentMutation(ticketId)
  const deleteCommentMutation  = useDeleteCommentMutation(ticketId)

  const [novoComentario, setNovoComentario] = useState('')
  const [isInternal,     setIsInternal    ] = useState(false)

  // estado de edição
  const [editingComment,      setEditingComment     ] = useState(null)
  const [deletingCommentId,   setDeletingCommentId  ] = useState(null)

  const messagesEndRef = useRef(null)

  useEffect(() => {
    setStatus(ticket?.status || 'open')
  }, [ticket])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [commentsQuery.data])

  const availableStatusOptions = useMemo(() => {
    const nextStatuses  = ALLOWED_TRANSITIONS[currentStatus] || []
    const currentOption = STATUS_OPTIONS.find((o) => o.value === currentStatus)
    return [
      ...(currentOption ? [currentOption] : []),
      ...STATUS_OPTIONS.filter((o) => nextStatuses.includes(o.value)),
    ]
  }, [currentStatus])

  const isStatusChanged  = status !== currentStatus
  const isSubmitDisabled =
    !hasAssignedAgent ||
    !isStatusChanged  ||
    updateTicketStatusMutation.isPending

  async function handleUpdate(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!hasAssignedAgent) {
      setErrorMessage('Este chamado ainda não foi assumido por um atendente. Pegue o chamado antes de alterar o status.')
      return
    }
    if (!isStatusChanged) {
      setErrorMessage('Selecione um novo status para salvar.')
      return
    }

    try {
      await updateTicketStatusMutation.mutateAsync({ ticketId, payload: { status } })
      navigate('/chamados', { replace: true })
    } catch (error) {
      const detail  = error?.response?.data?.detail
      const message =
        detail?.[0]?.msg ||
        error?.response?.data?.message ||
        String(detail || '') ||
        'Erro ao atualizar status do chamado.'
      setErrorMessage(message)
    }
  }

  async function handleSendComment(event) {
    event.preventDefault()
    const text = novoComentario.trim()
    if (!text) return

    try {
      await createCommentMutation.mutateAsync({
        ticketId,
        payload: { text, internal: isInternal },
      })
      setNovoComentario('')
      setIsInternal(false)
    } catch {
      // silencia
    }
  }

  async function handleSaveEdit() {
    if (!editingComment) return
    try {
      await updateCommentMutation.mutateAsync({
        ticketId,
        commentId: editingComment.commentId,
        payload: {
          author:   editingComment.author,
          text:     editingComment.text,
          internal: editingComment.internal,
        },
      })
      setEditingComment(null)
    } catch {
      // silencia
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

  const comments = commentsQuery.data ?? []

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden text-[#1E293B]">
      {/* Sidebar */}
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
            <NavItem icon={<Users size={16} />}           label="Usuários"  onClick={() => navigate('/usuarios')} />
            <NavItem icon={<Ticket size={16} />}          label="Chamados"  active onClick={() => navigate('/chamados')} />
            <NavItem icon={<MessageSquare size={16} />}   label="Chat"      onClick={() => navigate('/chat')} />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0">
          <div className="flex-1" />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuPerfilAberto((v) => !v)}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20"
            >
              <UserIcon size={20} />
            </button>

            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-48 bg-[#500D0D] border border-white/10 rounded-2xl p-2 shadow-2xl z-[50]">
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

            {/* Título */}
            <div className="mb-6 flex justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 uppercase">Editar Chamado</h1>
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

            {/* Grid principal */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.85fr] gap-6">

              {/* Informações */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10">
                <div className="flex items-center gap-2 mb-6">
                  <ClipboardList size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-lg font-bold text-gray-900">Informações do Chamado</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoBlock label="Produto"           value={ticket?.product            || 'Não informado'} />
                  <InfoBlock label="Tipo"              value={formatTicketType(ticket?.type)} />
                  <InfoBlock label="Criticidade"       value={formatCriticality(ticket?.criticality)} />
                  <InfoBlock label="Status Atual"      value={formatStatusLabel(ticket?.status)} />
                  <InfoBlock label="Cliente"           value={ticket?.client?.name       || 'Não informado'} />
                  <InfoBlock label="E-mail do Cliente" value={ticket?.client?.email      || 'Não informado'} />
                </div>

                <div className="mt-8">
                  <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">Descrição</label>
                  <div className="w-full min-h-[140px] px-4 py-4 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-700 leading-6">
                    {ticket?.description || 'Sem descrição.'}
                  </div>
                </div>
              </section>

              {/* Controle de status */}
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
                      <div>Este chamado ainda não foi assumido por um atendente. Pegue o chamado antes de alterar o status.</div>
                    </div>
                  )}

                  <form className="flex flex-col gap-6" onSubmit={handleUpdate}>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">Novo Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={!hasAssignedAgent || updateTicketStatusMutation.isPending}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#BD3B0F] disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {availableStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
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
                          <><Loader2 className="animate-spin" size={18} /> Salvando...</>
                        ) : (
                          <><Save size={18} /> Salvar Alterações</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </div>

            {/* ─── DISCUSSÃO ─── */}
            <section className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-8 pt-8 pb-4 border-b border-gray-100">
                <MessageCircle size={18} className="text-[#BD3B0F]" />
                <h2 className="text-lg font-bold text-gray-900">Discussão (Conversa)</h2>
                <span className="ml-auto text-[10px] font-bold text-gray-400">
                  {comments.length} {comments.length === 1 ? 'mensagem' : 'mensagens'}
                </span>
              </div>

              {/* Lista de comentários */}
              <div className="px-8 py-6 flex flex-col gap-5 min-h-[180px] max-h-[400px] overflow-y-auto">
                {commentsQuery.isLoading && (
                  <p className="text-center text-gray-400 text-sm italic">Carregando mensagens...</p>
                )}
                {!commentsQuery.isLoading && comments.length === 0 && (
                  <p className="text-center text-gray-400 text-sm italic">Nenhuma mensagem ainda.</p>
                )}

                {comments.map((comment) => {
                  const isTeam    = comment.internal
                  const isEditing = editingComment?.commentId === comment.comment_id
                  const isDeleting = deletingCommentId === comment.comment_id

                  return (
                    <div
                      key={comment.comment_id}
                      className={`flex flex-col ${isTeam ? 'items-end' : 'items-start'}`}
                    >
                      {/* autor */}
                      <span className="text-[10px] font-bold text-gray-400 mb-1 px-1 flex items-center gap-1.5">
                        {isTeam ? 'Equipe de Suporte' : (comment.author || 'Cliente')}
                        {isTeam && (
                          <span className="inline-flex items-center gap-0.5 text-orange-500">
                            <Lock size={9} /> Interno
                          </span>
                        )}
                      </span>

                      {/* bolha */}
                      {isEditing ? (
                        <div className="w-full max-w-[75%] flex flex-col gap-2">
                          <textarea
                            autoFocus
                            value={editingComment.text}
                            onChange={(e) => setEditingComment((prev) => ({ ...prev, text: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-[#BD3B0F] rounded-xl text-sm outline-none resize-none text-gray-800"
                          />
                          <div className="flex items-center gap-2 justify-end">
                            {/* toggle interno na edição */}
                            <button
                              type="button"
                              onClick={() => setEditingComment((prev) => ({ ...prev, internal: !prev.internal }))}
                              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                                editingComment.internal
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
                              {updateCommentMutation.isPending
                                ? <Loader2 size={12} className="animate-spin" />
                                : <Check size={12} />
                              }
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
                              onClick={() => handleConfirmDelete(comment.comment_id)}
                              disabled={deleteCommentMutation.isPending}
                              className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {deleteCommentMutation.isPending
                                ? <Loader2 size={11} className="animate-spin" />
                                : <Trash2 size={11} />
                              }
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
                            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                              isTeam
                                ? 'bg-[#BD3B0F] text-white rounded-tr-sm'
                                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                            }`}
                          >
                            {comment.text}
                          </div>

                          {/* botões editar/excluir — aparecem no hover */}
                          <div className={`absolute top-1 ${isTeam ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} hidden group-hover:flex items-center gap-1`}>
                            <button
                              type="button"
                              onClick={() => setEditingComment({
                                commentId: comment.comment_id,
                                text:      comment.text,
                                internal:  comment.internal,
                                author:    comment.author,
                              })}
                              className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-[#BD3B0F] hover:border-[#BD3B0F] transition-colors shadow-sm"
                              title="Editar"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCommentId(comment.comment_id)}
                              className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-400 transition-colors shadow-sm"
                              title="Excluir"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* data */}
                      {!isEditing && (
                        <span className="text-[9px] text-gray-300 mt-1 px-1">
                          {comment.date
                            ? new Date(comment.date).toLocaleString('pt-BR', {
                                day: '2-digit', month: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : ''}
                        </span>
                      )}
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input nova mensagem */}
              <form
                onSubmit={handleSendComment}
                className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => setIsInternal((v) => !v)}
                  title={isInternal ? 'Nota interna (visível só para equipe)' : 'Mensagem pública'}
                  className={`shrink-0 p-2 rounded-lg border transition-all ${
                    isInternal
                      ? 'border-orange-400 bg-orange-50 text-orange-600'
                      : 'border-gray-200 bg-white text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Lock size={15} />
                </button>

                <input
                  type="text"
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder={isInternal ? 'Nota interna (visível apenas para a equipe)...' : 'Digite sua mensagem...'}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#BD3B0F] bg-white transition-colors"
                />

                <button
                  type="submit"
                  disabled={!novoComentario.trim() || createCommentMutation.isPending}
                  className="shrink-0 bg-[#BD3B0F] hover:bg-[#9a2f0d] disabled:opacity-50 text-white p-3 rounded-xl transition-all"
                >
                  {createCommentMutation.isPending
                    ? <Loader2 size={18} className="animate-spin" />
                    : <Send size={18} />
                  }
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
    </div>
  )
}

// — helpers —

function getAssignedAgent(ticket) {
  const directId   = ticket?.assigned_agent_id   ?? ticket?.assignedAgentId   ?? null
  const directName = ticket?.assigned_agent_name  ?? ticket?.assignedAgentName ?? null

  if (directId || directName) {
    return { id: directId ? String(directId) : null, name: directName || 'Atendente atribuído', label: 'Responsável atual' }
  }

  const history       = Array.isArray(ticket?.agent_history) ? ticket.agent_history : []
  const latestHistory = history.length ? history[history.length - 1] : null

  if (latestHistory) {
    return {
      id:    latestHistory.agent_id ? String(latestHistory.agent_id) : null,
      name:  latestHistory.name  || 'Atendente atribuído',
      label: latestHistory.level || 'Responsável atual',
    }
  }

  return { id: null, name: null, label: 'Sem atendente' }
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">{label}</label>
      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-700">{value}</div>
    </div>
  )
}

function formatStatusLabel(status) {
  const map = { open: 'Aberto', in_progress: 'Em andamento', waiting_for_provider: 'Aguardando fornecedor', waiting_for_validation: 'Aguardando validação', finished: 'Finalizado' }
  return map[status] || status || 'Não informado'
}

function formatCriticality(value) {
  const map = { high: 'Alta', medium: 'Média', low: 'Baixa' }
  return map[value] || value || 'Não informada'
}

function formatTicketType(value) {
  const map = { issue: 'Problema', access: 'Acesso', new_feature: 'Nova funcionalidade' }
  return map[value] || value || 'Não informado'
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${
        active ? 'bg-[#BD3B0F] text-white' : 'text-white/60 hover:bg-white/10'
      }`}
    >
      {icon} {label}
    </button>
  )
}