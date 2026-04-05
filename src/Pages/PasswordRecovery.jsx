import React, { useState } from 'react';
import {
  Mail,
  ArrowLeft,
  Send,
  ShieldCheck,
  X,
  Eye,
  RotateCcw,
} from 'lucide-react';

const PasswordRecovery = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const colors = {
    primary: 'bg-[#C2410C]', // Laranja queimado das imagens
    hover: 'hover:bg-[#A6360B]',
    bg: 'bg-[#F5EFE1]', // Bege de fundo
    textMuted: 'text-[#64748B]',
    border: 'border-[#E2E8F0]',
  };

  return (
    <div
      className={`min-h-screen ${colors.bg} flex flex-col font-sans text-[#1E293B]`}
    >
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-[1440px] w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className={`${colors.primary} p-1.5 rounded-lg text-white`}>
            <ShieldCheck size={20} fill="currentColor" fillOpacity={0.2} />
          </div>
          <span className="font-bold text-lg tracking-tight">SyncDesk</span>
        </div>
        <button
          onClick={onBackToLogin}
          className={`${colors.primary} text-white px-5 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all ${colors.hover}`}
        >
          <ArrowLeft size={18} /> Voltar
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[24px] shadow-sm w-full max-w-[480px] border border-white">
          {/* Passo 1: Solicitar E-mail */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-14 h-14 bg-[#FFF7ED] rounded-full flex items-center justify-center text-[#C2410C]">
                <RotateCcw size={28} />
              </div>
              <div className="space-y-2">
                <h1 className="text-[28px] font-extrabold tracking-tight">
                  Redefinir senha
                </h1>
                <p className="text-gray-500 text-[15px] leading-relaxed px-4">
                  Informe seu e-mail cadastrado para receber as instruções de
                  redefinição de senha.
                </p>
              </div>
              <div className="text-left space-y-1.5">
                <label className="text-sm font-bold text-[#1E293B] block">
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="exemplo@empresa.com"
                    className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className={`w-full ${colors.primary} text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-base transition-all ${colors.hover}`}
              >
                Enviar Código de Recuperação{' '}
                <Send size={18} className="rotate-[-10deg]" />
              </button>
              <button
                onClick={onBackToLogin}
                className="text-[#C2410C] font-bold text-sm flex items-center justify-center gap-2 mx-auto hover:opacity-80"
              >
                <ArrowLeft size={16} /> Voltar para o Login
              </button>
            </div>
          )}

          {/* Passo 2: Verificação de Código */}
          {step === 2 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-14 h-14 bg-[#FFF7ED] rounded-full flex items-center justify-center text-[#C2410C]">
                <Mail size={28} />
              </div>
              <div className="space-y-2">
                <h1 className="text-[28px] font-extrabold tracking-tight">
                  Verifique seu e-mail
                </h1>
                <p className="text-gray-500 text-[15px] leading-relaxed px-4">
                  Enviamos um código de verificação de 6 dígitos para o seu
                  endereço de e-mail. Por favor, insira-o abaixo para continuar.
                </p>
              </div>
              <div className="flex justify-center gap-2 py-4">
                {[...Array(6)].map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    className="w-11 h-1 bg-slate-200 rounded-full outline-none focus:bg-[#C2410C] transition-colors"
                  />
                ))}
              </div>
              <button
                onClick={() => setStep(3)}
                className={`w-full ${colors.primary} text-white py-4 rounded-xl font-bold text-base transition-all ${colors.hover}`}
              >
                Verificar Código
              </button>
              <div className="text-sm">
                <span className="text-gray-500">Não recebeu o código?</span>
                <button className="text-[#C2410C] font-bold block mx-auto mt-1 hover:underline items-center justify-center gap-1">
                  <RotateCcw size={14} /> Reenviar código
                </button>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-slate-400 text-xs font-medium uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Voltar ao Login
              </button>
            </div>
          )}

          {/* Passo 3: Criar Nova Senha */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="mx-auto w-14 h-14 bg-[#FFF7ED] rounded-full flex items-center justify-center text-[#C2410C]">
                <RotateCcw size={28} />
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-extrabold tracking-tight">
                  Criar Nova Senha
                </h1>
                <p className="text-gray-500 text-[14px] px-2">
                  Sua nova senha deve ser diferente das senhas usadas
                  anteriormente para garantir sua segurança.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#1E293B]">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Digite sua nova senha"
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-[#F8FAFC] outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                    <Eye
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                      size={20}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#1E293B]">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Repita a nova senha"
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-[#F8FAFC] outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                    <Eye
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                      size={20}
                    />
                  </div>
                </div>
              </div>

              {/* Requisitos */}
              <div className="bg-[#FFF7ED]/50 p-4 rounded-xl border border-orange-100 space-y-2">
                <p className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-wider">
                  Requisitos da Senha
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-4 h-4 rounded-full border border-[#C2410C] flex items-center justify-center text-[#C2410C] text-[10px] font-bold">
                      ✓
                    </div>
                    <span>Mínimo de 8 caracteres</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                    <span>Pelo menos uma letra maiúscula</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                    <span>Pelo menos um número ou símbolo</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 accent-[#C2410C] rounded border-slate-300 cursor-pointer"
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs text-slate-600 font-bold"
                  >
                    Eu aceito os{' '}
                    <button
                      onClick={() => setShowTerms(true)}
                      className="text-[#C2410C] underline decoration-2 underline-offset-2"
                    >
                      Termos de Uso
                    </button>
                  </label>
                </div>
                {/* BOTÃO ALTERADO ABAIXO PARA REDIRECIONAR AO LOGIN */}
                <button
                  onClick={onBackToLogin}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg shadow-orange-900/10 ${colors.primary} ${colors.hover}`}
                >
                  Redefinir Senha
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold tracking-widest uppercase">
                  Proteção de conta via SSL 256-bits
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="p-6 text-center text-[10px] text-slate-400">
        © 2024 Portal Administrativo. Todos os direitos reservados.
      </footer>

      {/* Modal Termos de Uso */}
      {showTerms && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">
                Termos de Uso da Plataforma
              </h2>
              <button
                onClick={() => setShowTerms(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-8 overflow-y-auto custom-scrollbar text-[14px] leading-relaxed text-slate-600 space-y-8">
              
              {/* 1. INTRODUÇÃO */}
              <div>
                <p className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-widest mb-1">Capítulo I</p>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Introdução</h3>
                <p>Este Termo de Uso disciplina o acesso e a utilização da plataforma digital disponibilizada em modelo SaaS, destinada à triagem de demandas, abertura e gestão de tickets e comunicação operacional via chat em tempo real.</p>
                <p className="mt-2 font-medium">Ao utilizar a Plataforma, o Usuário declara ciência e concordância com este Termo e com a Política de Privacidade aplicável.</p>
              </div>

              {/* 2. DEFINIÇÕES */}
              <div>
                <p className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-widest mb-1">Capítulo II</p>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Definições</h3>
                <ul className="space-y-2 list-none">
                  <li><strong>Plataforma:</strong> Solução digital para gestão de solicitações e tickets.</li>
                  <li><strong>Organização Cliente:</strong> Pessoa jurídica que contrata ou disponibiliza a Plataforma.</li>
                  <li><strong>Usuário:</strong> Pessoa física autorizada (agentes, administradores ou clientes).</li>
                  <li><strong>Ticket:</strong> Registro formal de solicitação ou incidente.</li>
                </ul>
              </div>

              {/* 3. ACEITAÇÃO */}
              <div>
                <p className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-widest mb-1">Capítulo III</p>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Aceitação dos Termos</h3>
                <p>O acesso depende da aceitação integral. O usuário declara possuir capacidade legal e atuar dentro dos limites de autorização conferidos pela Organização Cliente.</p>
              </div>

              {/* 4. USO DA PLATAFORMA */}
              <div>
                <p className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-widest mb-1">Capítulo IV</p>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Uso da Plataforma</h3>
                <p>A plataforma deve ser usada para fins profissionais. É terminantemente <strong>vedado</strong>:</p>
                <ul className="list-disc pl-5 mt-3 space-y-1">
                  <li>Utilização para fins ilícitos, fraudulentos ou abusivos;</li>
                  <li>Inserção de conteúdo falso, ofensivo ou que viole direitos de terceiros;</li>
                  <li>Envio de código malicioso ou tentativa de burlar a segurança;</li>
                  <li>Explorar falhas técnicas ou realizar engenharia reversa.</li>
                </ul>
              </div>

              {/* 5. RESPONSABILIDADES */}
              <div>
                <p className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-widest mb-1">Capítulo V</p>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Responsabilidades do Usuário</h3>
                <p>O Usuário deve manter o sigilo de suas <strong>Credenciais</strong> e comunicar imediatamente qualquer suspeita de uso indevido. Toda atividade realizada com credenciais válidas é de responsabilidade do Usuário/Organização.</p>
              </div>

              {/* 6. PRIVACIDADE */}
              <div>
                <p className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-widest mb-1">Capítulo VI</p>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Privacidade e Dados</h3>
                <p>A coleta e o tratamento de dados (cadastrais, logs, conteúdo de tickets) seguem estritamente a <strong>LGPD (Lei Geral de Proteção de Dados)</strong> e o Marco Civil da Internet, visando a operação e segurança do serviço.</p>
              </div>

              {/* 7. PROPRIEDADE INTELECTUAL */}
              <div>
                <p className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-widest mb-1">Capítulo VII</p>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Propriedade Intelectual</h3>
                <p>A arquitetura, código-fonte e marcas são propriedade da Empresa Responsável. O Usuário detém o direito apenas ao uso conforme contratado.</p>
              </div>

              {/* 8. LIMITAÇÃO DE RESPONSABILIDADE */}
              <div>
                <p className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-widest mb-1">Capítulo VIII</p>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Limitação de Responsabilidade</h3>
                <p>A Empresa não se responsabiliza por falhas decorrentes de uso indevido, problemas na infraestrutura de internet do usuário ou conteúdos inseridos por terceiros.</p>
              </div>

              {/* 9. SUSPENSÃO */}
              <div>
                <p className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-widest mb-1">Capítulo IX</p>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Suspensão e Encerramento</h3>
                <p>O acesso pode ser restringido ou encerrado em casos de descumprimento destes termos, risco à segurança ou inadimplemento contratual.</p>
              </div>

              {/* 10, 11 e 12. FINAIS */}
              <div className="pt-4 border-t border-slate-100">
                <p className="mb-4"><strong>Foro:</strong> Fica eleito o foro da Comarca de São José dos Campos/SP para dirimir controvérsias.</p>
                <p className="text-xs italic text-slate-400">Última atualização: Abril de 2026.</p>
              </div>

            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setShowTerms(false)}
                className={`${colors.primary} text-white px-10 py-2.5 rounded-lg font-bold text-sm transition-all ${colors.hover} shadow-lg shadow-orange-200`}
              >
                Li e Concordo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordRecovery;