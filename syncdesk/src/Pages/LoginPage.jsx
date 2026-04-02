import React from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage({ onLogin, onForgotPassword }) {
  return (
    <div className="min-h-screen bg-[#F4EAD9] flex flex-col font-sans">
      <header className="bg-[#500D0D] text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-[#BD3B0F] p-1.5 rounded-md w-8 h-8 flex items-center justify-center">
            <img src="/titus.png" alt="SyncDesk" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-lg tracking-wide">SyncDesk</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <button className="border border-white/30 hover:bg-white/10 px-4 py-2 rounded transition-colors">
            Documentação
          </button>
          <button className="bg-[#BD3B0F] hover:bg-[#9a2f0d] px-4 py-2 rounded transition-colors shadow-sm">
            Central de Ajuda
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="bg-white rounded-xl shadow-2xl flex max-w-5xl w-full overflow-hidden min-h-[600px]">
          <div className="w-[55%] bg-gradient-to-b from-[#500D0D] via-[#500D0D] to-[#BD3B0F] p-10 flex flex-col justify-between text-white relative">
            <div className="flex justify-center mt-6 mb-6 relative z-10">
              <div className="relative flex items-center justify-center w-64 h-64">
                <img
                  src="/titus.png"
                  alt="Logo Titus"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-bold tracking-tight">
                Secure Admin Access
              </h2>
              <p className="text-white/80 text-sm leading-relaxed mb-4 pr-4">
                Gerencie chamados de usuários, configurações de sistema e análises de
                suporte a partir do seu painel centralizado.
              </p>
              <div className="bg-white/10 border border-white/20 rounded-lg p-4 flex gap-3 items-start backdrop-blur-sm">
                <ShieldCheck size={20} className="text-white shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-tight">
                  Autenticação de dois fatores obrigatória para todas as sessões.
                </p>
              </div>
            </div>
            <div className="mt-12">
              <p className="text-[10px] text-white/50">
                © 2026 Support Portal Infrastructure. All rights reserved.
              </p>
            </div>
          </div>

          <div className="w-[55%] p-14 flex flex-col justify-center bg-white">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bem-vindo(a) de volta
              </h2>
              <p className="text-gray-500 text-sm">
                Por favor, insira suas credenciais para acessar o portal.
              </p>
            </div>

            <form className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    defaultValue="admin@supportportal.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9f9] border border-gray-200 rounded-md text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#db5326]/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-700">Senha</label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs font-semibold text-[#BD3B0F] hover:text-[#9a2f0d] transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    defaultValue="12345678"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#f9f9f9] border border-gray-200 rounded-md text-sm text-gray-800 tracking-widest focus:outline-none focus:ring-2 focus:ring-[#db5326]/50 transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onLogin}
                className="mt-2 w-full bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white font-semibold py-3 px-4 rounded-md shadow-md transition-all flex items-center justify-center gap-2 text-sm"
              >
                Sign in to Dashboard <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-14 text-center px-8">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Apenas pessoal autorizado. Todas as tentativas de acesso são
                registradas e monitoradas.<br />
                <a href="#" className="text-[#BD3B0F] font-semibold hover:underline">
                  Internal Security Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}