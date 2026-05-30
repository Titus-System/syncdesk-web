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
  Filter,
  Settings,
  BarChart3,
  Users,
  Trash2,
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
  const loggedUser = useAuthStore((state) => state.user)

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
    const active = usersData.filter((u) => Boolean(u.is_active ?? u.isActive)).length
    const admins = usersData.filter((u) => {
      const r = getRoleInfo(u)
      return r.key === 'admin'
    }).length
    return { total, active, admins }
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
    if (roleData.key === 'client') {
      navigate(`/usuarios/${user.id}/editar-cliente`)
    } else {
      navigate(`/usuarios/${user.id}/editar-atendente`)
    }
  }

  return (
    <div className="flex h-screen bg-[var(--bg-page)] font-sans overflow-hidden text-[var(--text-primary)]">
      {/* Sidebar */}
      <aside className="w-60 bg-[var(--bg-sidebar)] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-sm">
              <UserPlus size={18} className="text-white" />
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
          <h1 className="text-base font-bold text-white tracking-tight"></h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Quick search..."
                className="bg-white/10 border border-white/15 text-white text-xs placeholder:text-white/40 rounded-lg pl-8 pr-4 py-1.5 w-48 outline-none focus:bg-white/15 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('/usuarios/novo')}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <UserPlus size={14} /> Add User
            </button>
            <div className="relative" ref={menuPerfilRef}>
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
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Gerenciamento de Usuários</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1 opacity-70">Controle quem tem acesso aos recursos da sua organização.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            <StatCard title="Total de Usuários"      value={usersQuery.isLoading ? '...' : stats.total.toLocaleString()} />
            <StatCard title="Licenças Ativas"        value={usersQuery.isLoading ? '...' : stats.active.toLocaleString()} />
            <StatCard title="Funções de Administrador" value={usersQuery.isLoading ? '...' : stats.admins.toLocaleString()} />
          </div>

          {/* Table card */}
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] border border-[var(--border-default)] rounded-lg px-3 py-2 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                <Filter size={14} /> Filter
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none text-xs font-semibold text-[var(--text-muted)] border border-[var(--border-default)] rounded-lg pl-3 pr-7 py-2 outline-none hover:bg-[var(--bg-hover)] cursor-pointer"
                >
                  <option value="">Status: All</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none text-xs font-semibold text-[var(--text-muted)] border border-[var(--border-default)] rounded-lg pl-3 pr-7 py-2 outline-none hover:bg-[var(--bg-hover)] cursor-pointer"
                >
                  {ROLE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button type="button" className="p-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-[var(--text-faint)] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                <button type="button" className="p-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-[var(--text-faint)] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                </button>
              </div>
            </div>

            {usersQuery.isLoading ? (
              <div className="p-20 text-center text-[var(--text-faint)] italic font-semibold">Carregando usuários...</div>
            ) : usersQuery.isError ? (
              <div className="p-20 text-center flex flex-col items-center gap-4 text-red-500 font-semibold">
                <ShieldAlert size={40} /><span>Erro ao carregar dados dos usuários.</span>
              </div>
            ) : !filteredUsers.length ? (
              <div className="p-16 text-center text-[var(--text-muted)] font-medium">Nenhum usuário encontrado para os filtros selecionados.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)]">
                  <tr className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wide">
                    <th className="py-3.5 px-5">Nome e E-mail</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Função</th>
                    <th className="py-3.5 px-5">Privilégio de Administrador</th>
                    <th className="py-3.5 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredUsers.map((user) => {
                    const isActive = Boolean(user.is_active ?? user.isActive)
                    const initials = getInitials(user.name || user.username)
                    const roleData = getRoleInfo(user)
                    const isAdmin = roleData.key === 'admin'

                    return (
                      <tr key={user.id} className="hover:bg-[var(--bg-hover)]/60 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isActive ? 'bg-orange-100 text-orange-700' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'}`}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--text-primary)]">{user.name || user.username || 'Sem Nome'}</p>
                              <p className="text-[11px] text-[var(--text-faint)]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${isActive ? 'bg-green-50 text-green-700' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'}`}>
                            {isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="text-sm text-[var(--text-secondary)]">{roleData.name}</span>
                        </td>
                        <td className="py-3.5 px-5">
                          <AdminToggle active={isAdmin} />
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center justify-end gap-1 text-[var(--text-faint)]">
                            <button type="button" onClick={() => handleEditUser(user)}
                              className="p-1.5 rounded-lg hover:text-[var(--accent-text)] hover:bg-orange-50 transition-colors">
                              <Pencil size={15} />
                            </button>
                            <button type="button"
                              className="p-1.5 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {filteredUsers.length > 0 && (
              <div className="px-5 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-faint)]">Mostrando {filteredUsers.length} de {usersData.length} usuários</span>
                <div className="flex items-center gap-1">
                  <button type="button" className="w-7 h-7 rounded border border-[var(--border-default)] flex items-center justify-center text-[var(--text-faint)] hover:bg-[var(--bg-hover)] text-xs">&lt;</button>
                  <button type="button" className="w-7 h-7 rounded border border-[var(--border-default)] flex items-center justify-center text-[var(--text-faint)] hover:bg-[var(--bg-hover)] text-xs">&gt;</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function getInitials(name) {
  return name?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '??'
}

function AdminToggle({ active }) {
  return (
    <div className={`relative w-10 h-5 rounded-full transition-colors ${active ? 'bg-[var(--accent)]' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--bg-card)] rounded-full shadow transition-transform ${active ? 'translate-x-5' : ''}`} />
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="bg-[var(--bg-card)] p-5 rounded-2xl shadow-sm border border-[var(--border-subtle)] flex flex-col gap-1 hover:shadow-md transition-all">
      <p className="text-xs text-[var(--text-faint)] font-medium">{title}</p>
      <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{value}</p>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${active ? 'bg-[var(--accent)] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
    >
      {icon} {label}
    </button>
  )
}