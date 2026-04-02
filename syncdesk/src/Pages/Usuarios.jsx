import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Pencil,
  Trash2,
  LayoutDashboard,
  Ticket,
  MessageSquare,
  User,
  LogOut,
} from 'lucide-react';

export default function Usuarios({ onNavigate }) {
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setMenuPerfilAberto(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const usersData = [
    {
      initials: 'AR',
      avatarBg: 'bg-red-50 text-red-600 border border-red-100',
      name: 'Alex Rivera',
      email: 'alex.r@company.com',
      status: 'Ativo',
      statusColor:
        'bg-emerald-50 text-emerald-600 border border-emerald-100',
      role: 'Gerente de Projetos',
      admin: true,
    },
    {
      initials: 'JS',
      avatarBg: 'bg-slate-50 text-slate-600 border border-slate-200',
      name: 'Jordan Smith',
      email: 'jordan.s@company.com',
      status: 'Pendente',
      statusColor: 'bg-amber-50 text-amber-600 border border-amber-100',
      role: 'Líder de Suporte',
      admin: false,
    },
    {
      initials: 'TW',
      avatarBg: 'bg-orange-50 text-orange-600 border border-orange-100',
      name: 'Taylor Wong',
      email: 'taylor.w@company.com',
      status: 'Ativo',
      statusColor:
        'bg-emerald-50 text-emerald-600 border border-emerald-100',
      role: 'Cliente',
      admin: false,
    },
    {
      initials: 'ML',
      avatarBg: 'bg-gray-50 text-gray-600 border border-gray-200',
      name: 'Morgan Lee',
      email: 'morgan.l@company.com',
      status: 'Inativo',
      statusColor: 'bg-gray-100 text-gray-500 border border-gray-200',
      role: 'Editor de Conteúdo',
      admin: false,
    },
  ];

  const handleEditUser = (user) => {
    if (user.name === 'Alex Rivera') onNavigate('config_atendente');
    else if (user.name === 'Taylor Wong') onNavigate('config_cliente');
    else alert(`O protótipo de edição para ${user.name} não foi criado.`);
  };

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden">
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <Users size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-wide">
              SyncDesk
            </span>
          </div>
          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem
              icon={<LayoutDashboard size={16} />}
              label="Dashboard"
              onClick={() => onNavigate('dashboard')}
            />
            <NavItem
              icon={<Users size={16} />}
              label="Usuários"
              active
              onClick={() => onNavigate('usuarios')}
            />
            <NavItem
              icon={<Ticket size={16} />}
              label="Chamados"
              onClick={() => onNavigate('chamados')}
            />
            <NavItem
              icon={<MessageSquare size={16} />}
              label="Chat"
              onClick={() => onNavigate('chat')}
            />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <div className="relative w-[300px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300/80"
              />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full bg-black/20 border border-white/30 text-white text-sm py-1.5 pl-10 pr-4 rounded-lg focus:outline-none focus:border-white/50 transition-all placeholder:text-gray-300/60"
              />
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
                className="w-8 h-8 bg-white/10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors focus:outline-none"
              >
                <User size={20} className="text-white/90" />
              </button>
              {menuPerfilAberto && (
                <div className="absolute right-0 top-12 w-56 bg-[#500D0D] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] overflow-hidden z-[999] animate-in fade-in zoom-in duration-150">
                  <div className="p-4 border-b border-white/10">
                    <p className="text-sm font-bold text-white">John Doe</p>
                    <p className="text-[11px] text-white/50 truncate">
                      john@example.com
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.reload();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase tracking-wider mt-1 text-left"
                    >
                      <LogOut size={14} /> Sair da Conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Gerenciamento de Usuários
              </h1>
              <p className="text-gray-500 text-xs mt-1 font-medium">
                Controle quem tem acesso aos recursos.
              </p>
            </div>
            <button
              onClick={() => onNavigate('cadastrar')}
              className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-[11px] font-bold py-2 px-4 rounded-md shadow-sm uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <UserPlus size={14} /> Add User
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard title="Total de Usuários" value="1,284" />
            <StatCard title="Licenças Ativas" value="1,120" />
            <StatCard title="Funções de Admin" value="14" />
          </div>
          <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100/80 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  <th className="py-3.5 px-6">Nome e E-mail</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Função</th>
                  <th className="py-3.5 px-6 text-center">Admin</th>
                  <th className="py-3.5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usersData.map((user, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="py-3 px-6 flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${user.avatarBg}`}
                      >
                        {user.initials}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-widest ${user.statusColor}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-xs text-gray-600 font-medium">
                      {user.role}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex justify-center">
                        <ToggleSwitch checked={user.admin} />
                      </div>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex justify-end gap-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 hover:bg-[#BD3B0F]/10 hover:text-[#BD3B0F] rounded-md transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        active
          ? 'bg-[#BD3B0F] text-white shadow-sm'
          : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/80 flex flex-col gap-1">
      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
        {title}
      </p>
      <p className="text-[#BD3B0F] text-2xl font-extrabold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function ToggleSwitch({ checked }) {
  return (
    <div
      className={`w-9 h-[18px] flex items-center rounded-full p-[2px] transition-colors ${
        checked ? 'bg-[#BD3B0F]' : 'bg-gray-200'
      }`}
    >
      <div
        className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      ></div>
    </div>
  );
}