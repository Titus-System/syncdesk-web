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
  RefreshCcw,
  Loader2
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useUserQuery } from '@/features/users/hooks/useUserQuery'
import { usePatchUserMutation } from '@/features/users/hooks/usePatchUserMutation'
import { getRoleInfo, ROLE_OPTIONS } from '@/features/users/utils/role-utils'

export default function EditarUsuario() {
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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
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
    <EditarUsuarioForm
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

function EditarUsuarioForm({
  user,
  userId,
  menuPerfilAberto,
  setMenuPerfilAberto,
  menuRef,
  onLogout,
  navigate,
  patchUserMutation
}) {
  const initialRole = getRoleInfo(user)

  const [nome, setNome] = useState(user.name || '')
  const [email, setEmail] = useState(user.email || '')
  const [isActive, setIsActive] = useState(Boolean(user.is_active ?? user.isActive))
  const [selectedRole, setSelectedRole] = useState(initialRole.key === 'unknown' ? 'user' : initialRole.key)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleUpdate(event) {
    event.preventDefault()
    setErrorMessage('')

    const selectedRoleOption = ROLE_OPTIONS.find((role) => role.key === selectedRole)

    const payload = {
      email: email.trim().toLowerCase(),
      name: nome.trim(),
      username: user.username,
      is_active: isActive,
      role_ids: selectedRoleOption ? [selectedRoleOption.roleId] : []
    }

    try {
      await patchUserMutation.mutateAsync({
        userId,
        payload
      })

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
            <NavItem icon={<Users size={16} />} label="Usuários" active onClick={() => navigate('/usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" onClick={() => navigate('/chamados')} />
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
          <div className="w-full max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 uppercase">Editar Perfil</h1>
                <p className="text-gray-500 text-sm mt-1.5 opacity-60">Editando: {user.username}</p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/usuarios')}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#500D0D] uppercase"
              >
                <ArrowLeft size={16} />
                Voltar
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10">
              <form className="flex flex-col gap-8" onSubmit={handleUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">Nome Completo</label>
                    <input
                      required
                      type="text"
                      value={nome}
                      onChange={(event) => setNome(event.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#BD3B0F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">E-mail</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#BD3B0F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">Role</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => setSelectedRole(role.key)}
                        className={`px-4 py-3 rounded-lg text-sm font-bold border transition-all ${selectedRole === role.key
                          ? 'border-[#BD3B0F] bg-[#fff8f6] text-[#BD3B0F]'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-xs font-bold text-gray-800 uppercase">Status da Conta:</label>
                  <button
                    type="button"
                    onClick={() => setIsActive((value) => !value)}
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold transition-all border ${isActive
                      ? 'border-green-500 bg-green-50 text-green-600'
                      : 'border-red-500 bg-red-50 text-red-600'
                      }`}
                  >
                    {isActive ? 'CONTA ATIVA' : 'CONTA INATIVA'}
                  </button>
                </div>

                {errorMessage && (
                  <p className="text-red-500 text-sm font-medium">{errorMessage}</p>
                )}

                <div className="flex justify-end items-center gap-5">
                  <button
                    type="button"
                    onClick={() => navigate('/usuarios')}
                    className="text-xs font-bold text-gray-400 uppercase"
                  >
                    Descartar
                  </button>

                  <button
                    type="submit"
                    disabled={patchUserMutation.isPending}
                    className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white font-bold py-3 px-10 rounded-lg shadow-lg flex items-center gap-2 text-sm uppercase disabled:opacity-50"
                  >
                    {patchUserMutation.isPending ? (
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

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white' : 'text-white/60 hover:bg-white/10'}`}
    >
      {icon} {label}
    </button>
  )
}