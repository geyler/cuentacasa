'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  useLockBodyScroll(isOpen);
  const [nameInput, setNameInput] = useState('');


  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onSubmit(nameInput.trim());
    setNameInput('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.70)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0'
    }} onClick={onClose}>
      
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bottom-sheet-modal"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '768px',
          padding: '20px 20px 28px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: 'var(--md-shadow-elevation-4)'
        }}
      >
        <div style={{ width: '40px', height: '4px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto', opacity: 0.8 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>+ Nuevo Proveedor</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Nombre del Proveedor (ej. Carlos, Distribuidora XYZ):
          </label>
          <input
            type="text"
            required
            placeholder="Nombre del proveedor..."
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            className="app-input"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              fontWeight: 800
            }}
          />
        </div>

        <button
          type="submit"
          className="md-btn md-btn-primary"
          style={{ width: '100%', padding: '14px' }}
        >
          Registrar Proveedor
        </button>
      </form>
    </div>
  );
};
