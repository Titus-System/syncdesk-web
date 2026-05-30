import { useEffect, useRef, useState } from 'react'
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
  ShieldCheck,
  BarChart3,
  Settings,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Pencil,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useUserQuery } from '@/features/users/hooks/useUserQuery'
import { usePatchUserMutation } from '@/features/users/hooks/usePatchUserMutation'
import { usePatchUserRolesMutation } from '@/features/users/hooks/useUpdateUserRolesMutation'
import { useDeactivateUserMutation } from '@/features/users/hooks/useDeactivateUserMutation'
import { getRoleInfo } from '@/features/users/utils/role-utils'

const CARGO_OPTIONS = [
  { key: 'admin', label: 'Gerente',  roleId: 1, description: 'Supervisiona toda a equipe e finanças.',  icon: <Briefcase size={20} /> },
  { key: 'agent', label: 'Operador', roleId: 3, description: 'Gerencia os tickets e atende clientes.',   icon: <CheckCircle2 size={20} /> },
  { key: 'user',  label: 'Suporte',  roleId: 2, description: 'Auxilia clientes e fecha tickets.',         icon: <ShieldCheck size={20} /> },
]

const PERMISSIONS_CONFIG = [
  { key: 'manage_users',    label: 'Gerenciar Usuários',       description: 'Capacidade de criar, editar e desativar perfis.',     icon: <Users size={16} /> },
  { key: 'manage_tickets',  label: 'Gerenciar Chamados',       description: 'Atribuição de chamados e resolução de tickets.',        icon: <Ticket size={16} /> },
  { key: 'view_reports',    label: 'Ver Relatórios',           description: 'Acesso ao dashboard de métricas e relatórios.',         icon: <BarChart3 size={16} /> },
  { key: 'system_settings', label: 'Configurações do Sistema', description: 'Alteração de preferências globais da plataforma.',     icon: <Settings size={16} /> },
]

export default function EditarAtendente() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const clearSession = useAuthStore((state) => state.clearSession)
  const loggedUser = useAuthStore((state) => state.user)
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const menuRef = useRef(null)

  const userQuery = useUserQuery(userId)
  const patchUserMutation = usePatchUserMutation()
  const patchUserRolesMutation = usePatchUserRolesMutation()
  const deactivateUserMutation = useDeactivateUserMutation()

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

  if (userQuery.isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[var(--bg-page)] font-bold text-[#500D0D] animate-pulse uppercase">Carregando...</div>
  }
  if (userQuery.isError || !userQuery.data) {
    return <div className="flex h-screen items-center justify-center bg-[var(--bg-page)] font-bold text-red-500 uppercase">Erro ao carregar usuário</div>
  }

  return (
    <EditarAtendenteForm
      user={userQuery.data}
      userId={userId}
      menuPerfilAberto={menuPerfilAberto}
      setMenuPerfilAberto={setMenuPerfilAberto}
      menuRef={menuRef}
      onLogout={handleLogout}
      navigate={navigate}
      patchUserMutation={patchUserMutation}
      patchUserRolesMutation={patchUserRolesMutation}
      deactivateUserMutation={deactivateUserMutation}
      loggedUser={loggedUser}
    />
  )
}

