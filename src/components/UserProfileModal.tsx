'use client';

import React, { useState, useEffect } from 'react';
import { AppUser } from '@/types';
import { getLoggedInUser, saveAppUser, getStoreSales } from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
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
  LogOut,
  Sparkles
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  currency?: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  currency = '$'
}) => {
  useLockBodyScroll(isOpen, onClose);
  const { showToast } = useActionFeedback();

  const currentUser = getLoggedInUser();

  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setPassword(currentUser.password || '');
      const existingPin = localStorage.getItem('cuentacasa_pin') || '';
      setPin(existingPin);
      setShowPasswordForm(false);
      setShowPinForm(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  // Calculate user-specific sales statistics
  const allSales = getStoreSales();
  const userSales = allSales.filter(s => {
    if (s.sellerId && s.sellerId === currentUser.id) return true;
    if (s.sellerUsername && s.sellerUsername.toLowerCase() === currentUser.username.toLowerCase()) return true;
    if (s.sellerName && currentUser.name && s.sellerName.toLowerCase() === currentUser.name.toLowerCase()) return true;
    // Fallback: Si no había seller asignado y el usuario actual es el propietario, incluirlo
    if (!s.sellerId && !s.sellerUsername && currentUser.role === 'propietario') return true;
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

  const totalAmountSold = userTotalCUP;

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.length < 4) {
      showToast({ title: 'Contraseña Inválida', message: 'Ingresa al menos 4 caracteres.', type: 'warning' });
      return;
    }

    saveAppUser({
      ...currentUser,
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

  const isOwner = currentUser.role === 'propietario';

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 2200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        maxWidth: '768px',
        margin: '0 auto'
      }}
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          width: '100%',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Grab Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
        </div>

        {/* Header Bar */}
        <div style={{
          padding: '12px 20px 14px 20px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
              Mi Perfil de Usuario
            </h3>
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
            <X size={20} />
          </button>
        </div>

        {/* Scroll Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* User Identity Card */}
        <div style={{
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: '20px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'var(--md-sys-color-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 900,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            flexShrink: 0
          }}>
            {isOwner ? <Crown size={28} /> : currentUser.name.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{currentUser.name}</span>
            </h3>
            
            <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span>@{currentUser.username}</span>
              <span>•</span>
              <span style={{
                textTransform: 'capitalize',
                fontWeight: 900,
                color: 'var(--md-sys-color-primary)',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                padding: '1px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem'
              }}>
                {currentUser.role}
              </span>
            </div>

            {currentUser.whatsappNumber && (
              <div style={{ fontSize: '0.74rem', color: '#15803D', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageCircle size={12} />
                <span>{currentUser.whatsappNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* User Sales Activity Metrics (Tailored by Role) */}
        <div>
          <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Estadísticas Personales en Tienda:
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div className="md-card" style={{ padding: '12px 14px', backgroundColor: 'var(--md-sys-color-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                <ShoppingBag size={14} color="var(--md-sys-color-primary)" />
                <span>Artículos Vendidos</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', marginTop: '4px' }}>
                {totalUnitsSold} u
              </div>
              <span style={{ fontSize: '0.66rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                {userSales.length} transacciones POS
              </span>
            </div>

            <div className="md-card" style={{ padding: '12px 14px', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#047857', fontWeight: 700 }}>
                <DollarSign size={14} color="#059669" />
                <span>Total Facturado</span>
              </div>
              <div style={{ marginTop: '4px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#047857', lineHeight: 1.1 }}>
                  ${userTotalCUP.toLocaleString('es-ES')} CUP
                </div>
                {userTotalUSD > 0 && (
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1D4ED8', marginTop: '2px' }}>
                    + US$ {userTotalUSD.toLocaleString('es-ES')} USD
                  </div>
                )}
              </div>
              <span style={{ fontSize: '0.66rem', color: '#065F46', fontWeight: 600 }}>
                Recaudación propia
              </span>
            </div>
          </div>
        </div>

        {/* Security & Access Management Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Seguridad y Accesos:
          </span>

          {/* Option: Cambiar Contraseña */}
          {!showPasswordForm ? (
            <button
              onClick={() => { setShowPasswordForm(true); setShowPinForm(false); }}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: 'var(--md-sys-color-on-surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={18} color="var(--md-sys-color-primary)" />
                <span>Cambiar Contraseña</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>Editar</span>
            </button>
          ) : (
            <form onSubmit={handleUpdatePassword} style={{
              padding: '14px',
              borderRadius: '16px',
              border: '1.5px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800 }}>Nueva Contraseña</span>
                <button type="button" onClick={() => setShowPasswordForm(false)} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
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

              <button type="submit" className="md-btn md-btn-primary" style={{ padding: '10px', fontSize: '0.85rem', fontWeight: 800 }}>
                <Check size={16} />
                <span>Actualizar Contraseña</span>
              </button>
            </form>
          )}

          {/* Option: Cambiar PIN Diario */}
          {!showPinForm ? (
            <button
              onClick={() => { setShowPinForm(true); setShowPasswordForm(false); }}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: 'var(--md-sys-color-on-surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={18} color="var(--md-sys-color-primary)" />
                <span>PIN de Desbloqueo Diario (4 dígitos)</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                {localStorage.getItem('cuentacasa_pin') ? 'Activo' : 'Sin PIN'}
              </span>
            </button>
          ) : (
            <form onSubmit={handleUpdatePin} style={{
              padding: '14px',
              borderRadius: '16px',
              border: '1.5px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800 }}>PIN Diario (4 dígitos)</span>
                <button type="button" onClick={() => setShowPinForm(false)} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
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

              <button type="submit" className="md-btn md-btn-primary" style={{ padding: '10px', fontSize: '0.85rem', fontWeight: 800 }}>
                <Check size={16} />
                <span>Guardar PIN</span>
              </button>
            </form>
          )}

        </div>

        {/* Logout Button */}
        <div style={{ marginTop: '8px', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '14px' }}>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="md-btn"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
              fontSize: '0.9rem',
              fontWeight: 800,
              gap: '8px'
            }}
          >
            <LogOut size={18} />
            <span>Cerrar Sesión (@{currentUser.username})</span>
          </button>
        </div>

        </div>

      </div>
    </div>
  );
};
