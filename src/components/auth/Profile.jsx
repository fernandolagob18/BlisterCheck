import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { User, LogOut, Trash2, ArrowLeft } from 'lucide-react';

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
      console.error(err);
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
      // El logout se gestiona en authService
    } catch (err) {
      setError('Error al borrar la cuenta: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bc-app">
      <div className="bc-topbar glass-panel">
        <div className="bc-topbar__left">
          <button className="bc-back-btn" onClick={onVolver} title="Volver">
            <ArrowLeft size={18} />
            <span>Volver a BlisterCheck</span>
          </button>
        </div>
      </div>

      <div className="bc-main-content">
        <div className="bc-profile-container">
          <div className="bc-profile-card glass-panel">
            
            <div className="bc-profile-header">
              <User size={48} className="bc-profile-avatar" />
              <h2>Mi Perfil</h2>
              <p className="bc-profile-email">{user?.email}</p>
            </div>

            {error && <div className="bc-auth-error">{error}</div>}
            {success && <div className="bc-auth-success">{success}</div>}

            <div className="bc-profile-details">
              {!isEditing ? (
                <>
                  <div className="bc-data-row">
                    <span className="bc-data-label">Nombre</span>
                    <span className="bc-data-value">{profile?.nombre || 'No especificado'}</span>
                  </div>
                  <div className="bc-data-row">
                    <span className="bc-data-label">Hospital</span>
                    <span className="bc-data-value">{profile?.hospital || 'No especificado'}</span>
                  </div>
                  <button className="bc-btn-secondary" onClick={() => setIsEditing(true)}>
                    Editar Perfil
                  </button>
                </>
              ) : (
                <div className="bc-auth-form">
                  <div className="bc-form-group">
                    <label>Nombre</label>
                    <input
                      type="text"
                      value={editData.nombre}
                      onChange={e => setEditData({ ...editData, nombre: e.target.value })}
                    />
                  </div>
                  <div className="bc-form-group">
                    <label>Hospital</label>
                    <input
                      type="text"
                      value={editData.hospital}
                      onChange={e => setEditData({ ...editData, hospital: e.target.value })}
                    />
                  </div>
                  <div className="bc-profile-actions">
                    <button className="bc-btn-secondary" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </button>
                    <button className="bc-btn-primary" onClick={handleSaveProfile} disabled={loading}>
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <hr className="bc-divider" />

            <div className="bc-profile-actions-main">
              <button className="bc-btn-secondary logout-btn" onClick={handleLogout}>
                <LogOut size={18} /> Cerrar Sesión
              </button>
            </div>

            <div className="bc-danger-zone">
              <h3>Zona de Peligro</h3>
              <p>Una vez que borres tu cuenta, no hay vuelta atrás. Por favor, asegúrate bien.</p>
              
              {!showDeleteConfirm ? (
                <button 
                  className="bc-btn-danger" 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={18} /> Borrar Cuenta
                </button>
              ) : (
                <div className="bc-danger-confirm">
                  <p>¿Estás completamente seguro?</p>
                  <div className="bc-danger-actions">
                    <button className="bc-btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
                    <button className="bc-btn-danger" onClick={handleDeleteAccount} disabled={loading}>
                      {loading ? 'Borrando...' : 'Sí, borrar definitivamente'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
