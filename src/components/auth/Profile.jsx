import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { 
  User, 
  LogOut, 
  Trash2, 
  ArrowLeft, 
  Building, 
  Mail, 
  ShieldCheck, 
  Edit3, 
  Save, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Award
} from 'lucide-react';

export default function Profile({ onVolver }) {
  const { user, profile, setProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nombre: profile?.nombre || '',
    hospital: profile?.hospital || ''
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedProfile = await authService.updateProfile(user.id, editData);
      setProfile(updatedProfile);
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (err) {
      setError('Error al actualizar el perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await authService.deleteAccount();
    } catch (err) {
      setError('Error al borrar la cuenta: ' + err.message);
      setLoading(false);
    }
  };

  const userInitial = (profile?.nombre || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="bc-app bc-profile-page">
      {/* Encabezado Superior */}
      <header className="bc-header-bar">
        <div className="bc-header-bar__left">
          <button className="bc-profile-back-btn" onClick={onVolver} title="Volver a BlisterCheck">
            <ArrowLeft size={18} />
            <span>Volver a BlisterCheck</span>
          </button>
          <h1 className="bc-header-title">Perfil de usuario</h1>
        </div>
      </header>

      {/* Contenido Principal del Perfil */}
      <main className="bc-content bc-profile-content">
        <div className="bc-profile-wrapper">
          
          {/* Banner / Tarjeta de Presentación */}
          <div className="bc-profile-hero-card glass-panel">
            <div className="bc-profile-hero__left">
              <div className="bc-profile-avatar-large">
                <span>{userInitial}</span>
                <div className="bc-avatar-badge" title="Cuenta Activa">
                  <ShieldCheck size={14} />
                </div>
              </div>

              <div className="bc-profile-hero__info">
                <h2 className="bc-profile-hero__name">{profile?.nombre || 'Usuario Farmacéutico'}</h2>
                <p className="bc-profile-hero__role">
                  <Award size={14} />
                  <span>Especialista SDMDU • Farmacia Clínica</span>
                </p>
                <div className="bc-profile-hero__tags">
                  <span className="bc-profile-tag bc-profile-tag--mint">
                    <CheckCircle size={12} /> Cuenta Verificada
                  </span>
                  <span className="bc-profile-tag bc-profile-tag--blue">
                    <Building size={12} /> {profile?.hospital || 'Farmacia Hospitalaria / Comunitaria'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bc-profile-hero__right">
              <button 
                className="bc-btn-primary" 
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <X size={16} /> : <Edit3 size={16} />}
                <span>{isEditing ? 'Cancelar Edición' : 'Editar Datos'}</span>
              </button>
            </div>
          </div>

          {/* Mensajes de Alerta */}
          {error && (
            <div className="bc-error glass-panel" style={{ textAlign: 'left', margin: '1rem 0' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="bc-success-banner glass-panel">
              <CheckCircle size={16} /> {success}
            </div>
          )}

          {/* Formulario / Datos Profesionales */}
          <div className="bc-profile-section glass-panel">
            <div className="bc-section-title">
              <User size={18} />
              <h3>Información Personal y Profesional</h3>
            </div>

            {!isEditing ? (
              <div className="bc-profile-grid">
                <div className="bc-profile-field-card">
                  <div className="bc-field-icon"><User size={18} /></div>
                  <div className="bc-field-body">
                    <span className="bc-field-label">Nombre Completo</span>
                    <span className="bc-field-value">{profile?.nombre || 'No especificado'}</span>
                  </div>
                </div>

                <div className="bc-profile-field-card">
                  <div className="bc-field-icon"><Building size={18} /></div>
                  <div className="bc-field-body">
                    <span className="bc-field-label">Centro / Hospital / Farmacia</span>
                    <span className="bc-field-value">{profile?.hospital || 'No especificado'}</span>
                  </div>
                </div>

                <div className="bc-profile-field-card">
                  <div className="bc-field-icon"><Mail size={18} /></div>
                  <div className="bc-field-body">
                    <span className="bc-field-label">Correo Electrónico</span>
                    <span className="bc-field-value">{user?.email || '—'}</span>
                  </div>
                </div>

                <div className="bc-profile-field-card">
                  <div className="bc-field-icon"><ShieldCheck size={18} /></div>
                  <div className="bc-field-body">
                    <span className="bc-field-label">Estado de la Sesión</span>
                    <span className="bc-field-value" style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                      Autenticado con Supabase Auth
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <form className="bc-profile-form" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                <div className="bc-form-grid">
                  <div className="bc-filtro-field">
                    <label className="bc-filtro-label">Nombre Completo</label>
                    <input
                      type="text"
                      className="bc-filtro-input"
                      value={editData.nombre}
                      onChange={e => setEditData({ ...editData, nombre: e.target.value })}
                      placeholder="Ej: Dra. María García"
                      required
                    />
                  </div>

                  <div className="bc-filtro-field">
                    <label className="bc-filtro-label">Centro / Hospital / Farmacia</label>
                    <input
                      type="text"
                      className="bc-filtro-input"
                      value={editData.hospital}
                      onChange={e => setEditData({ ...editData, hospital: e.target.value })}
                      placeholder="Ej: Hospital General Universitario"
                    />
                  </div>
                </div>

                <div className="bc-profile-form-actions">
                  <button type="button" className="bc-btn-secondary" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="bc-btn-primary" disabled={loading}>
                    <Save size={16} />
                    <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Ajustes de Cuenta y Seguridad */}
          <div className="bc-profile-section glass-panel">
            <div className="bc-section-title">
              <ShieldCheck size={18} />
              <h3>Seguridad y Gestión de Sesión</h3>
            </div>

            <div className="bc-security-row">
              <div className="bc-security-info">
                <span className="bc-security-title">Cerrar Sesión Actual</span>
                <span className="bc-security-desc">Finaliza la sesión de forma segura en este dispositivo.</span>
              </div>
              <button className="bc-btn-logout" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>

          {/* Zona de Peligro */}
          <div className="bc-profile-section bc-profile-danger-card glass-panel">
            <div className="bc-section-title" style={{ color: 'var(--color-danger)' }}>
              <Trash2 size={18} />
              <h3>Zona de Peligro</h3>
            </div>

            <p className="bc-danger-desc">
              Si eliminas tu cuenta, se borrarán de forma irreversible todos tus datos de perfil y clasificaciones personales.
            </p>

            {!showDeleteConfirm ? (
              <button 
                className="bc-btn-danger" 
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={16} /> Borrar Cuenta Definitivamente
              </button>
            ) : (
              <div className="bc-danger-confirm-box">
                <div className="bc-danger-confirm-text">
                  <AlertTriangle size={20} color="#dc2626" />
                  <span>¿Confirmas que deseas eliminar permanentemente tu cuenta? Esta acción no se puede deshacer.</span>
                </div>
                <div className="bc-danger-confirm-btns">
                  <button className="bc-btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                    Cancelar
                  </button>
                  <button className="bc-btn-danger" onClick={handleDeleteAccount} disabled={loading}>
                    {loading ? 'Borrando...' : 'Sí, eliminar cuenta'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
