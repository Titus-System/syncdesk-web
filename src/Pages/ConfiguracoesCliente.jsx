import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  BarChart2, 
  MessageSquare,
  Bell, 
  User, 
  Briefcase,
  FileText,
  ShieldAlert,
  Calendar,
  ArrowRight,
  Ban,
  CheckCircle2,
  Settings,
  LogOut
} from 'lucide-react';

export default function UsuarioCliente({ onNavigate }) {
  // --- LÓGICA DO MENU DE PERFIL (NAVBAR) ---
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-60 bg-[#500D0D] flex flex-col text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
            <Users size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm uppercase tracking-wider">Usuários</span>
        </div>

        <nav className="mt-2 px-3 flex flex-col gap-1">
          <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => onNavigate('dashboard')} />
          <NavItem icon={<Users size={16} />} label="Usuários" active onClick={() => onNavigate('usuarios')} />
          <NavItem icon={<Ticket size={16} />} label="Chamados" onClick={() => onNavigate('chamados')} />
          <NavItem icon={<BarChart2 size={16} />} label="Relatórios" />
          <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => onNavigate('console')} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Header Superior (Topbar Padronizada) */}
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-8 text-white shrink-0 shadow-sm z-30 w-full">
          <div className="flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-wide">Usuários</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-white/70 hover:text-white transition-colors relative">
              <Bell size={16} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#BD3B0F] rounded-full"></span>
            </button>

            {/* CONTAINER DO PERFIL COM DROPDOWN */}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
                className="w-8 h-8 bg-white/10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors focus:outline-none"
              >
                <User size={14} className="text-white/80" />
              </button>

              {menuPerfilAberto && (
                <div className="absolute right-0 top-12 w-56 bg-[#500D0D] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] overflow-hidden z-[999] animate-in fade-in zoom-in duration-150">
                  <div className="p-4 border-b border-white/10">
                    <p className="text-sm font-bold text-white">John Doe</p>
                    <p className="text-[11px] text-white/50 truncate">john@example.com</p>
                  </div>

                  <div className="p-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuPerfilAberto(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold text-white/80 hover:bg-white/10 rounded-xl transition-colors uppercase tracking-wider text-left"
                    >
                      <Settings size={14} />
                      Configurações
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.reload();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase tracking-wider mt-1 text-left"
                    >
                      <LogOut size={14} />
                      Sair da Conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-[1100px] mx-auto">
            
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-tr from-[#1a202c] to-[#374151] rounded-xl flex items-center justify-center shadow-md overflow-hidden border border-gray-200">
                    <div className="w-10 h-10 border-2 border-[#500D0D] rounded-full opacity-50 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white/50 tracking-widest">THORNE</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#F4EAD9] rounded-full"></div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight">Thorne & Co. Global</h1>
                    <span className="bg-[#fceae5] text-[#BD3B0F] text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md">
                      ATIVO
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                    <CheckCircle2 size={16} className="text-gray-400" />
                    Cliente Premium desde Jan 2022
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => onNavigate('usuarios')} 
                  className="bg-white border border-[#BD3B0F]/30 text-[#BD3B0F] hover:bg-[#BD3B0F]/5 text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors uppercase tracking-wider"
                >
                  Descartar
                </button>
                <button className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-[0_2px_10px_rgba(189,59,15,0.2)] transition-all uppercase tracking-wider">
                  Salvar Alterações
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6 sm:p-8">
                  <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100">
                    <Briefcase size={18} className="text-[#BD3B0F]" />
                    <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Dados Corporativos</h2>
                  </div>

                  <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Nome da Empresa</label>
                        <input type="text" defaultValue="Thorne & Co. Global" className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">E-mail Corporativo</label>
                        <input type="email" defaultValue="admin@thorneglobal.com" className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Produto Contratado</label>
                        <input type="text" defaultValue="Nexus Enterprise Pro" className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Data de Expiração</label>
                        <div className="relative">
                          <input type="text" defaultValue="12/31/2025" className="w-full pl-3.5 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all" />
                          <Calendar size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6 sm:p-8">
                  <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100">
                    <FileText size={18} className="text-[#BD3B0F]" />
                    <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Notas Internas</h2>
                  </div>
                  <textarea rows="4" placeholder="Notas administrativas..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:bg-white transition-all resize-none"></textarea>
                </div>
              </div>

              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6">
                  <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100">
                    <ShieldAlert size={18} className="text-[#BD3B0F]" />
                    <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Segurança</h2>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 py-3 border border-red-500 text-red-500 hover:bg-red-50 rounded-lg text-[11px] font-extrabold transition-all uppercase tracking-wider">
                    <Ban size={14} /> Suspender Acesso
                  </button>
                </div>

                <div className="bg-gradient-to-br from-[#500D0D] to-[#BD3B0F] rounded-2xl shadow-md p-7 relative overflow-hidden text-white">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 border-[8px] border-white/5 rounded-full"></div>
                  <div className="relative z-10">
                    <h3 className="font-extrabold text-base mb-3 tracking-wide">Suporte Prioritário</h3>
                    <p className="text-xs text-white/80 leading-relaxed mb-6">SLA de resposta de 2 horas ativo.</p>
                    <button className="text-[10px] font-extrabold text-white uppercase tracking-widest hover:text-white/70 transition-colors flex items-center gap-1.5 group">
                      Abrir Canal de Suporte
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
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
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white shadow-sm' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}