import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { ShieldCheck, ArrowLeft, LogIn } from 'lucide-react';

export default function Register({ onSwitchToLogin, onGoToHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [hospital, setHospital] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await authService.register(email, password, nombre, hospital);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al registrar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bc-auth-container">
        <div className="bc-auth-card glass-panel text-center">
          <ShieldCheck size={48} className="bc-auth-icon bc-success-color mx-auto" style={{ color: '#10b981' }} />
          <h2>¡Registro Completado!</h2>
          <p style={{ marginTop: '10px', color: '#64748b' }}>Revisa tu correo para confirmar la cuenta (si es necesario) o inicia sesión directamente.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
            <button className="bc-btn-primary" onClick={onSwitchToLogin} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <LogIn size={16} /> Ir a Iniciar Sesión
            </button>
            {onGoToHome && (
              <button className="bc-btn-secondary" onClick={onGoToHome} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                <ArrowLeft size={16} /> Volver al Inicio
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
          <h2>Crear Cuenta</h2>
          <p>Únete a BlisterCheck</p>
        </div>

        {error && <div className="bc-auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="bc-auth-form">
          <div className="bc-form-group">
            <label htmlFor="nombre">Nombre (Opcional)</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          <div className="bc-form-group">
            <label htmlFor="hospital">Hospital (Opcional)</label>
            <input
              id="hospital"
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="Hospital al que perteneces"
            />
          </div>

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

          <div className="bc-form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="bc-btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="bc-auth-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <p style={{ margin: 0 }}>
            ¿Ya tienes cuenta?{' '}
            <button className="bc-btn-link" onClick={onSwitchToLogin}>
              Inicia sesión
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
