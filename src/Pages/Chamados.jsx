import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard,
  Ticket,
  Users,
  MessageSquare,
  User as UserIcon,
  Plus,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { useTickets } from '@titus-system/syncdesk';

export default function Chamados({ onNavigate }) {
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState('Todos');
  const [busca, setBusca] = useState('');
  
  const menuRef = useRef(null);
  const { data: ticketsData = [], isLoading, isError } = useTickets({});

  const chamadosFiltrados = useMemo(() => {
    return ticketsData.filter(ticket => {
      const valorBusca = (ticket.product || ticket.title || "").toLowerCase();
      const matchBusca = valorBusca.includes(busca.toLowerCase());
      
      const statusReal = (ticket.status || "").toLowerCase().trim();
      let matchStatus = filtroStatus === 'Todos' || 
        (filtroStatus === 'Em Atendimento' ? (statusReal === 'em atendimento' || statusReal === 'em_atendimento') : statusReal === filtroStatus.toLowerCase().trim());
      
      const prioReal = (ticket.criticality || ticket.priority || "").toLowerCase().trim();
      let matchPrioridade = filtroPrioridade === 'Todos' || 
        (filtroPrioridade === 'Alta' ? ['alta', 'high', 'urgente'].includes(prioReal) : (filtroPrioridade === 'Media' ? ['media', 'médio'].includes(prioReal) : prioReal === 'baixa'));
      
      return matchBusca && matchStatus && matchPrioridade;
    });
  }, [ticketsData, busca, filtroStatus, filtroPrioridade]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTicketTheme = (status, priority) => {
    const s = status?.toLowerCase();
    if (['fechado', 'resolvido', 'finished'].includes(s)) return 'closed';
    const p = priority?.toLowerCase();
    if (['high', 'urgent', 'alta'].includes(p)) return 'urgent';
    return 'neutral';
  };

  return (
    <div className="flex h-screen bg-[#f4ece1] font-sans overflow-hidden text-[#1E293B]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <Ticket size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
          </div>
          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => onNavigate('dashboard')} />
            <NavItem icon={<Users size={16} />} label="Usuários" onClick={() => onNavigate('usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" active onClick={() => onNavigate('chamados')} />
            <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => onNavigate('chat')} />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1">
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuPerfilAberto(!menuPerfilAberto)} className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center">
              <UserIcon size={20} className="text-white" />
            </button>
            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-48 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase">
                  <LogOut size={14} /> Sair da Conta
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Área de Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {/* Header da Seção */}
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Central de chamados
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-medium opacity-60">
                Filtros e gestão de tickets
              </p>
            </div>
            <button onClick={() => onNavigate('abrir_chamado')} className="bg-[#BD3B0F] hover:bg-[#a1320d] text-white text-xs font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 uppercase shadow-lg transition-all active:scale-95">
              <Plus size={16} strokeWidth={3} /> NOVO TICKET
            </button>
          </div>

          {/* O TRAÇO: Ocupando toda a largura da div pai */}
          <div className="w-full h-[1.5px] bg-gray-300/40 mb-8" />

          {/* Filtros */}
          <div className="flex gap-4 mb-10">
             <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-gray-700 outline-none hover:border-[#BD3B0F] shadow-sm transition-all cursor-pointer">
                <option value="Todos">Status: Todos</option>
                <option value="Aberto">Aberto</option>
                <option value="Em Atendimento">Em Atendimento</option>
                <option value="Resolvido">Resolvido</option>
                <option value="Fechado">Fechado</option>
             </select>

             <select value={filtroPrioridade} onChange={(e) => setFiltroPrioridade(e.target.value)} className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-gray-700 outline-none hover:border-[#BD3B0F] shadow-sm transition-all cursor-pointer">
                <option value="Todos">Prioridade: Todas</option>
                <option value="Alta">Alta</option>
                <option value="Media">Média</option>
                <option value="Baixa">Baixa</option>
             </select>
          </div>

          {/* Lista de Chamados */}
          <div className="flex flex-col gap-3">
            {isLoading ? (
              <div className="p-20 text-center text-[#BD3B0F] text-[10px] font-black uppercase animate-pulse tracking-widest">Sincronizando...</div>
            ) : isError ? (
              <div className="p-20 text-center text-red-500 font-bold uppercase">Erro ao carregar chamados</div>
            ) : chamadosFiltrados.length === 0 ? (
              <div className="p-20 text-center border-2 border-dashed border-black/5 rounded-2xl text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Nenhum chamado encontrado</div>
            ) : (
              chamadosFiltrados.map((ticket) => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  theme={getTicketTheme(ticket.status, ticket.criticality || ticket.priority)} 
                  onNavigate={onNavigate} 
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TicketCard({ ticket, theme, onNavigate }) {
  const isUrgent = theme === 'urgent', isClosed = theme === 'closed';
  
  return (
    <div 
      onClick={() => onNavigate('modificar_chamado', ticket)} 
      className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
        isUrgent ? 'bg-[#BD3B0F] border-[#BD3B0F] text-white shadow-md' : 
        isClosed ? 'bg-white border-[#BD3B0F]/40 text-[#BD3B0F]' : 
        'bg-white text-gray-800 border-gray-100 shadow-sm hover:border-[#BD3B0F]'
      } hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isUrgent ? 'bg-white/20' : 
          isClosed ? 'bg-[#BD3B0F]/10 text-[#BD3B0F]' : 
          'bg-orange-50 text-[#BD3B0F]'
        }`}>
          {isUrgent ? <AlertCircle size={18} /> : isClosed ? <CheckCircle2 size={18} strokeWidth={3} /> : <CheckCircle2 size={18} className="text-emerald-500" />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[9px] font-black uppercase tracking-tighter ${isUrgent ? 'text-white/60' : 'text-gray-400'}`}>
              TKT-{ticket.id?.toString().slice(-4).toUpperCase()}
            </span>
            <h3 className={`text-sm font-bold truncate max-w-md ${isClosed ? 'opacity-80' : ''}`}>
              {ticket.product || ticket.title}
            </h3>
          </div>
          <div className={`text-[11px] flex items-center gap-2 ${isUrgent ? 'text-white/80' : isClosed ? 'text-[#BD3B0F]/60' : 'text-gray-500'}`}>
            <span className="flex items-center gap-1 font-bold uppercase text-[9px]">
              <div className={`w-1 h-1 rounded-full ${isUrgent ? 'bg-white' : isClosed ? 'bg-[#BD3B0F]' : 'bg-emerald-500'}`} />
              {ticket.status}
            </span>
            <span className="opacity-30">•</span>
            <span className="font-medium italic">{ticket.assignedToName || ''}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[9px] font-black px-2 py-1 rounded-lg tracking-widest uppercase border ${
          isUrgent ? 'bg-white/10 border-white/30 text-white' : 
          isClosed ? 'bg-[#BD3B0F]/10 border-[#BD3B0F]/20 text-[#BD3B0F]' : 
          'bg-gray-100 border-transparent text-gray-400'
        }`}>
          {ticket.criticality || ticket.priority || 'Média'}
        </span>
        <MoreVertical size={16} className="opacity-20 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${
        active ? 'bg-[#BD3B0F] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  );
}