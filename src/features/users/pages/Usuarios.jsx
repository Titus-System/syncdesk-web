import { useEffect, useMemo, useRef, useState } from 'react'
import {
  UserPlus,
  LayoutDashboard,
  Ticket,
  MessageSquare,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Pencil,
  Search,
  Filter
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useUsersQuery } from '@/features/users/hooks/useUsersQuery'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { getRoleInfo, ROLE_FILTER_OPTIONS } from '@/features/users/utils/role-utils'

export default function Usuarios() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const menuPerfilRef = useRef(null)

  const debouncedSearch = useDebouncedValue(search, 300)

  const usersQuery = useUsersQuery()
  const usersData = usersQuery.data ?? []

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuPerfilRef.current && !menuPerfilRef.current.contains(event.target)) {
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

  const stats = useMemo(() => {
    const total = usersData.length
    const active = usersData.filter((user) => Boolean(user.is_active ?? user.isActive)).length
    const inactive = total - active
    return { total, active, inactive }
  }, [usersData])

  const filteredUsers = useMemo(() => {
    return usersData.filter((user) => {
      const roleData = getRoleInfo(user)
      const isActive = Boolean(user.is_active ?? user.isActive)
      const normalizedSearch = debouncedSearch.trim().toLowerCase()

      const matchesSearch =
        !normalizedSearch ||
        String(user.name || user.username || '').toLowerCase().includes(normalizedSearch) ||
        String(user.email || '').toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive)

      const matchesRole = !roleFilter || roleData.key === roleFilter

      return matchesSearch && matchesStatus && matchesRole
    })
  }, [usersData, debouncedSearch, statusFilter, roleFilter])

  function handleEditUser(user) {
    const roleData = getRoleInfo(user)
    // cliente → EditarCliente
    // admin, agent, user → EditarAtendente
    if (roleData.key === 'client') {
      navigate(`/usuarios/${user.id}/editar-cliente`)
    } else {
      navigate(`/usuarios/${user.id}/editar-atendente`)
    }
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
            <NavItem icon={<UserIcon size={16} />} label="Usuários" active onClick={() => navigate('/usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" onClick={() => navigate('/chamados')} />
            <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => navigate('/chat')} />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="relative" ref={menuPerfilRef}>
              <button
                type="button"
                onClick={() => setMenuPerfilAberto((value) => !value)}
                className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <UserIcon size={20} className="text-white/90" />
              </button>

              {menuPerfilAberto && (
                <div className="absolute right-0 top-12 w-48 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase"
                  >
                    <LogOut size={14} />
                    Sair da Conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="flex justify-between items-end mb-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gerenciamento de Usuários</h1>
              <p className="text-sm text-gray-500 mt-1.5 font-medium opacity-60">
                Controle quem tem acesso aos recursos da sua organização.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/usuarios/novo')}
              className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-semibold py-2.5 px-6 rounded-lg shadow-sm flex items-center gap-2 transition-all"
            >
              <UserPlus size={16} />
              Add User
            </button>
          </div>

          <div className="w-full h-[1.5px] bg-gray-300/40 mb-8" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard title="Total de Usuários" value={usersQuery.isLoading ? '...' : stats.total.toLocaleString()} />
            <StatCard title="Usuários Ativos" value={usersQuery.isLoading ? '...' : stats.active.toLocaleString()} />
            <StatCard title="Usuários Inativos" value={usersQuery.isLoading ? '...' : stats.inactive.toLocaleString()} />
          </div>

          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/60">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_220px] gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nome ou e-mail"
                    className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-700 outline-none focus:border-[#BD3B0F]"
                  />
                </div>

                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-700 outline-none focus:border-[#BD3B0F]"
                  >
                    <option value="">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                </div>

                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-700 outline-none focus:border-[#BD3B0F]"
                  >
                    {ROLE_FILTER_OPTIONS.map((option) => (
                      <option key={option.value || 'all'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {usersQuery.isLoading ? (
              <div className="p-20 text-center text-gray-400 italic font-semibold">Carregando usuários...</div>
            ) : usersQuery.isError ? (
              <div className="p-20 text-center flex flex-col items-center gap-4 text-red-500 font-semibold">
                <ShieldAlert size={40} />
                <span>Erro ao carregar dados dos usuários.</span>
              </div>
            ) : !filteredUsers.length ? (
              <div className="p-16 text-center text-gray-500 font-medium">
                Nenhum usuário encontrado para os filtros selecionados.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500 font-semibold">
                    <th className="py-4 px-6">Nome e E-mail</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const isActive = Boolean(user.is_active ?? user.isActive)
                    const initials = getInitials(user.name || user.username)
                    const roleData = getRoleInfo(user)

                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${isActive ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {user.name || user.username || 'Sem Nome'}
                              </p>
                              <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <RoleBadge roleData={roleData} />
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 text-gray-400">
                            <button
                              type="button"
                              onClick={() => handleEditUser(user)}
                              className="hover:text-[#BD3B0F] p-1 transition-colors"
                            >
                              <Pencil size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function getInitials(name) {
  return name?.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) || '??'
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
    >
      {icon} {label}
    </button>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col gap-1.5 transition-all hover:shadow-md">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{title}</p>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  )
}

function RoleBadge({ roleData }) {
  const styles = {
    admin:   'bg-orange-50 text-orange-700',
    user:    'bg-blue-50 text-blue-700',
    agent:   'bg-green-50 text-green-700',
    client:  'bg-purple-50 text-purple-700',
    unknown: 'bg-gray-100 text-gray-600',
  }

  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${styles[roleData.key] || styles.unknown}`}>
      {roleData.name}
    </span>
  )
}