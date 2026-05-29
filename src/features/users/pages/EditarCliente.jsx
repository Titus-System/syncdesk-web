import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Ticket,
  User as UserIcon,
  LogOut,
  MessageSquare,
  Save,
  ArrowLeft,
  Loader2,
  Building2,
  ShieldAlert,
  StickyNote,
  Package,
  Settings,
  Search,
  Check,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useUserQuery } from '@/features/users/hooks/useUserQuery'
import { usePatchUserMutation } from '@/features/users/hooks/usePatchUserMutation'
import { useDeactivateUserMutation } from '@/features/users/hooks/useDeactivateUserMutation'
import { useCompaniesQuery } from '@/features/companies/hooks/useCompaniesQuery'
import { useAddUsersToCompanyMutation } from '@/features/companies/hooks/useAddUsersToCompanyMutation'
import { useRemoveUserFromCompanyMutation } from '@/features/companies/hooks/useRemoveUserFromCompanyMutation'

export default function EditarCliente() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const clearSession = useAuthStore((state) => state.clearSession)
  const loggedUser = useAuthStore((state) => state.user)
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const menuRef = useRef(null)

  const userQuery = useUserQuery(userId)
  const patchUserMutation = usePatchUserMutation()
  const deactivateUserMutation = useDeactivateUserMutation()
  const companiesQuery = useCompaniesQuery({ page: 1, limit: 100 })
  const addUsersToCompanyMutation = useAddUsersToCompanyMutation()
  const removeUserFromCompanyMutation = useRemoveUserFromCompanyMutation()

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  if (userQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4EAD9] font-bold text-[#500D0D] animate-pulse uppercase">
        Carregando...
      </div>
    )
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4EAD9] font-bold text-red-500 uppercase">
        Erro ao carregar usuário
      </div>
    )
  }

  return (
    <EditarClienteForm
      user={userQuery.data}
      userId={userId}
      menuPerfilAberto={menuPerfilAberto}
      setMenuPerfilAberto={setMenuPerfilAberto}
      menuRef={menuRef}
      onLogout={handleLogout}
      navigate={navigate}
      patchUserMutation={patchUserMutation}
      deactivateUserMutation={deactivateUserMutation}
      companiesQuery={companiesQuery}
      addUsersToCompanyMutation={addUsersToCompanyMutation}
      removeUserFromCompanyMutation={removeUserFromCompanyMutation}
      loggedUser={loggedUser}
    />
  )
}

