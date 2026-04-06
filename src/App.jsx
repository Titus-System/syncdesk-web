import React, { useState } from 'react';
import LoginPage from './Pages/LoginPage';
import PasswordRecovery from './Pages/PasswordRecovery';
import Dashboard from './Pages/Dashboard';
import Usuarios from './Pages/Usuarios';
import CadastrarUsuario from './Pages/CadastrarUsuario';
import EditarUsuario from './Pages/EditarUsuario'; // Importe a nova página
import Chat from './Pages/Chat';
import Chamados from './Pages/Chamados';
import AberturaChamado from './Pages/AberturaChamado';
import ModificarChamado from './Pages/ModificarChamado';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); 
  
  // Estados para armazenar dados de edição
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null); // Novo estado para o usuário

  const handleLogin = () => setIsLoggedIn(true);

  // Função de navegação aprimorada
  const handleNavigate = (page, data = null) => {
    if (page === 'modificar_chamado' && data) {
      setSelectedTicket(data);
    }
    
    // Lógica para capturar o ID quando for editar usuário
    if (page === 'editar' && data) {
      setSelectedUserId(data);
    }

    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'usuarios':
        return <Usuarios onNavigate={handleNavigate} />;
      case 'cadastrar':
        return <CadastrarUsuario onNavigate={handleNavigate} />;
      case 'editar': // Nova rota adicionada
        return <EditarUsuario userId={selectedUserId} onNavigate={handleNavigate} />;
      case 'chat':
        return <Chat onNavigate={handleNavigate} />;
      case 'chamados':
        return <Chamados onNavigate={handleNavigate} />;
      case 'abrir_chamado':
        return <AberturaChamado onNavigate={handleNavigate} />;
      case 'modificar_chamado':
        return <ModificarChamado onNavigate={handleNavigate} ticketData={selectedTicket} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      {isLoggedIn ? (
        renderPage()
      ) : (
        authView === 'login' ? (
          <LoginPage 
            onLogin={handleLogin} 
            onForgotPassword={() => setAuthView('recovery')} 
          />
        ) : (
          <PasswordRecovery 
            onBackToLogin={() => setAuthView('login')} 
          />
        )
      )}
    </>
  );
}

export default App;