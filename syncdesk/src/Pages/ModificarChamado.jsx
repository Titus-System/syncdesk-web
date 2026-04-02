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
  X,
  Download,
  LogOut,
} from 'lucide-react';

export default function ModificarChamado({ onNavigate }) {
  // --- LÓGICA DO MENU DE PERFIL (NAVBAR) ---
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
    <div className="flex flex-col min-h-screen bg-[#F4EAD9] font-sans">
      {/* Header Superior (Topbar Full Width) */}
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

            {/* Botões de Ação Superiores */}
            <div className="flex gap-3 mt-2 items-center">
              <button className="bg-[#FF1A1A] hover:bg-rose-700 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-[0_2px_10px_rgba(225,29,72,0.25)] transition-all uppercase tracking-wider flex items-center gap-2">
                Encerrar Chamado
              </button>

              <button
                onClick={() => onNavigate('chamados')}
                className="bg-white border border-[#BD3B0F]/30 text-[#BD3B0F] hover:bg-[#BD3B0F]/5 text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors uppercase tracking-wider ml-1"
              >
                Cancelar
              </button>

              <button className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-[0_2px_10px_rgba(189,59,15,0.2)] transition-all uppercase tracking-wider">
                Salvar Alterações
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA ESQUERDA (Principal) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* CARD 1: Detalhes do Chamado */}
              <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100">
                  <Info size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-sm font-bold text-gray-900">
                    Detalhes do Chamado
                  </h2>
                </div>

                <form className="flex flex-col gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                      Nome do Chamado (Assunto)
                    </label>
                    <input
                      type="text"
                      defaultValue="Problema de Acesso ao Sistema - Departamento Financeiro"
                      className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Nome da Empresa
                      </label>
                      <input
                        type="text"
                        defaultValue="Empresa Exemplo S.A."
                        className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Situação do Chamado
                      </label>
                      <div className="relative">
                        <select className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all cursor-pointer">
                          <option>Em Atendimento</option>
                          <option>Aberto</option>
                          <option>Pendente</option>
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
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Requerente
                      </label>
                      <input
                        type="text"
                        defaultValue="Alice Johnson"
                        className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Dia da Abertura
                      </label>
                      <input
                        type="text"
                        defaultValue="24/10/2023"
                        className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Categoria
                      </label>
                      <div className="relative">
                        <select className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all cursor-pointer">
                          <option>Suporte de Software</option>
                          <option>Acesso / Login</option>
                          <option>Falha no Sistema</option>
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Nível de Prioridade
                      </label>
                      <div className="relative">
                        <select className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all cursor-pointer">
                          <option>Média</option>
                          <option>Alta Prioridade</option>
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
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                      Descrição
                    </label>
                    <textarea
                      rows="4"
                      defaultValue="O usuário relata que não consegue acessar o sistema ERP interno desde a atualização desta manhã. Código de erro: 403 Forbidden na página de login."
                      className="w-full px-3.5 py-3 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/30 focus:border-[#BD3B0F] focus:bg-white transition-all resize-none"
                    ></textarea>
                  </div>
                </form>
              </div>

              {/* CARD 2: Discussão (Chat) */}
              <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6 flex flex-col min-h-[300px]">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare size={18} className="text-[#BD3B0F]" />
                    <h2 className="text-sm font-bold text-gray-900">
                      Discussão (Conversa)
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">
                    3 mensagens
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-4 mb-6">
                  <div className="flex flex-col items-end self-end w-full max-w-[85%] mt-2">
                    <div className="flex items-center gap-2 mb-1.5 mr-12">
                      <span className="text-[10px] text-gray-400 font-bold">
                        10:58
                      </span>
                      <span className="text-[11px] font-bold text-gray-700">
                        Equipe de Suporte
                      </span>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="bg-[#BD3B0F] text-white p-3.5 rounded-2xl rounded-tr-sm shadow-sm text-[13px] leading-relaxed">
                        Foi realizada a verificação no sistema e identificado que os
                        dados estão sendo atualizados corretamente. Aguardando
                        validação do usuário para prosseguimento com o encerramento
                        do chamado.
                      </div>
                      <div className="w-8 h-8 bg-[#9a2f0d] rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1">
                        <User size={14} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative mt-auto border border-gray-200 rounded-full bg-gray-50 p-1 pl-4 flex items-center shadow-sm focus-within:border-[#BD3B0F]/50 focus-within:ring-2 focus-within:ring-[#BD3B0F]/10 transition-all">
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

            {/* COLUNA DIREITA (Sidebar do Chamado) */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <Users size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-sm font-bold text-gray-900">
                    Equipe Atribuída
                  </h2>
                </div>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-2.5 mb-3 group hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center text-xs font-bold">
                      JD
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">John Doe</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                        Técnico Líder
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-300 hover:text-red-500 p-1 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <button className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#BD3B0F]/40 text-[#BD3B0F] hover:bg-[#BD3B0F]/5 rounded-xl text-xs font-bold transition-all tracking-wide">
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
                        defaultValue="4.5"
                        className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-bold focus:outline-none focus:border-[#BD3B0F] transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none uppercase tracking-wider">
                        hrs
                      </span>
                    </div>
                    <button className="bg-[#fceae5] hover:bg-[#BD3B0F]/20 text-[#BD3B0F] p-2.5 rounded-lg transition-colors border border-[#BD3B0F]/10">
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100/80 p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <Paperclip size={18} className="text-[#BD3B0F]" />
                  <h2 className="text-sm font-bold text-gray-900">Anexos</h2>
                </div>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-white p-1.5 rounded border border-gray-200 shadow-sm shrink-0">
                      <Download size={14} className="text-gray-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      error_screenshot.png
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-[#BD3B0F] transition-colors shrink-0">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto text-center text-[10px] font-bold text-gray-400 pb-6 uppercase tracking-widest">
          © 2026 Service Desk Pro • Gestão Moderna de Suporte
        </div>
      </main>
    </div>
  );
}