import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '@/app/layouts/AuthLayout'
import DashboardLayout from '@/app/layouts/DashboardLayout'
import AgentOrAdminLayout from '@/app/layouts/AgentOrAdminLayout'
import AdminOnlyLayout from '@/app/layouts/AdminOnlyLayout'
import LoginPage from '@/features/auth/pages/LoginPage'
import PasswordRecovery from '@/features/auth/pages/PasswordRecovery'
import WebAccessRestricted from '@/features/auth/pages/WebAccessRestricted'
import Dashboard from '@/features/dashboard/pages/Dashboard'
import Chat from '@/features/chat/pages/Chat'
import Usuarios from '@/features/users/pages/Usuarios'
import CadastrarUsuario from '@/features/users/pages/CadastrarUsuario'
import EditarCliente from '@/features/users/pages/EditarCliente'
import EditarAtendente from '@/features/users/pages/EditarAtendente'
import Chamados from '@/features/ticket/pages/Chamados'
import AberturaChamado from '@/features/ticket/pages/AberturaChamado'
import ModificarChamado from '@/features/ticket/pages/ModificarChamado'
import Configuracoes from '@/features/settings/pages/Configuracoes'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-senha" element={<PasswordRecovery />} />
        </Route>

        <Route path="/acesso-restrito-web" element={<WebAccessRestricted />} />

        <Route element={<DashboardLayout />}>
          <Route element={<AgentOrAdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chamados" element={<Chamados />} />
            <Route path="/chamados/novo" element={<AberturaChamado />} />
            <Route path="/chamados/:ticketId/editar" element={<ModificarChamado />} />
            <Route path="/configuracoes" element={<Configuracoes />} />

            <Route element={<AdminOnlyLayout />}>
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/usuarios/novo" element={<CadastrarUsuario />} />
              <Route path="/usuarios/:userId/editar-cliente" element={<EditarCliente />} />
              <Route path="/usuarios/:userId/editar-atendente" element={<EditarAtendente />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}