import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ShieldAlert, MonitorX } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-stores'
import { useWebAccessRole } from '@/shared/hooks/useWebAccessRole'

export default function WebAccessRestricted() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const { canAccessWeb } = useWebAccessRole()
  const [secondsLeft, setSecondsLeft] = useState(10)

  useEffect(() => {
    if (canAccessWeb) {
      navigate('/', { replace: true })
      return
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    const timeoutId = window.setTimeout(() => {
      clearSession()
      navigate('/login', { replace: true })
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [canAccessWeb, clearSession, navigate])

  return (
    <div className="min-h-screen bg-[#F4EAD9] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#500D0D] p-3 rounded-2xl">
            <MonitorX size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#500D0D]">
              Acesso não permitido nesta aplicação
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Ambiente web restrito por perfil de acesso
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 mb-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="text-orange-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-orange-700 mb-2">
                Esta aplicação web é exclusiva para administradores e atendentes.
              </p>
              <p className="text-sm text-orange-700/90 leading-6">
                O perfil utilizado neste login não possui permissão para acessar o portal web do SyncDesk.
                Para continuar, faça login com uma conta do tipo <strong>admin</strong> ou <strong>agent</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F8F5EE] border border-gray-200 p-5 flex items-center gap-4">
          <Loader2 size={22} className="animate-spin text-[#BD3B0F]" />
          <div>
            <p className="text-sm font-semibold text-[#500D0D]">
              Redirecionando para a tela de login...
            </p>
            <p className="text-sm text-gray-500">
              Você será desconectado automaticamente em {secondsLeft}s.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}