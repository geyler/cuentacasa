'use client';

import React from 'react';
import { Transaction } from '@/types';
import { formatCurrency, isTransactionEditable, getRemainingEditableTime } from '@/lib/invoice';
import { X, Calendar, Clock, Tag, DollarSign, Edit3, Trash2, ShieldCheck, AlertCircle, Store, Home, Info } from 'lucide-react';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  currency?: string;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onEdit,
  onDelete,
  currency = '$'
}) => {
  useLockBodyScroll(!!transaction);
  if (!transaction) return null;


  const editable = isTransactionEditable(transaction.createdAt);
  const remainingTime = getRemainingEditableTime(transaction.createdAt);

  const formattedDate = new Date(transaction.createdAt || transaction.date).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const isStoreRelated = transaction.category.includes('Tienda') || (transaction.notes && transaction.notes.includes('Tienda'));

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.70)',
      backdropFilter: 'blur(8px)',
      zIndex: 2200,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0'
    }} className="no-print" onClick={onClose}>

      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--md-sys-color-surface)',
          padding: '24px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'modalPop 0.25s cubic-bezier(0.1, 0.9, 0.2, 1)'
        }}
      >
        {/* MD3 Bottom-Sheet Top Drag Handle */}
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 8px auto' }} />

        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              backgroundColor: transaction.type === 'ingreso' 
                ? (isStoreRelated ? 'rgba(0, 99, 155, 0.15)' : 'rgba(0, 135, 90, 0.15)')
                : 'rgba(186, 26, 26, 0.15)',
              color: transaction.type === 'ingreso' 
                ? (isStoreRelated ? 'var(--md-sys-color-primary)' : '#00875A')
                : 'var(--md-sys-color-expense)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isStoreRelated ? <Store size={22} /> : (transaction.type === 'ingreso' ? <DollarSign size={22} /> : <Home size={22} />)}
            </div>
            <div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isStoreRelated ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)'
              }}>
                {isStoreRelated ? 'Transacción de Tienda' : 'Movimiento de Casa'}
              </span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                Detalles del Movimiento
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--md-sys-color-on-surface-variant)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Amount Card Showcase */}
        <div style={{
          backgroundColor: transaction.type === 'ingreso' ? 'rgba(0, 135, 90, 0.08)' : 'rgba(186, 26, 26, 0.08)',
          borderRadius: '20px',
          padding: '20px',
          textAlign: 'center',
          border: `1px solid ${transaction.type === 'ingreso' ? 'rgba(0, 135, 90, 0.2)' : 'rgba(186, 26, 26, 0.2)'}`
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
            MONTO REGISTRADO (ENTERO)
          </span>
          <div style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            color: transaction.type === 'ingreso' ? '#00875A' : 'var(--md-sys-color-expense)',
            margin: '4px 0'
          }}>
            {transaction.type === 'ingreso' ? '+' : '-'}{formatCurrency(transaction.amount, currency, true)}
          </div>
          <span style={{
            display: 'inline-block',
            backgroundColor: transaction.type === 'ingreso' ? '#00875A' : 'var(--md-sys-color-expense)',
            color: '#FFFFFF',
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '3px 12px',
            borderRadius: '9999px',
            textTransform: 'uppercase'
          }}>
            {transaction.type === 'ingreso' ? 'INGRESO' : 'GASTO'}
          </span>
        </div>

        {/* Detail List Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Concept */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Tag size={18} style={{ color: 'var(--md-sys-color-primary)', marginTop: '2px' }} />
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                CONCEPTO DE OPERACIÓN
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                {transaction.concept}
              </span>
            </div>
          </div>

          {/* Category */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Info size={18} style={{ color: 'var(--md-sys-color-primary)', marginTop: '2px' }} />
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                CATEGORÍA ASIGNADA
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                {transaction.category}
              </span>
            </div>
          </div>

          {/* Exact Timestamp */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Clock size={18} style={{ color: 'var(--md-sys-color-primary)', marginTop: '2px' }} />
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                FECHA Y HORA DE REGISTRO
              </span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Explicit Notes / Explanation */}
          <div style={{
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: '16px',
            padding: '14px 16px'
          }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
              EXPLICACIÓN / MOTIVO DE ORIGEN
            </span>
            <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface)', lineHeight: '1.5', margin: 0 }}>
              {transaction.notes || `Movimiento de ${transaction.type} registrado en la categoría "${transaction.category}" el ${transaction.date}.`}
            </p>
          </div>

          {/* Editable status timer banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: editable ? 'rgba(0, 135, 90, 0.1)' : 'var(--md-sys-color-surface-container-high)',
            color: editable ? '#00875A' : 'var(--md-sys-color-on-surface-variant)'
          }}>
            {editable ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
            <span>
              {editable 
                ? `Disponible para editar o eliminar (Tiempo restante: ${remainingTime})`
                : 'Registro consolidado (Ventana de modificación de 5 min finalizada)'}
            </span>
          </div>

        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {editable && onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
              className="md-btn md-btn-secondary"
              style={{ flex: 1, padding: '12px' }}
            >
              <Edit3 size={18} />
              <span>Editar</span>
            </button>
          )}

          {editable && onDelete && (
            <button
              onClick={() => {
                onClose();
                onDelete(transaction.id);
              }}
              className="md-btn"
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'var(--md-sys-color-expense)',
                color: '#FFF'
              }}
            >
              <Trash2 size={18} />
              <span>Eliminar</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="md-btn md-btn-primary"
            style={{ flex: 2, padding: '12px' }}
          >
            <span>Cerrar</span>
          </button>
        </div>

      </div>

    </div>
  );
};
