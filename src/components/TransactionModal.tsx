'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType } from '@/types';
import { X, CheckCircle2, Check, Keyboard, ArrowRight, Loader2 } from 'lucide-react';
import { AppInput } from '@/components/common/AppInput';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { getCurrencySettings } from '@/lib/storage';

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
  useLockBodyScroll(isOpen);

  const [type, setType] = useState<TransactionType>(initialType);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'CUP' | 'USD'>('CUP');
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
        setCurrency(editingTransaction.currency || 'CUP');
        setError('');
      } else {
        setType(initialType);
        setConcept('');
        setAmount('');
        setError('');
      }
      const { currencyMode } = getCurrencySettings();
      if (currencyMode === 'CUP') setCurrency('CUP');
      else if (currencyMode === 'USD') setCurrency('USD');
      setIsSaving(false);

      setFocusedField(null);
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

    setTimeout(() => {
      const { currencyMode } = getCurrencySettings();
      const finalCurrency = currencyMode === 'USD' ? 'USD' : (currencyMode === 'CUP' ? 'CUP' : currency);

      onSave({
        type,
        concept: trimmedConcept,
        category: type === 'ingreso' ? 'Ingreso General' : 'Gasto General',
        amount: parsedAmount,
        currency: finalCurrency,
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
      zIndex: 2000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0'
    }} className="no-print" onClick={() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setFocusedField(null);
      onClose();
    }}>
      
      <div 
        className="bottom-sheet-modal"
        onClick={e => {
          e.stopPropagation();
          const target = e.target as HTMLElement;
          if (target !== document.activeElement) {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            setFocusedField(null);
          }
        }}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
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

        {/* Currency Selector Toggle (CUP vs USD) */}
        {(() => {
          const { currencyMode } = getCurrencySettings();
          if (currencyMode !== 'BOTH') return null;

          return (
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
                onClick={() => setCurrency('CUP')}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  border: currency === 'CUP' ? '1px solid #FBCFE8' : 'none',
                  backgroundColor: currency === 'CUP' ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: currency === 'CUP' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer'
                }}
              >
                💵 CUP ($)
              </button>

              <button
                type="button"
                onClick={() => setCurrency('USD')}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  border: currency === 'USD' ? '1px solid #99F6E4' : 'none',
                  backgroundColor: currency === 'USD' ? '#0F766E' : 'transparent',
                  color: currency === 'USD' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer'
                }}
              >
                💲 USD (US$)
              </button>
            </div>
          );
        })()}

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
          <AppInput
            ref={conceptRef}
            label={`Detalle / Título del ${type === 'ingreso' ? 'Ingreso' : 'Gasto'} *`}
            placeholder={type === 'ingreso' ? 'Ej. Pago por webs, Venta de laptop...' : 'Ej. Pan, Arroz, Hamburguesa...'}
            value={concept}
            onChange={e => setConcept(e.target.value)}
            focusedField={focusedField}
            fieldName="concept"
            onFocus={() => setFocusedField('concept')}
            onNextField={() => {
              setFocusedField('amount');
              setTimeout(() => amountRef.current?.focus(), 50);
            }}
            minLength={3}
            maxLength={120}
            counterText={`${concept.length}/120`}
            required
            autoFocus
          />

          {/* Monto Input Field 2 */}
          <AppInput
            ref={amountRef}
            label="Monto *"
            unitSymbol={currency === 'USD' ? 'US$' : '$'}
            type="number"
            inputMode="decimal"
            pattern="[0-9]*"
            step="any"
            isNumeric
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            focusedField={focusedField}
            fieldName="amount"
            onFocus={() => setFocusedField('amount')}
            onDone={handleDismissKeyboard}
            required
          />

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
