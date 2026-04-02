import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  BarChart2, 
  MessageSquare,
  Bell, 
  User, 
  Briefcase,
  Key,
  Shield,
  Zap,
  Clock,
  UserPlus,
  Settings,
  AlertTriangle,
  Edit2,
  CheckCircle2,
  Headset,
  LogOut
} from 'lucide-react';

export default function ConfiguracoesAtendente({ onNavigate }) {
  const [cargoSelecionado, setCargoSelecionado] = useState('operador');
  const [statusAtivo, setStatusAtivo] = useState(true);
  
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

  const [permissoes, setPermissoes] = useState({
    gerenciarUsuarios: false,
    gerenciarChamados: true,
    verRelatorios: true,
    configuracoesSistema: false
  });

  const togglePermissao = (key) => {
    setPermissoes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <Users size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-wide">Usuários</span>
          </div>

          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => onNavigate('dashboard')} />
            <NavItem icon={<Users size={16} />} label="Usuários" active onClick={() => onNavigate('usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" onClick={() => onNavigate('chamados')} />
            <NavItem icon={<BarChart2 size={16} />} label="Relatórios" />
            <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => onNavigate('console')} />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Topbar Padronizada */}
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

            {/* DROPDOWN DO PERFIL */}
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
                    <p className="text-sm font-bold text-white">Alex Rivera</p>
                    <p className="text-[11px] text-white/50 truncate">alex.rivera@syncdesk.com</p>
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
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-[1100px] mx-auto">
            
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight">Configurações do Atendente</h1>
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
              
              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-8 flex flex-col items-center">
                  <div className="relative mb-5">
                    <div className="w-28 h-28 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm flex items-center justify-center">
                      <User size={40} className="text-gray-300" />
                    </div>
                    <button className="absolute -bottom-3 -right-3 bg-white p-2 rounded-full border border-gray-200 shadow-sm text-[#BD3B0F] hover:bg-gray-50 transition-colors">
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Alex Rivera</h2>
                  <p className="text-[11px] font-semibold text-gray-400 mt-1 uppercase tracking-widest">ID: #AT-8829-2024</p>
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded mt-3">VERIFICADO</span>
                  <div className="w-full h-px bg-gray-100 my-6"></div>
                  <div className="w-full flex justify-between items-center mb-5">
                    <div>
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Status da Conta</p>
                      <p className={`text-sm font-bold ${statusAtivo ? 'text-emerald-600' : 'text-gray-500'}`}>{statusAtivo ? 'Ativo' : 'Inativo'}</p>
                    </div>
                    <ToggleSwitch checked={statusAtivo} onChange={() => setStatusAtivo(!statusAtivo)} color="bg-emerald-500" />
                  </div>
                  <div className="w-full">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Último Acesso</p>
                    <div className="flex items-center gap-1.5 text-gray-600 text-xs font-semibold"><Clock size={14} className="text-gray-400" /> Hoje, às 14:23</div>
                  </div>
                </div>
                <div className="bg-[#500D0D] rounded-2xl shadow-md p-7 relative overflow-hidden text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={18} className="text-rose-400" />
                    <h3 className="font-extrabold text-xs uppercase tracking-widest text-rose-100">Zona de Perigo</h3>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed font-medium mb-6">Revogar o perfil impedirá que o usuário acesse qualquer sistema imediatamente.</p>
                  <button className="w-full py-2.5 border border-white/20 hover:bg-white/10 rounded-lg text-xs font-bold transition-all tracking-wide">Revogar Perfil</button>
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-8">
                  <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100">
                    <Briefcase size={18} className="text-[#BD3B0F]" />
                    <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Atribuição de Cargo</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <RoleCard title="Gerente" desc="Supervisão total, gestão de equipes e financeiro." icon={<Shield size={18} />} selected={cargoSelecionado === 'gerente'} onClick={() => setCargoSelecionado('gerente')} />
                    <RoleCard title="Operador" desc="Execução de tarefas principais e fluxos de trabalho." icon={<Zap size={18} />} selected={cargoSelecionado === 'operador'} onClick={() => setCargoSelecionado('operador')} />
                    <RoleCard title="Suporte" desc="Assistência ao cliente e gestão de chamados." icon={<Headset size={18} />} selected={cargoSelecionado === 'suporte'} onClick={() => setCargoSelecionado('suporte')} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-8">
                  <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100">
                    <Key size={18} className="text-[#BD3B0F]" />
                    <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Permissões do Sistema</h2>
                  </div>
                  <div className="flex flex-col gap-2">
                    <PermissionRow icon={<UserPlus size={16} />} title="Gerenciar Usuários" desc="Capacidade de criar, editar e desativar perfis." checked={permissoes.gerenciarUsuarios} onChange={() => togglePermissao('gerenciarUsuarios')} />
                    <PermissionRow icon={<Ticket size={16} />} title="Gerenciar Chamados" desc="Acesso total ao módulo de tickets e atendimento." checked={permissoes.gerenciarChamados} onChange={() => togglePermissao('gerenciarChamados')} />
                    <PermissionRow icon={<BarChart2 size={16} />} title="Ver Relatórios" desc="Visualização de dashboards e exportação de dados." checked={permissoes.verRelatorios} onChange={() => togglePermissao('verRelatorios')} />
                    <PermissionRow icon={<Settings size={16} />} title="Configurações do Sistema" desc="Alteração de parâmetros globais da plataforma." checked={permissoes.configuracoesSistema} onChange={() => togglePermissao('configuracoesSistema')} />
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

function RoleCard({ title, desc, icon, selected, onClick }) {
  return (
    <div onClick={onClick} className={`relative p-5 rounded-xl cursor-pointer transition-all duration-200 ${selected ? 'bg-[#fff8f6] border-[#BD3B0F] ring-1 ring-[#BD3B0F] shadow-sm' : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50 hover:border-gray-300 border'}`}>
      {selected && <div className="absolute top-3 right-3 text-[#BD3B0F]"><CheckCircle2 size={16} className="fill-[#BD3B0F] text-white" /></div>}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${selected ? 'bg-[#BD3B0F]/10 text-[#BD3B0F]' : 'bg-white border border-gray-200 text-gray-400 shadow-sm'}`}>{icon}</div>
      <h3 className={`text-sm font-bold mb-1.5 ${selected ? 'text-[#BD3B0F]' : 'text-gray-800'}`}>{title}</h3>
      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function PermissionRow({ icon, title, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50/80 rounded-xl transition-colors group border border-transparent hover:border-gray-100">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#BD3B0F]/5 text-[#BD3B0F] flex items-center justify-center shrink-0 border border-[#BD3B0F]/10">{icon}</div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-0.5">{title}</h4>
          <p className="text-[11px] text-gray-500 font-medium">{desc}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} color="bg-[#BD3B0F]" />
    </div>
  );
}

function ToggleSwitch({ checked, onChange, color = 'bg-[#BD3B0F]' }) {
  return (
    <div onClick={onChange} className={`w-10 h-[20px] flex items-center rounded-full p-[2px] cursor-pointer transition-colors ${checked ? color : 'bg-gray-200'}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </div>
  );
}