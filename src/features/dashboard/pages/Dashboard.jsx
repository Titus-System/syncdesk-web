import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Ticket,
  Users,
  MessageSquare,
  LogOut,
  UserPlus,
  Flag,
  CheckCircle2,
  Mail,
  Activity,
  User,
  Clock,
  CheckCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useTicketsQuery } from '@/features/ticket/hooks/useTicketsQuery'
import { useUsersQuery } from '@/features/users/hooks/useUsersQuery'

export default function Dashboard() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const menuRef = useRef(null)

  const ticketsQuery = useTicketsQuery()
  const usersQuery = useUsersQuery()

  const ticketsData = ticketsQuery.data ?? []
  const usersData = usersQuery.data ?? []

  const totalTickets = ticketsData.length
  const openTickets = ticketsData.filter((ticket) => isOpenStatus(ticket.status)).length
  const inProgressTickets = ticketsData.filter((ticket) => isInProgressStatus(ticket.status)).length
  const finishedTickets = ticketsData.filter((ticket) => isFinishedStatus(ticket.status)).length

  const criticalityPercentages = useMemo(() => {
    if (!totalTickets) {
      return {
        high: 0,
        medium: 0,
        low: 0
      }
    }

    const grouped = ticketsData.reduce(
      (accumulator, ticket) => {
        const key = normalizePriority(ticket.criticality || ticket.priority)

        if (key === 'high') accumulator.high += 1
        if (key === 'medium') accumulator.medium += 1
        if (key === 'low') accumulator.low += 1

        return accumulator
      },
      { high: 0, medium: 0, low: 0 }
    )

    return {
      high: Math.round((grouped.high / totalTickets) * 100),
      medium: Math.round((grouped.medium / totalTickets) * 100),
      low: Math.round((grouped.low / totalTickets) * 100)
    }
  }, [ticketsData, totalTickets])

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-[#f4ece1] font-sans overflow-hidden text-[#1E293B]">
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
          </div>

          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active onClick={() => navigate('/')} />
            <NavItem icon={<Users size={16} />} label="Usuários" onClick={() => navigate('/usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" onClick={() => navigate('/chamados')} />
            <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => navigate('/chat')} />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30">
          <div className="flex-1" />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuPerfilAberto((value) => !value)}
              className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <User size={20} className="text-white/90" />
            </button>

            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-48 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase"
                >
                  <LogOut size={14} />
                  Sair da Conta
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Visão geral do sistema</h1>
            <p className="text-gray-500 text-sm mt-1.5 font-medium opacity-60">Resumo operacional atualizado em tempo real.</p>
          </div>

          <div className="w-full h-[1.5px] bg-gray-300/40 mb-10" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              title="Total Users"
              value={usersQuery.isLoading ? '...' : usersData.length}
              icon={<Users size={18} className="text-blue-600" />}
              iconBg="bg-blue-50"
              badge="Ativos"
              badgeColor="text-green-700 bg-green-50"
            />
            <StatCard
              title="Total de Chamados"
              value={ticketsQuery.isLoading ? '...' : totalTickets}
              icon={<Ticket size={18} className="text-orange-600" />}
              iconBg="bg-orange-50"
              badge="Geral"
            />
            <StatCard
              title="Em progresso"
              value={ticketsQuery.isLoading ? '...' : inProgressTickets}
              icon={<Clock size={18} className="text-amber-600" />}
              iconBg="bg-amber-50"
              badge="Ativos"
              badgeColor="text-gray-600 bg-gray-100"
            />
            <StatCard
              title="Finalizados"
              value={ticketsQuery.isLoading ? '...' : finishedTickets}
              icon={<CheckCircle size={18} className="text-emerald-600" />}
              iconBg="bg-emerald-50"
              badge="Concluído"
              badgeColor="text-emerald-700 bg-emerald-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase">Logs de atividade</h2>
                <button
                  type="button"
                  onClick={() => navigate('/chamados')}
                  className="text-xs font-semibold text-[#BD3B0F] hover:underline"
                >
                  Ver Chamados
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <ActivityItem
                  icon={<UserPlus size={16} className="text-[#BD3B0F]" />}
                  iconBg="bg-[#BD3B0F]/10"
                  title={`Sistema sincronizado com ${usersQuery.isLoading ? '...' : usersData.length} usuários.`}
                  time="Agora"
                />
                <ActivityItem
                  icon={<Flag size={16} className="text-amber-600" />}
                  iconBg="bg-amber-50"
                  title={`Existem ${ticketsQuery.isLoading ? '...' : openTickets} chamados aguardando atendimento.`}
                  time="Status Real"
                />
                <ActivityItem
                  icon={<CheckCircle2 size={16} className="text-emerald-600" />}
                  iconBg="bg-emerald-50"
                  title={`${ticketsQuery.isLoading ? '...' : finishedTickets} chamados finalizados com sucesso.`}
                  time="Histórico"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-bold text-gray-900 tracking-wide mb-5 uppercase">Criticidade global</h2>
              <div className="flex flex-col gap-4">
                <ProgressBar label="Alta / High" percentage={criticalityPercentages.high} color="bg-red-500" />
                <ProgressBar label="Média / Medium" percentage={criticalityPercentages.medium} color="bg-amber-400" />
                <ProgressBar label="Baixa / Low" percentage={criticalityPercentages.low} color="bg-blue-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              type="button"
              className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-all text-left"
              onClick={() => navigate('/chat')}
            >
              <div className="bg-[#BD3B0F]/10 p-3 rounded-full text-[#BD3B0F]">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Mensagens do sistema</h3>
                <p className="text-xs text-gray-500 font-medium">Acesse o chat para suporte em tempo real.</p>
              </div>
            </button>

            <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-all">
              <div className="bg-emerald-50 p-3 rounded-full text-emerald-600">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Status da API</h3>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">
                  {ticketsQuery.isError || usersQuery.isError ? 'Instável' : 'Sincronizado & Online'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
    >
      {icon} {label}
    </button>
  )
}

function StatCard({ title, value, icon, iconBg, badge, badgeColor = 'text-orange-700 bg-orange-50' }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:-translate-y-1 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`${iconBg} p-2 rounded-lg`}>{icon}</div>
        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${badgeColor}`}>{badge}</span>
      </div>
      <div>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function ActivityItem({ icon, iconBg, title, time }) {
  return (
    <div className="flex gap-3 items-center">
      <div className={`${iconBg} w-8 h-8 rounded-full flex items-center justify-center shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700 font-medium truncate">{title}</p>
        <p className="text-[10px] text-gray-400 font-bold uppercase">{time}</p>
      </div>
    </div>
  )
}

function ProgressBar({ label, percentage, color }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-black uppercase mb-2">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-900">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function normalizePriority(value) {
  const normalized = String(value || '').trim().toLowerCase()

  if (['high', 'alta', 'urgent', 'urgente'].includes(normalized)) {
    return 'high'
  }

  if (['medium', 'media', 'média'].includes(normalized)) {
    return 'medium'
  }

  if (['low', 'baixa'].includes(normalized)) {
    return 'low'
  }

  return 'medium'
}

function isOpenStatus(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return ['open', 'aberto'].includes(normalized)
}

function isInProgressStatus(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return ['in_progress', 'waiting_for_provider', 'em atendimento', 'em_atendimento'].includes(normalized)
}

function isFinishedStatus(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return ['finished', 'resolvido', 'fechado', 'closed'].includes(normalized)
}