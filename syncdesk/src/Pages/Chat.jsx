import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  User,
  Radio,
  ArchiveRestore,
  AlertTriangle,
  Hand,
  Flag,
  Bot,
  Paperclip,
  LayoutGrid,
  History,
  MailWarning,
  LogOut,
} from 'lucide-react';

export default function Chat({ onNavigate }) {
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickFora(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#4A0E0E] text-white font-sans overflow-hidden">
      {/* HEADER SUPERIOR */}
      <header className="h-[64px] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-50 bg-[#4A0E0E]">
        <div className="flex items-center gap-10">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="bg-[#D14D1D] p-1.5 rounded-md">
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">SyncDesk</span>
          </button>

          <nav className="flex items-center gap-8">
            <a
              href="#"
              className="text-[#D14D1D] font-medium text-sm border-b-2 border-[#D14D1D] pb-1"
            >
              Console ao Vivo
            </a>
            <a
              href="#"
              className="text-white/60 hover:text-white font-medium text-sm pb-1 transition-colors"
            >
              Histórico de Logs
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {/* BARRA DE PESQUISA ATUALIZADA PADRÃO IMAGEM */}
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

          {/* DROPDOWN PERFIL */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
              className="w-9 h-9 bg-white/10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <User size={20} className="text-white/80" />
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

      {/* ÁREA PRINCIPAL */}
      <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-6">
        {/* COLUNA ESQUERDA - SESSÕES ATIVAS */}
        <aside className="w-[260px] flex flex-col shrink-0 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Radio size={16} className="text-[#D14D1D]" />
            <h2 className="font-bold text-sm text-white/90">Sessões Ativas</h2>
            <span className="ml-auto bg-black/40 text-[10px] px-2 py-0.5 rounded-full text-white/60">
              12 Live
            </span>
          </div>

          <div className="flex gap-2 mb-4">
            <button className="flex-1 bg-[#D14D1D] text-[10px] font-bold py-1.5 rounded-md">
              Todas
            </button>
            <button className="flex-1 bg-white/5 text-white/40 text-[10px] font-bold py-1.5 rounded-md hover:bg-white/10">
              Sinalizadas
            </button>
            <button className="flex-1 bg-white/5 text-white/40 text-[10px] font-bold py-1.5 rounded-md hover:bg-white/10">
              Erros
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <SessionItem
              active
              user="User_4921"
              message="Como faço para redefinir minhas credenciais?"
              time="12 min"
            />
            <SessionItem
              user="User_8832"
              message="Obrigado pela ajuda rápida."
              time="45 min"
              status="IDLE"
            />
            <SessionItem
              user="System_Bot"
              message="Exceção não tratada: referência nula..."
              time="2 min"
              status="ERRO"
              isError
            />
            <SessionItem
              user="User_1204"
              message="Existe algum código de desconto?"
              time="5 min"
              status="LIVE"
            />
          </div>
        </aside>

        {/* COLUNA CENTRAL - ÁREA DO CHAT */}
        <main className="flex-1 flex flex-col rounded-2xl overflow-hidden mt-4 shadow-xl">
          <div className="bg-[#F3EAD8] px-6 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center">
                <User size={20} className="text-gray-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-gray-800 font-bold text-sm">User_4921</h3>
                  <span className="bg-[#D14D1D] text-white text-[9px] px-2 py-0.5 rounded-md font-bold uppercase">
                    Autenticado
                  </span>
                </div>
                <p className="text-gray-500 text-[10px]">
                  ID da Sessão: sess_902130 | Localização: Nova York, EUA
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-[#D14D1D] text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md hover:bg-[#b03f18] transition-colors">
                <Hand size={14} /> Intervenção Manual
              </button>
              <button className="bg-[#D14D1D] text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md hover:bg-[#b03f18] transition-colors">
                <Flag size={14} /> Sinalizar Sessão
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 bg-[#F3EAD8]">
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-200/50 px-3 py-1 rounded-full">
                Yesterday, 14:20
              </span>
            </div>

            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-gray-200">
                <User size={16} className="text-gray-400" />
              </div>
              <div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-gray-700 text-sm leading-relaxed border border-gray-100">
                  Oi, estou tendo problemas para redefinir as credenciais da minha
                  conta. Não recebi o e-mail.
                </div>
                <span className="text-[10px] text-gray-400 mt-1 ml-1 font-medium">
                  14:21 • AI Bot
                </span>
              </div>
            </div>

            <div className="flex gap-3 max-w-[80%] self-end flex-row-reverse">
              <div className="w-8 h-8 bg-[#4A0E0E] rounded-full flex items-center justify-center shadow-sm shrink-0 text-white">
                <Bot size={16} />
              </div>
              <div className="flex flex-col items-end">
                <div className="bg-[#4A0E0E] p-4 rounded-2xl rounded-tr-none shadow-lg text-white text-sm leading-relaxed">
                  Olá Usuário_4921!! Sou o SyncBot, seu assistente virtual. Sinto
                  muito por ouvir isso. Verifiquei sua conta e parece que o link de
                  redefinição foi enviado para seu e-mail principal terminado em
                  @gmail.com. Você verificou sua pasta de spam?
                </div>
                <span className="text-[10px] text-gray-400 mt-1 mr-1 font-medium">
                  14:22 • User
                </span>
              </div>
            </div>

            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-gray-200">
                <User size={16} className="text-gray-400" />
              </div>
              <div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-gray-700 text-sm border border-gray-100">
                  Sim, eu verifiquei em todos os lugares. Ainda nada. Um humano
                  pode me ajudar com isso? É urgente.
                </div>
                <span className="text-[10px] text-gray-400 mt-1 ml-1 font-medium">
                  14:23 • AI Bot
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#D14D1D]">
            <div className="bg-white rounded-xl p-2 flex items-center gap-2 border border-[#D14D1D]/20 shadow-md">
              <input
                type="text"
                placeholder="Assuma o controle e digite uma mensagem..."
                className="flex-1 px-4 py-2 text-sm text-gray-600 focus:outline-none placeholder:text-gray-400"
              />
              <button className="p-2 text-gray-400 hover:text-[#D14D1D] transition-colors">
                <Paperclip size={20} />
              </button>
              <button className="bg-[#D14D1D] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#b03f18] transition-all">
                Enviar
              </button>
            </div>
            <p className="text-center text-[10px] text-white font-bold mt-3 uppercase opacity-90 tracking-tighter">
              Você deve clicar em "Intervenção Manual" para assumir o controle desta
              sessão.
            </p>
          </div>
        </main>

        {/* COLUNA DIREITA - ATALHOS */}
        <aside className="w-[180px] shrink-0 mt-4">
          <div className="flex items-center gap-2 mb-6">
            <LayoutGrid size={16} className="text-[#D14D1D]" />
            <h2 className="font-bold text-sm text-white/90">Atalhos</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <QuickAction icon={<History size={18} />} label="Full Logs" />
            <QuickAction icon={<MailWarning size={18} />} label="Transfer" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function SessionItem({ active, user, message, time, status, isError }) {
  return (
    <div
      className={`p-4 rounded-xl cursor-pointer transition-all ${
        active
          ? 'bg-[#D14D1D] shadow-lg scale-[1.02]'
          : 'bg-black/20 hover:bg-black/30'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <h4
          className={`text-xs font-bold truncate ${
            isError && !active ? 'text-orange-500' : 'text-white'
          }`}
        >
          {user}
        </h4>
        {status && (
          <span
            className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black ${
              status === 'ERRO'
                ? 'bg-orange-500/20 text-orange-400'
                : status === 'LIVE'
                ? 'bg-black/20 text-white/80'
                : 'bg-white/10 text-white/60'
            }`}
          >
            {status}
          </span>
        )}
      </div>
      <p className="text-[10px] text-white/60 line-clamp-1 mb-2">"{message}"</p>
      <div className="flex justify-between items-center opacity-40">
        <span className="text-[9px] font-bold tracking-tighter">
          duração de {time}
        </span>
        {isError ? (
          <AlertTriangle size={10} className="text-orange-500" />
        ) : (
          <ArchiveRestore size={10} />
        )}
      </div>
    </div>
  );
}

function QuickAction({ icon, label }) {
  return (
    <button className="bg-white text-[#4A0E0E] flex flex-col items-center justify-center p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform group">
      <div className="text-[#D14D1D] mb-1 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tighter opacity-80">
        {label}
      </span>
    </button>
  );
}