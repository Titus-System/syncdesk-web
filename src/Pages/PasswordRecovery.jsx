import React, { useState, useEffect } from 'react';
import {
  Mail,
  ArrowLeft,
  Send,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

const PasswordRecovery = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumberOrSymbol;

  const colors = {
    primary: 'bg-[#C2410C]',
    hover: 'hover:bg-[#A6360B]',
    bg: 'bg-[#F5EFE1]',
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get('token');
    if (tokenUrl) {
      setToken(tokenUrl);
      setStep(3);
    }
  }, []);

  const handleRequestRecovery = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://api.syncdesk.pro:8000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) setStep(2);
      else setErrorMessage('E-mail não encontrado.');
    } catch (error) {
      setErrorMessage('Erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://api.syncdesk.pro:8000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token, 
          new_password: password 
        }),
      });

      if (response.ok) {
        alert('Senha redefinida com sucesso! Agora você pode logar.');
        onBackToLogin();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Erro ao redefinir. Token expirado.');
      }
    } catch (error) {
      setErrorMessage('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${colors.bg} flex flex-col font-sans text-[#1E293B]`}>
      <header className="p-6 flex justify-between items-center max-w-[1440px] w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className={`${colors.primary} p-1.5 rounded-lg text-white`}>
            <ShieldCheck size={20} fill="currentColor" fillOpacity={0.2} />
          </div>
          <span className="font-bold text-lg tracking-tight">SyncDesk</span>
        </div>
        <button onClick={onBackToLogin} className={`${colors.primary} text-white px-5 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all ${colors.hover}`}>
          <ArrowLeft size={18} /> Voltar
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[24px] shadow-sm w-full max-w-[480px] border border-white">
          
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-14 h-14 bg-[#FFF7ED] rounded-full flex items-center justify-center text-[#C2410C]">
                <RotateCcw size={28} />
              </div>
              <h1 className="text-[28px] font-extrabold tracking-tight">Redefinir senha</h1>
              <div className="text-left space-y-1.5 mt-4">
                <label className="text-sm font-bold block">Endereço de E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl outline-none" 
                    placeholder="exemplo@empresa.com" 
                  />
                </div>
              </div>
              <button onClick={handleRequestRecovery} disabled={isLoading} className={`w-full ${colors.primary} text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${colors.hover} disabled:opacity-50`}>
                {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'} <Send size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-14 h-14 bg-[#FFF7ED] rounded-full flex items-center justify-center text-[#C2410C]">
                <Mail size={28} />
              </div>
              <h1 className="text-[28px] font-extrabold tracking-tight">Verifique seu e-mail</h1>
              <p className="text-gray-500">Link enviado para <b>{email}</b>.</p>
              <button onClick={onBackToLogin} className={`w-full ${colors.primary} text-white py-4 rounded-xl font-bold ${colors.hover}`}>Entendi, ir para o Login</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-extrabold tracking-tight">Nova Senha</h1>
                <p className="text-gray-500 text-[14px]">Defina sua nova senha de acesso.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Digite sua nova senha" 
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-[#F8FAFC] outline-none" 
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Repita a nova senha" 
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-[#F8FAFC] outline-none" 
                />
              </div>

              {/* REQUISITOS VISUAIS */}
              <div className="bg-[#FFF7ED]/50 p-4 rounded-xl border border-orange-100 space-y-2">
                <p className="text-[11px] font-extrabold text-[#C2410C] uppercase tracking-wider">Requisitos da Senha</p>
                <div className="space-y-1.5">
                   <Requirement met={hasMinLength} label="Mínimo de 8 caracteres" />
                   <Requirement met={hasUppercase} label="Uma letra maiúscula" />
                   <Requirement met={hasNumberOrSymbol} label="Um número ou símbolo" />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={acceptedTerms} 
                    onChange={(e) => setAcceptedTerms(e.target.checked)} 
                    className="w-4 h-4 accent-[#C2410C] cursor-pointer" 
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600 font-bold">
                    Eu aceito os <button onClick={() => setShowTerms(true)} className="text-[#C2410C] underline">Termos de Uso</button>
                  </label>
                </div>
                {errorMessage && <p className="text-red-500 text-xs text-center">{errorMessage}</p>}
                <button
                  onClick={handleResetPassword}
                  disabled={isLoading || !acceptedTerms || !isPasswordValid}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all ${colors.primary} ${colors.hover} disabled:bg-slate-300 disabled:shadow-none shadow-lg`}
                >
                  {isLoading ? 'Salvando...' : 'Redefinir Senha'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL COMPLETO */}
      {showTerms && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">Termos de Uso da Plataforma</h2>
              <button onClick={() => setShowTerms(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>

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

            <div className="px-8 py-6 border-t border-slate-100 flex justify-end bg-slate-50">
              <button 
                onClick={() => { setAcceptedTerms(true); setShowTerms(false); }} 
                className={`${colors.primary} text-white px-10 py-2.5 rounded-lg font-bold text-sm transition-all ${colors.hover}`}
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

const Requirement = ({ met, label }) => (
  <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-green-600' : 'text-slate-400'}`}>
    <CheckCircle2 size={14} className={met ? 'text-green-500' : 'text-slate-300'} />
    <span className={met ? 'font-semibold' : ''}>{label}</span>
  </div>
);

export default PasswordRecovery;