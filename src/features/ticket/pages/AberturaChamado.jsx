import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Ticket,
  MessageSquare,
  User as UserIcon,
  Plus,
  X,
  LogOut,
  Loader2,
  RefreshCcw,
  Settings
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-stores'
import { useCreateTicketMutation } from '@/features/ticket/hooks/useCreateTicketMutation'
import { useUsersQuery } from '@/features/users/hooks/useUsersQuery'

export default function AberturaChamado() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const loggedUser = useAuthStore((state) => state.user)

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])

  const menuRef = useRef(null)
  const fileInputRef = useRef(null)

  const createTicketMutation = useCreateTicketMutation()
  const usersQuery = useUsersQuery()

  const usersData = usersQuery.data ?? []

  const [formData, setFormData] = useState({
    client_id: '',
    product: '',
    criticality: 'medium',
    type: 'issue',
    description: ''
  })

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

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  function handleFileChange(event) {
    const files = Array.from(event.target.files || [])
    setSelectedFiles((previous) => [...previous, ...files])
  }

  function removeFile(index) {
    setSelectedFiles((previous) => previous.filter((_, fileIndex) => fileIndex !== index))
  }

  async function handleSave(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!formData.client_id || !formData.product || !formData.description) {
      setErrorMessage('Preencha todos os campos obrigatórios.')
      return
    }

    const payload = {
      client_id: formData.client_id,
      product: formData.product,
      criticality: formData.criticality,
      type: formData.type,
      description: formData.description
    }

    try {
      await createTicketMutation.mutateAsync(payload)
      navigate('/chamados', { replace: true })
    } catch (error) {
      const detail = error.response?.data?.detail
      const message =
        detail?.[0]?.msg ||
        error.response?.data?.message ||
        'Erro ao abrir chamado.'

      setErrorMessage(message)
    }
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
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => navigate('/')} />
            <NavItem icon={<Users size={16} />} label="Usuários" onClick={() => navigate('/usuarios')} />
            <NavItem icon={<Ticket size={16} />} label="Chamados" active onClick={() => navigate('/chamados')} />
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
                  onClick={handleLogout}
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
          <div className="max-w-[1100px] mx-auto">
            <div className="flex justify-between items-end mb-4 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Novo Ticket</h1>
                <p className="text-gray-500 text-sm mt-1.5 font-medium opacity-60">Preencha os dados para abertura de chamado técnico.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/chamados')}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  form="form-novo-chamado"
                  disabled={createTicketMutation.isPending}
                  className="bg-[#BD3B0F] hover:bg-[#9a2f0d] text-white text-xs font-bold py-3 px-8 rounded-lg shadow-lg flex items-center gap-2 uppercase tracking-widest disabled:opacity-50 transition-all active:scale-95"
                >
                  {createTicketMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> Abrir Chamado</>}
                </button>
              </div>
            </div>

            <div className="w-full h-[1.5px] bg-gray-300/40 mb-10" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <form id="form-novo-chamado" className="flex flex-col gap-8" onSubmit={handleSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Cliente Solicitante</label>
                      <select
                        required
                        name="client_id"
                        value={formData.client_id}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#BD3B0F] transition-all"
                      >
                        <option value="" disabled>
                          {usersQuery.isLoading ? 'Carregando...' : 'Selecione o Cliente'}
                        </option>
                        {usersData.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.username || user.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Sistema / Produto</label>
                      <input
                        required
                        type="text"
                        name="product"
                        value={formData.product}
                        onChange={handleChange}
                        placeholder="Ex: App SyncDesk"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#BD3B0F] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Criticidade</label>
                      <select
                        name="criticality"
                        value={formData.criticality}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#BD3B0F] transition-all"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Tipo</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#BD3B0F] transition-all"
                      >
                        <option value="issue">Problema</option>
                        <option value="request">Solicitação</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Descrição</label>
                    <textarea
                      required
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="6"
                      placeholder="O que está acontecendo?"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none outline-none focus:border-[#BD3B0F] transition-all"
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-red-500 text-sm font-medium">{errorMessage}</p>
                  )}
                </form>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 tracking-widest text-center">Anexar Prints</p>

                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-100 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-50 transition-all group"
                  >
                    <Plus size={24} className="text-gray-300 group-hover:text-[#BD3B0F] transition-colors" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase text-center tracking-tighter">Selecionar Arquivos</span>
                  </button>

                  {selectedFiles.length > 0 && (
                    <div className="mt-6 flex flex-col gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="text-[11px] text-gray-600 font-medium truncate max-w-[140px]">{file.name}</span>
                          <button type="button" onClick={() => removeFile(index)} className="text-red-400 hover:text-red-600 transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center gap-2 text-gray-400 uppercase tracking-widest text-[10px] font-bold mt-12 mb-10">
              <RefreshCcw size={14} />
              Sincronizado via API
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
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${active ? 'bg-[#BD3B0F] text-white shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white'
        }`}
    >
      {icon} {label}
    </button>
  )
}