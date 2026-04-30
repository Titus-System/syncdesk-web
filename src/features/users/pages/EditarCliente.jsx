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
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useUserQuery } from '@/features/users/hooks/useUserQuery'
import { usePatchUserMutation } from '@/features/users/hooks/usePatchUserMutation'

export default function EditarCliente() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const clearSession = useAuthStore((state) => state.clearSession)
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const menuRef = useRef(null)

  const userQuery = useUserQuery(userId)
  const patchUserMutation = usePatchUserMutation()

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

  if (userQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4EAD9] font-bold text-[#500D0D] animate-pulse uppercase">
        Carregando...
      </div>
    )
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4EAD9] font-bold text-red-500 uppercase">
        Erro ao carregar usuário
      </div>
    )
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
    />
  )
}

function EditarClienteForm({ user, userId, menuPerfilAberto, setMenuPerfilAberto, menuRef, onLogout, navigate, patchUserMutation }) {
  const isActiveInitial = Boolean(user.is_active ?? user.isActive)
  const initials = getInitials(user.name || user.username)

  const [nome, setNome] = useState(user.name || '')
  const [email, setEmail] = useState(user.email || '')
  const [isActive, setIsActive] = useState(isActiveInitial)
  const [notasInternas, setNotasInternas] = useState(user.internal_notes || '')
  const [produtoContratado, setProdutoContratado] = useState(user.contracted_product || '')
  const [dataExpiracao, setDataExpiracao] = useState(user.contract_expiration || '')
  const [errorMessage, setErrorMessage] = useState('')
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false)

  async function handleUpdate(event) {
    event.preventDefault()
    setErrorMessage('')

    // Apenas campos aceitos pelo PATCH /api/users/{id}
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
      const message =
        detail?.[0]?.msg ||
        error.response?.data?.message ||
        String(detail || '') ||
        'Erro ao atualizar usuário.'
      setErrorMessage(message)
    }
  }

  function handleToggleSuspend() {
    setIsActive((prev) => !prev)
    setShowSuspendConfirm(false)
  }

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden text-[#1E293B]">
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <UserIcon size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
          </div>
          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => navigate('/')} />
            <NavItem icon={<Users size={16} />} label="Usuários" active onClick={() => navigate('/usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" onClick={() => navigate('/chamados')} />
            <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => navigate('/chat')} />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1" />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuPerfilAberto((v) => !v)}
              className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <UserIcon size={20} className="text-white/90" />
            </button>
            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-48 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase"
                >
                  <LogOut size={14} />
                  Sair da Conta
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="w-full max-w-5xl mx-auto">

            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-lg">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{nome || user.username}</h2>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {isActive ? 'ATIVO' : 'SUSPENSO'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Cliente desde{' '}
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                      : 'data não disponível'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/usuarios')}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={patchUserMutation.isPending}
                  className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {patchUserMutation.isPending ? (
                    <><Loader2 className="animate-spin" size={14} /> Salvando...</>
                  ) : (
                    <><Save size={14} /> Salvar Alterações</>
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

                {/* Coluna esquerda */}
                <div className="flex flex-col gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Building2 size={15} className="text-[#BD3B0F]" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Dados Corporativos</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Nome</label>
                        <input
                          type="text"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-[#BD3B0F] transition-colors"
                          placeholder="Nome do responsável"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">E-mail Corporativo</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-[#BD3B0F] transition-colors"
                          placeholder="email@empresa.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Produto Contratado</label>
                        <input
                          type="text"
                          value={produtoContratado}
                          onChange={(e) => setProdutoContratado(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-[#BD3B0F] transition-colors"
                          placeholder="Ex: Nexus Enterprise Pro"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Data de Expiração do Contrato</label>
                        <input
                          type="date"
                          value={dataExpiracao}
                          onChange={(e) => setDataExpiracao(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-[#BD3B0F] transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-bold py-2 px-5 rounded-lg flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Package size={13} />
                      Adicionar Produto
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <StickyNote size={15} className="text-[#BD3B0F]" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Notas Internas</h3>
                    </div>
                    <textarea
                      value={notasInternas}
                      onChange={(e) => setNotasInternas(e.target.value)}
                      rows={5}
                      placeholder="Insira observações administrativas confidenciais sobre este cliente..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#BD3B0F] transition-colors resize-none placeholder:text-gray-300"
                    />
                    <p className="text-[10px] text-gray-400 mt-2 italic">
                      * Essas notas são visíveis apenas para administradores do sistema.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                      {errorMessage}
                    </div>
                  )}
                </div>

                {/* Coluna direita */}
                <div className="flex flex-col gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldAlert size={15} className="text-[#BD3B0F]" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Segurança</h3>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-3">Ações da Conta</p>

                    {showSuspendConfirm ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs text-red-700 font-medium mb-3">
                          {isActive ? 'Suspender' : 'Reativar'} o acesso deste cliente?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleToggleSuspend}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSuspendConfirm(false)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowSuspendConfirm(true)}
                        className={`w-full flex items-center gap-2 text-[10px] font-bold py-2.5 px-4 rounded-xl border transition-all ${
                          isActive
                            ? 'border-red-400 text-red-600 bg-red-50 hover:bg-red-100'
                            : 'border-green-500 text-green-600 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        <ShieldAlert size={13} />
                        {isActive ? '↓ Suspender Acesso' : '↑ Reativar Acesso'}
                      </button>
                    )}
                  </div>

                  <div className="bg-[#500D0D] rounded-2xl p-5 text-white">
                    <p className="text-[10px] font-bold uppercase text-white/60 mb-1">Suporte Prioritário</p>
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
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${
        active ? 'bg-[#BD3B0F] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  )
}