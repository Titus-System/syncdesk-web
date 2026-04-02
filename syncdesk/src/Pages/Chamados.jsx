import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Ticket,
  Users,
  MessageSquare,
  Search,
  User,
  Plus,
  ChevronDown,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Lock,
  LifeBuoy,
  Edit2,
  LogOut,
} from 'lucide-react';

export default function Chamados({ onNavigate }) {
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuPerfilRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuPerfilRef.current &&
        !menuPerfilRef.current.contains(event.target)
      ) {
        setMenuPerfilAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ticketsData = [
    {
      id: 'TXT-1024',
      title: 'Latência do sistema no ambiente de produção (US-EAST-1)',
      status: 'Em Atendimento',
      assignee: 'Alex Rivera',
      time: 'Atualizado há 12 min',
      priorityBadge: 'ALTA PRIORIDADE',
      theme: 'urgent',
      icon: <AlertCircle size={18} className="text-[#BD3B0F]" />,
    },
    {
      id: 'TXT-0086',
      title: 'Solicitação de reembolso para a Fatura #INV-2023-90',
      status: 'Resolvido',
      assignee: 'Sarah Chen',
      time: 'Resolvido há 2h',
      priorityBadge: 'BAIXA',
      theme: 'success',
      icon: <CheckCircle2 size={18} className="text-emerald-500" />,
    },
    {
      id: 'TXT-1011',
      title: 'Falha na autenticação da API para novos usuários',
      status: 'Aberto',
      assignee: 'Aguardando atribuição',
      time: 'Criado há 45 min',
      priorityBadge: 'URGENTE',
      theme: 'urgent',
      icon: <AlertCircle size={18} className="text-[#BD3B0F]" />,
    },
    {
      id: 'TXT-0972',
      title: 'Solicitação de recurso: Modo escuro para o painel',
      status: 'Fechado',
      assignee: 'Marcus Wright',
      time: 'Fechado há 3 dias',
      priorityBadge: 'MÉDIO',
      theme: 'neutral',
      icon: <Lock size={18} className="text-gray-400" />,
    },
  ];

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden">
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <LifeBuoy size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Centro de Suporte
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
              onClick={() => onNavigate('usuarios')}
            />
            <NavItem
              icon={<Ticket size={16} />}
              label="Chamados"
              active
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
                placeholder="Search tickets..."
                className="w-full bg-black/20 border border-white/30 text-white text-sm py-1.5 pl-10 pr-4 rounded-lg focus:outline-none focus:border-white/50 transition-all placeholder:text-gray-300/60"
              />
            </div>

            <div className="relative" ref={menuPerfilRef}>
              <button
                onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
                className="w-8 h-8 bg-white/10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors focus:outline-none"
              >
                <User size={20} className="text-white/90" />
              </button>
              {menuPerfilAberto && (
                <div className="absolute right-0 top-12 w-56 bg-[#500D0D] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] overflow-hidden z-[999]">
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

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="flex gap-8 border-b border-gray-200/60 mb-6">
            <button className="pb-3 text-[13px] font-extrabold text-[#BD3B0F] border-b-2 border-[#BD3B0F] uppercase tracking-wide">
              Todos os Chamados
            </button>
            <button className="pb-3 text-[13px] font-bold text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-wide">
              Atribuídos a Mim
            </button>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <FilterDropdown label="Status" value="Aberto, Em Atendimento" />
              <FilterDropdown label="Prioridade" value="Alta" />
            </div>
            <button
              onClick={() => onNavigate('abrir_chamado')}
              className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-bold py-2 px-5 rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider"
            >
              <Plus size={16} /> New Ticket
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {ticketsData.map((ticket, index) => (
              <TicketCard key={index} data={ticket} onNavigate={onNavigate} />
            ))}
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
          ? 'bg-[#BD3B0F] text-white'
          : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function FilterDropdown({ label, value }) {
  return (
    <button className="bg-white border border-gray-200/80 text-[11px] font-bold text-gray-600 py-1.5 px-3 rounded-lg flex items-center gap-2">
      <span className="text-gray-400">{label}:</span>{' '}
      <span className="text-gray-900">{value}</span>
      <ChevronDown size={14} className="text-gray-400 ml-1" />
    </button>
  );
}

function TicketCard({ data, onNavigate }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setMenuAberto(false);
    }
    if (menuAberto) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuAberto]);

  const handleCardClick = (e) => {
    if (menuRef.current && menuRef.current.contains(e.target)) return;
    onNavigate('abrir_chamado');
  };

  return (
    <div
      onClick={handleCardClick}
      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer relative ${
        data.theme === 'urgent'
          ? 'bg-[#BD3B0F] text-white border-transparent'
          : 'bg-white text-gray-800 border-gray-200/60'
      } hover:-translate-y-0.5 shadow-sm`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            data.theme === 'urgent' ? 'bg-white' : 'bg-gray-50'
          }`}
        >
          {data.icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-extrabold uppercase ${
                data.theme === 'urgent' ? 'text-white/70' : 'text-gray-400'
              }`}
            >
              {data.id}
            </span>
            <h3 className="text-sm font-bold truncate max-w-xl">{data.title}</h3>
          </div>
          <div
            className={`flex items-center gap-3 text-[11px] ${
              data.theme === 'urgent' ? 'text-white/80' : 'text-gray-500'
            }`}
          >
            <span className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  data.theme === 'urgent' ? 'bg-white' : 'bg-emerald-500'
                }`}
              ></span>
              {data.status}
            </span>
            <span>
              Atribuído: <b>{data.assignee}</b>
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <span
          className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-widest ${
            data.theme === 'urgent'
              ? 'bg-white text-[#BD3B0F]'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {data.priorityBadge}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuAberto(!menuAberto);
            }}
            className={`p-1.5 rounded-md ${
              data.theme === 'urgent' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
          >
            <MoreVertical size={18} />
          </button>
          {menuAberto && (
            <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] p-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('modificar_chamado');
                  setMenuAberto(false);
                }}
                className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5"
              >
                <Edit2 size={14} className="text-gray-400" /> Modificar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}