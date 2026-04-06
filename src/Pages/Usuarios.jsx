import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  UserPlus,
  LayoutDashboard,
  Ticket,
  MessageSquare,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Pencil,
} from 'lucide-react';

import { useGetUsers, useGetUser } from '@titus-system/syncdesk';

const getRoleInfo = (user) => {
  if (!user) return { name: '...', style: 'text-gray-400' };

  const roleId = user.role_id || (user.role_ids && user.role_ids[0]) || (user.roles && user.roles[0]?.id) || (user.role && user.role.id);
  const roleName = typeof user.role === 'string' ? user.role.toLowerCase() : (user.roles && user.roles[0]?.name?.toLowerCase()) || (user.role?.name?.toLowerCase()) || (user.role_name?.toLowerCase()) || '';

  if (roleId === 1 || roleName.includes('admin')) {
    return { name: 'Gerente de Projetos', style: 'text-gray-900', isAdmin: true };
  }
  if (roleId === 3 || roleName.includes('agent') || roleName.includes('atendente')) {
    return { name: 'Líder de Suporte', style: 'text-gray-900', isAdmin: false };
  }
  if (roleId === 4 || roleName.includes('client') || roleName.includes('cliente')) {
    return { name: 'Arquiteto de Sistemas', style: 'text-gray-900', isAdmin: false };
  }
  return { name: 'Editor de Conteúdo', style: 'text-gray-900', isAdmin: false };
};

function RoleBadge({ user }) {
  const { data: detailedUser, isLoading } = useGetUser(user.id);
  if (isLoading) return <span className="text-sm text-gray-400 animate-pulse">Carregando...</span>;
  const finalUser = detailedUser || user;
  const roleData = getRoleInfo(finalUser);
  return <span className={`text-sm ${roleData.style}`}>{roleData.name}</span>;
}

export default function Usuarios({ onNavigate }) {
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuPerfilRef = useRef(null);
  const { data: usersData = [], isLoading, isError } = useGetUsers();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuPerfilRef.current && !menuPerfilRef.current.contains(event.target)) {
        setMenuPerfilAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden text-[#1E293B]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <UserIcon size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
          </div>
          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => onNavigate('dashboard')} />
            <NavItem icon={<Users size={16} />} label="Usuários" active onClick={() => onNavigate('usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" onClick={() => onNavigate('chamados')} />
            <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => onNavigate('chat')} />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Navbar */}
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={menuPerfilRef}>
              <button onClick={() => setMenuPerfilAberto(!menuPerfilAberto)} className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <UserIcon size={20} className="text-white/90" />
              </button>
              {menuPerfilAberto && (
                <div className="absolute right-0 top-12 w-48 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                  <button 
                    onClick={() => { localStorage.clear(); window.location.reload(); }} 
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase"
                  >
                    <LogOut size={14} /> Sair da Conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Área de Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gerenciamento de Usuários</h1>
              <p className="text-sm text-gray-500 mt-1.5 font-medium opacity-60">Controle quem tem acesso aos recursos da sua organização.</p>
            </div>
            <button 
              onClick={() => onNavigate('cadastrar')} 
              className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-semibold py-2.5 px-6 rounded-lg shadow-sm flex items-center gap-2 transition-all"
            >
              <UserPlus size={16} /> Add User
            </button>
          </div>

          <div className="w-full h-[1.5px] bg-gray-300/40 mb-8" />

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard title="Total de Usuários" value={isLoading ? "..." : usersData.length.toLocaleString()} />
            <StatCard title="Licenças Ativas" value={isLoading ? "..." : usersData.filter(u => u.is_active || u.isActive).length.toLocaleString()} />
            <StatCard title="Licenças Inativas" value={isLoading ? "..." : usersData.filter(u => getRoleInfo(u).isAdmin).length.toLocaleString()} />
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
            {isLoading ? (
              <div className="p-20 text-center text-gray-400 italic font-semibold">Carregando usuários...</div>
            ) : isError ? (
              <div className="p-20 text-center flex flex-col items-center gap-4 text-red-500 font-semibold">
                <ShieldAlert size={40} />
                <span>Erro ao carregar dados dos usuários.</span>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500 font-semibold">
                    <th className="py-4 px-6">Nome e E-mail</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Função</th>
                    <th className="py-4 px-6">Privilégio de Administrador</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersData.map((user) => {
                    const isActive = user.is_active || user.isActive;
                    const initials = getInitials(user.name || user.username);
                    const { isAdmin } = getRoleInfo(user);

                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${isActive ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{user.name || user.username || "Sem Nome"}</p>
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
                          <RoleBadge user={user} />
                        </td>
                        <td className="py-4 px-6">
                          <div className={`relative w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${isAdmin ? 'bg-orange-600' : 'bg-gray-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isAdmin ? 'translate-x-5' : 'translate-x-0'}`}></div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 text-gray-400">
                            {/* BOTÃO MODIFICADO AQUI */}
                            <button 
                                onClick={() => onNavigate('editar', user.id)}
                                className="hover:text-[#BD3B0F] p-1 transition-colors"
                            >
                              <Pencil size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col gap-1.5 transition-all hover:shadow-md">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{title}</p>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  );
}