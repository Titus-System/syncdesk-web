import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Info,
  ChevronDown,
  Paperclip,
  Send,
  Clock,
  RotateCcw,
  Plus,
  Headset,
  Users,
  MessageSquare,
  LogOut,
} from 'lucide-react';

export default function AberturaChamado({ onNavigate }) {
  // --- LÓGICA DO MENU DE PERFIL ---
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
    <div className="flex flex-col min-h-screen bg-[#F4EAD9] font-sans">
      {/* Header Superior */}
      <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-8 text-white shrink-0 shadow-sm z-50 w-full">
        <div className="flex items-center gap-3">
          <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm flex items-center justify-center">
            <Headset size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-wide">
            Service Desk
          </span>
        </div>

        <div className="flex items-center gap-5">
          {/* CONTAINER DO PERFIL COM DROPDOWN */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
              className="w-8 h-8 bg-white/10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors focus:outline-none"
            >
              <User size={16} className="text-white/80" />
            </button>

            {/* O MENU DROPDOWN */}
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold text-[#BD3B0F] hover:bg-white/10 rounded-xl transition-colors uppercase tracking-wider mt-1 text-left"
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-[1100px] mx-auto">
          {/* Header da Página do Chamado */}
          <div className="flex justify-between items-start mb-8 mt-2">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-[#fceae5] text-[#BD3B0F] text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md">
                  ATIVO
                </span>
                <span className="text-gray-500 text-xs font-semibold">
                  Chamado #12345
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Problema de Acesso ao Sistema
              </h1>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => onNavigate('chamados')}
                className="bg-white border border-[#BD3B0F]/30 text-[#BD3B0F] hover:bg-[#BD3B0F]/5 text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-[0_2px_10px_rgba(189,59,15,0.2)] transition-all uppercase tracking-wider">
                Salvar Alterações
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA ESQUERDA */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100">
                  <Info size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-sm font-bold text-gray-900">
                    Detalhes do Chamado
                  </h2>
                </div>

                <form className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Nome do Chamado (Assunto)
                    </label>
                    <input
                      type="text"
                      defaultValue="Problema de Acesso ao Sistema"
                      className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Nome da Empresa
                      </label>
                      <input
                        type="text"
                        defaultValue="Acme Corp"
                        className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Situação do Chamado
                      </label>
                      <div className="relative">
                        <select className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all cursor-pointer">
                          <option>Em Atendimento</option>
                          <option>Aberto</option>
                          <option>Resolvido</option>
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Requerente
                      </label>
                      <input
                        type="text"
                        defaultValue="João Silva"
                        className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Dia da Abertura
                      </label>
                      <input
                        type="text"
                        defaultValue="12/04/2024"
                        disabled
                        className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Categoria
                      </label>
                      <div className="relative">
                        <select className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all cursor-pointer">
                          <option>Acesso / Login</option>
                          <option>Falha no Sistema</option>
                          <option>Dúvida Técnica</option>
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Nível de Prioridade
                      </label>
                      <div className="relative">
                        <select className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all cursor-pointer">
                          <option>Alta Prioridade</option>
                          <option>Média</option>
                          <option>Baixa</option>
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Descrição
                    </label>
                    <textarea
                      rows="6"
                      className="w-full px-3.5 py-3 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all resize-none"
                    ></textarea>
                  </div>
                </form>
              </div>

              {/* Discussão */}
              <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6 flex flex-col min-h-[300px]">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare size={18} className="text-[#BD3B0F]" />
                    <h2 className="text-sm font-bold text-gray-900">
                      Discussão (Conversa)
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">
                    0 mensagens
                  </span>
                </div>

                <div className="flex-1 rounded-xl mb-4 flex items-center justify-center"></div>

                <div className="relative mt-auto border border-gray-200 rounded-full bg-gray-50 p-1 pl-4 flex items-center shadow-sm">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-transparent text-sm text-gray-700 focus:outline-none placeholder:text-gray-400"
                  />
                  <button className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white w-9 h-9 flex items-center justify-center rounded-full transition-colors shadow-sm ml-2">
                    <Send size={14} className="ml-[-2px] mt-[1px]" />
                  </button>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <Users size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-sm font-bold text-gray-900">
                    Equipe Atribuída
                  </h2>
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#BD3B0F]/40 text-[#BD3B0F] hover:bg-[#BD3B0F]/5 rounded-lg text-xs font-bold transition-all tracking-wide">
                  <Plus size={16} />
                  Atribuir Alguém
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <Clock size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-sm font-bold text-gray-900">
                    Horas Trabalhadas
                  </h2>
                </div>

                <div className="mb-4">
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                    Total de Horas
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-bold focus:outline-none focus:border-[#BD3B0F] transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none uppercase tracking-wider">
                        hrs
                      </span>
                    </div>
                    <button className="bg-[#BD3B0F]/10 hover:bg-[#BD3B0F]/20 text-[#BD3B0F] p-2.5 rounded-lg transition-colors">
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-medium text-gray-500 pt-4 border-t border-gray-100">
                  <span>Última atualização:</span>
                  <span>há 2 horas</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6">
                <div className="flex items-center gap-2.5">
                  <Paperclip size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-sm font-bold text-gray-900">Anexos</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-[10px] font-bold text-gray-400 pb-6 shrink-0">
          © 2026 Service Desk Pro • Gestão Moderna de Suporte
        </div>
      </main>
    </div>
  );
}