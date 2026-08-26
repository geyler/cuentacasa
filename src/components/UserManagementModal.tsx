'use client';

import React, { useState, useEffect } from 'react';
import { AppUser, UserRole } from '@/types';
import { getAppUsers, saveAppUser, deleteAppUser, getLoggedInUser } from '@/lib/storage';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { AppInput } from '@/components/common/AppInput';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3,
  X, 
  ShieldCheck, 
  User, 
  KeyRound,
  Check,
  Crown,
  MessageCircle
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  useLockBodyScroll(isOpen);
  const { showToast, confirmAction } = useActionFeedback();

  const currentUser = getLoggedInUser();
  const isOwner = currentUser?.role === 'propietario';

  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [role, setRole] = useState<UserRole>('administrador');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const resetForm = () => {
    setShowAddForm(false);
    setEditingUserId(null);
    setName('');
    setUsername('');
    setPassword('');
    setWhatsappNumber('');
    setRole('administrador');
  };

  useEffect(() => {
    if (isOpen) {
      setUsersList(getAppUsers());
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (u: AppUser) => {
    setEditingUserId(u.id);
    setName(u.name);
    setUsername(u.username);
    setPassword(u.password);
    setWhatsappNumber(u.whatsappNumber || '');
    setRole(u.role);
    setShowAddForm(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      showToast({ title: 'Campos Incompletos', message: 'Completa todos los datos requeridos.', type: 'error' });
      return;
    }

    saveAppUser({
      id: editingUserId || undefined,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      role,
      whatsappNumber: whatsappNumber.trim()
    });

    setUsersList(getAppUsers());
    resetForm();
    showToast({ 
      title: editingUserId ? '¡Usuario Actualizado!' : '¡Usuario Creado!', 
      message: `El usuario @${username} (${role}) ha sido ${editingUserId ? 'actualizado' : 'creado'} con éxito.`, 
      type: 'success' 
    });
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
        {(isOwner || currentUser?.role === 'administrador') && !showAddForm && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="md-btn md-btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: 800, gap: '8px' }}
          >
            <UserPlus size={18} />
            <span>Añadir Nuevo Usuario</span>
          </button>
        )}

        {/* Formulario de Creación / Edición de Usuario */}
        {showAddForm && (
          <form onSubmit={handleSaveUser} style={{
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
                {editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h4>
              <button type="button" onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
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

            <AppInput
              label="Número de WhatsApp (Editar / Recibir Pedidos)"
              fieldName="whatsappNumber"
              type="tel"
              focusedField={focusedField}
              value={whatsappNumber}
              onChange={e => setWhatsappNumber(e.target.value)}
              onFocus={() => setFocusedField('whatsappNumber')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ej. 5351234567"
            />

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                Rol y Permisos
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setRole('propietario')}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    border: role === 'propietario' ? '2px solid #BE185D' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: role === 'propietario' ? '#FCE7F3' : 'var(--md-sys-color-surface)',
                    color: role === 'propietario' ? '#BE185D' : 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Crown size={15} />
                  <span>Propietario</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('administrador')}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    border: role === 'administrador' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: role === 'administrador' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                    color: role === 'administrador' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('vendedor')}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    border: role === 'vendedor' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: role === 'vendedor' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                    color: role === 'vendedor' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <User size={15} />
                  <span>Vendedor</span>
                </button>
              </div>
            </div>

            <button type="submit" className="md-btn md-btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.9rem', marginTop: '6px' }}>
              <Check size={16} />
              <span>{editingUserId ? 'Guardar Cambios' : 'Guardar Usuario'}</span>
            </button>
          </form>
        )}

        {/* Lista de Usuarios Registrados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {usersList.map(u => {
            const isSelf = currentUser?.id === u.id;
            const isOwnerRole = u.role === 'propietario';

            return (
              <div
                key={u.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isOwnerRole ? '1.5px solid #FBCFE8' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: isOwnerRole ? '#FFF5F8' : 'var(--md-sys-color-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: isOwnerRole ? '#BE185D' : '#334155',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.88rem'
                  }}>
                    {isOwnerRole ? <Crown size={18} /> : u.name.charAt(0).toUpperCase()}
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
                    <div style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>@{u.username}</span>
                      <span>•</span>
                      <span style={{ textTransform: 'capitalize', fontWeight: 800, color: isOwnerRole ? '#BE185D' : 'inherit' }}>
                        {u.role}
                      </span>
                      {u.whatsappNumber && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#DCFCE7', color: '#15803D', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                          <MessageCircle size={10} />
                          {u.whatsappNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {(isOwner || currentUser?.role === 'administrador') && (
                    <button
                      onClick={() => handleStartEdit(u)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--md-sys-color-primary)',
                        cursor: 'pointer',
                        padding: '6px'
                      }}
                      title="Editar usuario"
                    >
                      <Edit3 size={18} />
                    </button>
                  )}

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
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
