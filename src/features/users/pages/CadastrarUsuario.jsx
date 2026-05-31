import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Ticket,
  User as UserIcon,
  UserPlus,
  RefreshCcw,
  LogOut,
  MessageSquare,
  Loader2,
  Settings
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useNotificationStore } from '@/stores/notification-store'
import { useCreateUserMutation } from '@/features/users/hooks/useCreateUserMutation'
import { CREATE_USER_ROLE_OPTIONS } from '@/features/users/utils/role-utils'
import NotificationBadge from '@/shared/components/NotificationBadge'

export default function CadastrarUsuario() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const loggedUser = useAuthStore((state) => state.user)
  const unreadChatMessages = useNotificationStore((state) => state.unreadChatMessages)
  const ticketUpdates = useNotificationStore((state) => state.ticketUpdates)
  const clearTicketUpdates = useNotificationStore((state) => state.clearTicketUpdates)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState('agent')
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const menuRef = useRef(null)

  const createUserMutation = useCreateUserMutation()

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

  function getErrorMessage(error) {
    const detail = error.response?.data?.detail

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item?.msg || item?.message || String(item))
        .join('\n')
    }

    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }

    if (error.response?.data?.message) {
      return error.response.data.message
    }

    return 'Erro ao cadastrar usuário.'
  }

  async function handleCadastro(event) {
    event.preventDefault()
    setErrorMessage('')

    const normalizedEmail = email.trim().toLowerCase()
    const selectedRoleOption = CREATE_USER_ROLE_OPTIONS.find((role) => role.key === selectedRole)

    if (!selectedRoleOption) {
      setErrorMessage('Selecione uma role válida para o usuário.')
      return
    }

    const payload = {
      email: normalizedEmail,
      name: nome.trim(),
      role_ids: [selectedRoleOption.roleId],
      level_ids: []
    }

    try {
      await createUserMutation.mutateAsync(payload)
      navigate('/usuarios', { replace: true })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="flex h-screen bg-[#f4ece1] font-sans overflow-hidden text-[#1E293B]">
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
          </div>

          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => navigate('/')} />
            <NavItem icon={<Users size={16} />} label="Usuários" active onClick={() => navigate('/usuarios')} />
            <NavItem
              icon={<Ticket size={16} />}
              label="Chamados"
              badgeCount={ticketUpdates}
              onClick={() => {
                clearTicketUpdates()
                navigate('/chamados')
              }}
            />
            <NavItem
              icon={<MessageSquare size={16} />}
              label="Chat"
              badgeCount={unreadChatMessages}
              onClick={() => navigate('/chat')}
            />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1" />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuPerfilAberto((value) => !value)}
              className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <UserIcon size={20} className="text-white/90" />
            </button>

            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-60 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                <div className="px-4 py-3 border-b border-white/10 mb-1">
                  <p className="text-sm font-bold text-white truncate">{loggedUser?.name || 'Usuário'}</p>
                  <p className="text-[11px] text-white/50 truncate">{loggedUser?.email || ''}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMenuPerfilAberto(false)
                    navigate('/configuracoes')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-white/70 hover:bg-white/10 rounded-xl transition-colors uppercase"
                >
                  <Settings size={14} />
                  Configurações
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="w-full max-w-4xl mx-auto">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Novo Registro</h1>
              <p className="text-gray-500 text-sm mt-1.5 font-medium opacity-60">
                Crie usuários e defina a role de acesso conforme a regra de negócio.
              </p>
            </div>

            <div className="w-full h-[1.5px] bg-gray-300/40 mb-10" />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10 w-full mb-10">
              <form className="flex flex-col gap-8" onSubmit={handleCadastro}>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase tracking-wider">
                    Role de Acesso
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {CREATE_USER_ROLE_OPTIONS.map((role) => (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => setSelectedRole(role.key)}
                        className={`py-3 rounded-lg text-sm font-bold transition-all border ${selectedRole === role.key
                            ? 'border-[#BD3B0F] bg-[#fff8f6] text-[#BD3B0F]'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase tracking-wider">
                    Nome Completo
                  </label>
                  <input
                    required
                    type="text"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    placeholder="Ex: Maria Oliveira"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#BD3B0F] outline-none transition-all placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase tracking-wider">
                    E-mail Corporativo
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@syncdesk.com"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#BD3B0F] outline-none transition-all placeholder:text-gray-300"
                  />
                </div>

                <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3">
                  <p className="text-xs font-semibold text-[#BD3B0F] uppercase tracking-wider mb-1">
                    Senha de primeiro acesso
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    A senha temporária será gerada pelo backend e enviada pelo fluxo de convite.
                    O usuário deverá alterá-la no primeiro login.
                  </p>
                </div>

                {errorMessage && (
                  <p className="whitespace-pre-line text-red-500 text-sm font-medium">
                    {errorMessage}
                  </p>
                )}

                <div className="flex justify-end items-center gap-5 mt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/usuarios')}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white font-bold py-3 px-10 rounded-lg shadow-lg flex items-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50 transition-all"
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Finalizar Cadastro
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex justify-center items-center gap-2 text-gray-400 uppercase tracking-widest text-[10px] font-bold mb-10">
              <RefreshCcw size={14} />
              Sincronizado com API
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active, onClick, badgeCount = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${active
          ? 'bg-[#BD3B0F] text-white shadow-md'
          : 'text-white/60 hover:bg-white/10 hover:text-white'
        }`}
    >
      {icon}
      <span>{label}</span>
      <NotificationBadge count={badgeCount} />
    </button>
  )
}