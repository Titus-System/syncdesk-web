import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Ticket,
  Headset,
  User as UserIcon,
  UserPlus,
  RefreshCcw,
  LogOut,
  MessageSquare
} from 'lucide-react';

import { useCreateUser } from '@titus-system/syncdesk';

export default function CadastrarUsuario({ onNavigate }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfilSelecionado, setPerfilSelecionado] = useState('atendente'); 
  const [isAdministrador, setIsAdministrador] = useState(false);

  const createUserMutation = useCreateUser();
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuRef = useRef(null);

  const userLogged = JSON.parse(
    localStorage.getItem('user_data') || '{"name": "Admin"}'
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCadastro = async (e) => {
    e.preventDefault();

    const getRoleIds = () => {
      if (perfilSelecionado === 'atendente') {
        return isAdministrador ? [1] : [3];
      }
      return [4];
    };

    const cleanUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const uniqueSuffix = Math.floor(Math.random() * 1000);
    const finalUsername = `${cleanUsername}${uniqueSuffix}`;

    const userData = {
      email: email.trim().toLowerCase(),
      password_hash: "Mudar@123",
      username: finalUsername,
      name: nome.trim(),
      oauth_provider: "local",
      oauth_provider_id: `local_${Date.now()}`,
      is_active: true,
      is_verified: true,
      must_change_password: true,
      must_accept_terms: true,
      role_ids: getRoleIds()
    };

    try {
      await createUserMutation.mutateAsync(userData);
      alert("Usuário cadastrado com sucesso!");
      onNavigate('usuarios');
    } catch (error) {
      const errorDetail = error.response?.data?.detail || "Erro desconhecido.";
      alert(`Erro ao cadastrar: ${errorDetail}`);
    }
  };

  return (
    <div className="flex h-screen bg-[#f4ece1] font-sans overflow-hidden text-[#1E293B]">
      {/* Sidebar - Idêntica ao Dashboard */}
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <LayoutDashboard size={18} className="text-white" />
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
        {/* Navbar - Idêntica ao Dashboard */}
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1"></div>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setMenuPerfilAberto(!menuPerfilAberto)} 
              className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
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
        </header>

        {/* Área de Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="w-full max-w-4xl mx-auto">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Novo Registro</h1>
              <p className="text-gray-500 text-sm mt-1.5 font-medium opacity-60">Os IDs de perfil serão vinculados conforme a regra de negócio (Seed: 1, 3, 4).</p>
            </div>

            {/* O TRAÇO*/}
            <div className="w-full h-[1.5px] bg-gray-300/40 mb-10" />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10 w-full mb-10">
              <form className="flex flex-col gap-8" onSubmit={handleCadastro}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase tracking-wider">Perfil de Acesso</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setPerfilSelecionado('atendente')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all border ${perfilSelecionado === 'atendente' ? 'border-[#BD3B0F] bg-[#fff8f6] text-[#BD3B0F]' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                      >
                        <Headset size={16} /> Atendente
                      </button>
                      <button
                        type="button"
                        onClick={() => setPerfilSelecionado('cliente')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all border ${perfilSelecionado === 'cliente' ? 'border-[#BD3B0F] bg-[#fff8f6] text-[#BD3B0F]' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                      >
                        <UserIcon size={16} /> Cliente
                      </button>
                    </div>
                  </div>

                  {perfilSelecionado === 'atendente' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase tracking-wider">Nível Administrativo</label>
                      <div className="flex gap-4">
                        <button type="button" onClick={() => setIsAdministrador(true)} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all border ${isAdministrador ? 'border-[#BD3B0F] bg-[#fff8f6] text-[#BD3B0F]' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>Sim (Admin)</button>
                        <button type="button" onClick={() => setIsAdministrador(false)} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all border ${!isAdministrador ? 'border-[#BD3B0F] bg-[#fff8f6] text-[#BD3B0F]' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>Não (Agente)</button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase tracking-wider">Nome Completo</label>
                  <input required type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Maria Oliveira" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#BD3B0F] outline-none transition-all placeholder:text-gray-300" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase tracking-wider">E-mail Corporativo</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@syncdesk.com" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#BD3B0F] outline-none transition-all placeholder:text-gray-300" />
                </div>

                <div className="flex justify-end items-center gap-5 mt-4">
                  <button type="button" onClick={() => onNavigate('usuarios')} className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">Cancelar</button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white font-bold py-3 px-10 rounded-lg shadow-lg flex items-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50 transition-all"
                  >
                    {createUserMutation.isPending ? 'Cadastrando...' : <><UserPlus size={18} /> Finalizar Cadastro</>}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex justify-center items-center gap-2 text-gray-400 uppercase tracking-widest text-[10px] font-bold mb-10">
              <RefreshCcw size={14} /> Sincronizado com OpenAPI & SQLAlchemy Seed
            </div>
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