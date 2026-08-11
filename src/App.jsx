import React, { useState } from 'react';
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

  // Si está cargando la sesión, mostramos un loader
  if (loading) {
    return (
      <div className="bc-app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="bc-mini-spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  // Si hay usuario y estábamos en rutas públicas, vamos a la app
  if (user && (currentView === 'landing' || currentView === 'login' || currentView === 'register')) {
    setCurrentView('app');
  }

  // Si no hay usuario y estábamos en app o perfil, vamos al landing
  if (!user && (currentView === 'app' || currentView === 'profile')) {
    setCurrentView('landing');
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
