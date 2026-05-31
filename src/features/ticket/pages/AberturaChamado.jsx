import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Ticket,
  MessageSquare,
  User as UserIcon,
  Plus,
  X,
  LogOut,
  Loader2,
  Settings,
  BarChart3,
  Paperclip,
  ChevronDown,
  RefreshCcw,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useNotificationStore } from '@/stores/notification-store'
import { useCreateTicketMutation } from '@/features/ticket/hooks/useCreateTicketMutation'
import { useUsersQuery } from '@/features/users/hooks/useUsersQuery'
import NotificationBadge from '@/shared/components/NotificationBadge'

const INITIAL_FORM_DATA = {
  client_id: '',
  product: '',
  criticality: 'medium',
  type: 'issue',
  description: ''
}

export default function AberturaChamado() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const loggedUser = useAuthStore((state) => state.user)

  // Lógica de Notificações importada
  const unreadChatMessages = useNotificationStore((state) => state.unreadChatMessages)
  const ticketUpdates = useNotificationStore((state) => state.ticketUpdates)
  const clearUnreadChatMessages = useNotificationStore((state) => state.clearUnreadChatMessages)
  const clearTicketUpdates = useNotificationStore((state) => state.clearTicketUpdates)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)

  const menuRef = useRef(null)
  const fileInputRef = useRef(null)

  const createTicketMutation = useCreateTicketMutation()
  const usersQuery = useUsersQuery()

  // Normalização de usuários importada
  const usersData = useMemo(() => normalizeUsersResponse(usersQuery.data), [usersQuery.data])

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

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleFileChange(event) {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setSelectedFiles((prev) => [...prev, ...files])
    event.target.value = '' // Reset para permitir re-seleção do mesmo arquivo
  }

  function removeFile(index) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave(event) {
    event.preventDefault()
    setErrorMessage('')

    const payload = {
      client_id: formData.client_id.trim(),
      product: formData.product.trim(),
      criticality: formData.criticality,
      type: formData.type,
      description: formData.description.trim()
    }

    if (!payload.client_id || !payload.product || !payload.description) {
      setErrorMessage('Preencha todos os campos obrigatórios.')
      return
    }

    try {
      await createTicketMutation.mutateAsync(payload)
      navigate('/chamados', { replace: true })
    } catch (error) {
      setErrorMessage(extractApiError(error, 'Erro ao abrir chamado.'))
    }
  }

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
              onClick={() => {
                clearUnreadChatMessages()
                navigate('/chat')
              }} 
            />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-[var(--bg-sidebar)] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <p className="text-xs text-white/50 font-medium"></p>
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
                <button type="button" onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase">
                  <LogOut size={14} /> Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="w-full max-w-4xl mx-auto">

            {/* Page title + actions */}
            <div className="flex justify-between items-end mb-6 gap-4">
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Novo Ticket</h1>
                <p className="text-xs text-[var(--text-faint)] mt-0.5">Preencha os dados para abertura manual de chamado técnico.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigate('/chamados')}
                  className="text-xs font-bold text-[var(--text-muted)] px-4 py-2.5 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-all">
                  Cancelar
                </button>
                <button type="submit" form="form-novo-chamado" disabled={createTicketMutation.isPending}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95">
                  {createTicketMutation.isPending ? <Loader2 className="animate-spin" size={13} /> : <><Plus size={13} />Abrir Chamado</>}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
              {/* Form */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6">
                <form id="form-novo-chamado" onSubmit={handleSave} className="flex flex-col gap-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cliente */}
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Cliente Solicitante</label>
                      <div className="relative">
                        <select required name="client_id" value={formData.client_id} onChange={handleChange} disabled={usersQuery.isLoading}
                          className="w-full appearance-none px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] disabled:opacity-60 transition-all pr-9 text-[var(--text-primary)]">
                          <option value="" disabled>{usersQuery.isLoading ? 'Carregando...' : 'Selecione o Cliente'}</option>
                          {usersData.map((user) => (
                            <option key={user.id} value={user.id}>
                              {getUserDisplayName(user)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                      </div>
                      {usersQuery.isError && (
                        <p className="mt-1.5 text-[10px] text-red-500 font-medium">Não foi possível carregar os usuários.</p>
                      )}
                    </div>

                    {/* Produto */}
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Sistema / Produto</label>
                      <input required type="text" name="product" value={formData.product} onChange={handleChange}
                        placeholder="Ex: App SyncDesk"
                        className="w-full px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Criticidade */}
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Criticidade</label>
                      <div className="relative">
                        <select name="criticality" value={formData.criticality} onChange={handleChange}
                          className="w-full appearance-none px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-all pr-9">
                          <option value="low">Baixa</option>
                          <option value="medium">Média</option>
                          <option value="high">Alta</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                      </div>
                    </div>

                    {/* Tipo */}
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Tipo</label>
                      <div className="relative">
                        <select name="type" value={formData.type} onChange={handleChange}
                          className="w-full appearance-none px-4 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-all pr-9">
                          <option value="issue">Problema</option>
                          <option value="request">Solicitação</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Descrição</label>
                    <textarea required name="description" value={formData.description} onChange={handleChange}
                      rows={6} placeholder="Descreva o que está acontecendo..."
                      className="w-full px-4 py-3 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-xl text-sm resize-none outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-all" />
                  </div>

                  {errorMessage && <p className="text-red-500 text-sm font-medium">{errorMessage}</p>}
                </form>
              </div>

              {/* Attachments panel */}
              <div>
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-5 sticky top-6">
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Paperclip size={12} /> Anexar Prints
                  </p>

                  <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[var(--border-default)] rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[var(--bg-hover)] hover:border-[var(--accent)]/30 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] group-hover:bg-[var(--accent-subtle)] flex items-center justify-center transition-colors">
                      <Plus size={20} className="text-[var(--text-faint)] group-hover:text-[var(--accent-text)] transition-colors" />
                    </div>
                    <span className="text-[11px] text-[var(--text-faint)] font-bold uppercase text-center">Selecionar Arquivos</span>
                  </button>

                  <p className="mt-3 text-[10px] leading-4 text-[var(--text-faint)] text-center">
                    Os arquivos ficam pré-selecionados nesta tela. O envio real depende do endpoint de anexos.
                  </p>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between bg-[var(--bg-subtle)] p-3 rounded-xl border border-[var(--border-subtle)]">
                          <span className="text-[11px] text-[var(--text-muted)] font-medium truncate max-w-[140px]">{file.name}</span>
                          <button type="button" onClick={() => removeFile(index)} className="text-[var(--text-faint)] hover:text-red-500 transition-colors shrink-0 ml-2">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center gap-2 text-[var(--text-faint)] uppercase tracking-widest text-[10px] font-bold mt-12 mb-10">
              <RefreshCcw size={14} />
              Sincronizado via API
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// --- Funções Auxiliares (Lógica Refatorada) ---

function normalizeUsersResponse(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data?.items)) return data.data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

function getUserDisplayName(user) {
  const name = user?.name || user?.username || user?.email || 'Usuário sem nome'
  const email = user?.email && user.email !== name ? ` - ${user.email}` : ''
  return `${name}${email}`
}

function extractApiError(error, fallback) {
  const data = error?.response?.data
  const detail = data?.detail

  if (Array.isArray(detail)) return detail.map((item) => item?.msg || item?.message || String(item)).join(' ')
  if (typeof detail === 'string') return detail
  if (typeof data?.message === 'string') return data.message
  if (typeof data?.error === 'string') return data.error

  return fallback
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