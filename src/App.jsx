import React, { useState } from 'react';
import LoginPage from './Pages/LoginPage';
import PasswordRecovery from './Pages/PasswordRecovery'; // Importe a nova página
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

  const handleLogin = () => setIsLoggedIn(true);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'usuarios':
        return <Usuarios onNavigate={setCurrentPage} />;
      case 'cadastrar':
        return <CadastrarUsuario onNavigate={setCurrentPage} />;
      case 'chat':
        return <Chat onNavigate={setCurrentPage} />;
      case 'chamados':
        return <Chamados onNavigate={setCurrentPage} />;
      case 'abrir_chamado':
        return <AberturaChamado onNavigate={setCurrentPage} />;
      case 'modificar_chamado':
        return <ModificarChamado onNavigate={setCurrentPage} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <>
      {isLoggedIn ? (
        renderPage()
      ) : (
        // Lógica de alternância entre Login e Recuperação
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