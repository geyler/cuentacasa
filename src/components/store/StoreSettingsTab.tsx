'use client';

import React, { useState, useEffect } from 'react';
import { 
  getStoreWhatsappNumber, 
  saveStoreWhatsappNumber, 
  getAppUsers, 
  getActiveWhatsappUserId,
  formatCubanPhone 
} from '@/lib/storage';
import { AppUser } from '@/types';
import { MessageCircle, Check, Crown, ShieldCheck, User, Phone, CheckCircle2 } from 'lucide-react';

interface StoreSettingsTabProps {
  onShowToast: (toast: { title: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }) => void;
}

export const StoreSettingsTab: React.FC<StoreSettingsTabProps> = ({ onShowToast }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | undefined>(undefined);
  const [customPhone, setCustomPhone] = useState<string>('');

  useEffect(() => {
    const appUsers = getAppUsers();
    setUsers(appUsers);

    const activeId = getActiveWhatsappUserId();
    setActiveUserId(activeId);

    const currentPhone = getStoreWhatsappNumber();
    setCustomPhone(currentPhone);
  }, []);

  const handleSelectUser = (user: AppUser) => {
    const phoneToSave = user.whatsappNumber || customPhone;
    setActiveUserId(user.id);
    saveStoreWhatsappNumber(phoneToSave, user.id);
    onShowToast({
      title: 'Destinatario de Pedidos Actualizado',
      message: `Los pedidos del catálogo se enviarán al WhatsApp de @${user.username} (${user.name}).`,
      type: 'success'
    });
  };

  const handleSaveCustomPhone = () => {
    if (!customPhone.trim()) {
      onShowToast({ title: 'Número Requerido', message: 'Ingresa un número de WhatsApp válido.', type: 'error' });
      return;
    }
    setActiveUserId(undefined);
    saveStoreWhatsappNumber(customPhone.trim(), undefined);
    onShowToast({
      title: 'WhatsApp Guardado',
      message: 'Los pedidos del carrito se dirigirán al número manual especificado.',
      type: 'success'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '100%', width: '100%', margin: '0 auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* Target WhatsApp Info Card */}
      <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            backgroundColor: '#25D366',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
            flexShrink: 0
          }}>
            <MessageCircle size={24} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', margin: 0 }}>
              Destinatario de Pedidos WhatsApp
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0', lineHeight: '1.4' }}>
              Selecciona cuál propietario o administrador recibirá los pedidos de la tienda online en su número personal.
            </p>
          </div>
        </div>

        {/* Lista de Usuarios Elegibles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px', maxWidth: '100%' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Seleccionar Usuario Receptor:
          </span>

          {users.map(u => {
            const isSelected = activeUserId === u.id;
            const formatted = formatCubanPhone(u.whatsappNumber);

            return (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  border: isSelected ? '2px solid #25D366' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: isSelected ? '#F0FDF4' : 'var(--md-sys-color-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: u.role === 'propietario' ? '#BE185D' : 'var(--md-sys-color-primary-container)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    flexShrink: 0
                  }}>
                    {u.role === 'propietario' ? <Crown size={18} /> : u.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, backgroundColor: u.role === 'propietario' ? '#FCE7F3' : '#E0F2FE', color: u.role === 'propietario' ? '#BE185D' : '#0284C7', padding: '1px 6px', borderRadius: '6px', flexShrink: 0 }}>
                        {u.role}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, marginTop: '1px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      @{u.username} • {u.whatsappNumber ? formatted.display : 'Sin número asignado'}
                    </div>
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {isSelected ? (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#25D366', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={16} />
                    </div>
                  ) : (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--md-sys-color-outline-variant)' }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Separador Manual */}
        <div style={{ borderTop: '1px dashed var(--md-sys-color-outline-variant)', paddingTop: '14px', marginTop: '6px', maxWidth: '100%', boxSizing: 'border-box' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
            O Ingresar Número Manual Personalizado:
          </label>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '100%' }}>
            <input
              type="tel"
              placeholder="Ej. 5351234567"
              value={customPhone}
              onChange={e => setCustomPhone(e.target.value)}
              style={{
                flex: '1 1 180px',
                minWidth: 0,
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                fontSize: '0.95rem',
                fontWeight: 700,
                outline: 'none',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                boxSizing: 'border-box'
              }}
            />

            <button
              onClick={handleSaveCustomPhone}
              className="md-btn"
              style={{
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                padding: '12px 18px',
                fontSize: '0.88rem',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                flexShrink: 0
              }}
            >
              <Check size={18} />
              <span>Guardar</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