function EditarAtendenteForm({
  user, userId, menuPerfilAberto, setMenuPerfilAberto, menuRef,
  onLogout, navigate, patchUserMutation, patchUserRolesMutation, deactivateUserMutation, loggedUser,
}) {
  const initialRole = getRoleInfo(user)
  const initials = getInitials(user.name || user.username)
  const initialCargo = CARGO_OPTIONS.find((c) => c.key === initialRole.key) ? initialRole.key : 'agent'

  const [nome, setNome] = useState(user.name || '')
  const [email, setEmail] = useState(user.email || '')
  const [isActive, setIsActive] = useState(Boolean(user.is_active ?? user.isActive))
  const [selectedCargo, setSelectedCargo] = useState(initialCargo)
  const [editandoNome, setEditandoNome] = useState(false)
  const [permissions, setPermissions] = useState({
    manage_users:    user.permissions?.manage_users    ?? false,
    manage_tickets:  user.permissions?.manage_tickets  ?? true,
    view_reports:    user.permissions?.view_reports    ?? true,
    system_settings: user.permissions?.system_settings ?? false,
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [revogarErrorMessage, setRevogarErrorMessage] = useState('')
  const [showDangerConfirm, setShowDangerConfirm] = useState(false)

  const isSaving = patchUserMutation.isPending || patchUserRolesMutation.isPending

  function togglePermission(key) {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleUpdate(event) {
    event.preventDefault()
    setErrorMessage('')
    try {
      await patchUserMutation.mutateAsync({
        userId,
        payload: {
          email: email.trim().toLowerCase(),
          name: nome.trim(),
          username: user.username,
          oauth_provider: user.oauth_provider ?? 'local',
          oauth_provider_id: user.oauth_provider_id ?? `local_${user.id}`,
          is_active: isActive,
          is_verified: user.is_verified ?? false,
        },
      })
      const selectedCargoOption = CARGO_OPTIONS.find((c) => c.key === selectedCargo)
      const initialCargoOption  = CARGO_OPTIONS.find((c) => c.key === initialCargo)
      if (selectedCargoOption && selectedCargoOption.key !== initialCargo) {
        await patchUserRolesMutation.mutateAsync({
          userId,
          addRoleIds: [selectedCargoOption.roleId],
          removeRoleIds: initialCargoOption ? [initialCargoOption.roleId] : [],
        })
      }
      navigate('/usuarios', { replace: true })
    } catch (error) {
      const detail = error.response?.data?.detail
      setErrorMessage(detail?.[0]?.msg || error.response?.data?.message || String(detail || '') || 'Erro ao atualizar atendente.')
    }
  }

  async function handleToggleStatus() {
    setRevogarErrorMessage('')
    try {
      if (isActive) {
        await deactivateUserMutation.mutateAsync(userId)
        setIsActive(false)
        setShowDangerConfirm(false)
      } else {
        await patchUserMutation.mutateAsync({
          userId,
          payload: {
            email: user.email,
            name: user.name,
            username: user.username,
            oauth_provider: user.oauth_provider ?? 'local',
            oauth_provider_id: user.oauth_provider_id ?? `local_${user.id}`,
            is_active: true,
            is_verified: user.is_verified ?? false,
          },
        })
        setIsActive(true)
        setShowDangerConfirm(false)
      }
    } catch (error) {
      const detail = error?.response?.data?.detail
      setRevogarErrorMessage(detail?.[0]?.msg || error?.response?.data?.message || String(detail || '') || 'Erro ao alterar status.')
      setShowDangerConfirm(false)
    }
  }

  const ultimoAcesso = user.last_login
    ? new Date(user.last_login).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    : 'Hoje, às 14:23'

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
                  <NavItem icon={<Users size={16} />} label="Usuários"  active onClick={() => navigate('/usuarios')} />
                  <NavItem icon={<Ticket size={16} />} label="Chamados" onClick={() => navigate('/chamados')} />
                  <NavItem icon={<BarChart3 size={16} />} label="Relatórios" onClick={() => navigate('/relatorios')} />
                  <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => navigate('/chat')} />
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
            {/* Page header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Configurações do Atendente</h1>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigate('/usuarios')}
                  className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-4 py-2.5 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-hover)] flex items-center gap-1.5 transition-all">
                  <ArrowLeft size={13} /> Descartar
                </button>
                <button type="button" onClick={handleUpdate} disabled={isSaving}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50">
                  {isSaving ? <><Loader2 className="animate-spin" size={13} /> Salvando...</> : <><Save size={13} /> Salvar Alterações</>}
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
                {/* Left column */}
                <div className="flex flex-col gap-4">
                  {/* Profile card */}
                  <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-5 flex flex-col items-center text-center">
                    <div className="relative mb-3">
                      <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xl">
                        {initials}
                      </div>
                      <button type="button" onClick={() => setEditandoNome(true)}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-full flex items-center justify-center shadow-sm text-[var(--text-faint)] hover:text-[var(--accent-text)] transition-colors">
                        <Pencil size={11} />
                      </button>
                    </div>

                    {editandoNome ? (
                      <input autoFocus type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                        onBlur={() => setEditandoNome(false)}
                        className="text-sm font-bold text-[var(--text-primary)] text-center border-b border-[var(--accent)] outline-none w-full mb-1" />
                    ) : (
                      <p className="text-sm font-bold text-[var(--text-primary)] mb-0.5">{nome || user.username}</p>
                    )}

                    <p className="text-[11px] text-[var(--accent-text)] font-bold mb-1">
                      ID: #{String(user.id || '').slice(-8).toUpperCase().padStart(8, '0')}
                    </p>

                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="text-xs text-[var(--text-faint)] text-center border-b border-transparent hover:border-[var(--border-default)] focus:border-[var(--accent)] outline-none w-full mb-3 transition-colors" />

                    <span className="text-[9px] font-bold px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 uppercase tracking-wide">
                      Verificado
                    </span>

                    <div className="w-full border-t border-[var(--border-subtle)] mt-4 pt-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Status</span>
                        <span className={`text-[10px] font-bold ${isActive ? 'text-green-600' : 'text-red-500'}`}>{isActive ? 'Ativo' : 'Inativo'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Último Acesso</span>
                        <span className="text-[10px] text-[var(--text-faint)]">{ultimoAcesso}</span>
                      </div>
                    </div>
                  </div>

                  {/* Danger zone / Reactivate zone */}
                  <div className={`bg-[var(--bg-card)] rounded-2xl border shadow-sm p-4 ${isActive ? 'border-red-100' : 'border-green-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isActive ? <AlertTriangle size={13} className="text-red-500" /> : <ShieldCheck size={13} className="text-green-500" />}
                      <p className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-red-500' : 'text-green-600'}`}>
                        {isActive ? 'Zona de Perigo' : 'Conta Suspensa'}
                      </p>
                    </div>
                    <p className="text-[10px] text-[var(--text-faint)] mb-3 leading-relaxed">
                      {isActive 
                        ? 'Revogar o perfil impede que o usuário acesse qualquer sistema indevidamente. Esta ação desativará a conta.' 
                        : 'Reativar o perfil permitirá que o usuário volte a acessar o sistema com suas permissões normais.'}
                    </p>
                    {revogarErrorMessage && <p className="text-[10px] text-red-600 font-medium mb-2">{revogarErrorMessage}</p>}
                    {showDangerConfirm ? (
                      <div className="flex flex-col gap-2">
                        <p className={`text-[10px] font-medium ${isActive ? 'text-red-600' : 'text-green-600'}`}>
                          Tem certeza? Esta ação {isActive ? 'desativará' : 'reativará'} o usuário.
                        </p>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleToggleStatus} disabled={deactivateUserMutation.isPending || patchUserMutation.isPending}
                            className={`flex-1 text-white text-[10px] font-bold py-1.5 rounded-lg disabled:opacity-50 ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                            {(deactivateUserMutation.isPending || patchUserMutation.isPending) ? 'Processando...' : 'Confirmar'}
                          </button>
                          <button type="button" onClick={() => setShowDangerConfirm(false)}
                            className="flex-1 bg-[var(--bg-muted)] text-[var(--text-muted)] text-[10px] font-bold py-1.5 rounded-lg">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowDangerConfirm(true)}
                        className={`w-full border text-[10px] font-bold py-2 rounded-xl transition-colors uppercase ${isActive ? 'border-red-400 text-red-600 hover:bg-red-50' : 'border-green-500 text-green-600 hover:bg-green-50'}`}>
                        {isActive ? 'Revogar Perfil' : 'Reativar Perfil'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-4">
                  {/* Cargo */}
                  <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase size={14} className="text-[var(--accent-text)]" />
                      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Atribuição de Cargo</h3>
                    </div>
                    <p className="text-[10px] text-[var(--text-faint)] mb-4">Selecione o cargo do atendente. A alteração será salva ao clicar em "Salvar Alterações".</p>
                    <div className="grid grid-cols-3 gap-3">
                      {CARGO_OPTIONS.map((cargo) => {
                        const isSelected = selectedCargo === cargo.key
                        return (
                          <button key={cargo.key} type="button" onClick={() => setSelectedCargo(cargo.key)}
                            className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                              isSelected ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]'
                            }`}>
                            {isSelected && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--accent)]" />}
                            <div className={`mb-2 ${isSelected ? 'text-[var(--accent-text)]' : 'text-[var(--text-faint)]'}`}>{cargo.icon}</div>
                            <p className={`text-xs font-bold mb-0.5 ${isSelected ? 'text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}>{cargo.label}</p>
                            <p className="text-[10px] text-[var(--text-faint)] leading-relaxed">{cargo.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">{errorMessage}</div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

function getInitials(name) {
  return name?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '??'
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
        active ? 'bg-[var(--accent)] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}>
      {icon} {label}
    </button>
  )
}