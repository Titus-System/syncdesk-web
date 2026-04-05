import React, { useState } from 'react';
import LoginPage from './Pages/LoginPage';
import PasswordRecovery from './Pages/PasswordRecovery';
import Dashboard from './Pages/Dashboard';
import Usuarios from './Pages/Usuarios';
import CadastrarUsuario from './Pages/CadastrarUsuario';
import Chat from './Pages/Chat';
import Chamados from './Pages/Chamados';
import AberturaChamado from './Pages/AberturaChamado';
import ModificarChamado from './Pages/ModificarChamado';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); 
  
  // Estado para armazenar os dados do chamado selecionado
  const [selectedTicket, setSelectedTicket] = useState(null);

  const handleLogin = () => setIsLoggedIn(true);

  // Função de navegação que aceita a página e dados opcionais
  const handleNavigate = (page, data = null) => {
    if (page === 'modificar_chamado' && data) {
      setSelectedTicket(data);
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