import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Ticket,
  Headset,
  User as UserIcon,
  LogOut,
  MessageSquare,
  Save,
  ArrowLeft,
  RefreshCcw,
  Loader2
} from 'lucide-react';

import { useGetUser, usePatchUser } from '@titus-system/syncdesk';
import { useQueryClient } from '@tanstack/react-query';

export default function EditarUsuario({ userId, onNavigate }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetUser(userId);
  const patchUserMutation = usePatchUser();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuRef = useRef(null);

  const userLogged = JSON.parse(
    localStorage.getItem('user_data') || '{"name": "Admin"}'
  );

  useEffect(() => {
    if (user) {
      setNome(user.name || '');
      setEmail(user.email || '');
      setIsActive(user.is_active ?? true);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();

    // PAYLOAD AJUSTADO: 
    // Mantemos o username original (se existir) para evitar que o servidor se perca e dê erro 500
    const payload = {
      email: email.trim().toLowerCase(),
      name: nome.trim(),
      username: user?.username, // Adicionado para garantir estabilidade no back-end
      is_active: isActive       // Mantém o estado que está na tela (Ativo/Inativo)
    };

    try {
      await patchUserMutation.mutateAsync({
        id: userId,
        data: payload
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
      
      alert("Usuário atualizado com sucesso!");
      onNavigate('usuarios');
    } catch (error) {
      console.error("Erro detalhado da API:", error.response?.data);
      alert("Erro interno no servidor (500). Verifique se o e-mail já existe ou se os dados estão corretos.");
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-[#F4EAD9] font-bold text-[#500D0D] animate-pulse uppercase">Carregando...</div>;

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden text-[#1E293B]">
      <aside className="w-64 bg-[#500D0D] flex flex-col justify-between text-white/90 shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-2 rounded-xl"><LayoutDashboard size={24} /></div>
            <span className="text-white font-bold text-sm uppercase">SyncDesk</span>
          </div>
          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => onNavigate('dashboard')} />
            <NavItem icon={<Users size={16} />} label="Usuários" active onClick={() => onNavigate('usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" onClick={() => onNavigate('chamados')} />
            <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => onNavigate('chat')} />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0">
          <div className="flex-1"></div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuPerfilAberto(!menuPerfilAberto)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <UserIcon size={20} />
            </button>
            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-48 bg-[#500D0D] border border-white/10 rounded-2xl p-2 shadow-2xl z-[50]">
                <p className="p-3 text-[10px] text-white/40 uppercase font-bold border-b border-white/5">{userLogged.name}</p>
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 uppercase">
                  <LogOut size={14} /> Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="w-full max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 uppercase">Editar Perfil</h1>
                <p className="text-gray-500 text-sm mt-1.5 opacity-60">Editando: {user?.username}</p>
              </div>
              <button onClick={() => onNavigate('usuarios')} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#500D0D] uppercase">
                <ArrowLeft size={16} /> Voltar
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10">
              <form className="flex flex-col gap-8" onSubmit={handleUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">Nome Completo</label>
                    <input required type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#BD3B0F]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2.5 uppercase">E-mail</label>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#BD3B0F]" />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-xs font-bold text-gray-800 uppercase">Status da Conta:</label>
                  <button 
                    type="button" 
                    onClick={() => setIsActive(!isActive)} 
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold transition-all border ${isActive ? 'border-green-500 bg-green-50 text-green-600' : 'border-red-500 bg-red-50 text-red-600'}`}
                  >
                    {isActive ? 'CONTA ATIVA' : 'CONTA INATIVA'}
                  </button>
                </div>

                <div className="flex justify-end items-center gap-5">
                  <button type="button" onClick={() => onNavigate('usuarios')} className="text-xs font-bold text-gray-400 uppercase">Descartar</button>
                  <button
                    type="submit"
                    disabled={patchUserMutation.isPending}
                    className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white font-bold py-3 px-10 rounded-lg shadow-lg flex items-center gap-2 text-sm uppercase disabled:opacity-50"
                  >
                    {patchUserMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Salvar Alterações</>}
                  </button>
                </div>
              </form>
            </div>
            <div className="mt-10 flex justify-center items-center gap-2 text-gray-400 uppercase text-[10px] font-bold">
              <RefreshCcw size={14} /> Atualização via SyncDesk API Engine
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white' : 'text-white/60 hover:bg-white/10'}`}>
      {icon} {label}
    </button>
  );
}