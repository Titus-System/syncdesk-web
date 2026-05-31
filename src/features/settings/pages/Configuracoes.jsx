import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Ticket,
  MessageSquare,
  User as UserIcon,
  LogOut,
  Settings,
  Save,
  Loader2,
  BarChart3,
  Bell,
  Shield,
  Globe,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useNotificationStore } from '@/stores/notification-store'
import { useThemeStore } from '@/stores/useThemeStore'
import { usePatchUserMutation } from '@/features/users/hooks/usePatchUserMutation'
import NotificationBadge from '@/shared/components/NotificationBadge'

export default function Configuracoes() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const loggedUser = useAuthStore((state) => state.user)

  // Lógica de Notificações
  const unreadChatMessages = useNotificationStore((state) => state.unreadChatMessages)
  const ticketUpdates = useNotificationStore((state) => state.ticketUpdates)
  const clearUnreadChatMessages = useNotificationStore((state) => state.clearUnreadChatMessages)
  const clearTicketUpdates = useNotificationStore((state) => state.clearTicketUpdates)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const [nome, setNome] = useState(loggedUser?.name || '')
  const [email, setEmail] = useState(loggedUser?.email || '')
  const { tema, setTema } = useThemeStore()
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const menuRef = useRef(null)
  const patchUserMutation = usePatchUserMutation()

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

  async function handleSalvar(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    if (!loggedUser?.id) { setErrorMessage('Usuário não identificado.'); return }

    try {
      await patchUserMutation.mutateAsync({
        userId: loggedUser.id,
        payload: {
          name: nome.trim(),
          email: email.trim().toLowerCase(),
          username: loggedUser.username,
          oauth_provider: loggedUser.oauth_provider ?? 'local',
          oauth_provider_id: loggedUser.oauth_provider_id ?? `local_${loggedUser.id}`,
          is_active: loggedUser.is_active ?? true,
          is_verified: loggedUser.is_verified ?? true,
        },
      })
      setSuccessMessage('Alterações salvas com sucesso!')
    } catch (error) {
      const detail = error?.response?.data?.detail
      setErrorMessage(detail?.[0]?.msg || error?.response?.data?.message || String(detail || '') || 'Erro ao salvar alterações.')
    }
  }

  const initials = getInitials(loggedUser?.name || loggedUser?.username || '')

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
          <div className="w-full max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Configurações da Conta</h1>
              <p className="text-xs text-[var(--text-faint)] mt-1">Gerencie suas informações de perfil, preferências de segurança e notificações do sistema.</p>
            </div>

            {/* Profile card */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6 mb-4">
              <div className="flex items-center gap-2 mb-5">
                <UserIcon size={14} className="text-[var(--accent-text)]" />
                <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Informações do Perfil</h2>
              </div>

              <form onSubmit={handleSalvar} className="flex flex-col gap-5">
                {/* Avatar + name */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 text-[var(--accent-text)] flex items-center justify-center text-xl font-bold shrink-0 shadow-sm">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{loggedUser?.name || 'Usuário'}</p>
                    <p className="text-xs text-[var(--text-faint)]">{loggedUser?.email || ''}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Nome Completo</label>
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full px-4 py-3 border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] bg-transparent transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Endereço de E-mail</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] bg-transparent transition-all" />
                  </div>
                </div>

                {errorMessage   && <p className="text-red-500 text-sm font-medium">{errorMessage}</p>}
                {successMessage && <p className="text-emerald-600 text-sm font-medium">{successMessage}</p>}

                <div>
                  <button type="submit" disabled={patchUserMutation.isPending}
                    className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-2 px-6 rounded-xl shadow-sm flex items-center gap-2 text-xs uppercase tracking-wide disabled:opacity-50 transition-all">
                    {patchUserMutation.isPending ? <><Loader2 className="animate-spin" size={14} />Salvando...</> : <><Save size={14} />Salvar Alterações</>}
                  </button>
                </div>
              </form>
            </div>

            {/* System preferences */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6 mb-4">
              <div className="flex items-center gap-2 mb-5">
                <Settings size={14} className="text-[var(--accent-text)]" />
                <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Preferências do Sistema</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={13} className="text-[var(--text-faint)]" />
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Seleção do Idioma</label>
                  </div>
                  <select defaultValue="pt-BR"
                    className="w-full px-4 py-2 border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-all appearance-none">
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                  <p className="text-[11px] text-[var(--text-faint)] mt-1.5">Altera o idioma utilizado em toda a interface do painel.</p>
                </div>

                {/* Theme */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Settings size={13} className="text-[var(--text-faint)]" />
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Tema da Interface</label>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setTema('light')}
                      className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${tema === 'light' ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)]' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}>
                      ☀️ Modo Claro
                    </button>
                    <button type="button" onClick={() => setTema('dark')}
                      className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${tema === 'dark' ? 'border-[var(--accent)] bg-[var(--bg-sidebar)] text-white' : 'border-[var(--border-default)] bg-[var(--bg-sidebar)] text-white/60 hover:bg-[var(--bg-muted)]'}`}>
                      🌙 Modo Escuro
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6 mb-4">
              <div className="flex items-center gap-2 mb-5">
                <Bell size={14} className="text-[var(--accent-text)]" />
                <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Notificações</h2>
              </div>
              <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
                {[
                  { label: 'Novos chamados atribuídos',   sub: 'Receba alertas quando um chamado for atribuído a você.' },
                  { label: 'Atualizações de status',        sub: 'Seja notificado quando o status de um chamado for alterado.' },
                  { label: 'Mensagens no chat ao vivo',     sub: 'Alertas em tempo real de novas mensagens no chat.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)]">{item.label}</p>
                      <p className="text-[11px] text-[var(--text-faint)] mt-0.5">{item.sub}</p>
                    </div>
                    <ToggleSwitch defaultOn={i < 2} />
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6 mb-10">
              <div className="flex items-center gap-2 mb-5">
                <Shield size={14} className="text-[var(--accent-text)]" />
                <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Segurança</h2>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Autenticação em Dois Fatores</p>
                  <p className="text-[11px] text-[var(--text-faint)] mt-0.5">Adiciona uma camada extra de proteção à sua conta.</p>
                </div>
                <ToggleSwitch defaultOn={false} />
              </div>
              <div className="mt-5">
                <button type="button"
                  className="text-xs font-bold text-[var(--accent-text)] hover:text-[var(--accent-hover)] border border-[var(--accent)]/30 rounded-xl px-4 py-2 hover:bg-[var(--accent-subtle)] transition-all">
                  Alterar Senha
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ToggleSwitch({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button type="button" onClick={() => setOn((v) => !v)}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${on ? 'bg-[var(--accent)]' : 'bg-[var(--border-default)]'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function getInitials(name) {
  return name?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '??'
}

function NavItem({ icon, label, active, onClick, badgeCount = 0 }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${active ? 'bg-[var(--accent)] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
      {icon} 
      <span className="flex-1 text-left">{label}</span>
      <NotificationBadge count={badgeCount} />
    </button>
  )
}