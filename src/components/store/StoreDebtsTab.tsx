'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CustomerDebtRecord, CurrencyType } from '@/types';
import {
  getCustomerDebts,
  registerCustomerDebtPayment,
  deleteCustomerDebt,
  getCurrencySettings
} from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { formatRecordDateTime } from '@/lib/dateUtils';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Phone,
  Calendar,
  DollarSign,
  ArrowRight,
  X,
  CreditCard,
  Banknote,
  SendHorizontal
} from 'lucide-react';

interface StoreDebtsTabProps {
  onRefresh?: () => void;
}

export const StoreDebtsTab: React.FC<StoreDebtsTabProps> = ({ onRefresh }) => {
  const { showToast, confirmAction, showActionResult } = useActionFeedback();
  const [debts, setDebts] = useState<CustomerDebtRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'parcial' | 'pagado'>('pendiente');

  // Modal para abonar / liquidar deuda
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<CustomerDebtRecord | null>(null);
  const [payAmountCUP, setPayAmountCUP] = useState<string>('');
  const [payAmountUSD, setPayAmountUSD] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [payNotes, setPayNotes] = useState<string>('');

  const loadDebts = () => {
    setDebts(getCustomerDebts());
  };

  useEffect(() => {
    loadDebts();
    window.addEventListener('cuentacasa-db-changed', loadDebts);
    return () => window.removeEventListener('cuentacasa-db-changed', loadDebts);
  }, []);

  const { currencyMode, exchangeRateUSD } = getCurrencySettings();

  // Filtrado y estadísticas
  const filteredDebts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return debts.filter(d => {
      const matchQuery = !q || d.customerName.toLowerCase().includes(q) || (d.customerPhone && d.customerPhone.includes(q)) || (d.notes && d.notes.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'todos' || d.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [debts, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    let pendingCUP = 0;
    let pendingUSD = 0;
    let totalCollectedCUP = 0;
    let totalCollectedUSD = 0;
    let countPending = 0;

    debts.forEach(d => {
      const remCUP = Math.max(0, d.amountCUP - (d.paidCUP || 0));
      const remUSD = Math.max(0, d.amountUSD - (d.paidUSD || 0));
      if (d.status !== 'pagado') {
        pendingCUP += remCUP;
        pendingUSD += remUSD;
        countPending += 1;
      }
      totalCollectedCUP += (d.paidCUP || 0);
      totalCollectedUSD += (d.paidUSD || 0);
    });

    return {
      pendingCUP,
      pendingUSD,
      totalCollectedCUP,
      totalCollectedUSD,
      countPending
    };
  }, [debts]);

  const handleOpenPaymentModal = (debt: CustomerDebtRecord) => {
    setSelectedDebtForPayment(debt);
    const remCUP = Math.max(0, debt.amountCUP - (debt.paidCUP || 0));
    const remUSD = Math.max(0, debt.amountUSD - (debt.paidUSD || 0));
    setPayAmountCUP(remCUP > 0 ? remCUP.toString() : '');
    setPayAmountUSD(remUSD > 0 ? remUSD.toString() : '');
    setPayMethod(debt.debtTypeCUP === 'transferencia' ? 'transferencia' : 'efectivo');
    setPayNotes('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPayment) return;

    const valCUP = parseFloat(payAmountCUP) || 0;
    const valUSD = parseFloat(payAmountUSD) || 0;

    if (valCUP <= 0 && valUSD <= 0) {
      showToast({ title: 'Monto Inválido', message: 'Ingresa al menos un monto a abonar en CUP o USD.', type: 'warning' });
      return;
    }

    const success = registerCustomerDebtPayment(
      selectedDebtForPayment.id,
      valCUP,
      valUSD,
      payMethod,
      payNotes.trim()
    );

    if (success) {
      showToast({
        title: '¡Abono Registrado!',
        message: `Se registró el cobro a ${selectedDebtForPayment.customerName} por ${valCUP > 0 ? `$${valCUP} CUP ` : ''}${valUSD > 0 ? `US$${valUSD} USD ` : ''}(${payMethod === 'transferencia' ? 'Transferencia' : 'Efectivo'}).`,
        type: 'success'
      });
      loadDebts();
      if (onRefresh) onRefresh();
      setSelectedDebtForPayment(null);
    }
  };

  const handleDeleteDebt = (debt: CustomerDebtRecord) => {
    confirmAction({
      title: '¿Eliminar Registro de Fiado?',
      message: `Se eliminará el registro de deuda de ${debt.customerName}. Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar Fiado',
      onConfirm: () => {
        deleteCustomerDebt(debt.id);
        loadDebts();
        if (onRefresh) onRefresh();
        showToast({ title: 'Fiado Eliminado', message: 'El registro fue eliminado con éxito.', type: 'info' });
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Header con Métricas y Tarjetas de Cuentas por Cobrar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px'
      }}>
        <div style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderRadius: '16px',
          border: '1px solid var(--md-sys-color-outline-variant)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
            Total Adeudado por Clientes
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#DC2626' }}>
              ${stats.pendingCUP.toLocaleString('es-ES')} <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>CUP</span>
            </span>
            {stats.pendingUSD > 0 && (
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#B91C1C' }}>
                • US${stats.pendingUSD.toLocaleString('es-ES')} <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>USD</span>
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
            {stats.countPending} {stats.countPending === 1 ? 'cliente con deuda activa' : 'clientes con deuda activa'}
          </span>
        </div>

        <div style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderRadius: '16px',
          border: '1px solid var(--md-sys-color-outline-variant)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
            Total Cobrado / Liquidado
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16A34A' }}>
              ${stats.totalCollectedCUP.toLocaleString('es-ES')} <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>CUP</span>
            </span>
            {stats.totalCollectedUSD > 0 && (
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#15803D' }}>
                • US${stats.totalCollectedUSD.toLocaleString('es-ES')} <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>USD</span>
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
            Dinero recuperado ingresado a caja/banco
          </span>
        </div>
      </div>

      {/* 2. Filtros y Barra de Búsqueda */}
      <div style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderRadius: '16px',
        border: '1px solid var(--md-sys-color-outline-variant)',
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px' }}>
          <Search size={18} color="var(--md-sys-color-on-surface-variant)" />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono o nota..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              fontSize: '0.88rem',
              color: 'var(--md-sys-color-on-surface)',
              outline: 'none'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(['pendiente', 'parcial', 'pagado', 'todos'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                border: 'none',
                borderRadius: '9999px',
                padding: '5px 12px',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: statusFilter === tab ? 'var(--brand-primary, #1A73E8)' : 'var(--md-sys-color-surface)',
                color: statusFilter === tab ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                transition: 'all 0.15s ease'
              }}
            >
              {tab === 'pendiente' && 'Pendientes'}
              {tab === 'parcial' && 'Parciales'}
              {tab === 'pagado' && 'Pagados'}
              {tab === 'todos' && 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Listado de Fiados y Cuentas por Cobrar */}
      {filteredDebts.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderRadius: '16px',
          border: '1px dashed var(--md-sys-color-outline-variant)',
          padding: '40px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Users size={36} color="var(--md-sys-color-on-surface-variant)" style={{ opacity: 0.6 }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
            No hay registros de fiados en esta sección
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', maxWidth: '360px' }}>
            Al registrar una venta en el POS puedes asignar parte o el total a "Fiado / A Deber" para llevar el control bilateral exacto.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredDebts.map(debt => {
            const remCUP = Math.max(0, debt.amountCUP - (debt.paidCUP || 0));
            const remUSD = Math.max(0, debt.amountUSD - (debt.paidUSD || 0));
            const isCompleted = debt.status === 'pagado' || (remCUP === 0 && remUSD === 0);

            return (
              <div
                key={debt.id}
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  borderRadius: '16px',
                  border: isCompleted
                    ? '1px solid var(--md-sys-color-outline-variant)'
                    : '1.5px solid #FCA5A5',
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: 'var(--md-shadow-elevation-1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: isCompleted ? '#DCFCE7' : '#FEE2E2',
                      color: isCompleted ? '#16A34A' : '#DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1rem'
                    }}>
                      {debt.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 900, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
                        {debt.customerName}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={12} /> {formatRecordDateTime(debt.timestamp, debt.date)}
                        </span>
                        {debt.customerPhone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Phone size={12} /> {debt.customerPhone}
                          </span>
                        )}
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          backgroundColor: debt.debtTypeCUP === 'transferencia' ? '#EFF6FF' : '#F1F5F9',
                          color: debt.debtTypeCUP === 'transferencia' ? '#1E40AF' : '#475569'
                        }}>
                          {debt.debtTypeCUP === 'transferencia' ? '📲 Por Transferencia' : '💵 En Efectivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estado Badge */}
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    backgroundColor: isCompleted ? '#DCFCE7' : debt.status === 'parcial' ? '#FEF9C3' : '#FEE2E2',
                    color: isCompleted ? '#166534' : debt.status === 'parcial' ? '#854D0E' : '#991B1B'
                  }}>
                    {isCompleted ? '✓ Totalmente Pagado' : debt.status === 'parcial' ? '⏳ Abono Parcial' : '⚠️ Pendiente de Cobro'}
                  </span>
                </div>

                {/* Desglose de Montos */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Monto Original Fiado:
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                      {debt.amountCUP > 0 ? `$${debt.amountCUP.toLocaleString('es-ES')} CUP ` : ''}
                      {debt.amountUSD > 0 ? `US$${debt.amountUSD.toLocaleString('es-ES')} USD` : ''}
                    </span>
                  </div>

                  {(debt.paidCUP > 0 || debt.paidUSD > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16A34A' }}>
                        Ya Abonado:
                      </span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#16A34A' }}>
                        {debt.paidCUP > 0 ? `$${debt.paidCUP.toLocaleString('es-ES')} CUP ` : ''}
                        {debt.paidUSD > 0 ? `US$${debt.paidUSD.toLocaleString('es-ES')} USD` : ''}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isCompleted ? '#16A34A' : '#DC2626' }}>
                      {isCompleted ? 'Saldo Pendiente:' : 'Resta por Cobrar:'}
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: isCompleted ? '#16A34A' : '#DC2626' }}>
                      {isCompleted
                        ? '$0 CUP'
                        : `${remCUP > 0 ? `$${remCUP.toLocaleString('es-ES')} CUP ` : ''}${remUSD > 0 ? `US$${remUSD.toLocaleString('es-ES')} USD` : ''}`}
                    </span>
                  </div>
                </div>

                {debt.notes && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '0', fontStyle: 'italic' }}>
                    Nota: "{debt.notes}"
                  </p>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => handleOpenPaymentModal(debt)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '9999px',
                        border: 'none',
                        backgroundColor: 'var(--brand-primary, #1A73E8)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Banknote size={15} />
                      <span>Cobrar / Abonar Fiado</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteDebt(debt)}
                    title="Eliminar registro"
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--md-sys-color-on-surface-variant)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Abonar / Cobrar Fiado */}
      {selectedDebtForPayment && (
        <div
          className="modal-backdrop-responsive"
          onClick={() => setSelectedDebtForPayment(null)}
        >
          <form
            className="bottom-sheet-modal"
            onClick={e => e.stopPropagation()}
            onSubmit={handleConfirmPayment}
            style={{
              maxWidth: '520px',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
                  Abonar / Liquidar Fiado
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                  Cliente: <strong>{selectedDebtForPayment.customerName}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDebtForPayment(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Medio de Pago para este abono */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                ¿Cómo paga el cliente este abono?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPayMethod('efectivo')}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: payMethod === 'efectivo' ? '2px solid var(--brand-primary, #1A73E8)' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: payMethod === 'efectivo' ? 'var(--brand-primary-light, #EFF6FF)' : 'var(--md-sys-color-surface)',
                    color: payMethod === 'efectivo' ? 'var(--brand-primary-dark, #1E3A8A)' : 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Banknote size={16} />
                  <span>Efectivo en Caja</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('transferencia')}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: payMethod === 'transferencia' ? '2px solid #2563EB' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: payMethod === 'transferencia' ? '#EFF6FF' : 'var(--md-sys-color-surface)',
                    color: payMethod === 'transferencia' ? '#1E40AF' : 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <SendHorizontal size={16} />
                  <span>Transferencia Bancaria</span>
                </button>
              </div>
            </div>

            {/* Campos de Montos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                  Abono en CUP ($)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="0.00"
                  value={payAmountCUP}
                  onChange={e => setPayAmountCUP(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: '0.92rem',
                    fontWeight: 800
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                  Abono en USD (US$)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="0.00"
                  value={payAmountUSD}
                  onChange={e => setPayAmountUSD(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: '0.92rem',
                    fontWeight: 800
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                Observaciones / Referencia (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Transferencia confirmada por EnZona #12345"
                value={payNotes}
                onChange={e => setPayNotes(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.84rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setSelectedDebtForPayment(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '9999px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'transparent',
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  flex: 1.5,
                  padding: '12px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'var(--brand-primary, #1A73E8)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={18} />
                <span>Registrar Cobro</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

