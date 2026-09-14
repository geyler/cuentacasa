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
  useLockBodyScroll(isOpen, onClose);
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
      backgroundColor: 'var(--md-sys-color-surface)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      width: '100%',
      maxWidth: '768px',
      margin: '0 auto',
      overflow: 'hidden'
    }} onClick={onClose}>
      
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--md-sys-color-surface-container)'
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
            + Nuevo Proveedor
          </h3>
          <button
            type="button"
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

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
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
            style={{ width: '100%', padding: '14px', marginTop: 'auto' }}
          >
            Registrar Proveedor
          </button>

        </div>

      </form>
    </div>
  );
};