function EditarClienteForm({
  user,
  userId,
  menuPerfilAberto,
  setMenuPerfilAberto,
  menuRef,
  onLogout,
  navigate,
  patchUserMutation,
  deactivateUserMutation,
  companiesQuery,
  addUsersToCompanyMutation,
  removeUserFromCompanyMutation,
  loggedUser,
}) {
  const isActiveInitial = Boolean(user.is_active ?? user.isActive)
  const initials = getInitials(user.name || user.username)

  const initialCompanyId = user.company_id ?? user.companyId ?? null

  const [nome, setNome] = useState(user.name || '')
  const [email, setEmail] = useState(user.email || '')
  const [isActive, setIsActive] = useState(isActiveInitial)
  const [notasInternas, setNotasInternas] = useState(user.internal_notes || '')
  const [produtoContratado, setProdutoContratado] = useState(user.contracted_product || '')
  const [dataExpiracao, setDataExpiracao] = useState(user.contract_expiration || '')
  const [errorMessage, setErrorMessage] = useState('')
  const [suspendErrorMessage, setSuspendErrorMessage] = useState('')
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId)
  const [companySearch, setCompanySearch] = useState('')
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false)
  const [companyErrorMessage, setCompanyErrorMessage] = useState('')
  const companyComboboxRef = useRef(null)

  const companies = useMemo(() => companiesQuery.data?.items ?? [], [companiesQuery.data])
  const selectedCompany = useMemo(
    () => companies.find((c) => String(c.id) === String(selectedCompanyId)) || null,
    [companies, selectedCompanyId]
  )
  const initialCompany = useMemo(
    () => companies.find((c) => String(c.id) === String(initialCompanyId)) || null,
    [companies, initialCompanyId]
  )
  const filteredCompanies = useMemo(() => {
    const query = companySearch.trim().toLowerCase()
    if (!query) return companies
    return companies.filter((company) => {
      const haystack = [company.legal_name, company.trade_name, company.tax_id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [companies, companySearch])

  const companyChanged = String(selectedCompanyId ?? '') !== String(initialCompanyId ?? '')
  const isCompanySaving =
    addUsersToCompanyMutation.isPending || removeUserFromCompanyMutation.isPending

  useEffect(() => {
    function handleClickOutside(event) {
      if (companyComboboxRef.current && !companyComboboxRef.current.contains(event.target)) {
        setCompanyDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectCompany(company) {
    setSelectedCompanyId(company.id)
    setCompanyDropdownOpen(false)
    setCompanySearch('')
    setCompanyErrorMessage('')
  }

  function handleClearCompany() {
    setSelectedCompanyId(null)
    setCompanyDropdownOpen(false)
    setCompanySearch('')
    setCompanyErrorMessage('')
  }

  async function syncCompanyAssignment() {
    if (!companyChanged) return

    if (initialCompanyId) {
      await removeUserFromCompanyMutation.mutateAsync({
        companyId: initialCompanyId,
        userId,
      })
    }

    if (selectedCompanyId) {
      await addUsersToCompanyMutation.mutateAsync({
        companyId: selectedCompanyId,
        userIds: [userId],
      })
    }
  }

  async function handleUpdate(event) {
    event.preventDefault()
    setErrorMessage('')
    setCompanyErrorMessage('')

    // Apenas campos aceitos pelo PATCH /api/users/{id}
    const payload = {
      email: email.trim().toLowerCase(),
      name: nome.trim(),
      username: user.username,
      oauth_provider: user.oauth_provider ?? 'local',
      oauth_provider_id: user.oauth_provider_id ?? `local_${user.id}`,
      is_active: isActive,
      is_verified: user.is_verified ?? false,
    }

    try {
      await patchUserMutation.mutateAsync({ userId, payload })
    } catch (error) {
      const detail = error.response?.data?.detail
      const message =
        detail?.[0]?.msg ||
        error.response?.data?.message ||
        String(detail || '') ||
        'Erro ao atualizar usuário.'
      setErrorMessage(message)
      return
    }

    try {
      await syncCompanyAssignment()
    } catch (error) {
      const detail = error?.response?.data?.detail
      const message =
        detail?.[0]?.msg ||
        error?.response?.data?.message ||
        String(detail || '') ||
        'Erro ao atualizar vínculo com a empresa.'
      setCompanyErrorMessage(message)
      return
    }

    navigate('/usuarios', { replace: true })
  }

  async function handleToggleSuspend() {
    setSuspendErrorMessage('')
    try {
      if (isActive) {
        // Desativar → usa endpoint dedicado e redireciona igual ao EditarAtendente
        await deactivateUserMutation.mutateAsync(userId)
        navigate('/usuarios', { replace: true })
      } else {
        // Reativar → usa PATCH normal com is_active: true
        await patchUserMutation.mutateAsync({
          userId,
          payload: {
            email: user.email,
            name: user.name,
            username: user.username,
            password_hash: user.password_hash ?? '',
            oauth_provider: user.oauth_provider ?? 'local',
            oauth_provider_id: user.oauth_provider_id ?? `local_${user.id}`,
            is_active: true,
            is_verified: user.is_verified ?? false,
          },
        })
        setIsActive(true)
        setShowSuspendConfirm(false)
      }
    } catch (error) {
      const detail = error?.response?.data?.detail
      const message =
        detail?.[0]?.msg ||
        error?.response?.data?.message ||
        String(detail || '') ||
        'Erro ao alterar status do usuário.'
      setSuspendErrorMessage(message)
      setShowSuspendConfirm(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#F4EAD9] font-sans overflow-hidden text-[#1E293B]">
      <aside className="w-60 bg-[#500D0D] flex flex-col justify-between text-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="bg-[#BD3B0F] p-1.5 rounded-lg shadow-sm">
              <UserIcon size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">SyncDesk</span>
          </div>
          <nav className="mt-2 px-3 flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => navigate('/')} />
            <NavItem icon={<Users size={16} />} label="Usuários" active onClick={() => navigate('/usuarios')} />
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
              onClick={() => setMenuPerfilAberto((v) => !v)}
              className="w-8 h-8 bg-white/10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <UserIcon size={20} className="text-white/90" />
            </button>
            {menuPerfilAberto && (
              <div className="absolute right-0 top-12 w-60 bg-[#500D0D] border border-white/10 rounded-2xl shadow-2xl z-[999] p-2">
                <div className="px-4 py-3 border-b border-white/10 mb-1">
                  <p className="text-sm font-bold text-white truncate">{loggedUser?.name || 'Usuário'}</p>
                  <p className="text-[11px] text-white/50 truncate">{loggedUser?.email || ''}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setMenuPerfilAberto(false); navigate('/configuracoes') }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-white/70 hover:bg-white/10 rounded-xl transition-colors uppercase"
                >
                  <Settings size={14} />
                  Configurações
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-orange-500 hover:bg-white/10 rounded-xl transition-colors uppercase"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="w-full max-w-5xl mx-auto">

            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-lg">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{nome || user.username}</h2>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {isActive ? 'ATIVO' : 'SUSPENSO'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Cliente desde{' '}
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                      : 'data não disponível'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/usuarios')}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={patchUserMutation.isPending || isCompanySaving}
                  className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {(patchUserMutation.isPending || isCompanySaving) ? (
                    <><Loader2 className="animate-spin" size={14} /> Salvando...</>
                  ) : (
                    <><Save size={14} /> Salvar Alterações</>
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

                {/* Coluna esquerda */}
                <div className="flex flex-col gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Building2 size={15} className="text-[#BD3B0F]" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Dados Corporativos</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Nome</label>
                        <input
                          type="text"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-[#BD3B0F] transition-colors"
                          placeholder="Nome do responsável"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">E-mail Corporativo</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-[#BD3B0F] transition-colors"
                          placeholder="email@empresa.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Produto Contratado</label>
                        <input
                          type="text"
                          value={produtoContratado}
                          onChange={(e) => setProdutoContratado(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-[#BD3B0F] transition-colors"
                          placeholder="Ex: Nexus Enterprise Pro"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Data de Expiração do Contrato</label>
                        <input
                          type="date"
                          value={dataExpiracao}
                          onChange={(e) => setDataExpiracao(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-[#BD3B0F] transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-bold py-2 px-5 rounded-lg flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Package size={13} />
                      Adicionar Produto
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <StickyNote size={15} className="text-[#BD3B0F]" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Notas Internas</h3>
                    </div>
                    <textarea
                      value={notasInternas}
                      onChange={(e) => setNotasInternas(e.target.value)}
                      rows={5}
                      placeholder="Insira observações administrativas confidenciais sobre este cliente..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#BD3B0F] transition-colors resize-none placeholder:text-gray-300"
                    />
                    <p className="text-[10px] text-gray-400 mt-2 italic">
                      * Essas notas são visíveis apenas para administradores do sistema.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                      {errorMessage}
                    </div>
                  )}
                </div>

                {/* Coluna direita */}
                <div className="flex flex-col gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 size={15} className="text-[#BD3B0F]" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Empresa Vinculada</h3>
                    </div>

                    {selectedCompany ? (
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-3">
                        <p className="text-[10px] font-bold text-[#BD3B0F] uppercase tracking-wider mb-1">
                          {companyChanged ? 'Nova seleção' : 'Atual'}
                        </p>
                        <p className="text-sm font-bold text-gray-900 leading-tight">
                          {selectedCompany.trade_name || selectedCompany.legal_name}
                        </p>
                        {selectedCompany.trade_name && selectedCompany.legal_name && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{selectedCompany.legal_name}</p>
                        )}
                        {selectedCompany.tax_id && (
                          <p className="text-[10px] text-gray-400 mt-1 font-mono">{selectedCompany.tax_id}</p>
                        )}
                      </div>
                    ) : initialCompanyId ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">
                          Será desvinculado ao salvar
                        </p>
                        <p className="text-xs text-amber-700">
                          {initialCompany?.legal_name || 'Empresa atual'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic mb-3">Cliente sem empresa vinculada.</p>
                    )}

                    <div className="relative" ref={companyComboboxRef}>
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={companySearch}
                          onChange={(e) => { setCompanySearch(e.target.value); setCompanyDropdownOpen(true) }}
                          onFocus={() => setCompanyDropdownOpen(true)}
                          placeholder={selectedCompany ? 'Trocar empresa...' : 'Buscar empresa...'}
                          disabled={companiesQuery.isLoading || companiesQuery.isError}
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-xs text-gray-800 outline-none focus:border-[#BD3B0F] transition-colors disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </div>

                      {companyDropdownOpen && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {companiesQuery.isLoading && (
                            <p className="px-3 py-2 text-[11px] text-gray-400">Carregando empresas...</p>
                          )}
                          {companiesQuery.isError && (
                            <p className="px-3 py-2 text-[11px] text-red-500">Erro ao carregar empresas.</p>
                          )}
                          {!companiesQuery.isLoading && filteredCompanies.length === 0 && (
                            <p className="px-3 py-2 text-[11px] text-gray-400">Nenhuma empresa encontrada.</p>
                          )}
                          {filteredCompanies.map((company) => {
                            const isCurrent = String(company.id) === String(selectedCompanyId)
                            return (
                              <button
                                key={company.id}
                                type="button"
                                onClick={() => handleSelectCompany(company)}
                                className={`w-full flex items-start gap-2 px-3 py-2 text-left text-xs hover:bg-orange-50 transition-colors ${isCurrent ? 'bg-orange-50' : ''}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-800 truncate">
                                    {company.trade_name || company.legal_name}
                                  </p>
                                  {company.trade_name && (
                                    <p className="text-[10px] text-gray-500 truncate">{company.legal_name}</p>
                                  )}
                                </div>
                                {isCurrent && <Check size={13} className="text-[#BD3B0F] shrink-0 mt-0.5" />}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {selectedCompanyId && (
                      <button
                        type="button"
                        onClick={handleClearCompany}
                        className="mt-3 w-full flex items-center justify-center gap-2 text-[10px] font-bold py-2 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                      >
                        <X size={12} />
                        Desvincular empresa
                      </button>
                    )}

                    {companyChanged && (
                      <p className="text-[10px] text-amber-600 font-medium mt-3">
                        * Alterações no vínculo só serão aplicadas ao salvar.
                      </p>
                    )}

                    {companyErrorMessage && (
                      <p className="text-[10px] text-red-600 font-medium mt-3">{companyErrorMessage}</p>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldAlert size={15} className="text-[#BD3B0F]" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Segurança</h3>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-3">Ações da Conta</p>

                    {suspendErrorMessage && (
                      <p className="text-[10px] text-red-600 font-medium mb-3">{suspendErrorMessage}</p>
                    )}
                    {showSuspendConfirm ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs text-red-700 font-medium mb-3">
                          {isActive ? 'Suspender' : 'Reativar'} o acesso deste cliente?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleToggleSuspend}
                            disabled={deactivateUserMutation.isPending || patchUserMutation.isPending}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {(deactivateUserMutation.isPending || patchUserMutation.isPending) ? 'Salvando...' : 'Confirmar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSuspendConfirm(false)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowSuspendConfirm(true)}
                        className={`w-full flex items-center gap-2 text-[10px] font-bold py-2.5 px-4 rounded-xl border transition-all ${
                          isActive
                            ? 'border-red-400 text-red-600 bg-red-50 hover:bg-red-100'
                            : 'border-green-500 text-green-600 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        <ShieldAlert size={13} />
                        {isActive ? '↓ Suspender Acesso' : '↑ Reativar Acesso'}
                      </button>
                    )}
                  </div>

                  <div className="bg-[#500D0D] rounded-2xl p-5 text-white">
                    <p className="text-[10px] font-bold uppercase text-white/60 mb-1">Suporte Prioritário</p>
                    <p className="text-xs text-white/80 leading-relaxed mb-4">
                      Este cliente possui SLA de resposta de 2 horas. Contato direto com o Key Account Manager disponível.
                    </p>
                    <button type="button" className="text-[10px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider transition-colors">
                      Abrir Canal de Suporte →
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

function getInitials(name) {
  return name?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '??'
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${
        active ? 'bg-[#BD3B0F] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  )
}