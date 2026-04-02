import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Ticket,
  Users,
  MessageSquare,
  Search,
  LogOut,
  UserPlus,
  Flag,
  CheckCircle2,
  History,
  Mail,
  Activity,
  User,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-[#f4ece1] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-wide">
              SyncDesk
            </span>
          </div>

          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem
              icon={<LayoutDashboard size={16} />}
              label="Dashboard"
              active
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
        {/* Topbar - BARRA DE PESQUISA ATUALIZADA CONFORME IMAGEM */}
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1"></div> {/* Espaçador */}

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

        {/* Conteúdo Scrollável */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Visão Geral do Sistema
            </h1>
            <p className="text-gray-500 text-xs mt-1 font-medium">
              Bem-vindo(a) de volta. Aqui está o resumo de hoje.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Users"
              value="12,842"
              icon={<Users size={18} className="text-blue-600" />}
              iconBg="bg-blue-50"
              badge="+12%"
              badgeColor="text-green-700 bg-green-50"
            />
            <StatCard
              title="Chamados Abertos"
              value="145"
              icon={<Ticket size={18} className="text-orange-600" />}
              iconBg="bg-orange-50"
              badge="+5.1%"
            />
            <StatCard
              title="Em progresso"
              value="62"
              icon={<Clock size={18} className="text-amber-600" />}
              iconBg="bg-amber-50"
              badge="Steady"
              badgeColor="text-gray-600 bg-gray-100"
            />
            <StatCard
              title="Resolvidos"
              value="2,410"
              icon={<CheckCircle size={18} className="text-emerald-600" />}
              iconBg="bg-emerald-50"
              badge="+18%"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="col-span-2 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100/80 p-5 hover:shadow-sm transition-shadow duration-300">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Atividades Recentes
                </h2>
                <a
                  href="#"
                  className="text-xs font-semibold text-[#BD3B0F] hover:underline transition-colors"
                >
                  Ver tudo
                </a>
              </div>
              <div className="flex flex-col gap-4">
                <ActivityItem
                  icon={<UserPlus size={16} className="text-[#BD3B0F]" />}
                  iconBg="bg-[#BD3B0F]/10"
                  title="Novo usuário registrado: Sarah Jenkins (sarah.j@example.com)"
                  time="Há 2 minutos"
                />
                <ActivityItem
                  icon={<Flag size={16} className="text-amber-600" />}
                  iconBg="bg-amber-50"
                  title="Escalonamento: Chamado #6822 marcado como urgente"
                  time="Há 15 minutos"
                />
                <ActivityItem
                  icon={<CheckCircle2 size={16} className="text-emerald-600" />}
                  iconBg="bg-emerald-50"
                  title="Resolução: Admin 'Mike Ross' resolveu o chamado #6810"
                  time="Há 1 hora"
                />
                <ActivityItem
                  icon={<History size={16} className="text-blue-600" />}
                  iconBg="bg-blue-50"
                  title="Update de Sistema: Versão 2.4.0 implantada em produção"
                  time="4 hours ago"
                />
              </div>
            </div>

            <div className="col-span-1 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100/80 p-5 hover:shadow-sm transition-shadow duration-300">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-5">
                Status dos Chamados
              </h2>
              <div className="flex flex-col gap-4">
                <ProgressBar label="Crítico" percentage={12} color="bg-red-500" />
                <ProgressBar
                  label="Alta Prioridade"
                  percentage={28}
                  color="bg-[#BD3B0F]"
                />
                <ProgressBar label="Médio" percentage={45} color="bg-amber-400" />
                <ProgressBar
                  label="Baixa Prioridade"
                  percentage={15}
                  color="bg-blue-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100/80 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow duration-300">
              <div className="bg-[#BD3B0F]/10 p-2.5 rounded-full text-[#BD3B0F]">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Mensagens da Equipe
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  5 mensagens de sistema não lidas
                </p>
              </div>
            </div>

            <div className="col-span-1  bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100/80 p-4 relative overflow-hidden flex items-center gap-4 text-white hover:shadow-md transition-shadow duration-300">
              <div className="bg-[#BD3B0F]/10 p-2.5 rounded-full text-[#BD3B0F]">
                <Activity size={20} />
              </div>
              <div className="z-10">
                <h3 className="text-sm font-bold text-gray-900">Status da API</h3>
                <p className="text-[10px] text-emerald-500 font-semibold mt-0.5 uppercase tracking-wider">
                  Online
                </p>
              </div>
            </div>
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
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-xs font-semibold ${
        active
          ? 'bg-[#BD3B0F] text-white shadow-sm'
          : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function StatCard({ title, value, icon, iconBg, badge, badgeColor }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100/80 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div className={`${iconBg} p-2 rounded-lg`}>{icon}</div>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColor}`}
        >
          {badge}
        </span>
      </div>
      <div>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
          {title}
        </p>
        <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function ActivityItem({ icon, iconBg, title, time }) {
  return (
    <div className="flex gap-3 group items-center">
      <div
        className={`${iconBg} w-8 h-8 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700 leading-snug font-medium truncate">
          {title.includes(':') ? (
            <>
              <span className="font-bold text-gray-900">
                {title.split(':')[0]}:
              </span>{' '}
              {title.split(':')[1]}
            </>
          ) : (
            title
          )}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">{time}</p>
      </div>
    </div>
  );
}

function ProgressBar({ label, percentage, color }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] font-bold mb-1.5">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}