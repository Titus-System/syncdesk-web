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
import EditarUsuario from '@/features/users/pages/EditarUsuario'
import Chamados from '@/features/ticket/pages/Chamados'
import AberturaChamado from '@/features/ticket/pages/AberturaChamado'
import ModificarChamado from '@/features/ticket/pages/ModificarChamado'

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

            <Route element={<AdminOnlyLayout />}>
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/usuarios/novo" element={<CadastrarUsuario />} />
              <Route path="/usuarios/:userId/editar" element={<EditarUsuario />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}