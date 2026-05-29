import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useTicketsQuery } from '@/features/ticket/hooks/useTicketsQuery'
import { useUsersQuery } from '@/features/users/hooks/useUsersQuery'
import { useTicketsDashboardQuery } from '@/features/reports/hooks/useTicketsDashboardQuery'
import { useAgentClosingsQuery } from '@/features/reports/hooks/useAgentClosingsQuery'
import { useIssuesByProductQuery } from '@/features/reports/hooks/useIssuesByProductQuery'
import {
  LayoutDashboard,
  Ticket,
  Users,
  MessageSquare,
  LogOut,
  Settings,
  BarChart3,
  User,
  Bell,
  Calendar,
  X
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts"

const T = {
  chartBlue:  "#4472C4",
  chartPurple:"#9B89D6",
  chartOrange:"#BD3B0F",
  chartGreen: "#70AD47",
  textPrimary:"#111827",
  textMuted:  "#6B7280"
}

const LINE_COLORS = [T.chartBlue, T.chartPurple, T.chartOrange, T.chartGreen]
const TABS = ["Análise Geral", "Detalhamento de Chamados", "Métricas de Satisfação", "Desempenho de Agentes"]

// Helpers
function getTicketStatus(ticket) { return String(ticket?.status ?? '').toLowerCase() }
function isOpenStatus(value) { return ['open', 'aberto'].includes(String(value || '').trim().toLowerCase()) }
function isInProgressStatus(value) { return ['in_progress', 'waiting_for_provider', 'waiting_for_validation', 'em andamento', 'em atendimento', 'em_atendimento'].includes(String(value || '').trim().toLowerCase()) }
function isFinishedStatus(value) { return ['finished', 'resolvido', 'fechado', 'closed'].includes(String(value || '').trim().toLowerCase()) }
function getTicketClientName(ticket) { return ticket?.client?.name ?? 'Cliente' }
function getTicketDescription(ticket) { return ticket?.description ?? 'Sem descrição' }

// ─── Transformações de dados (Híbridas para lidar com transição de API) ─────────

function transformIssuesByProduct(data) {
  if (!data || !data.series || !Array.isArray(data.series)) return null
  const products = [...new Set(data.series.map(s => s.product))]
  const months = data.months || []

  const lineData = months.map(month => {
    const entry = { month }
    data.series.forEach(s => {
      const point = s.points?.find(p => p.month === month)
      entry[s.product] = point ? point.count : 0
    })
    return entry
  })
  return { lineData, products, months }
}

function transformAgentClosings(data) {
  if (!data) return null

  // Formato NOVO (Contrato atualizado da API)
  if (data.agents && Array.isArray(data.agents)) {
    return data.agents.map(a => ({
      name:          a.agent_name || 'Outros',
      Ticket:        a.issue_count || 0,
      Features:      a.new_feature_count || 0,
      'Lib. Acesso': a.access_count || 0,
    }))
  }

  if (Array.isArray(data) && data.length > 0) {
    const first = data[0]
    if ('Ticket' in first || 'Features' in first) return data
    if ('agent_name' in first || 'ticket' in first || 'ticket_count' in first) {
      return data.map(r => ({
        name:          r.agent_name ?? r.name ?? 'Agente',
        Ticket:        r.ticket     ?? r.ticket_count   ?? 0,
        Features:      r.feature    ?? r.feature_count  ?? 0,
        'Lib. Acesso': r.access     ?? r.access_count   ?? 0,
      }))
    }
    if ('closings' in first) {
      return data.map(r => ({
        name:          r.name ?? r.agent_name ?? 'Agente',
        Ticket:        r.closings ?? 0,
        Features:      0,
        'Lib. Acesso': 0,
      }))
    }
  }

  return null
}

// ─── Componentes Auxiliares ───────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
      {icon} {label}
    </button>
  )
}

