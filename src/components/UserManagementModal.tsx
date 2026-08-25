'use client';

import React, { useState, useEffect } from 'react';
import { AppUser, UserRole } from '@/types';
import { getAppUsers, saveAppUser, deleteAppUser, getLoggedInUser } from '@/lib/storage';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { AppInput } from '@/components/common/AppInput';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  X, 
  ShieldCheck, 
  User, 
  KeyRound,
  Check
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { showToast, confirmAction } = useActionFeedback();
  const currentUser = getLoggedInUser();
  const isOwner = currentUser?.role === 'propietario';

  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('administrador');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsersList(getAppUsers());
      setShowAddForm(false);
      setName('');
      setUsername('');
      setPassword('');
      setRole('administrador');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      showToast({ title: 'Campos Incompletos', message: 'Completa todos los datos requeridos.', type: 'error' });
      return;
    }

    saveAppUser({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      role
    });

    setUsersList(getAppUsers());
    setShowAddForm(false);
    setName('');
    setUsername('');
    setPassword('');
    showToast({ title: '¡Usuario Creado!', message: `El usuario @${username} ha sido añadido con éxito.`, type: 'success' });
  };

  const handleDeleteUser = (userId: string, targetUsername: string) => {
    confirmAction({
      title: '¿Eliminar Usuario?',
      message: `¿Estás seguro de eliminar el acceso para @${targetUsername}?`,
      variant: 'danger',
      confirmText: 'Eliminar Acceso',
      onConfirm: () => {
        const res = deleteAppUser(userId);
        if (res.success) {
          setUsersList(getAppUsers());
          showToast({ title: 'Usuario Eliminado', message: res.message, type: 'info' });
        } else {
          showToast({ title: 'No permitido', message: res.message, type: 'error' });
        }
      }
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.70)',
      backdropFilter: 'blur(8px)',
      zIndex: 2200,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0'
    }} className="no-print" onClick={onClose}>
      
      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '520px',
          padding: '20px 24px 28px 24px',
          borderRadius: '28px 28px 0 0',
          boxShadow: 'var(--md-shadow-elevation-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Drag Handle */}
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 8px auto' }} />

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>Gestión de Usuarios</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                {usersList.length} usuarios registrados en el sistema
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface)', cursor: 'pointer', padding: '6px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Botón para Desplegar Formulario de Nuevo Usuario */}
        {isOwner && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="md-btn md-btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: 800, gap: '8px' }}
          >
            <UserPlus size={18} />
            <span>Añadir Nuevo Usuario</span>
          </button>
        )}

        {/* Formulario de Creación de Usuario */}
        {showAddForm && (
          <form onSubmit={handleCreateUser} style={{
            backgroundColor: 'var(--md-sys-color-surface)',
            padding: '16px',
            borderRadius: '16px',
            border: '1.5px solid var(--md-sys-color-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 900, margin: 0, color: 'var(--md-sys-color-primary)' }}>
                Crear Nuevo Usuario
              </h4>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                Cancelar
              </button>
            </div>

            <AppInput
              label="Nombre Completo"
              fieldName="name"
              focusedField={focusedField}
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ej. María Pérez"
            />

            <AppInput
              label="Nombre de Usuario (Login)"
              fieldName="username"
              focusedField={focusedField}
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ej. maria"
            />

            <AppInput
              label="Contraseña"
              fieldName="password"
              type="password"
              focusedField={focusedField}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
            />

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                Rol y Permisos
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRole('administrador')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: role === 'administrador' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: role === 'administrador' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                    color: role === 'administrador' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Administrador
                </button>

                <button
                  type="button"
                  onClick={() => setRole('vendedor')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: role === 'vendedor' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: role === 'vendedor' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                    color: role === 'vendedor' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Vendedor
                </button>
              </div>
            </div>

            <button type="submit" className="md-btn md-btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.9rem', marginTop: '6px' }}>
              <Check size={16} />
              <span>Guardar Usuario</span>
            </button>
          </form>
        )}

        {/* Lista de Usuarios Registrados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {usersList.map(u => {
            const isSelf = currentUser?.id === u.id;
            return (
              <div
                key={u.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: u.role === 'propietario' ? '#FCE7F3' : '#F1F5F9',
                    color: u.role === 'propietario' ? '#BE185D' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.85rem'
                  }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{u.name}</span>
                      {isSelf && (
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#DB2777', color: '#FFF', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>
                          Tú
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                      @{u.username} • <span style={{ textTransform: 'capitalize' }}>{u.role}</span>
                    </div>
                  </div>
                </div>

                {isOwner && u.role !== 'propietario' && (
                  <button
                    onClick={() => handleDeleteUser(u.id, u.username)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--md-sys-color-expense)',
                      cursor: 'pointer',
                      padding: '6px'
                    }}
                    title="Eliminar usuario"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
