import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { ShieldCheck } from 'lucide-react';

export default function Register({ onSwitchToLogin }) {
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
          <ShieldCheck size={48} className="bc-auth-icon bc-success-color mx-auto" />
          <h2>¡Registro Completado!</h2>
          <p>Revisa tu correo para confirmar la cuenta (si es necesario) o inicia sesión.</p>
          <button className="bc-btn-primary mt-4" onClick={onSwitchToLogin}>
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bc-auth-container">
      <div className="bc-auth-card glass-panel">
        <div className="bc-auth-header">
          <ShieldCheck size={48} className="bc-auth-icon" />
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

        <div className="bc-auth-footer">
          <p>
            ¿Ya tienes cuenta?{' '}
            <button className="bc-btn-link" onClick={onSwitchToLogin}>
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
