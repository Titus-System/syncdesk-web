import React, { useState, useRef, useEffect } from 'react';
import {
  User, 
  Info, 
  ChevronDown, 
  Users, 
  MessageSquare, 
  LogOut, 
  LayoutDashboard, 
  Ticket
} from 'lucide-react';

import { useUpdateTicketStatus } from '@titus-system/syncdesk';

export default function ModificarChamado({ onNavigate, ticketData }) {
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuRef = useRef(null);
  const { mutateAsync: updateStatus, isPending } = useUpdateTicketStatus();

  const [formData, setFormData] = useState({
    product: '', status: '', description: '', criticality: '', id: ''
  });

  useEffect(() => {
    if (ticketData) {
      setFormData({
        product: ticketData.product || ticketData.title || '',
        status: ticketData.status || 'open',
        description: ticketData.description || '',
        criticality: ticketData.criticality || ticketData.priority || 'medium',
        id: ticketData.id || ''
      });
    }
  }, [ticketData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.id) return;
    try {
      await updateStatus({ ticketId: formData.id, payload: { status: formData.status } });
      alert("Alterações salvas com sucesso!");
      onNavigate('chamados'); 
    } catch (error) {
      alert("Erro ao atualizar o chamado.");
    }
  };

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden text-[#1E293B]">
      {/* Sidebar Padronizada */}
      <aside className="w-64 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-2 rounded-xl shadow-sm">
              <LayoutDashboard size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-black text-2xl uppercase tracking-tighter">SYNCDESK</span>
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
        {/* Navbar Padronizada */}
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1"></div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuPerfilAberto(!menuPerfilAberto)} className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center">
              <User size={20} className="text-white/90" />
            </button>
            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-48 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl uppercase transition-colors">
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
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-[#fceae5] text-[#BD3B0F] text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md">{formData.status}</span>
                  <span className="text-gray-500 text-xs font-semibold opacity-60">Chamado #{formData.id.toString().slice(-6)}</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{formData.product}</h1>
              </div>
              <div className="flex gap-3 mt-2 items-center">
                <button onClick={() => onNavigate('chamados')} className="bg-white border border-gray-300 text-gray-600 text-xs font-bold py-2.5 px-5 rounded-lg uppercase">Cancelar</button>
                <button onClick={handleSave} disabled={isPending} className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-lg uppercase transition-all disabled:opacity-50">
                  {isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </div>
            <div className="w-full h-[1.5px] bg-gray-300/40 mb-10" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100 opacity-60">
                    <Info size={18} className="text-[#BD3B0F]" />
                    <h2 className="text-sm font-bold text-gray-900">Detalhes do Chamado</h2>
                  </div>
                  <form className="flex flex-col gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Produto / Sistema</label>
                      <input disabled type="text" value={formData.product} className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-400 cursor-not-allowed" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1.5 tracking-wider">Situação (Status)</label>
                        <div className="relative">
                          <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm appearance-none outline-none focus:border-[#BD3B0F]">
                            <option value="open">Aberto (Open)</option>
                            <option value="in_progress">Em Atendimento (In Progress)</option>
                            <option value="finished">Finalizado (Finished)</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Criticidade</label>
                        <input disabled value={formData.criticality} className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Descrição</label>
                      <textarea disabled rows="5" value={formData.description} className="w-full px-3.5 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm resize-none text-gray-400" />
                    </div>
                  </form>
                </div>
              </div>
              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-2.5 mb-5 text-[#BD3B0F] opacity-60">
                    <Users size={18} />
                    <h2 className="text-sm font-bold text-gray-900">Equipe Atribuída</h2>
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 text-center uppercase font-bold tracking-widest">Suporte Nível 1</div>
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