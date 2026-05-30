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
  Building2,
  ShieldAlert,
  StickyNote,
  Package,
  Settings,
  BarChart3,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useUserQuery } from '@/features/users/hooks/useUserQuery'
import { usePatchUserMutation } from '@/features/users/hooks/usePatchUserMutation'
import { useDeactivateUserMutation } from '@/features/users/hooks/useDeactivateUserMutation'

export default function EditarCliente() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const clearSession = useAuthStore((state) => state.clearSession)
  const loggedUser = useAuthStore((state) => state.user)
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const menuRef = useRef(null)

  const userQuery = useUserQuery(userId)
  const patchUserMutation = usePatchUserMutation()
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
    <EditarClienteForm
      user={userQuery.data}
      userId={userId}
      menuPerfilAberto={menuPerfilAberto}
      setMenuPerfilAberto={setMenuPerfilAberto}
      menuRef={menuRef}
      onLogout={handleLogout}
      navigate={navigate}
      patchUserMutation={patchUserMutation}
      deactivateUserMutation={deactivateUserMutation}
      loggedUser={loggedUser}
    />
  )
}

function EditarClienteForm({ user, userId, menuPerfilAberto, setMenuPerfilAberto, menuRef, onLogout, navigate, patchUserMutation, deactivateUserMutation, loggedUser }) {
  const isActiveInitial = Boolean(user.is_active ?? user.isActive)
  const initials = getInitials(user.name || user.username)

  const [nome, setNome] = useState(user.name || '')
  const [email, setEmail] = useState(user.email || '')
  const [isActive, setIsActive] = useState(isActiveInitial)
  const [notasInternas, setNotasInternas] = useState(user.internal_notes || '')
  const [produtoContratado, setProdutoContratado] = useState(user.contracted_product || '')
  const [dataExpiracao, setDataExpiracao] = useState(user.contract_expiration || '')
  const [errorMessage, setErrorMessage] = useState('')
  const [suspendErrorMessage, setSuspendErrorMessage] = useState('')
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false)

  async function handleUpdate(event) {
    event.preventDefault()
    setErrorMessage('')
    const payload = {
      email: email.trim().toLowerCase(),
      name: nome.trim(),
      username: user.username,
      oauth_provider: user.oauth_provider ?? 'local',
      oauth_provider_id: user.oauth_provider_id ?? `local_${user.id}`,
      is_active: isActive,
      is_verified: user.is_verified ?? false,
    }
    try {
      await patchUserMutation.mutateAsync({ userId, payload })
      navigate('/usuarios', { replace: true })
    } catch (error) {
      const detail = error.response?.data?.detail
      setErrorMessage(detail?.[0]?.msg || error.response?.data?.message || String(detail || '') || 'Erro ao atualizar usuário.')
    }
  }

  async function handleToggleSuspend() {
    setSuspendErrorMessage('')
    try {
      if (isActive) {
        await deactivateUserMutation.mutateAsync(userId)
        setIsActive(false)
        setShowSuspendConfirm(false)
      } else {
        await patchUserMutation.mutateAsync({
          userId,
          payload: {
            email: user.email, name: user.name, username: user.username,
            password_hash: user.password_hash ?? '',
            oauth_provider: user.oauth_provider ?? 'local',
            oauth_provider_id: user.oauth_provider_id ?? `local_${user.id}`,
            is_active: true, is_verified: user.is_verified ?? false,
          },
        })
        setIsActive(true)
        setShowSuspendConfirm(false)
      }
    } catch (error) {
      const detail = error?.response?.data?.detail
      setSuspendErrorMessage(detail?.[0]?.msg || error?.response?.data?.message || String(detail || '') || 'Erro ao alterar status.')
      setShowSuspendConfirm(false)
    }
  }

  const clienteSinceLabel = user.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    : 'data não disponível'

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
            {/* Client header card */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-5 mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-lg shadow-sm">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">{nome || user.username}</h2>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                      {isActive ? 'Ativo' : 'Suspenso'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-faint)]">Cliente Premium desde {clienteSinceLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigate('/usuarios')}
                  className="text-xs font-bold text-[var(--text-muted)] px-4 py-2.5 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-hover)] flex items-center gap-1.5 transition-all">
                  <ArrowLeft size={13} /> Descartar
                </button>
                <button type="button" onClick={handleUpdate} disabled={patchUserMutation.isPending}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50">
                  {patchUserMutation.isPending ? <><Loader2 className="animate-spin" size={13} /> Salvando...</> : <><Save size={13} /> Salvar Alterações</>}
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
                {/* Left column */}
                <div className="flex flex-col gap-5">
                  {/* Corporate data */}
                  <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Building2 size={14} className="text-[var(--accent-text)]" />
                      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Dados Corporativos</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5">Nome da Empresa</label>
                        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-colors"
                          placeholder="Nome do responsável" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5">E-mail Corporativo</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-colors"
                          placeholder="email@empresa.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5">Produto Contratado</label>
                        <input type="text" value={produtoContratado} onChange={(e) => setProdutoContratado(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-colors"
                          placeholder="Ex: Nexus Enterprise Pro" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5">Data de Expiração do Contrato</label>
                        <input type="date" value={dataExpiracao} onChange={(e) => setDataExpiracao(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-colors" />
                      </div>
                    </div>
                    <button type="button"
                      className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-2 transition-all shadow-sm">
                      <Package size={13} /> Adicionar Produto
                    </button>
                  </div>

                  {/* Internal notes */}
                  <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <StickyNote size={14} className="text-[var(--accent-text)]" />
                      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Notas Internas</h3>
                    </div>
                    <textarea value={notasInternas} onChange={(e) => setNotasInternas(e.target.value)} rows={5}
                      placeholder="Insira observações administrativas confidenciais sobre este cliente..."
                      className="w-full px-4 py-3 border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] transition-colors resize-none placeholder:text-[var(--text-faint)]" />
                    <p className="text-[10px] text-[var(--text-faint)] mt-2 italic">* Essas notas são visíveis apenas para administradores do sistema.</p>
                  </div>

                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">{errorMessage}</div>
                  )}
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-4">
                  {/* Security */}
                  <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldAlert size={14} className="text-[var(--accent-text)]" />
                      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Segurança</h3>
                    </div>
                    <p className="text-[10px] text-[var(--text-faint)] uppercase font-bold mb-3">Ações da Conta</p>
                    {suspendErrorMessage && <p className="text-[10px] text-red-600 font-medium mb-3">{suspendErrorMessage}</p>}
                    {showSuspendConfirm ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs text-red-700 font-medium mb-3">{isActive ? 'Suspender' : 'Reativar'} o acesso deste cliente?</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleToggleSuspend}
                            disabled={deactivateUserMutation.isPending || patchUserMutation.isPending}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-1.5 rounded-lg disabled:opacity-50">
                            {(deactivateUserMutation.isPending || patchUserMutation.isPending) ? 'Salvando...' : 'Confirmar'}
                          </button>
                          <button type="button" onClick={() => setShowSuspendConfirm(false)}
                            className="flex-1 bg-[var(--bg-muted)] hover:bg-gray-200 text-[var(--text-muted)] text-[10px] font-bold py-1.5 rounded-lg">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowSuspendConfirm(true)}
                        className={`w-full flex items-center justify-center gap-2 text-[10px] font-bold py-2.5 px-4 rounded-xl border transition-all ${
                          isActive ? 'border-red-400 text-red-600 bg-red-50 hover:bg-red-100' : 'border-green-500 text-green-600 bg-green-50 hover:bg-green-100'
                        }`}>
                        {isActive ? '↓ Suspender Acesso' : '↑ Reativar Acesso'}
                      </button>
                    )}
                  </div>

                  {/* Priority support card */}
                  <div className="bg-[var(--bg-sidebar)] rounded-2xl p-5 text-white">
                    <p className="text-[9px] font-bold uppercase text-white/50 mb-2 tracking-wider">Suporte Prioritário</p>
                    <p className="text-xs text-white/80 leading-relaxed mb-4">
                      Este cliente possui SLA de resposta de 2 horas. Contato direto com o Key Account Manager disponível.
                    </p>
                    <button type="button" className="text-[10px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider transition-colors">
                      Abrir Canal de Suporte →
                    </button>
                  </div>
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