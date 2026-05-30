import { useState } from 'react'
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLoginMutation } from '@/features/auth/hooks/useLoginMutation'
import { useAuthStore } from '@/stores/auth-stores'

export default function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleLogin(event) {
    event.preventDefault()
    setErrorMessage('')

    try {
      const response = await loginMutation.mutateAsync({ email, password })

      if (!response?.access_token) {
        throw new Error('Login sem access_token na resposta')
      }

      navigate('/', { replace: true })
    } catch (error) {
      const status = error?.response?.status

      if (status === 401) {
        setErrorMessage('E-mail ou senha incorretos.')
        return
      }

      if (status === 404) {
        setErrorMessage('Endpoint de login não encontrado na API.')
        return
      }

      setErrorMessage('Erro ao conectar com o servidor. Verifique se a API está rodando.')
    }
  }

  function handleForgotPassword() {
    navigate('/recuperar-senha')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col font-sans">
      <header className="bg-[var(--bg-sidebar)] text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-[var(--accent)] p-1.5 rounded-md w-8 h-8 flex items-center justify-center">
            <img src="/titus.png" alt="SyncDesk" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-lg tracking-wide">SyncDesk</span>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <button type="button" className="border border-white/30 hover:bg-white/10 px-4 py-2 rounded transition-colors">
            Documentação
          </button>
          <button type="button" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2 rounded transition-colors shadow-sm">
            Central de Ajuda
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl flex max-w-5xl w-full overflow-hidden min-h-[600px]">
          <div className="hidden md:flex w-[45%] bg-gradient-to-b from-[#500D0D] via-[#500D0D] to-[#BD3B0F] p-10 flex-col justify-between text-white relative">
            <div className="flex justify-center mt-6 mb-6">
              <div className="w-48 h-48">
                <img src="/titus.png" alt="Logo Titus" className="w-full h-full object-contain drop-shadow-lg" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-3">Secure Admin Access</h2>
              <p className="text-white/80 text-sm leading-relaxed mb-6">
                Gerencie chamados, configurações de sistema e análises de suporte a partir do seu painel centralizado.
              </p>

              <div className="bg-white/10 border border-white/20 rounded-lg p-4 flex gap-3 items-start backdrop-blur-sm">
                <ShieldCheck size={20} className="text-white shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-tight">
                  Sessão monitorada. O acesso requer credenciais administrativas válidas.
                </p>
              </div>
            </div>

            <p className="text-[10px] text-white/50 mt-8">
              © 2026 SyncDesk Infrastructure. All rights reserved.
            </p>
          </div>

          <div className="w-full md:w-[55%] p-8 sm:p-14 flex flex-col justify-center bg-[var(--bg-card)]">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 text-center md:text-left">Bem-vindo(a)</h2>
              <p className="text-[var(--text-muted)] text-sm text-center md:text-left">Insira suas credenciais para acessar o portal.</p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 text-sm animate-pulse">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleLogin}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-[var(--text-faint)]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9f9] border border-[var(--border-default)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/50 transition-all"
                    placeholder="admin@syncdesk.com"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Senha</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-semibold text-[var(--accent-text)] hover:text-[#9a2f0d] transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-[var(--text-faint)]" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9f9] border border-[var(--border-default)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="mt-2 w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-md shadow-md transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
              >
                {loginMutation.isPending ? 'Verificando...' : 'Entrar no Sistema'}
                {!loginMutation.isPending && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-[11px] text-[var(--text-faint)] leading-relaxed uppercase tracking-tighter">
                Uso restrito para administradores.
                <br />
                Acesso monitorado pela <span className="text-[var(--accent-text)] font-bold">Titus Security</span>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}