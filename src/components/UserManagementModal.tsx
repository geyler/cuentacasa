'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppUser, UserRole } from '@/types';
import { getAppUsers, saveAppUser, deleteAppUser, getLoggedInUser, formatCubanPhone } from '@/lib/storage';
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
  MessageCircle,
  Search,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Info
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

const ROLE_DEFINITIONS: Record<UserRole, {
  label: string;
  badgeBg: string;
  badgeColor: string;
  borderColor: string;
  icon: React.ReactNode;
  summary: string;
  permissions: string[];
}> = {
  propietario: {
    label: 'Propietario',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
    badgeColor: '#DB2777',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    icon: <Crown size={16} />,
    summary: 'Control absoluto del negocio, finanzas, socios y configuración.',
    permissions: [
      'Acceso total a contabilidad, ganancias e inversiones',
      'Configurar monedas, tasa elTOQUE y márgenes de ganancia',
      'Crear, editar y eliminar usuarios de cualquier rol',
      'Cierre de turnos, arqueos de caja y tasaciones oficiales',
      'Exportar, importar y reiniciar bases de datos'
    ]
  },
  administrador: {
    label: 'Administrador',
    badgeBg: 'rgba(14, 165, 233, 0.15)',
    badgeColor: '#0284C7',
    borderColor: 'rgba(14, 165, 233, 0.4)',
    icon: <ShieldCheck size={16} />,
    summary: 'Gestión operativa completa de tienda, stock y vendedores.',
    permissions: [
      'Crear y editar productos, precios y categorías',
      'Registrar ventas, devoluciones y tickets en caja',
      'Gestionar proveedores, pagos y cuentas por cobrar',
      'Abrir y cerrar turnos de venta IPV',
      'Crear y editar vendedores (no puede alterar propietarios)'
    ]
  },
  vendedor: {
    label: 'Vendedor',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeColor: '#059669',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    icon: <User size={16} />,
    summary: 'Punto de venta POS, cobros y consulta de inventario disponible.',
    permissions: [
      'Operar la caja registradora y escanear códigos de barra',
      'Realizar ventas en efectivo y transferencias',
      'Apertura y entrega de su propio turno IPV',
      'Consultar disponibilidad de productos para clientes',
      'Sin acceso a costos de compra ni márgenes de ganancia'
    ]
  }
};

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ 
  isOpen, 
  onClose,
  embedded = false 
}) => {
  useLockBodyScroll(isOpen && !embedded, onClose);
  const { showToast, confirmAction } = useActionFeedback();

  const currentUser = getLoggedInUser();
  const isOwner = currentUser?.role === 'propietario';

  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [role, setRole] = useState<UserRole>('administrador');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Filtros de búsqueda y vista
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | UserRole>('all');
  const [expandedRoleId, setExpandedRoleId] = useState<UserRole | null>(null);

  const resetForm = () => {
    setShowAddForm(false);
    setEditingUserId(null);
    setName('');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setWhatsappNumber('');
    setRole('administrador');
  };

  useEffect(() => {
    if (isOpen) {
      setUsersList(getAppUsers());
      resetForm();
    }
  }, [isOpen]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return usersList.filter(u => {
      const matchesSearch = !q 
        || u.name.toLowerCase().includes(q) 
        || u.username.toLowerCase().includes(q)
        || (u.whatsappNumber && u.whatsappNumber.includes(q));
      const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [usersList, searchQuery, selectedRoleFilter]);

  if (!isOpen && !embedded) return null;

  const handleStartEdit = (u: AppUser) => {
    setEditingUserId(u.id);
    setName(u.name);
    setUsername(u.username);
    setPassword(u.password);
    setShowPassword(false);
    setWhatsappNumber(u.whatsappNumber || '');
    setRole(u.role);
    setShowAddForm(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const cleanPassword = password.trim();

    if (!cleanName || !cleanUsername || !cleanPassword) {
      showToast({ 
        title: 'Campos Requeridos', 
        message: 'Debes completar el nombre, usuario y contraseña.', 
        type: 'error' 
      });
      return;
    }

    if (cleanUsername.length < 3) {
      showToast({ 
        title: 'Usuario muy corto', 
        message: 'El nombre de usuario debe tener al menos 3 caracteres.', 
        type: 'warning' 
      });
      return;
    }

    // Verificar si ya existe otro usuario con el mismo username
    const exists = usersList.some(u => u.username.toLowerCase() === cleanUsername && u.id !== editingUserId);
    if (exists) {
      showToast({ 
        title: 'Usuario ya existente', 
        message: `El nombre de usuario @${cleanUsername} ya está en uso. Elige uno diferente.`, 
        type: 'error' 
      });
      return;
    }

    saveAppUser({
      id: editingUserId || undefined,
      name: cleanName,
      username: cleanUsername,
      password: cleanPassword,
      role,
      whatsappNumber: whatsappNumber.trim()
    });

    setUsersList(getAppUsers());
    resetForm();
    showToast({ 
      title: editingUserId ? '¡Usuario Actualizado!' : '¡Usuario Creado!', 
      message: `El acceso para @${cleanUsername} (${role}) fue guardado con éxito.`, 
      type: 'success' 
    });
  };

  const handleDeleteUser = (userId: string, targetUsername: string, targetRole: UserRole) => {
    if (targetRole === 'propietario' && usersList.filter(u => u.role === 'propietario').length <= 1) {
      showToast({
        title: 'Operación no permitida',
        message: 'No puedes eliminar el único usuario propietario del sistema.',
        type: 'error'
      });
      return;
    }

    confirmAction({
      title: '¿Eliminar Acceso de Usuario?',
      message: `¿Estás seguro de revocar y eliminar permanentemente el acceso para @${targetUsername}?`,
      variant: 'danger',
      confirmText: 'Eliminar Usuario',
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

  const modalBody = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header con métricas de roles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px'
      }}>
        {(['propietario', 'administrador', 'vendedor'] as UserRole[]).map(r => {
          const count = usersList.filter(u => u.role === r).length;
          const meta = ROLE_DEFINITIONS[r];
          const isSelected = selectedRoleFilter === r;

          return (
            <div
              key={r}
              onClick={() => setSelectedRoleFilter(isSelected ? 'all' : r)}
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                border: isSelected ? `2px solid ${meta.badgeColor}` : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: isSelected ? meta.badgeBg : 'var(--md-sys-color-surface)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: meta.badgeColor, fontWeight: 900, fontSize: '0.82rem' }}>
                  {meta.icon}
                  {meta.label}s
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                  {count}
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                {isSelected ? 'Mostrando solo este rol' : 'Toca para filtrar'}
              </span>
            </div>
          );
        })}
      </div>

      {/* 2. Barra de acciones: Búsqueda + Añadir Usuario */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          flex: 1,
          minWidth: '220px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: '12px',
          padding: '0 12px'
        }}>
          <Search size={16} color="var(--md-sys-color-on-surface-variant)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, usuario o teléfono..."
            style={{
              width: '100%',
              padding: '10px 10px',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--md-sys-color-on-surface)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-sys-color-on-surface-variant)', padding: 0 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {(isOwner || currentUser?.role === 'administrador') && !showAddForm && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="md-btn md-btn-primary"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <UserPlus size={16} />
            <span>Crear Usuario</span>
          </button>
        )}
      </div>

      {/* 3. Formulario Interactivo (Crear o Editar) */}
      {showAddForm && (
        <form onSubmit={handleSaveUser} style={{
          backgroundColor: 'var(--md-sys-color-surface)',
          padding: '18px',
          borderRadius: '18px',
          border: '1.5px solid var(--md-sys-color-primary)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {editingUserId ? <Edit3 size={16} /> : <UserPlus size={16} />}
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
                {editingUserId ? 'Modificar Datos de Usuario' : 'Registrar Nuevo Acceso de Usuario'}
              </h4>
            </div>
            <button 
              type="button" 
              onClick={resetForm} 
              style={{ 
                background: 'var(--md-sys-color-surface-container-high)', 
                border: '1px solid var(--md-sys-color-outline-variant)', 
                borderRadius: '8px', 
                color: 'var(--md-sys-color-on-surface-variant)', 
                cursor: 'pointer', 
                fontSize: '0.75rem', 
                fontWeight: 800,
                padding: '5px 10px'
              }}
            >
              Cancelar
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
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
              label="Usuario (Login sin espacios)"
              fieldName="username"
              focusedField={focusedField}
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ej. maria"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <AppInput
                label="Contraseña de Acceso"
                fieldName="password"
                type={showPassword ? 'text' : 'password'}
                focusedField={focusedField}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '36px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <AppInput
              label="WhatsApp (Opcional - para recibir carritos)"
              fieldName="whatsappNumber"
              type="tel"
              focusedField={focusedField}
              value={whatsappNumber}
              onChange={e => setWhatsappNumber(e.target.value)}
              onFocus={() => setFocusedField('whatsappNumber')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ej. 5351234567"
            />
          </div>

          {/* Selector y desglose de rol con permisos */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', display: 'block', marginBottom: '8px' }}>
              Rol Asignado y Nivel de Privilegios:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '10px' }}>
              {(['propietario', 'administrador', 'vendedor'] as UserRole[]).map(r => {
                const meta = ROLE_DEFINITIONS[r];
                const isSelected = role === r;

                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected ? `2px solid ${meta.badgeColor}` : '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: isSelected ? meta.badgeBg : 'var(--md-sys-color-surface-container-high)',
                      color: isSelected ? meta.badgeColor : 'var(--md-sys-color-on-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '4px',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 900, fontSize: '0.88rem' }}>
                      {meta.icon}
                      <span>{meta.label}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.3 }}>
                      {meta.summary}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Cuadro de permisos del rol seleccionado */}
            <div style={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1px solid var(--md-sys-color-outline-variant)'
            }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 900, color: ROLE_DEFINITIONS[role].badgeColor, display: 'block', marginBottom: '6px' }}>
                Permisos del rol {ROLE_DEFINITIONS[role].label}:
              </span>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.6 }}>
                {ROLE_DEFINITIONS[role].permissions.map((perm, i) => (
                  <li key={i}>{perm}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={resetForm}
              className="md-btn md-btn-secondary"
              style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.84rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="md-btn md-btn-primary"
              style={{ padding: '10px 22px', borderRadius: '12px', fontSize: '0.86rem', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Check size={16} />
              <span>{editingUserId ? 'Guardar Cambios' : 'Confirmar y Crear'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. Lista Optimizada de Usuarios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Usuarios ({filteredUsers.length} de {usersList.length})
          </span>
          {selectedRoleFilter !== 'all' && (
            <button
              onClick={() => setSelectedRoleFilter('all')}
              style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-primary)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
            >
              Quitar filtro ({selectedRoleFilter})
            </button>
          )}
        </div>

        {filteredUsers.length === 0 ? (
          <div style={{
            padding: '30px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--md-sys-color-surface)',
            borderRadius: '16px',
            border: '1px dashed var(--md-sys-color-outline-variant)'
          }}>
            <Users size={32} style={{ color: 'var(--md-sys-color-on-surface-variant)', margin: '0 auto 8px auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
              No se encontraron usuarios
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Prueba con otro término de búsqueda o cambia el filtro de roles.
            </span>
          </div>
        ) : (
          filteredUsers.map(u => {
            const isSelf = currentUser?.id === u.id || currentUser?.username === u.username;
            const meta = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.vendedor;
            const isPropietario = u.role === 'propietario';

            return (
              <div
                key={u.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: isSelf ? '1.5px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  {/* Avatar con indicador de rol */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: meta.badgeBg,
                    color: meta.badgeColor,
                    border: `1.5px solid ${meta.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    flexShrink: 0
                  }}>
                    {isPropietario ? <Crown size={20} /> : u.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Datos del usuario */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                        {u.name}
                      </span>
                      {isSelf && (
                        <span style={{
                          fontSize: '0.66rem',
                          backgroundColor: 'var(--md-sys-color-primary)',
                          color: '#FFFFFF',
                          padding: '1px 7px',
                          borderRadius: '9999px',
                          fontWeight: 900
                        }}>
                          Tú
                        </span>
                      )}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: meta.badgeBg,
                        color: meta.badgeColor
                      }}>
                        {meta.icon}
                        {meta.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '3px', fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      <span style={{ fontWeight: 700 }}>@{u.username}</span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Lock size={12} />
                        ••••••••
                      </span>
                      {u.whatsappNumber && (
                        <>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16A34A', fontWeight: 700 }}>
                            <MessageCircle size={12} />
                            {formatCubanPhone(u.whatsappNumber).display}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {(isOwner || currentUser?.role === 'administrador') && (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(u)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        color: 'var(--md-sys-color-primary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.78rem',
                        fontWeight: 800
                      }}
                      title="Editar usuario y clave"
                    >
                      <Edit3 size={15} />
                      <span className="desktop-only">Editar</span>
                    </button>
                  )}

                  {isOwner && !isSelf && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.username, u.role)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        color: 'var(--md-sys-color-expense, #DC2626)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.78rem',
                        fontWeight: 800
                      }}
                      title="Eliminar usuario"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Guía de Seguridad y Roles del Sistema */}
      <div style={{
        padding: '16px',
        borderRadius: '16px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        border: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} color="var(--md-sys-color-primary)" />
          <span style={{ fontSize: '0.86rem', fontWeight: 900 }}>
            Guía de Privilegios y Seguridad
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.5 }}>
          Cada rol posee permisos delimitados para garantizar que los vendedores únicamente operen el cobro y consulta de existencias, mientras los administradores y propietarios conservan el control de compras, proveedores, finanzas y configuración.
        </p>
      </div>

    </div>
  );

  // Si está integrado directamente como vista dentro de Ajustes (embedded=true)
  if (embedded) {
    return modalBody;
  }

  // Modal Flotante / Bottom-Sheet
  return (
    <div
      className="modal-backdrop-responsive no-print"
      style={{ zIndex: 2400 }}
      onClick={onClose}
    >
      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '650px',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '24px'
        }}
      >
        {/* Grab Handle */}
        <div className="mobile-only" style={{ justifyContent: 'center', paddingTop: '10px', paddingBottom: '2px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
        </div>

        {/* Header Bar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
                Gestión de Usuarios y Roles
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                {usersList.length} usuarios registrados en el sistema
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--md-sys-color-surface-container-high)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              borderRadius: '50%',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {modalBody}
        </div>
      </div>
    </div>
  );
};
