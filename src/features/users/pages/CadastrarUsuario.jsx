import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Ticket,
  User as UserIcon,
  UserPlus,
  LogOut,
  MessageSquare,
  Loader2,
  Settings,
  BarChart3,
  ShieldCheck,
  Info,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useCreateUserMutation } from '@/features/users/hooks/useCreateUserMutation'
import { ROLE_OPTIONS } from '@/features/users/utils/role-utils'

export default function CadastrarUsuario() {
  const navigate     = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const loggedUser   = useAuthStore((state) => state.user)

  const [nome,            setNome           ] = useState('')
  const [email,           setEmail          ] = useState('')
  const [senhaTemporaria, setSenhaTemporaria ] = useState('')
  const [setor,           setSetor          ] = useState('')
  const [empresa,         setEmpresa        ] = useState('')
  const [produto,         setProduto        ] = useState('')
  const [dataExpiracao,   setDataExpiracao  ] = useState('')
  // 'agent' = atendente padrão | 'admin' = atendente administrador | 'client' = cliente
  const [selectedRole,    setSelectedRole   ] = useState('agent')
  const [isAdmin,         setIsAdmin        ] = useState(false)
  const [menuPerfilAberto,setMenuPerfilAberto] = useState(false)
  const [errorMessage,    setErrorMessage   ] = useState('')

  const profileType = selectedRole === 'client' ? 'client' : 'attendant'

  const menuRef          = useRef(null)
  const createUserMutation = useCreateUserMutation()

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

  function buildUsernameFromEmail(value) {
    const cleanUsername = value.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
    const uniqueSuffix  = Date.now().toString().slice(-5)
    return `${cleanUsername}${uniqueSuffix}`.toLowerCase()
  }

  async function handleCadastro(event) {
    event.preventDefault()
    setErrorMessage('')

    const normalizedEmail     = email.trim().toLowerCase()
    const username            = buildUsernameFromEmail(normalizedEmail)
    // Resolve a role correta:
    // - Cliente           → 'client'
    // - Atendente + Admin → 'admin'
    // - Atendente normal  → 'agent'
    const resolvedRoleKey =
      profileType === 'client'
        ? 'client'
        : isAdmin
          ? 'admin'
          : 'agent'
    const selectedRoleOption = ROLE_OPTIONS.find((role) => role.key === resolvedRoleKey)

    const payload = {
      email:             normalizedEmail,
      name:              nome.trim(),
      username,
      password_hash:     senhaTemporaria,
      oauth_provider:    'local',
      oauth_provider_id: `local_${Date.now()}`,
      is_active:         true,
      is_verified:       true,
      must_change_password: true,
      must_accept_terms:    true,
      role_ids: selectedRoleOption ? [selectedRoleOption.roleId] : [],
    }

    try {
      await createUserMutation.mutateAsync(payload)
      navigate('/usuarios', { replace: true })
    } catch (error) {
      const detail  = error.response?.data?.detail
      const message =
        detail?.[0]?.msg ||
        error.response?.data?.message ||
        String(detail || '') ||
        'Erro ao cadastrar usuário.'
      setErrorMessage(message)
    }
  }

  /* ─── helpers de estilo de botão toggle ─────────────────────────── */
  function toggleCls(active) {
    return active
      ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)]'
      : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
  }

  return (
    <div className="flex h-screen bg-[var(--bg-page)] font-sans overflow-hidden text-[var(--text-primary)]">

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-[var(--bg-sidebar)] flex flex-col text-white/90 z-20 shrink-0">
        <div className="p-5 flex items-center gap-3">
          <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-sm">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
        </div>

        <nav className="mt-2 px-3 flex flex-col gap-1">
          <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard"  onClick={() => navigate('/')} />
          <NavItem icon={<Users size={16} />}           label="Usuários"   active onClick={() => navigate('/usuarios')} />
          <NavItem icon={<Ticket size={16} />}          label="Chamados"   onClick={() => navigate('/chamados')} />
          <NavItem icon={<BarChart3 size={16} />}       label="Relatórios" onClick={() => navigate('/relatorios')} />
          <NavItem icon={<MessageSquare size={16} />}   label="Chat"       onClick={() => navigate('/chat')} />
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Header */}
        <header className="bg-[var(--bg-sidebar)] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <p className="text-xs text-white/50 font-medium">Portal Admin</p>
          <div className="relative" ref={menuRef}>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="w-full max-w-2xl mx-auto">

            {/* Título fora do card */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Cadastrar Novo Usuário</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Preencha os dados abaixo para registrar um novo perfil de acesso no sistema.
              </p>
            </div>

            {/* Card */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm px-8 py-7">
              <form onSubmit={handleCadastro} className="flex flex-col gap-6">

                {/* ── Linha de toggles: varia conforme profileType ── */}
                {profileType === 'attendant' ? (
                  /* Atendente: Perfil de Acesso + Administrador na mesma linha */
                  <div className="grid grid-cols-2 gap-6">
                    {/* Perfil de Acesso */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2.5">
                        Perfil de Acesso
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setSelectedRole('agent'); setIsAdmin(false) }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${toggleCls(profileType === 'attendant')}`}
                        >
                          <ShieldCheck size={14} /> Atendente
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSelectedRole('client'); setIsAdmin(false) }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${toggleCls(false)}`}
                        >
                          <UserIcon size={14} /> Cliente
                        </button>
                      </div>
                    </div>

                    {/* Administrador */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2.5">
                        Administrador
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAdmin(true)}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${toggleCls(isAdmin)}`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAdmin(false)}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${toggleCls(!isAdmin)}`}
                        >
                          Não
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Cliente: só Perfil de Acesso */
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2.5">
                      Perfil de Acesso
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedRole('agent'); setIsAdmin(false) }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${toggleCls(false)}`}
                      >
                        <ShieldCheck size={14} /> Atendente
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('client')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${toggleCls(true)}`}
                      >
                        <UserIcon size={14} /> Cliente
                      </button>
                    </div>
                  </div>
                )}

                {/* Nome Completo — sempre visível */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Nome Completo
                  </label>
                  <input
                    required
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: João Silva de Oliveira"
                    className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-faint)]"
                  />
                </div>

                {/* ── Campos específicos por perfil ── */}
                {profileType === 'attendant' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        E-mail Corporativo
                      </label>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="usuario@dominio.com.br"
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-faint)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Setor
                      </label>
                      <input
                        type="text"
                        value={setor}
                        onChange={(e) => setSetor(e.target.value)}
                        placeholder="Suporte N1"
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-faint)]"
                      />
                    </div>
                  </div>
                )}

                {profileType === 'client' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                          E-mail Corporativo
                        </label>
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="usuario@dominio.com.br"
                          className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-faint)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                          Empresa
                        </label>
                        <input
                          type="text"
                          value={empresa}
                          onChange={(e) => setEmpresa(e.target.value)}
                          placeholder=""
                          className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                          Produto
                        </label>
                        <input
                          type="text"
                          value={produto}
                          onChange={(e) => setProduto(e.target.value)}
                          placeholder=""
                          className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                          Data de Expiração
                        </label>
                        <input
                          type="date"
                          value={dataExpiracao}
                          onChange={(e) => setDataExpiracao(e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-all text-[var(--text-secondary)]"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Info notice */}
                <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3.5">
                  <Info size={15} className="text-[var(--accent-text)] shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--accent-text)]">
                    Um convite de ativação será enviado para o e-mail informado após a conclusão do cadastro.
                  </p>
                </div>

                {errorMessage && (
                  <p className="text-red-500 text-sm font-medium">{errorMessage}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate('/usuarios')}
                    className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-2.5 px-7 rounded-xl shadow-sm flex items-center gap-2 text-sm disabled:opacity-50 transition-all"
                  >
                    {createUserMutation.isPending ? (
                      <><Loader2 className="animate-spin" size={15} /> Cadastrando...</>
                    ) : (
                      <><UserPlus size={15} /> Cadastrar Usuário</>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Footer */}
            <p className="text-center text-[10px] text-[var(--text-faint)] font-bold uppercase tracking-widest mt-6 flex items-center justify-center gap-1.5">
              <ShieldCheck size={12} /> Processo de Segurança Validado
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
        active
          ? 'bg-[var(--accent)] text-white shadow-md'
          : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  )
}