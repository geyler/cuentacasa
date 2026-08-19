'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType } from '@/types';
import { fileToBase64 } from '@/lib/storage';
import { X, Camera, Trash2, CheckCircle2, Check, Keyboard, ArrowRight } from 'lucide-react';

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
  
  // Spotlight Focus state for active keyboard input
  const [focusedField, setFocusedField] = useState<'concept' | 'amount' | null>(null);

  const conceptRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
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

      // Auto-focus first input & activate spotlight blur immediately on open!
      setFocusedField('concept');
      const timer = setTimeout(() => {
        conceptRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    } else {
      setFocusedField(null);
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

  const handleDismissKeyboard = () => {
    if (typeof document !== 'undefined' && document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
    setFocusedField(null);
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

  const isFocused = focusedField !== null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: isFocused ? 'rgba(0, 0, 0, 0.88)' : 'rgba(0, 0, 0, 0.65)',
      backdropFilter: isFocused ? 'blur(10px)' : 'blur(4px)',
      zIndex: 110,
      display: 'flex',
      alignItems: isFocused ? 'flex-start' : 'center',
      justifyContent: 'center',
      padding: isFocused ? '16px 16px 0 16px' : '16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }} className="no-print" onClick={isFocused ? handleDismissKeyboard : onClose}>
      
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          boxShadow: isFocused ? '0 20px 50px rgba(0,0,0,0.8)' : 'var(--md-shadow-elevation-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginTop: isFocused ? '10px' : '0'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: isFocused ? 0.3 : 1,
          filter: isFocused ? 'blur(1px)' : 'none',
          transition: 'all 0.3s ease'
        }}>
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
          borderRadius: '14px',
          opacity: isFocused ? 0.3 : 1,
          filter: isFocused ? 'blur(1px)' : 'none',
          pointerEvents: isFocused ? 'none' : 'auto',
          transition: 'all 0.3s ease'
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
          
          {/* Detalle / Titulo (Spotlight Input Field 1) */}
          <div style={{
            position: 'relative',
            zIndex: focusedField === 'concept' ? 100 : 1,
            transform: focusedField === 'concept' ? 'scale(1.04)' : 'scale(1)',
            opacity: focusedField !== null && focusedField !== 'concept' ? 0.2 : 1,
            filter: focusedField !== null && focusedField !== 'concept' ? 'blur(3px)' : 'none',
            pointerEvents: focusedField !== null && focusedField !== 'concept' ? 'none' : 'auto',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            
            {/* Top Toolbar when focused */}
            {focusedField === 'concept' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
                animation: 'fadeIn 0.2s ease'
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Keyboard size={14} /> Foco Total: Detalle del {type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFocusedField('amount');
                    setTimeout(() => amountRef.current?.focus(), 50);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: 'var(--md-shadow-elevation-2)'
                  }}
                >
                  <span>Siguiente (Monto)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {focusedField !== 'concept' && (
              <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                Detalle / Título * (3 a 120 caracteres)
              </label>
            )}

            <input
              ref={conceptRef}
              type="text"
              minLength={3}
              maxLength={120}
              placeholder={type === 'ingreso' ? 'Ej. Pago por webs, Venta de laptop...' : 'Ej. Pan, Arroz, Hamburguesa...'}
              value={concept}
              onChange={e => setConcept(e.target.value)}
              onFocus={() => setFocusedField('concept')}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setFocusedField('amount');
                  setTimeout(() => amountRef.current?.focus(), 50);
                }
              }}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: focusedField === 'concept' 
                  ? '2px solid var(--md-sys-color-primary)' 
                  : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: focusedField === 'concept'
                  ? 'var(--md-sys-color-surface-container)'
                  : 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '1.05rem',
                fontWeight: 700,
                outline: 'none',
                boxShadow: focusedField === 'concept'
                  ? '0 0 0 6px rgba(0, 99, 155, 0.3), 0 10px 30px rgba(0,0,0,0.5)'
                  : 'none',
                transition: 'all 0.25s ease'
              }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', marginTop: '2px' }}>
              {concept.length}/120
            </div>
          </div>

          {/* Monto (Spotlight Input Field 2 - LAST INPUT) */}
          <div style={{
            position: 'relative',
            zIndex: focusedField === 'amount' ? 100 : 1,
            transform: focusedField === 'amount' ? 'scale(1.04)' : 'scale(1)',
            opacity: focusedField !== null && focusedField !== 'amount' ? 0.2 : 1,
            filter: focusedField !== null && focusedField !== 'amount' ? 'blur(3px)' : 'none',
            pointerEvents: focusedField !== null && focusedField !== 'amount' ? 'none' : 'auto',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            
            {/* Top Toolbar when focused */}
            {focusedField === 'amount' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
                animation: 'fadeIn 0.2s ease'
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Keyboard size={14} /> Foco Total: Monto ($)
                </span>
                <button
                  type="button"
                  onClick={handleDismissKeyboard}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: 'var(--md-shadow-elevation-2)'
                  }}
                >
                  <Check size={14} />
                  <span>Aceptar y Desdifuminar</span>
                </button>
              </div>
            )}

            {focusedField !== 'amount' && (
              <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                Monto ($) *
              </label>
            )}

            <input
              ref={amountRef}
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onFocus={() => setFocusedField('amount')}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Stop form submit, accept input value, remove spotlight blur overlay!
                  amountRef.current?.blur();
                  setFocusedField(null);
                }
              }}
              required
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: focusedField === 'amount' 
                  ? '2px solid var(--md-sys-color-primary)' 
                  : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: focusedField === 'amount'
                  ? 'var(--md-sys-color-surface-container)'
                  : 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '1.35rem',
                fontWeight: 800,
                outline: 'none',
                boxShadow: focusedField === 'amount'
                  ? '0 0 0 6px rgba(0, 99, 155, 0.3), 0 10px 30px rgba(0,0,0,0.5)'
                  : 'none',
                transition: 'all 0.25s ease'
              }}
            />
          </div>

          {/* Photo Attachment */}
          <div style={{
            opacity: isFocused ? 0.2 : 1,
            filter: isFocused ? 'blur(3px)' : 'none',
            pointerEvents: isFocused ? 'none' : 'auto',
            transition: 'all 0.3s ease'
          }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
              Foto (Opcional)
            </label>

            {photoUrl ? (
              <div style={{
                position: 'relative',
                width: '100%',
                height: '120px',
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
                padding: '10px',
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
          <div style={{
            display: 'flex',
            gap: '10px',
            marginTop: '6px',
            opacity: isFocused ? 0.2 : 1,
            filter: isFocused ? 'blur(3px)' : 'none',
            pointerEvents: isFocused ? 'none' : 'auto',
            transition: 'all 0.3s ease'
          }}>
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
