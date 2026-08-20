'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType } from '@/types';
import { X, CheckCircle2, Check, Keyboard, ArrowRight, Loader2 } from 'lucide-react';

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
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Active focused field state
  const [focusedField, setFocusedField] = useState<'concept' | 'amount' | null>(null);

  const conceptRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setConcept(editingTransaction.concept);
        setAmount(editingTransaction.amount.toString());
        setError('');
      } else {
        setType(initialType);
        setConcept('');
        setAmount('');
        setError('');
      }
      setIsSaving(false);

      // Auto-focus first input on open
      setFocusedField('concept');
      const timer = setTimeout(() => {
        conceptRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setFocusedField(null);
      setIsSaving(false);
    }
  }, [editingTransaction, initialType, isOpen]);

  // Global window keydown listener: Submit form on Enter key ONLY when NO input is focused
  useEffect(() => {
    if (!isOpen || isSaving) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && focusedField === null) {
        e.preventDefault();
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedField, isSaving]);

  if (!isOpen) return null;

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

    setIsSaving(true);

    // Auto-generate date in background (ISO YYYY-MM-DD)
    const currentDate = new Date().toISOString().split('T')[0];
    const categoryName = type === 'ingreso' ? 'Ingreso' : 'Gasto';

    setTimeout(() => {
      onSave({
        type,
        concept: trimmedConcept,
        category: categoryName,
        amount: parsedAmount,
        date: editingTransaction ? editingTransaction.date : currentDate,
        notes: ''
      });
      setIsSaving(false);
      onClose();
    }, 250);
  };

  const isFocused = focusedField !== null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.70)',
      backdropFilter: 'blur(8px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0'
    }} className="no-print" onClick={onClose}>
      
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px',
          width: '100%',
          maxWidth: '480px',
          padding: '14px 24px 28px 24px',
          boxShadow: 'var(--md-shadow-elevation-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        {/* Saving Loader Overlay */}
        {isSaving && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderRadius: '28px 28px 0 0',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: '#FFF'
          }}>
            <Loader2 size={36} className="animate-spin" color="var(--md-sys-color-primary)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>Guardando transacción...</span>
          </div>
        )}

        {/* Material Design Drag Handle */}
        <div style={{
          width: '36px',
          height: '4px',
          borderRadius: '9999px',
          backgroundColor: 'var(--md-sys-color-outline-variant)',
          margin: '0 auto 4px auto',
          opacity: 0.8
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: isFocused ? 0.6 : 1,
          transition: 'opacity 0.2s ease'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {editingTransaction ? 'Editar' : 'Registrar'} {type === 'ingreso' ? 'Ingreso' : 'Gasto'}
          </h2>
          <button 
            onClick={onClose}
            title="Cerrar"
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
          opacity: isFocused ? 0.6 : 1,
          transition: 'opacity 0.2s ease'
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

        <form 
          ref={formRef} 
          onSubmit={handleSubmit}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (focusedField !== null) {
                e.preventDefault();
                e.stopPropagation();
                if (focusedField === 'concept') {
                  setFocusedField('amount');
                  setTimeout(() => amountRef.current?.focus(), 50);
                } else if (focusedField === 'amount') {
                  amountRef.current?.blur();
                  setFocusedField(null);
                }
              }
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          
          {/* Detalle / Titulo Input Field 1 */}
          <div style={{
            opacity: focusedField !== null && focusedField !== 'concept' ? 0.4 : 1,
            transition: 'opacity 0.2s ease'
          }}>
            
            {focusedField === 'concept' ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Keyboard size={14} /> Detalle del {type === 'ingreso' ? 'Ingreso' : 'Gasto'}
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
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <span>Siguiente</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
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
                  e.stopPropagation();
                  setFocusedField('amount');
                  setTimeout(() => amountRef.current?.focus(), 50);
                }
              }}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: focusedField === 'concept' 
                  ? '2px solid var(--md-sys-color-primary)' 
                  : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '1rem',
                fontWeight: 600,
                outline: 'none',
                boxShadow: focusedField === 'concept'
                  ? '0 0 0 4px rgba(0, 99, 155, 0.25)'
                  : 'none',
                transition: 'all 0.2s ease'
              }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', marginTop: '2px' }}>
              {concept.length}/120
            </div>
          </div>

          {/* Monto Input Field 2 (LAST INPUT) */}
          <div style={{
            opacity: focusedField !== null && focusedField !== 'amount' ? 0.4 : 1,
            transition: 'opacity 0.2s ease'
          }}>
            
            {focusedField === 'amount' ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Keyboard size={14} /> Monto ($)
                </span>
                <button
                  type="button"
                  onClick={handleDismissKeyboard}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Check size={13} />
                  <span>Listo</span>
                </button>
              </div>
            ) : (
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
                  e.stopPropagation();
                  // Stop form submit, remove focus from active input so no input is selected
                  amountRef.current?.blur();
                  setFocusedField(null);
                }
              }}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: focusedField === 'amount' 
                  ? '2px solid var(--md-sys-color-primary)' 
                  : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '1.25rem',
                fontWeight: 800,
                outline: 'none',
                boxShadow: focusedField === 'amount'
                  ? '0 0 0 4px rgba(0, 99, 155, 0.25)'
                  : 'none',
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          {/* Full Width Single Action Button */}
          <div style={{
            marginTop: '6px',
            opacity: isFocused ? 0.6 : 1,
            transition: 'opacity 0.2s ease'
          }}>
            <button
              type="submit"
              disabled={isSaving}
              className={`md-btn ${type === 'ingreso' ? 'md-btn-income' : 'md-btn-expense'}`}
              style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
