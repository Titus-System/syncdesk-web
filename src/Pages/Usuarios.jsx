import React, { useState, useRef, useEffect } from 'react';
import { Users, LayoutDashboard, User as UserIcon, LogOut, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { useGetUsers } from '@titus-system/syncdesk';

export default function Usuarios({ onNavigate }) {
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuRef = useRef(null);

  const { data: usersData = [], isLoading, isError, error } = useGetUsers();

  const userLogged = JSON.parse(localStorage.getItem('user_data') || '{"name": "mafe", "email": "mafe@syncdesk.com"}');

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuPerfilAberto(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-[#500D0D] flex flex-col text-white/90 z-20 shrink-0">
        <div className="p-5 flex items-center gap-3">
          <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm"><Users size={18} /></div>
          <span className="font-bold text-lg">SyncDesk</span>
        </div>
        <nav className="mt-2 px-3 flex flex-col gap-1">
          <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => onNavigate('dashboard')} />
          <NavItem icon={<Users size={16} />} label="Usuários" active onClick={() => onNavigate('usuarios')} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1"></div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuPerfilAberto(!menuPerfilAberto)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <UserIcon size={20} />
            </button>
            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-56 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl p-2 z-[999]">
                <div className="p-3 border-b border-white/10">
                  <p className="text-sm font-bold">{userLogged.name}</p>
                  <p className="text-[10px] text-white/50">{userLogged.email}</p>
                </div>
                <button 
                  onClick={() => { localStorage.clear(); window.location.reload(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl uppercase"
                >
                  <LogOut size={14} /> Sair da Conta
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Usuários</h1>
              <p className="text-gray-500 text-xs mt-1 font-medium">Lista de acessos do sistema.</p>
            </div>
            <button className="bg-[#BD3B0F] text-white text-[11px] font-bold py-2 px-4 rounded-md shadow-sm uppercase flex items-center gap-2">
              <UserPlus size={14} /> Novo Usuário
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {isLoading ? (
              <div className="p-20 text-center text-gray-400 text-sm">Carregando dados da API...</div>
            ) : isError ? (
              <div className="p-20 text-center">
                <p className="text-red-500 font-bold">Erro 403: Acesso Negado</p>
                <p className="text-gray-400 text-xs mt-2">Você não tem permissão de Admin ou sua sessão expirou.</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-[10px] bg-gray-100 px-4 py-2 rounded font-bold uppercase">Tentar Novamente</button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <th className="py-4 px-6">Nome e E-mail</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usersData.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 group transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{user.name}</p>
                          <p className="text-[11px] text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-widest ${
                          user.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-end gap-2 text-gray-400">
                          <button className="p-1.5 hover:bg-[#BD3B0F]/10 hover:text-[#BD3B0F] rounded-md transition-colors"><Pencil size={14} /></button>
                          <button className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${
        active ? 'bg-[#BD3B0F] text-white shadow-sm' : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  );
}