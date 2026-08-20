import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
import BlisterCheckApp from './components/blistercheck/BlisterCheckApp';
import LandingPage from './components/marketing/LandingPage';
import './blistercheck.css'; // Asegurarse de importar los estilos globales

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'login', 'register', 'app', 'profile'

  // Redirigir según el estado de autenticación cada vez que cambia el usuario.
  // Se usa useEffect para evitar llamar a setState durante la fase de render,
  // lo que viola las reglas de React y provoca bucles en StrictMode.
  useEffect(() => {
    if (user && ['landing', 'login', 'register'].includes(currentView)) {
      setCurrentView('app');
    } else if (!user && ['app', 'profile'].includes(currentView)) {
      setCurrentView('landing');
    }
  }, [user]); // Solo reacciona al cambio de sesión (login / logout), no a cada navegación manual

  // Si está cargando la sesión, mostramos un loader
  if (loading) {
    return (
      <div className="bc-app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="bc-mini-spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  // Router simple basado en estado
  switch (currentView) {
    case 'landing':
      return <LandingPage onLogin={() => setCurrentView('login')} onRegister={() => setCurrentView('register')} />;
    case 'login':
      return <Login onSwitchToRegister={() => setCurrentView('register')} onGoToHome={() => setCurrentView('landing')} />;
    case 'register':
      return <Register onSwitchToLogin={() => setCurrentView('login')} onGoToHome={() => setCurrentView('landing')} />;
    case 'profile':
      return <Profile onVolver={() => setCurrentView('app')} />;
    case 'app':
    default:
      // Pasamos una función para ir al perfil
      return <BlisterCheckApp onGoToProfile={() => setCurrentView('profile')} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
