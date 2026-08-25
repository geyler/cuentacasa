'use client';

import React, { useState } from 'react';
import { getStoreWhatsappNumber, saveStoreWhatsappNumber } from '@/lib/storage';
import { MessageCircle, Check } from 'lucide-react';

interface StoreSettingsTabProps {
  onShowToast: (toast: { title: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }) => void;
}

export const StoreSettingsTab: React.FC<StoreSettingsTabProps> = ({ onShowToast }) => {
  const [storeWhatsappNumber, setStoreWhatsappNumber] = useState<string>(() => getStoreWhatsappNumber());

  const handleSave = () => {
    saveStoreWhatsappNumber(storeWhatsappNumber);
    onShowToast({ title: 'WhatsApp Guardado', message: 'Los pedidos online del carrito se dirigirán a este número.', type: 'success' });
  };

  return (
    <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          backgroundColor: '#25D366',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <MessageCircle size={22} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
            WhatsApp para Pedidos del Carrito
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Los pedidos del catálogo online se enviarán automáticamente a este número de WhatsApp.
          </p>
        </div>
      </div>

      <div>
        <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
          Número de WhatsApp Target (Ej. 5351234567)
        </label>
        <input
          type="tel"
          placeholder="Ej. 5351234567"
          value={storeWhatsappNumber}
          onChange={e => setStoreWhatsappNumber(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '14px',
            border: '1px solid var(--md-sys-color-outline-variant)',
            fontSize: '1rem',
            fontWeight: 700,
            outline: 'none',
            backgroundColor: 'var(--md-sys-color-surface)',
            color: 'var(--md-sys-color-on-surface)'
          }}
        />
      </div>

      <button
        onClick={handleSave}
        className="md-btn"
        style={{
          backgroundColor: '#25D366',
          color: '#FFFFFF',
          padding: '12px',
          fontSize: '0.92rem',
          fontWeight: 800,
          boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
        }}
      >
        <Check size={18} />
        <span>Guardar Número WhatsApp</span>
      </button>
    </div>
  );
};
