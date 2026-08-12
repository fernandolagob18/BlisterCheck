import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Login({ onSwitchToRegister, onGoToHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login(email, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Comprueba tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bc-auth-container">
      <div className="bc-auth-card glass-panel">
        <div className="bc-auth-header">
          <svg width="64" height="64" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, borderRadius: 12, boxShadow: '0 8px 24px rgba(13, 148, 136, 0.4)', margin: '0 auto 1rem' }}>
            <rect width="38" height="38" rx="9" fill="#0b192c"/>
            <rect x="7" y="10" width="10" height="8" rx="3" fill="#1a3a5c"/>
            <rect x="21" y="10" width="10" height="8" rx="3" fill="#1a3a5c"/>
            <rect x="7" y="21" width="10" height="8" rx="3" fill="#1a3a5c"/>
            <rect x="21" y="21" width="10" height="8" rx="3" fill="#1a3a5c"/>
            <ellipse cx="12" cy="14" rx="3" ry="2.5" fill="#0ea5e9"/>
            <ellipse cx="26" cy="14" rx="3" ry="2.5" fill="#0ea5e9" opacity="0.5"/>
            <ellipse cx="12" cy="25" rx="3" ry="2.5" fill="#0ea5e9" opacity="0.5"/>
            <polyline points="24,25.5 26,27.5 30,23.5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2>Bienvenido a BlisterCheck</h2>
          <p>Inicia sesión para gestionar el catálogo</p>
        </div>

        {error && <div className="bc-auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="bc-auth-form">
          <div className="bc-form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="bc-form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="bc-btn-primary" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="bc-auth-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <p style={{ margin: 0 }}>
            ¿No tienes cuenta?{' '}
            <button className="bc-btn-link" onClick={onSwitchToRegister}>
              Regístrate aquí
            </button>
          </p>
          {onGoToHome && (
            <button className="bc-btn-link" onClick={onGoToHome} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#64748b' }}>
              <ArrowLeft size={14} /> Volver al Inicio
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
