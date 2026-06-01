import { useState } from 'react'
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, X } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLoginMutation } from '@/features/auth/hooks/useLoginMutation'
import { useAuthStore } from '@/stores/auth-stores'
import syncdeskLogo from '@/assets/syncdesk.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)

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
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col font-sans relative">
      <header className="bg-[var(--bg-sidebar)] text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={syncdeskLogo}
              alt="SyncDesk"
              className="h-full w-full object-contain drop-shadow-sm"
            />
          </div>

          <span className="font-bold text-lg tracking-wide">SyncDesk</span>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => setIsDocModalOpen(true)}
            className="border border-white/30 hover:bg-white/10 px-4 py-2 rounded transition-colors"
          >
            Documentação
          </button>

          <button
            type="button"
            onClick={() => window.open('https://github.com/Titus-System/syncdesk-web', '_blank', 'noopener,noreferrer')}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2 rounded transition-colors shadow-sm">
            Central de Ajuda
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl flex max-w-5xl w-full overflow-hidden min-h-[600px]">
          <div className="hidden md:flex w-[45%] bg-gradient-to-b from-[#500D0D] via-[#500D0D] to-[#BD3B0F] p-10 flex-col justify-between text-white relative">
            <div className="flex justify-center mt-4 mb-6">
              <div className="w-60 h-60 flex items-center justify-center">
                <img
                  src={syncdeskLogo}
                  alt="SyncDesk"
                  className="w-full h-full object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,0.28)]"
                />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-3">
                Secure Admin Access
              </h2>

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
              <div className="md:hidden flex justify-center mb-6">
                <div className="h-24 w-24 flex items-center justify-center">
                  <img
                    src={syncdeskLogo}
                    alt="SyncDesk"
                    className="h-full w-full object-contain drop-shadow-sm"
                  />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 text-center md:text-left">
                Bem-vindo(a)
              </h2>

              <p className="text-[var(--text-muted)] text-sm text-center md:text-left">
                Insira suas credenciais para acessar o portal.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 text-sm animate-pulse">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleLogin}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Email
                </label>

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
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Senha
                  </label>

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
                Acesso monitorado pela <span className="text-[var(--accent-text)] font-bold">SyncDesk Security</span>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} />
    </div>
  )
}

function DocumentationModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex justify-center items-center backdrop-blur-sm p-4 sm:p-8" onClick={onClose}>
      <div 
        className="bg-[var(--bg-page)] w-full max-w-4xl h-full max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] text-white shrink-0">
          <h2 className="text-xl font-bold tracking-wide">Documentação do Sistema</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10 text-[var(--text-primary)]">
          <section>
            <h3 className="text-xl font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Visão geral do sistema</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">A página inicial apresenta um panorama do sistema com informações atualizadas em tempo real, para acompanhamento rápido das operações.</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[var(--text-secondary)]">
              <li><strong>Dashboard:</strong> Exibe indicadores gerais da plataforma, incluindo total de usuários cadastrados, total de chamados, chamados em andamento e chamados finalizados.</li>
              <li><strong>Logs de atividade:</strong> Apresenta um curto histórico das últimas ações realizadas no sistema, como chamados finalizados, chamados aguardando atendimento e demais atualizações operacionais relevantes.</li>
              <li><strong>Criticidade global:</strong> Mostra a distribuição percentual dos chamados conforme seu nível de criticidade (alta, média ou baixa).</li>
              <li><strong>Atalho para o chat:</strong> Na parte inferior da tela, há um acesso rápido para a área de conversas e atendimentos em andamento.</li>
              <li><strong>Status da API:</strong> Indica a situação atual da API do sistema, o que permite identificar se o serviço está operando normalmente ou se apresenta instabilidades.</li>
              <li><strong>Menu lateral:</strong> Permite a navegação pelas demais funcionalidades e páginas da plataforma.</li>
              <li><strong>Menu de conta:</strong> O ícone de usuário, localizado no cabeçalho da página, oferece acesso às configurações da conta e à opção de logout.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Página de Usuários</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">A página de usuários permite que administradores gerenciem os usuários cadastrados na plataforma, incluindo controle de acesso, permissões e informações de perfil.</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[var(--text-secondary)]">
              <li><strong>Adicionar usuário:</strong> Ao lado do título da página, há um botão destinado ao cadastro de novos usuários no sistema.</li>
              <li><strong>Dashboard:</strong> Exibe indicadores gerais relacionados aos usuários cadastrados.</li>
              <li><strong>Lista de usuários:</strong> Apresenta todos os usuários cadastrados no sistema. Cada item da lista exibe nome, e-mail, status da conta e papel do usuário, além de um botão representado por um ícone de lápis que permite a edição das informações.</li>
              <li><strong>Pesquisa e filtros:</strong> É possível pesquisar usuários por nome ou e-mail, além de aplicar filtros por status ou papel.</li>
              <li>
                <strong>Status dos usuários:</strong>
                <ul className="list-circle pl-6 mt-1 space-y-1">
                  <li><strong>Ativo:</strong> Usuário com acesso liberado ao sistema.</li>
                  <li><strong>Inativo:</strong> Usuário suspenso ou com acesso desativado.</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Cadastro de novos usuários</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Ao selecionar a opção de adicionar usuário, o administrador poderá cadastrar um novo perfil na plataforma.</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[var(--text-secondary)]">
              <li>
                <strong>Papéis disponíveis no cadastro:</strong>
                <ul className="list-circle pl-6 mt-1 space-y-1">
                  <li><strong>Administrador:</strong> Gerenciamento de usuários, acompanhamento de métricas, visualização de gráficos de auditoria e configuração de permissões e preferências globais.</li>
                  <li><strong>Atendente:</strong> Responsável pelo gerenciamento de chamados e pelo atendimento aos clientes, acompanhando conversas, atualizando status e conduzindo os atendimentos até sua finalização.</li>
                  <li><strong>Usuário comum:</strong> Atua como apoio operacional no fluxo de suporte, podendo auxiliar em atendimentos, acompanhar solicitações e encerrar tickets conforme as permissões atribuídas.</li>
                  <li><strong>Cliente:</strong> Utiliza a aplicação mobile para abrir atendimentos, acompanhar solicitações e avaliar os atendimentos prestados.</li>
                </ul>
              </li>
              <li><strong>Informações obrigatórias:</strong> Nome completo, e-mail corporativo e senha temporária.</li>
              <li>A senha temporária deverá ser alterada obrigatoriamente pelo usuário em seu primeiro login, respeitando os critérios de segurança definidos pela plataforma.</li>
              <li>Após preencher o formulário, o administrador deve selecionar a opção "Finalizar cadastro", localizada na parte inferior da tela.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Edição de usuários clientes</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Usuários com papel de cliente possuem opções de gerenciamento relacionadas ao contrato e aos produtos vinculados.</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[var(--text-secondary)]">
              <li>As principais informações editáveis são nome, e-mail corporativo e empresa vinculada.</li>
              <li>É possível adicionar ou alterar produtos contratados e definir ou editar a data de expiração do contrato de manutenção.</li>
              <li>Por fim, a página também permite suspender o acesso do usuário e adicionar observações administrativas relacionadas ao cliente por meio das "notas internas".</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Edição de atendentes, administradores e usuários comuns</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">A edição desses tipos de perfil apresenta opções relacionadas a gerenciamento de permissões e de acesso.</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[var(--text-secondary)]">
              <li>As principais informações editáveis são nome, cargo, nível e papel do usuário.</li>
              <li>Quanto aos controles, é possível desligar a conta, revogar o perfil e gerenciar permissões.</li>
              <li>As permissões disponíveis para esses tipos de usuários incluem gerenciamento de usuários, gerenciamento de chamados, visualização de relatórios e definição de preferências globais do sistema.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Página de configurações de conta</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">A página de configurações permite que o usuário visualize e personalize informações relacionadas à sua conta.</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[var(--text-secondary)]">
              <li><strong>Dados pessoais:</strong> Permite visualização e edição de nome completo e endereço de e-mail.</li>
              <li><strong>Preferências de interface:</strong> Possibilita alternar entre os modos claro e escuro da plataforma, de acordo com a preferência do usuário.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Página de Chats</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">A página de chats concentra as ferramentas necessárias para acompanhamento e condução dos atendimentos por meio de troca de mensagens.</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[var(--text-secondary)]">
              <li><strong>Conversa do atendimento:</strong> A área central da tela exibe o histórico completo de mensagens trocadas durante o atendimento. No topo da conversa são exibidos nome e e-mail do cliente, ID do chamado, produto relacionado ao atendimento (quando aplicável) e status de atribuição do atendimento.</li>
              <li>
                <strong>Status de atribuição:</strong>
                <ul className="list-circle pl-6 mt-1 space-y-1">
                  <li>Atribuído a você;</li>
                  <li>Atribuído a outro atendente;</li>
                  <li>Disponível na fila.</li>
                </ul>
              </li>
              <li><strong>Histórico da conversa:</strong> Ao acessar um atendimento, também é possível visualizar as mensagens automáticas e as respostas fornecidas pelo cliente durante a etapa inicial.</li>
              <li><strong>Filtros de visualização:</strong> O usuário pode escolher se deseja visualizar todos os atendimentos ativos, apenas os atendimentos atribuídos a ele ou apenas os atendimentos disponíveis na fila, aguardando atribuição.</li>
              <li><strong>Envio de mensagens:</strong> Na parte inferior da conversa encontra-se a área destinada à comunicação com o cliente. Os recursos disponíveis são o campo para digitação de mensagens, o botão de envio e a opção de anexar arquivos por meio do ícone de clipe.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Página de Chamados</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Por meio desta página, é possível acompanhar todos os chamados registrados na plataforma.</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[var(--text-secondary)]">
              <li><strong>Lista de chamados:</strong> Exibe todos os chamados disponíveis para visualização e acompanhamento.</li>
              <li><strong>Filtros de visualização:</strong> O usuário pode escolher entre exibir todos os chamados, exibir apenas os chamados na fila (aguardando atribuição de um atendente) ou exibir apenas os chamados atribuídos ao usuário logado.</li>
              <li><strong>Pesquisa de chamados:</strong> É possível localizar chamados específicos por meio da barra de pesquisa, utilizando cliente, produto, descrição ou responsável como atributo de pesquisa.</li>
              <li><strong>Visualização de detalhes:</strong> Cada chamado possui o botão "Abrir", que direciona para a tela de detalhes do atendimento.</li>
              <li>Quando um chamado está aguardando pelo atendimento humano, o botão "Pegar chamado" fica disponível para que um usuário elegível assuma sua responsabilidade. A atribuição respeita as permissões e o nível de acesso do usuário. Caso o chamado já possua um responsável definido, o botão será exibido como "Bloqueado" e não poderá ser clicado.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 border-b border-[var(--border-subtle)] pb-2">Página de Detalhes do Chamado</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">A página de detalhes reúne todas as informações relacionadas ao chamado selecionado, além das ferramentas necessárias para seu gerenciamento.</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[var(--text-secondary)]">
              <li><strong>Informações gerais:</strong> São apresentadas informações como identificador (ID), produto relacionado ao atendimento (quando aplicável), tipo de solicitação, criticidade (alta, média ou baixa), nome e e-mail do cliente, status atual e descrição do chamado.</li>
              <li>
                <strong>Tipos de solicitação:</strong>
                <ul className="list-circle pl-6 mt-1 space-y-1">
                  <li><strong>Problema:</strong> Algum produto da Pro4Tech que a empresa do cliente utiliza está com falhas.</li>
                  <li><strong>Nova funcionalidade:</strong> O cliente deseja uma nova funcionalidade em um certo produto que sua empresa consome.</li>
                  <li><strong>Liberação de acesso:</strong> O cliente solicita que outro funcionário da empresa que representa também tenha acesso ao SyncDesk.</li>
                </ul>
              </li>
              <li><strong>Controle de status:</strong> Permite atualizar manualmente o andamento do chamado conforme a evolução do atendimento.</li>
              <li><strong>Escalonamento de chamados:</strong> A opção "Escalonar chamado" permite transferir a responsabilidade de dar continuidade ao atendimento para outro usuário. Ao clicar, é necessário selecionar o novo responsável e informar o motivo da transferência. O usuário selecionado deve possuir as permissões necessárias para assumir o chamado.</li>
              <li><strong>Histórico de responsáveis:</strong> Exibe todos os usuários que já foram responsáveis pelo atendimento em algum momento. Para cada registro são exibidos nome, status (responsável atual ou encerrado) e nível de acesso do atendente, data de entrada e de saída (quando aplicável) do chamado e motivo da atribuição.</li>
              <li><strong>Notas do chamado:</strong> Permite o registro de observações relacionadas ao atendimento. As notas ficam visíveis para o cliente, mas apenas o autor pode editá-las ou removê-las.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}