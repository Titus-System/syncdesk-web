import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Ticket,
  MessageSquare,
  Headset,
  User,
  UserPlus,
  Calendar,
  RefreshCcw,
  LogOut,
  Search,
} from 'lucide-react';

export default function CadastrarUsuario({ onNavigate }) {
  // Estados do Formulário
  const [perfilSelecionado, setPerfilSelecionado] = useState('atendente');
  const [isAdministrador, setIsAdministrador] = useState(true);

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
      {/* Sidebar (Menu Lateral) */}
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          {/* Header da Sidebar */}
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm flex items-center justify-center">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide leading-tight">
                Portal Admin
              </p>
              <p className="text-[#BD3B0F] text-[10px] font-bold uppercase tracking-wider">
                Administrador
              </p>
            </div>
          </div>

          {/* Menu Principal */}
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
              onClick={() => onNavigate('console')}
            />
          </nav>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Topbar (Igual às outras telas) */}
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="relative w-[350px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Pesquisar usuários..."
              className="w-full bg-white/95 text-gray-800 text-xs py-2 pl-9 pr-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BD3B0F] shadow-inner transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-5">
            {/* Dropdown do Perfil */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
                className="w-8 h-8 bg-white/10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors focus:outline-none"
              >
                <User size={16} className="text-white/80" />
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
                      <LogOut size={14} />
                      Sair da Conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Conteúdo do Formulário Scrollável */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="w-full max-w-4xl mx-auto">
            <div className="mb-8 mt-2">
              <h1 className="text-[28px] font-extrabold text-gray-900 mb-1.5 tracking-tight">
                Cadastrar Novo Usuário
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                Preencha os dados abaixo para registrar um novo perfil de acesso no
                sistema.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10 w-full mb-10">
              <form
                className="flex flex-col gap-6"
                onSubmit={(e) => e.preventDefault()}
              >
                {/* Perfil e Admin */}
                <div className="grid grid-cols-2 gap-8 items-start">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2.5">
                      Perfil de Acesso
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setPerfilSelecionado('atendente')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all border ${
                          perfilSelecionado === 'atendente'
                            ? 'border-[#BD3B0F] bg-[#fff8f6] text-[#BD3B0F]'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <Headset size={16} /> Atendente
                      </button>
                      <button
                        type="button"
                        onClick={() => setPerfilSelecionado('cliente')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all border ${
                          perfilSelecionado === 'cliente'
                            ? 'border-[#BD3B0F] bg-[#fff8f6] text-[#BD3B0F]'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <User size={16} /> Cliente
                      </button>
                    </div>
                  </div>

                  {perfilSelecionado === 'atendente' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-2.5">
                        Administrador
                      </label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setIsAdministrador(true)}
                          className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all border ${
                            isAdministrador
                              ? 'border-[#BD3B0F] bg-[#fff8f6] text-[#BD3B0F]'
                              : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {' '}
                          Sim{' '}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAdministrador(false)}
                          className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all border ${
                            !isAdministrador
                              ? 'border-[#BD3B0F] bg-[#fff8f6] text-[#BD3B0F]'
                              : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {' '}
                          Não{' '}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2.5">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: João Silva de Oliveira"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] transition-all placeholder:text-gray-400"
                  />
                </div>

                {/* Email e Setor */}
                <div className="grid grid-cols-2 gap-8 items-start">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2.5">
                      E-mail Corporativo
                    </label>
                    <input
                      type="email"
                      placeholder="usuario@dominio.com.br"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2.5">
                      {perfilSelecionado === 'atendente' ? 'Setor' : 'Empresa'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        perfilSelecionado === 'atendente'
                          ? 'Suporte N1'
                          : 'Empresa Ltda'
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Campos de Cliente */}
                {perfilSelecionado === 'cliente' && (
                  <div className="grid grid-cols-2 gap-8 items-start">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-2.5">
                        Produto
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-2.5">
                        Data de Expiração
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] transition-all"
                        />
                        <Calendar
                          size={16}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex justify-end items-center gap-5 mt-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('usuarios')}
                    className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors px-2 py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white font-bold py-3 px-6 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm"
                  >
                    <UserPlus size={18} /> Cadastrar Usuário
                  </button>
                </div>
              </form>
            </div>

            <div className="flex justify-center items-center gap-2 text-gray-400 uppercase tracking-widest text-[10px] font-bold mb-10">
              <RefreshCcw size={14} /> Processo de Segurança Validado
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