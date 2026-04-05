import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Plus,
  Users,
  LogOut,
  X,
  LayoutDashboard,
  Ticket,
  MessageSquare
} from 'lucide-react';

import { useCreateTicket, useGetUsers } from '@titus-system/syncdesk';

export default function AberturaChamado({ onNavigate }) {
  const userLogged = JSON.parse(localStorage.getItem('user_data') || '{"name": "Admin"}');
  const fileInputRef = useRef(null);

  const { mutateAsync: createTicket, isPending } = useCreateTicket();
  const { data: usersData = [], isLoading: isLoadingUsers } = useGetUsers();

  const [formData, setFormData] = useState({
    client_id: '', 
    product: '',
    criticality: 'medium',
    type: 'issue',
    description: '',
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert("Erro 401/403: Você não está autenticado.");
      onNavigate('login');
      return;
    }
    if (!formData.client_id) {
      alert("Erro: Selecione um Cliente Solicitante.");
      return;
    }
    const payload = {
      client_id: formData.client_id,
      product: formData.product,
      criticality: formData.criticality,
      type: formData.type,
      description: formData.description,
      chat_ids: [], 
      triage_id: "67f0c9b8e4b0b1a2c3d4e5f6",
      attachments: selectedFiles.map(f => f.name)
    };
    try {
      await createTicket(payload);
      alert("Chamado aberto com sucesso!");
      onNavigate('chamados');
    } catch (error) {
      alert("Erro ao abrir o chamado.");
    }
  };

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden text-[#1E293B]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-2 rounded-xl shadow-sm">
              <LayoutDashboard size={24} className="text-white" strokeWidth={2.5} />
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
        {/* Navbar*/}
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1"></div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuPerfilAberto(!menuPerfilAberto)} className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center">
              <User size={20} className="text-white/90" />
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
          <div className="max-w-[1100px] mx-auto">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Novo Ticket</h1>
              <div className="flex gap-3">
                <button type="button" onClick={() => onNavigate('chamados')} className="bg-white border border-gray-300 text-gray-600 text-xs font-bold py-2.5 px-5 rounded-lg uppercase">Cancelar</button>
                <button onClick={handleSave} disabled={isPending} className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-lg uppercase disabled:opacity-50 transition-all">
                  {isPending ? "Criando..." : "Abrir Chamado"}
                </button>
              </div>
            </div>
            <div className="w-full h-[1.5px] bg-gray-300/40 mb-10" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <form className="flex flex-col gap-6" onSubmit={handleSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Cliente Solicitante</label>
                      <select required name="client_id" value={formData.client_id} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#BD3B0F]">
                        <option value="" disabled>{isLoadingUsers ? "Carregando..." : "Selecione o Cliente"}</option>
                        {usersData.map(user => (<option key={user.id} value={user.id}>{user.name || user.username} ({user.email})</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sistema / Produto</label>
                      <input required type="text" name="product" value={formData.product} onChange={handleChange} placeholder="Ex: App SyncDesk" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#BD3B0F]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Criticidade</label>
                      <select name="criticality" value={formData.criticality} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo</label>
                      <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
                        <option value="issue">Problema</option>
                        <option value="request">Solicitação</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição</label>
                    <textarea required name="description" value={formData.description} onChange={handleChange} rows="6" placeholder="O que está acontecendo?" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none outline-none focus:border-[#BD3B0F]" />
                  </div>
                </form>
              </div>

              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                   <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 tracking-widest text-center">Anexar Prints</p>
                   <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                   <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-gray-100 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                      <Plus size={20} className="text-gray-300" />
                      <span className="text-[10px] text-gray-400 font-medium text-center">Clique para selecionar</span>
                   </div>
                   {selectedFiles.length > 0 && (
                     <div className="mt-4 flex flex-col gap-2">
                       {selectedFiles.map((file, index) => (
                         <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                           <span className="text-[11px] text-gray-600 truncate max-w-[150px]">{file.name}</span>
                           <button onClick={() => removeFile(index)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                         </div>
                       ))}
                     </div>
                   )}
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
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}