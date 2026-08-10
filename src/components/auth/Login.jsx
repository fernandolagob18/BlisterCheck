import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { ShieldCheck } from 'lucide-react';

export default function Login({ onSwitchToRegister }) {
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
          <ShieldCheck size={48} className="bc-auth-icon" />
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

        <div className="bc-auth-footer">
          <p>
            ¿No tienes cuenta?{' '}
            <button className="bc-btn-link" onClick={onSwitchToRegister}>
              Regístrate aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