function StatusBadge({ status }) {
  const labelMap = { open: 'Aberto', in_progress: 'Em andamento', waiting_for_provider: 'Aguardando fornecedor', waiting_for_validation: 'Aguardando validação', finished: 'Finalizado' }
  const classMap = { open: 'bg-orange-50 text-orange-700', in_progress: 'bg-blue-50 text-blue-700', waiting_for_provider: 'bg-yellow-50 text-yellow-700', waiting_for_validation: 'bg-purple-50 text-purple-700', finished: 'bg-green-50 text-green-700' }
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full whitespace-nowrap ${classMap[status] || 'bg-gray-100 text-gray-600'}`}>{labelMap[status] || status}</span>
}

const Sel = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange} className="border border-gray-200 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#BD3B0F]/50 cursor-pointer transition-colors">
    {children}
  </select>
)

const EmpTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 rounded-xl p-4 text-xs shadow-xl border border-gray-800">
      <div className="font-bold mb-3 text-white">{label}</div>
      {payload.map((p, idx) => (
        <div key={`tooltip-item-${idx}`} className="flex gap-2 items-center mb-1.5 last:mb-0">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.fill }} />
          <span className="text-gray-300 font-medium">{p.name}:</span>
          <strong className="text-white ml-auto pl-4">{p.value.toLocaleString("pt-BR")}</strong>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data, centerValue, centerLines, height = 240 }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} cx="50%" cy="45%" innerRadius={72} outerRadius={98} dataKey="value" paddingAngle={2} strokeWidth={0}>
            {data.map((e, i) => <Cell key={`cell-${e.name}-${i}`} fill={e.color} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
          <Legend iconSize={10} iconType="circle" formatter={v => <span className="text-xs font-medium text-gray-500 ml-1">{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none flex flex-col items-center">
        <div className="text-3xl font-black text-gray-900 leading-none mb-1">{centerValue}</div>
        {centerLines.map((l, i) => <div key={`center-line-${i}`} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{l}</div>)}
      </div>
    </div>
  )
}

function TicketPanel({ config, onClose }) {
  if (!config) return null
  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex justify-end backdrop-blur-sm transition-opacity" onClick={onClose}>
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}`}</style>
      <div className="bg-[#f4ece1] w-full max-w-[500px] h-full overflow-y-auto p-8 shadow-[-10px_0_40px_rgba(0,0,0,0.2)]" style={{ animation: "slideIn .25s cubic-bezier(0.16, 1, 0.3, 1) forwards" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <div className="text-2xl font-bold text-gray-900 tracking-tight">{config.title}</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-50 p-2 rounded-full shadow-sm transition-colors border border-gray-200"><X size={20} /></button>
        </div>
        <div className="flex flex-col gap-4">
          {config.tickets.length === 0 ? <div className="text-center text-gray-500 text-sm mt-10 font-medium">Nenhum chamado encontrado.</div> : config.tickets.map((t, idx) => {
            const ticketStatus = getTicketStatus(t)
            return (
              <div key={t.id || t._id || `ticket-fallback-${idx}`} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-[#BD3B0F] uppercase tracking-wider mb-1.5">{t.id ? String(t.id).substring(0, 8).toUpperCase() : 'NO-ID'}</div>
                    <div className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{getTicketDescription(t)}</div>
                    <div className="text-xs font-medium text-gray-500 mt-2">{getTicketClientName(t)} <span className="mx-1">•</span>{t.creation_date ? new Date(t.creation_date).toLocaleDateString('pt-BR') : 'Data Indisponível'}</div>
                  </div>
                  <StatusBadge status={ticketStatus} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Relatorios() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const loggedUser = useAuthStore((state) => state.user)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const menuRef = useRef(null)

  const [panelConfig, setPanelConfig] = useState(null)
  const [activeTab, setActiveTab] = useState("Análise Geral")

  const [lineProductFilter, setLineProductFilter] = useState('Todos')
  const [linePeriod, setLinePeriod] = useState('6')

  const [empMonth, setEmpMonth] = useState("Todos")
  const [empYear, setEmpYear] = useState("2026")
  const [empLevel, setEmpLevel] = useState("Todos")

  const ticketsQuery = useTicketsQuery()
  const usersQuery   = useUsersQuery()
  
  const dashboardQuery = useTicketsDashboardQuery('issue') 
  const agentClosingsQuery = useAgentClosingsQuery({ month: empMonth, year: empYear, level: empLevel })
  const issuesByProductQuery = useIssuesByProductQuery()

  const ticketsData = ticketsQuery.data ?? []
  const usersData   = usersQuery.data   ?? []

  useEffect(() => {
    function handleClickOutside(event) { if (menuRef.current && !menuRef.current.contains(event.target)) setMenuPerfilAberto(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  const kpiData = useMemo(() => {
    const dash = dashboardQuery.data

    if (dash && dash.kpis) {
      return {
        open: dash.kpis.open_count ?? 0,
        cancelled: dash.kpis.cancelled_count ?? 0,
        unassigned: dash.kpis.unassigned_count ?? 0,
        overdue: dash.kpis.overdue_count ?? 0,
        total: (dash.kpis.open_count ?? 0) + (dash.kpis.cancelled_count ?? 0),
        finished: ticketsData.filter(t => isFinishedStatus(t.status)).length
      }
    }

    const openTickets = ticketsData.filter(t => isOpenStatus(t.status))
    const inProgressTickets = ticketsData.filter(t => isInProgressStatus(t.status))
    return { 
      open: openTickets.length, 
      cancelled: 0, 
      unassigned: openTickets.length, 
      overdue: 0,
      total: ticketsData.length,
      finished: ticketsData.filter(t => isFinishedStatus(t.status)).length 
    }
  }, [dashboardQuery.data, ticketsData])

  const isKpiLoading = dashboardQuery.isLoading || ticketsQuery.isLoading

  const openTicketsList = useMemo(() => ticketsData.filter(t => isOpenStatus(t.status)), [ticketsData])
  const inProgressTicketsList = useMemo(() => ticketsData.filter(t => isInProgressStatus(t.status)), [ticketsData])

  const statusDonutData = useMemo(() => {
    const dash = dashboardQuery.data
    if (dash && dash.open_breakdown) {
      const colors = {
        pendente: T.chartOrange,
        em_atendimento: T.chartBlue,
        nao_atribuidos: T.chartPurple
      }
      return dash.open_breakdown
        .map(b => ({ name: b.label, value: b.count, color: colors[b.bucket] || T.chartGreen }))
        .filter(item => item.value > 0)
    }
    
    return [
      { name: "Abertos",       value: kpiData.open,       color: T.chartOrange },
      { name: "Em andamento",  value: kpiData.inProgress, color: T.chartBlue },
      { name: "Finalizados",   value: kpiData.finished,   color: T.chartGreen },
    ].filter(item => item.value > 0)
  }, [dashboardQuery.data, kpiData])

  const agentClosingsRaw = useMemo(() => transformAgentClosings(agentClosingsQuery.data), [agentClosingsQuery.data])

  const assignedDonutData = useMemo(() => {
    const dash = dashboardQuery.data
    const barColors = [T.chartBlue, T.chartPurple, T.chartOrange, T.chartGreen]
    
    if (dash && dash.assigned_breakdown) {
      return dash.assigned_breakdown
        .map((a, i) => ({
          name: a.agent_name,
          value: a.count,
          color: a.is_aggregate ? '#9CA3AF' : barColors[i % barColors.length]
        }))
        .filter(item => item.value > 0)
    }

    if (agentClosingsRaw && agentClosingsRaw.length > 0) {
      return agentClosingsRaw.map((a, i) => ({
        name: a.name,
        value: a.Ticket ?? 0,
        color: barColors[i % barColors.length]
      })).filter(item => item.value > 0)
    }
    return []
  }, [dashboardQuery.data, agentClosingsRaw])

  const issuesTransformed = useMemo(() => transformIssuesByProduct(issuesByProductQuery.data), [issuesByProductQuery.data])
  const allProducts = issuesTransformed?.products ?? []
  const allMonths = issuesTransformed?.months ?? []

  const activeProducts = useMemo(() => {
    if (!issuesTransformed) return []
    if (lineProductFilter === 'Todos') return allProducts
    return allProducts.filter(p => p === lineProductFilter)
  }, [issuesTransformed, lineProductFilter, allProducts])

  const lineData = useMemo(() => {
    if (!issuesTransformed) return []
    const n = parseInt(linePeriod, 10)
    const slicedMonths = allMonths.slice(-n)
    return issuesTransformed.lineData.filter(d => slicedMonths.includes(d.month))
  }, [issuesTransformed, linePeriod, allMonths])

  const empData = agentClosingsRaw ?? []
  const empBarKeys = empData.length > 0 ? Object.keys(empData[0]).filter(k => k !== 'name') : []
  const barColors = [T.chartBlue, T.chartPurple, T.chartOrange, T.chartGreen]

  return (
    <div className="flex h-screen bg-[#f4ece1] font-sans overflow-hidden text-[#1E293B]">
      <TicketPanel config={panelConfig} onClose={() => setPanelConfig(null)} />

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm"><BarChart3 size={18} className="text-white" /></div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
          </div>
          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => navigate('/')} />
            <NavItem icon={<Users size={16} />} label="Usuários" onClick={() => navigate('/usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" onClick={() => navigate('/chamados')} />
            <NavItem icon={<BarChart3 size={16} />} label="Relatórios" active onClick={() => navigate('/relatorios')} />
            <NavItem icon={<MessageSquare size={16} />} label="Chat" onClick={() => navigate('/chat')} />
          </nav>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="bg-[#500D0D] h-[60px] flex items-center justify-between px-6 text-white shrink-0 shadow-sm z-30 border-b border-white/5">
          <div className="flex items-center gap-2 bg-white/10 rounded-md px-3 py-1.5 text-xs font-semibold border border-white/10 cursor-pointer hover:bg-white/20 transition-colors">
            <Calendar size={14} className="text-white/80" /> Últimos 30 Dias
          </div>
          <div className="flex items-center gap-4">
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"><Bell size={18} className="text-white/90" /></button>
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setMenuPerfilAberto((v) => !v)} className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"><User size={20} className="text-white/90" /></button>
              {menuPerfilAberto && (
                <div className="absolute right-0 top-12 w-60 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                  <div className="px-4 py-3 border-b border-white/10 mb-1">
                    <p className="text-sm font-bold text-white truncate">{loggedUser?.name || 'Usuário'}</p>
                    <p className="text-[11px] text-white/50 truncate">{loggedUser?.email || ''}</p>
                  </div>
                  <button type="button" onClick={() => { setMenuPerfilAberto(false); navigate('/configuracoes') }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-white/70 hover:bg-white/10 rounded-xl transition-colors uppercase"><Settings size={14} /> Configurações</button>
                  <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-[#BD3B0F] hover:bg-white/10 rounded-xl transition-colors uppercase"><LogOut size={14} /> Sair</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-8 pt-5 flex gap-8 border-b border-gray-300/50 shrink-0">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-bold tracking-wide transition-colors border-b-[3px] whitespace-nowrap ${activeTab === tab ? 'border-[#BD3B0F] text-[#BD3B0F]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[
              { tag: "Geral", label: "Tickets Abertos", value: isKpiLoading ? '...' : kpiData.open, tickets: openTicketsList, title: 'Tickets Abertos' },
              { tag: "Atenção", label: "Cancelados", value: isKpiLoading ? '...' : kpiData.cancelled, tickets: [], title: 'Cancelados' },
              { tag: "Atribuição", label: "Sem Atribuição", value: isKpiLoading ? '...' : kpiData.unassigned, tickets: openTicketsList, title: 'Sem Atribuição' },
              { tag: "Crítico", label: "Vencidos", value: isKpiLoading ? '...' : kpiData.overdue, tickets: openTicketsList, title: 'Vencidos' },
            ].map(k => (
              <div key={`kpi-card-${k.tag}`} onClick={() => setPanelConfig({ title: k.title, tickets: k.tickets })} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:-translate-y-1 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-5">
                  <div className="bg-[#BD3B0F]/10 p-2.5 rounded-xl text-[#BD3B0F] group-hover:bg-[#BD3B0F] group-hover:text-white transition-colors"><Ticket size={20} /></div>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">{k.tag}</p>
                  <p className="text-3xl font-black text-gray-900">{k.value}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
              <h2 className="text-sm font-bold text-gray-900 tracking-wide mb-1">Tickets abertos por status</h2>
              <p className="text-xs text-gray-500 mb-6">{dashboardQuery.isLoading ? 'Carregando...' : 'Distribuição da API em tempo real'}</p>
              {statusDonutData.length > 0 ? <DonutChart data={statusDonutData} centerValue={kpiData.open} centerLines={["Tickets", "Abertos"]} /> : <div className="h-60 flex items-center justify-center text-sm text-gray-400">Sem dados disponíveis</div>}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
              <h2 className="text-sm font-bold text-gray-900 tracking-wide mb-1">Chamados abertos por analista</h2>
              <p className="text-xs text-gray-500 mb-6">{dashboardQuery.isLoading ? 'Carregando...' : 'Distribuição da API em tempo real'}</p>
              {assignedDonutData.length > 0 ? (
                <DonutChart
                  data={assignedDonutData}
                  centerValue={kpiData.open - kpiData.unassigned}
                  centerLines={["Tickets", "Atribuídos"]}
                />
              ) : <div className="h-60 flex items-center justify-center text-sm text-gray-400">{dashboardQuery.isLoading ? 'Carregando...' : 'Nenhum agente atribuído'}</div>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
            <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-wide mb-1">Tickets por Produto (Falhas)</h2>
                <p className="text-xs text-gray-500">{issuesByProductQuery.isLoading ? 'Carregando...' : 'Evolução de entrada de tickets no período'}</p>
              </div>
              {issuesTransformed && (
                <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-2">Produto</span>
                    <Sel value={lineProductFilter} onChange={e => setLineProductFilter(e.target.value)}>
                      <option value="Todos">Todos</option>
                      {allProducts.map((p, idx) => <option key={`prod-${idx}`}>{p}</option>)}
                    </Sel>
                  </div>
                  <div className="w-[1px] h-4 bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</span>
                    <Sel value={linePeriod} onChange={e => setLinePeriod(e.target.value)}><option value="3">Últ. 3 meses</option><option value="6">Últ. 6 meses</option></Sel>
                  </div>
                </div>
              )}
            </div>
            {issuesByProductQuery.isLoading ? <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">Carregando...</div> : lineData.length > 0 && activeProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={lineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textMuted, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: T.textMuted, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 500 }} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} formatter={v => <span className="text-xs font-semibold text-gray-600 ml-1">{v}</span>} />
                  {activeProducts.map((prod, i) => <Line key={`line-${prod}-${i}`} type="monotone" dataKey={prod} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />)}
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">Sem dados no período</div>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
            <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-wide mb-1">Chamados Encerrados por Funcionário</h2>
                <p className="text-xs text-gray-500">{agentClosingsQuery.isLoading ? 'Carregando...' : 'Performance da equipe categorizada por tipo'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                {[
                  { label: "Mês", val: empMonth, set: setEmpMonth, opts: ["Todos","1","2","3","4","5","6","7","8","9","10","11","12"] },
                  { label: "Ano", val: empYear, set: setEmpYear, opts: ["2026","2025","2024"] },
                  { label: "Nível", val: empLevel, set: setEmpLevel, opts: ["Todos","N1","N2","N3"] },
                ].map((f, i) => (
                  <div key={`filter-${f.label}`} className="flex items-center gap-2">
                    {i > 0 && <div className="w-[1px] h-4 bg-gray-300 mr-1" />}
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{f.label}</span>
                    <Sel value={f.val} onChange={e => f.set(e.target.value)}>{f.opts.map((o, idx) => <option key={`opt-${f.label}-${idx}`}>{o}</option>)}</Sel>
                  </div>
                ))}
              </div>
            </div>
            {agentClosingsQuery.isLoading ? <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">Carregando...</div> : empData.length > 0 && empBarKeys.length > 0 ? (
              <ResponsiveContainer width="100%" height={empData.length * 90 + 60}>
                <BarChart layout="vertical" data={empData} margin={{ top: 10, right: 60, left: 10, bottom: 0 }} barCategoryGap="25%" barGap={6}>
                  <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textMuted, fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={v => v.toLocaleString("pt-BR")} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: T.textPrimary, fontWeight: 700 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} content={<EmpTooltip />} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} formatter={v => <span className="text-xs font-semibold text-gray-600 ml-1">{v}</span>} />
                  {empBarKeys.map((key, i) => <Bar key={`bar-${key}-${i}`} dataKey={key} fill={barColors[i % barColors.length]} radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: T.textMuted, fontWeight: 600, formatter: v => v.toLocaleString("pt-BR") }} />)}
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">Sem encerramentos no período</div>}
          </div>

        </div>
      </main>
    </div>
  )
}