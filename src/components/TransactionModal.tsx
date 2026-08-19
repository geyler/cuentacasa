'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/types';
import { fileToBase64 } from '@/lib/storage';
import { X, Camera, Trash2, CheckCircle2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'gasto',
  editingTransaction
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setConcept(editingTransaction.concept);
      setAmount(editingTransaction.amount.toString());
      setPhotoUrl(editingTransaction.photoUrl);
      setError('');
    } else {
      setType(initialType);
      setConcept('');
      setAmount('');
      setPhotoUrl(undefined);
      setError('');
    }
  }, [editingTransaction, initialType, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setPhotoUrl(base64);
      } catch (err) {
        console.error('Error reading photo:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedConcept = concept.trim();
    if (trimmedConcept.length < 3 || trimmedConcept.length > 120) {
      setError('El detalle debe tener entre 3 y 120 caracteres.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor introduce un monto mayor a 0.');
      return;
    }

    // Auto-generate date in background (ISO YYYY-MM-DD)
    const currentDate = new Date().toISOString().split('T')[0];
    const categoryName = type === 'ingreso' ? 'Ingreso' : 'Gasto';

    onSave({
      type,
      concept: trimmedConcept,
      category: categoryName,
      amount: parsedAmount,
      date: editingTransaction ? editingTransaction.date : currentDate,
      notes: '',
      photoUrl
    });

    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }} className="no-print" onClick={onClose}>
      
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          boxShadow: 'var(--md-shadow-elevation-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {editingTransaction ? 'Editar' : 'Registrar'} {type === 'ingreso' ? 'Ingreso' : 'Gasto'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--md-sys-color-on-surface-variant)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Type Toggle Switch */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          padding: '4px',
          borderRadius: '14px'
        }}>
          <button
            type="button"
            onClick={() => setType('gasto')}
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: type === 'gasto' ? 'var(--md-sys-color-expense)' : 'transparent',
              color: type === 'gasto' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            GASTO
          </button>

          <button
            type="button"
            onClick={() => setType('ingreso')}
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: type === 'ingreso' ? 'var(--md-sys-color-income)' : 'transparent',
              color: type === 'ingreso' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            INGRESO
          </button>
        </div>

        {error && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '10px',
            backgroundColor: 'var(--md-sys-color-expense-container)',
            color: 'var(--md-sys-color-on-expense-container)',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Detalle / Titulo */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
              Detalle / Título * (3 a 120 caracteres)
            </label>
            <input
              type="text"
              minLength={3}
              maxLength={120}
              placeholder={type === 'ingreso' ? 'Ej. Pago por webs, Venta de laptop...' : 'Ej. Pan, Arroz, Hamburguesa...'}
              value={concept}
              onChange={e => setConcept(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', marginTop: '2px' }}>
              {concept.length}/120
            </div>
          </div>

          {/* Monto */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
              Monto ($) *
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '1.2rem',
                fontWeight: 800,
                outline: 'none'
              }}
            />
          </div>

          {/* Photo Attachment */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
              Foto (Opcional)
            </label>

            {photoUrl ? (
              <div style={{
                position: 'relative',
                width: '100%',
                height: '140px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: '#000'
              }}>
                <img 
                  src={photoUrl} 
                  alt="Adjunto" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(211, 47, 47, 0.9)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '12px',
                border: '2px dashed var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface-variant)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700
              }}>
                <Camera size={18} />
                <span>Adjuntar Foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }} 
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              className="md-btn md-btn-secondary"
              style={{ flex: 1, padding: '12px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`md-btn ${type === 'ingreso' ? 'md-btn-income' : 'md-btn-expense'}`}
              style={{ flex: 1, padding: '12px' }}
            >
              <CheckCircle2 size={18} />
              <span>Guardar</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
