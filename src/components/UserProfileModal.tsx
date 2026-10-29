'use client';

import React, { useState, useEffect } from 'react';
import { AppUser } from '@/types';
import { getLoggedInUser, saveAppUser, getStoreSales } from '@/lib/storage';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { AppInput } from '@/components/common/AppInput';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { 
  User, 
  Crown, 
  ShieldCheck, 
  MessageCircle, 
  KeyRound, 
  Lock, 
  Check, 
  X, 
  ShoppingBag, 
  DollarSign,
  Receipt,
  LogOut,
  Sparkles
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  currency?: string;
  embedded?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  currency = '$',
  embedded = false
}) => {
  useLockBodyScroll(isOpen && !embedded, onClose);
  const { showToast } = useActionFeedback();

  const currentUser = getLoggedInUser();
  const activeUser: AppUser = currentUser || {
    id: 'usr-admin',
    username: 'admin',
    name: 'Administrador',
    role: 'propietario',
    password: '1234',
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  };

  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword(activeUser.password || '');
      const existingPin = localStorage.getItem('cuentacasa_pin') || '';
      setPin(existingPin);
      setShowPasswordForm(false);
      setShowPinForm(false);
    }
  }, [isOpen, activeUser]);

  if (!isOpen) return null;

  // Calculate user-specific sales statistics
  const allSales = getStoreSales();
  const userSales = allSales.filter(s => {
    if (s.sellerId && s.sellerId === activeUser.id) return true;
    if (s.sellerUsername && s.sellerUsername.toLowerCase() === activeUser.username.toLowerCase()) return true;
    if (s.sellerName && activeUser.name && s.sellerName.toLowerCase() === activeUser.name.toLowerCase()) return true;
    if (!s.sellerId && !s.sellerUsername && activeUser.role === 'propietario') return true;
    return false;
  });
  
  const totalUnitsSold = userSales.reduce((acc, s) => {
    return acc + (s.items || []).reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  let userTotalCUP = 0;
  let userTotalUSD = 0;
  userSales.forEach(s => {
    if (s.totalAmountCUP !== undefined || s.totalAmountUSD !== undefined) {
      userTotalCUP += s.totalAmountCUP || 0;
      userTotalUSD += s.totalAmountUSD || 0;
    } else if (s.currency === 'USD') {
      userTotalUSD += s.totalAmount || 0;
    } else {
      userTotalCUP += s.totalAmount || 0;
    }
  });

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.length < 4) {
      showToast({ title: 'Contraseña Inválida', message: 'Ingresa al menos 4 caracteres.', type: 'warning' });
      return;
    }

    saveAppUser({
      ...activeUser,
      password: password.trim()
    });

    setShowPasswordForm(false);
    showToast({ title: '¡Contraseña Actualizada!', message: 'Tu contraseña de acceso ha sido cambiada.', type: 'success' });
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin && pin.length !== 4) {
      showToast({ title: 'PIN Inválido', message: 'El PIN debe contener exactamente 4 dígitos.', type: 'warning' });
      return;
    }

    if (pin) {
      localStorage.setItem('cuentacasa_pin', pin);
      showToast({ title: 'PIN Actualizado', message: 'Tu PIN de desbloqueo diario de 4 dígitos fue actualizado.', type: 'success' });
    } else {
      localStorage.removeItem('cuentacasa_pin');
      showToast({ title: 'PIN Removido', message: 'Se ha desactivado el PIN diario.', type: 'info' });
    }
    setShowPinForm(false);
  };

  const isOwner = activeUser.role === 'propietario';

  const formattedCUP = `$${new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(userTotalCUP)} CUP`;
  const formattedUSD = userTotalUSD > 0 ? `+ US$ ${new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(userTotalUSD)} USD` : '';

  // Tipografía adaptativa para cifras millonarias en inflación
  const getAdaptiveSize = (text: string) => {
    if (text.length > 20) return '1.05rem';
    if (text.length > 15) return '1.2rem';
    if (text.length > 11) return '1.35rem';
    return '1.5rem';
  };

  // 1. Vista de Perfil Principal (Contenido Estándar de Página, mismo diseño que Dashboard / Tienda / Ajustes)
  const profileBodyContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      
      {/* Tarjeta 1: Identidad del Usuario */}
      <div 
        className="md-card"
        style={{
          padding: '16px',
          borderRadius: '18px',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'var(--md-sys-color-primary)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.35rem',
          fontWeight: 900,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          flexShrink: 0
        }}>
          {isOwner ? <Crown size={26} /> : activeUser.name.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '1.12rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--md-sys-color-on-surface)' }}>
            <span>{activeUser.name}</span>
          </h3>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span>@{activeUser.username}</span>
            <span>•</span>
            <span style={{
              textTransform: 'capitalize',
              fontWeight: 900,
              color: 'var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem'
            }}>
              {activeUser.role}
            </span>
          </div>

          {activeUser.whatsappNumber && (
            <div style={{ fontSize: '0.74rem', color: '#15803D', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MessageCircle size={13} />
              <span>{activeUser.whatsappNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta 2: Métricas de Ventas Personales (100% ancho disponible para millones de CUP) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Estadísticas Personales en Tienda:
        </span>

        {/* Hero Showcase de Facturación */}
        <div 
          className="md-card" 
          style={{ 
            padding: '16px', 
            backgroundColor: '#ECFDF5', 
            border: '1px solid #A7F3D0', 
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#047857', fontWeight: 800 }}>
              <DollarSign size={16} color="#059669" />
              <span>Total Facturado en Tienda</span>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#D1FAE5', color: '#065F46' }}>
              Recaudación propia
            </span>
          </div>

          <div style={{ marginTop: '2px', minWidth: 0 }}>
            <div 
              className="tabular-nums" 
              style={{ 
                fontSize: getAdaptiveSize(formattedCUP), 
                fontWeight: 900, 
                color: '#047857', 
                lineHeight: 1.15,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}
            >
              {formattedCUP}
            </div>
            {formattedUSD && (
              <div 
                className="tabular-nums" 
                style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 800, 
                  color: '#1D4ED8', 
                  marginTop: '2px',
                  fontVariantNumeric: 'tabular-nums',
                  wordBreak: 'break-word'
                }}
              >
                {formattedUSD}
              </div>
            )}
          </div>
        </div>

        {/* Sub-fila: Artículos Vendidos & Comprobantes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div 
            className="md-card" 
            style={{ 
              padding: '12px 14px', 
              backgroundColor: 'var(--md-sys-color-surface-container)', 
              border: '1px solid var(--md-sys-color-outline-variant)', 
              borderRadius: '16px' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
              <ShoppingBag size={14} color="var(--md-sys-color-primary)" />
              <span>Artículos Vendidos</span>
            </div>
            <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(totalUnitsSold)} u
            </div>
            <span style={{ fontSize: '0.66rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
              Unidades despachadas
            </span>
          </div>

          <div 
            className="md-card" 
            style={{ 
              padding: '12px 14px', 
              backgroundColor: 'var(--md-sys-color-surface-container)', 
              border: '1px solid var(--md-sys-color-outline-variant)', 
              borderRadius: '16px' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
              <Receipt size={14} color="var(--md-sys-color-secondary, #0D9488)" />
              <span>Comprobantes POS</span>
            </div>
            <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {userSales.length}
            </div>
            <span style={{ fontSize: '0.66rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
              Ventas registradas
            </span>
          </div>
        </div>

      </div>

      {/* Tarjeta 3: Seguridad y Accesos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Seguridad y Accesos:
        </span>

        {/* Opción 1: Cambiar Contraseña */}
        {!showPasswordForm ? (
          <button
            type="button"
            onClick={() => { setShowPasswordForm(true); setShowPinForm(false); }}
            style={{
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: 'var(--md-sys-color-on-surface)',
              minHeight: '48px',
              transition: 'background-color 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <KeyRound size={18} color="var(--md-sys-color-primary)" />
              <span>Cambiar Contraseña</span>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>Editar</span>
          </button>
        ) : (
          <form onSubmit={handleUpdatePassword} style={{
            padding: '16px',
            borderRadius: '18px',
            border: '2px solid var(--md-sys-color-primary)',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>Nueva Contraseña</span>
              <button type="button" onClick={() => setShowPasswordForm(false)} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                Cancelar
              </button>
            </div>

            <AppInput
              label="Nueva Contraseña"
              fieldName="password"
              type="password"
              focusedField={focusedField}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
            />

            <button type="submit" className="md-btn md-btn-primary" style={{ padding: '12px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '12px' }}>
              <Check size={16} />
              <span>Actualizar Contraseña</span>
            </button>
          </form>
        )}

        {/* Opción 2: Cambiar PIN Diario */}
        {!showPinForm ? (
          <button
            type="button"
            onClick={() => { setShowPinForm(true); setShowPasswordForm(false); }}
            style={{
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: 'var(--md-sys-color-on-surface)',
              minHeight: '48px',
              transition: 'background-color 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={18} color="var(--md-sys-color-primary)" />
              <span>PIN de Desbloqueo Diario (4 dígitos)</span>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
              {localStorage.getItem('cuentacasa_pin') ? 'Activo' : 'Sin PIN'}
            </span>
          </button>
        ) : (
          <form onSubmit={handleUpdatePin} style={{
            padding: '16px',
            borderRadius: '18px',
            border: '2px solid var(--md-sys-color-primary)',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>PIN Diario (4 dígitos)</span>
              <button type="button" onClick={() => setShowPinForm(false)} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                Cancelar
              </button>
            </div>

            <AppInput
              label="PIN (Ej. 1234)"
              fieldName="pin"
              type="password"
              maxLength={4}
              focusedField={focusedField}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onFocus={() => setFocusedField('pin')}
              onBlur={() => setFocusedField(null)}
              placeholder="4 dígitos..."
            />

            <button type="submit" className="md-btn md-btn-primary" style={{ padding: '12px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '12px' }}>
              <Check size={16} />
              <span>Guardar PIN</span>
            </button>
          </form>
        )}

      </div>

      {/* Botón de Cerrar Sesión */}
      <div style={{ marginTop: '8px' }}>
        <button
          type="button"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="md-btn"
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            border: '1px solid #FCA5A5',
            borderRadius: '16px',
            fontSize: '0.92rem',
            fontWeight: 800,
            gap: '8px',
            cursor: 'pointer',
            minHeight: '48px'
          }}
        >
          <LogOut size={18} />
          <span>Cerrar Sesión (@{activeUser.username})</span>
        </button>
      </div>

    </div>
  );

  // MODO 1: Vista Embebida de Pestaña Principal (activeTab === 'profile')
  // Se renderiza exactamente igual a Settings, Dashboard o Tienda (sin envoltorio de modal artificial ni botón [X])
  if (embedded) {
    return (
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Cabecera Estándar de Sección */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={22} color="var(--md-sys-color-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.28rem', fontWeight: 900, margin: 0, lineHeight: 1.2, color: 'var(--md-sys-color-on-surface)' }}>
                Mi Perfil de Usuario
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0', fontWeight: 600 }}>
                Samy Store • @{activeUser.username} ({activeUser.role})
              </p>
            </div>
          </div>
        </div>

        {profileBodyContent}
      </div>
    );
  }

  // MODO 2: Modal Emergente Standalone Flotante (cuando se abre como ventana emergente)
  return (
    <div
      className="modal-backdrop-responsive no-print"
      style={{ zIndex: 2200 }}
      onClick={onClose}
    >
      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Bar */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1.08rem', fontWeight: 900, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
              Mi Perfil de Usuario
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--md-sys-color-surface-container-high)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              borderRadius: '50%',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {profileBodyContent}
        </div>
      </div>
    </div>
  );
};
