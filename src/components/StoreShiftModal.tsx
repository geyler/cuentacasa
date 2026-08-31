'use client';

import React, { useState, useEffect } from 'react';
import { StoreShiftRecord, AppUser, ShiftInventorySnapshot } from '@/types';
import { 
  getActiveShift, 
  getStoreShifts, 
  openStoreShift, 
  acceptShiftOpening, 
  closeStoreShift, 
  getAppUsers, 
  getLoggedInUser, 
  getStoreProducts 
} from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { AppInput } from '@/components/common/AppInput';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { 
  Clock, 
  UserCheck, 
  DollarSign, 
  Package, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  History, 
  Plus, 
  Check, 
  ArrowRight,
  Sparkles,
  Lock,
  FileSpreadsheet
} from 'lucide-react';

interface StoreShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
}

export const StoreShiftModal: React.FC<StoreShiftModalProps> = ({
  isOpen,
  onClose,
  currency = '$'
}) => {
  useLockBodyScroll(isOpen);
  const { showToast, confirmAction } = useActionFeedback();

  const currentUser = getLoggedInUser();
  const isOwnerOrAdmin = currentUser?.role === 'propietario' || currentUser?.role === 'administrador';

  const [activeShift, setActiveShift] = useState<StoreShiftRecord | null>(null);
  const [shiftHistory, setShiftHistory] = useState<StoreShiftRecord[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'ipv'>('current');

  // Form States for Opening Shift
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [initialCashFund, setInitialCashFund] = useState<string>('');
  const [openingNotes, setOpeningNotes] = useState<string>('');

  // Form States for Closing Shift (Arqueo)
  const [isClosingMode, setIsClosingMode] = useState<boolean>(false);
  const [realCashInput, setRealCashInput] = useState<string>('');
  const [realStockInputs, setRealStockInputs] = useState<Record<string, string>>({});
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const reloadData = () => {
    const shift = getActiveShift();
    const history = getStoreShifts();
    const appUsers = getAppUsers();

    setActiveShift(shift);
    setShiftHistory(history);
    setUsers(appUsers);

    if (!selectedSellerId && appUsers.length > 0) {
      const defaultSeller = appUsers.find(u => u.role === 'vendedor') || appUsers[0];
      setSelectedSellerId(defaultSeller.id);
    }

    if (shift) {
      setRealCashInput(shift.expectedCashInRegister.toString());
      const initialStockMap: Record<string, string> = {};
      shift.inventorySnapshots.forEach(snap => {
        initialStockMap[snap.productId] = snap.expectedFinalStock.toString();
      });
      setRealStockInputs(initialStockMap);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadData();
      setIsClosingMode(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Opening a New Shift
  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSellerId) {
      showToast({ title: 'Selecciona Vendedor', message: 'Debes asignar un vendedor para el turno.', type: 'warning' });
      return;
    }

    try {
      const cash = parseFloat(initialCashFund) || 0;
      const newShift = openStoreShift(selectedSellerId, cash, openingNotes);
      reloadData();
      showToast({
        title: '¡Turno Iniciado!',
        message: `Turno asignado a ${newShift.sellerName} con fondo de caja de ${formatCurrency(cash, currency, true)}.`,
        type: 'success'
      });
    } catch (err: any) {
      showToast({ title: 'Error al abrir turno', message: err.message, type: 'error' });
    }
  };

  // Handle Seller Accepting Shift Handover
  const handleAcceptOpening = () => {
    if (!activeShift) return;
    try {
      acceptShiftOpening(activeShift.id);
      reloadData();
      showToast({ title: 'Turno Aceptado', message: 'Has asumido la responsabilidad del inventario y dinero en caja.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Handle Finalizing Shift Closing (Arqueo)
  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    confirmAction({
      title: '¿Confirmar Arqueo y Cerrar Turno?',
      message: `Se registrará el conteo físico final y la firma bilateral de entrega de cuentas para ${activeShift.sellerName}.`,
      confirmText: 'Cerrar Turno Definitivamente',
      variant: 'danger',
      onConfirm: () => {
        try {
          const cashReal = parseFloat(realCashInput) || 0;
          const stockCounts: Record<string, number> = {};
          Object.keys(realStockInputs).forEach(pid => {
            stockCounts[pid] = parseFloat(realStockInputs[pid]) || 0;
          });

          closeStoreShift(activeShift.id, cashReal, stockCounts, closingNotes);
          reloadData();
          setIsClosingMode(false);
          onClose();
          showToast({ title: '¡Turno Cerrado Con Éxito!', message: 'El arqueo de caja e inventario ha sido guardado e inmutabilizado.', type: 'success' });
        } catch (err: any) {
          showToast({ title: 'Error en cierre', message: err.message, type: 'error' });
        }
      }
    });
  };

  const isSellerOfShift = currentUser?.id === activeShift?.sellerId;

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
    }} className="no-print" onClick={onClose}>
      
      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '540px',
          padding: '20px 24px 28px 24px',
          borderRadius: '28px 28px 0 0',
          boxShadow: 'var(--md-shadow-elevation-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Drag Handle */}
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto' }} />

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Turnos e IPV (Informe de Ventas)</h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Arqueo de caja e Informe de Productos y Ventas (IPV)
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface)', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', backgroundColor: 'var(--md-sys-color-surface)', padding: '4px', borderRadius: '12px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('current'); setIsClosingMode(false); }}
            style={{
              padding: '8px 4px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'current' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'current' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer'
            }}
          >
            Turno Actual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ipv')}
            style={{
              padding: '8px 4px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'ipv' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'ipv' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer'
            }}
          >
            Ver IPV del Día
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 4px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'history' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'history' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer'
            }}
          >
            Historial Turnos
          </button>
        </div>

        {/* TAB 1: CURRENT SHIFT MONITORING & ACTIONS */}
        {activeTab === 'current' && (
          <>
            {/* SCENARIO A: NO ACTIVE SHIFT */}
            {!activeShift && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', textAlign: 'center' }}>
                  <AlertCircle size={32} color="var(--md-sys-color-outline)" style={{ margin: '0 auto 8px auto' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 4px 0' }}>No hay Turno Abierto</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
                    Al iniciar un turno se registrará el stock de mercancía actual y el dinero entregado para vueltos en caja.
                  </p>
                </div>

                {isOwnerOrAdmin ? (
                  <form onSubmit={handleOpenShift} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                        Seleccionar Vendedor a Cargo
                      </label>
                      <select
                        value={selectedSellerId}
                        onChange={e => setSelectedSellerId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '12px',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          backgroundColor: 'var(--md-sys-color-surface)',
                          color: 'var(--md-sys-color-on-surface)',
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} (@{u.username}) - Rol: {u.role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <AppInput
                      label="Fondo de Caja Entregado (Efectivo para Vueltos)"
                      fieldName="initialCashFund"
                      type="number"
                      focusedField={focusedField}
                      value={initialCashFund}
                      onChange={e => setInitialCashFund(e.target.value)}
                      onFocus={() => setFocusedField('initialCashFund')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Ej. 2000"
                    />

                    <AppInput
                      label="Observaciones o Notas de Entrega"
                      fieldName="openingNotes"
                      focusedField={focusedField}
                      value={openingNotes}
                      onChange={e => setOpeningNotes(e.target.value)}
                      onFocus={() => setFocusedField('openingNotes')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Ej. Entregado con cambio de 100 y 200 CUP"
                    />

                    <button type="submit" className="md-btn md-btn-primary" style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 800, width: '100%', marginTop: '6px' }}>
                      <Plus size={18} />
                      <span>Iniciar Turno y Entregar Mercancía</span>
                    </button>
                  </form>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', textAlign: 'center' }}>
                    Contacta a un administrador para realizar la apertura de turno e inicio de caja.
                  </p>
                )}
              </div>
            )}

            {/* SCENARIO B: ACTIVE SHIFT EXISTS */}
            {activeShift && !isClosingMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Pending Handover Acceptance Banner */}
                {activeShift.status === 'apertura_pendiente' && (
                  <div style={{ padding: '14px', borderRadius: '16px', backgroundColor: '#FEF3C7', border: '1.5px solid #F59E0B', color: '#92400E' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '0.9rem' }}>
                      <ShieldAlert size={20} />
                      <span>Apertura de Turno Pendiente de Confirmación</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', marginTop: '4px', marginBottom: '10px' }}>
                      El usuario <strong>{activeShift.openedByName}</strong> ha iniciado un turno a nombre de <strong>{activeShift.sellerName}</strong> con <strong>{formatCurrency(activeShift.initialCashFund, currency, true)}</strong> en efectivo.
                    </p>

                    {(isSellerOfShift || isOwnerOrAdmin) && (
                      <button
                        onClick={handleAcceptOpening}
                        className="md-btn md-btn-primary"
                        style={{ width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: 800 }}
                      >
                        <Check size={16} />
                        <span>Aceptar y Asumir Custodia de Caja y Stock</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Live Shift Financial Card */}
                <div style={{ padding: '16px', borderRadius: '20px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: '10px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>Vendedor Responsable</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{activeShift.sellerName}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-primary)', backgroundColor: 'var(--md-sys-color-primary-container)', padding: '1px 6px', borderRadius: '4px' }}>
                          @{activeShift.sellerUsername}
                        </span>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.7rem', fontWeight: 900, backgroundColor: activeShift.status === 'activo' ? '#DCFCE7' : '#FEF3C7', color: activeShift.status === 'activo' ? '#15803D' : '#B45309', padding: '4px 10px', borderRadius: '8px' }}>
                      {activeShift.status === 'activo' ? '🟢 EN CURSO' : '⏳ PENDIENTE'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>Fondo Inicial (Vueltos)</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                        {formatCurrency(activeShift.initialCashFund, 'CUP', true)}
                        {(activeShift.initialCashFundUSD || 0) > 0 && (
                          <span style={{ fontSize: '0.82rem', color: '#059669', display: 'block' }}>
                            {formatCurrency(activeShift.initialCashFundUSD || 0, 'USD', true)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>Ventas Efectivo</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>
                        +{formatCurrency(activeShift.totalCashSales, 'CUP', true)}
                        {(activeShift.totalCashSalesUSD || 0) > 0 && (
                          <span style={{ fontSize: '0.82rem', color: '#059669', display: 'block' }}>
                            +{formatCurrency(activeShift.totalCashSalesUSD || 0, 'USD', true)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ gridColumn: 'span 2', backgroundColor: 'var(--md-sys-color-surface-container-high)', padding: '10px 12px', borderRadius: '12px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>Debe Haber en Caja (Efectivo Esperado):</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
                            {formatCurrency(activeShift.expectedCashInRegister, 'CUP', true)}
                          </div>
                          {(activeShift.expectedCashInRegisterUSD || 0) > 0 && (
                            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#059669' }}>
                              {formatCurrency(activeShift.expectedCashInRegisterUSD || 0, 'USD', true)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Audit Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
                      Control de Mercancía en Custodia
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                      {activeShift.inventorySnapshots.length} productos
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                    {activeShift.inventorySnapshots.map(snap => (
                      <div key={snap.productId} style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <div>
                          <div style={{ fontWeight: 800 }}>{snap.productName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Inicial: {snap.initialStock} | Reposición: +{snap.addedStock}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
                            Esperado: {snap.expectedFinalStock} u
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Vendidas por vendedor: {snap.soldByShiftUser} u
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trigger Closing / Arqueo Button */}
                <button
                  onClick={() => setIsClosingMode(true)}
                  className="md-btn md-btn-primary"
                  style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 800, width: '100%', marginTop: '6px' }}
                >
                  <FileSpreadsheet size={18} />
                  <span>Realizar Arqueo y Cerrar Turno</span>
                </button>
              </div>
            )}

            {/* SCENARIO C: CLOSING / ARQUEO FORM MODE */}
            {activeShift && isClosingMode && (
              <form onSubmit={handleCloseShiftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>Formulario de Arqueo y Cierre</h4>
                  <button type="button" onClick={() => setIsClosingMode(false)} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-primary)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                    Volver a Resumen
                  </button>
                </div>

                {/* Cash Balance Count */}
                <div style={{ padding: '14px', borderRadius: '16px', backgroundColor: 'var(--md-sys-color-surface)', border: '1.5px solid var(--md-sys-color-primary)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--md-sys-color-primary)', display: 'block', marginBottom: '6px' }}>
                    1. Arqueo de Dinero en Caja
                  </span>
                  
                  <div style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '8px' }}>
                    Efectivo Esperado según ventas: <strong>{formatCurrency(activeShift.expectedCashInRegister, currency, true)}</strong>
                  </div>

                  <AppInput
                    label="Efectivo Físico Entregado por Vendedor"
                    fieldName="realCashInput"
                    type="number"
                    focusedField={focusedField}
                    value={realCashInput}
                    onChange={e => setRealCashInput(e.target.value)}
                    onFocus={() => setFocusedField('realCashInput')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Monto real contado..."
                  />

                  {realCashInput !== '' && (
                    <div style={{ marginTop: '8px', fontSize: '0.82rem', fontWeight: 900, color: (parseFloat(realCashInput) - activeShift.expectedCashInRegister) >= 0 ? '#059669' : '#DC2626' }}>
                      {(parseFloat(realCashInput) - activeShift.expectedCashInRegister) === 0 ? (
                        '✅ Cuadre de caja exacto'
                      ) : (parseFloat(realCashInput) - activeShift.expectedCashInRegister) > 0 ? (
                        `➕ Sobrante en caja: ${formatCurrency(parseFloat(realCashInput) - activeShift.expectedCashInRegister, currency, true)}`
                      ) : (
                        `⚠️ Faltante en caja: ${formatCurrency(parseFloat(realCashInput) - activeShift.expectedCashInRegister, currency, true)}`
                      )}
                    </div>
                  )}
                </div>

                {/* Physical Stock Conteo */}
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                    2. Conteo Físico de Mercancía Remanente
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {activeShift.inventorySnapshots.map(snap => (
                      <div key={snap.productId} style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {snap.productName}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Esperado: {snap.expectedFinalStock} u
                          </div>
                        </div>

                        <div style={{ width: '100px' }}>
                          <input
                            type="number"
                            value={realStockInputs[snap.productId] || ''}
                            onChange={e => setRealStockInputs({ ...realStockInputs, [snap.productId]: e.target.value })}
                            placeholder="Conteo..."
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1px solid var(--md-sys-color-outline-variant)',
                              backgroundColor: 'var(--md-sys-color-surface-container)',
                              color: 'var(--md-sys-color-on-surface)',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              textAlign: 'center'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <AppInput
                  label="Notas o Observaciones Finales del Cierre"
                  fieldName="closingNotes"
                  focusedField={focusedField}
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  onFocus={() => setFocusedField('closingNotes')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Detalles sobre faltantes o aclaraciones de caja..."
                />

                <button type="submit" className="md-btn md-btn-primary" style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 900, width: '100%', marginTop: '6px' }}>
                  <CheckCircle2 size={18} />
                  <span>Firmar y Confirmar Cierre Bilateral</span>
                </button>
              </form>
            )}
          </>
        )}

        {/* TAB 2: HISTORIAL DE TURNOS ANTERIORES */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
            {shiftHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--md-sys-color-outline)', fontSize: '0.85rem', padding: '20px 0' }}>
                No hay turnos registrados en el historial.
              </p>
            ) : (
              shiftHistory.map(s => (
                <div key={s.id} style={{ padding: '14px', borderRadius: '16px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 900 }}>Vendedor: {s.sellerName} (@{s.sellerUsername})</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Apertura: {new Date(s.openedAt).toLocaleString()}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', backgroundColor: s.status === 'cerrado' ? '#E2E8F0' : '#DCFCE7', color: s.status === 'cerrado' ? '#475569' : '#15803D' }}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '0.75rem', backgroundColor: 'var(--md-sys-color-surface-container)', padding: '8px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Efectivo Resp.</div>
                      <div style={{ fontWeight: 800 }}>{formatCurrency(s.expectedCashInRegister, currency, true)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Entregado</div>
                      <div style={{ fontWeight: 800 }}>{formatCurrency(s.realCashInRegister || 0, currency, true)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Diferencia</div>
                      <div style={{ fontWeight: 900, color: (s.cashDifference || 0) >= 0 ? '#059669' : '#DC2626' }}>
                        {formatCurrency(s.cashDifference || 0, currency, true)}
                      </div>
                    </div>
                  </div>

                  {s.notes && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}>
                      📝 {s.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: IPV (INFORME DE PRODUCTOS Y VENTAS) DEL DÍA - ESTILO TICKET COMPACTO */}
        {activeTab === 'ipv' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto' }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: '14px 12px',
              borderRadius: '12px',
              border: '1.5px solid #CBD5E1',
              fontFamily: 'monospace, sans-serif',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              {/* Header del Ticket IPV */}
              <div style={{ textAlign: 'center', borderBottom: '1.5px dashed #0F172A', paddingBottom: '10px', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 900, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#0F172A' }}>
                  === INFORME IPV (PRODUCTOS Y VENTAS) ===
                </h3>
                <p style={{ fontSize: '0.66rem', color: '#475569', margin: '4px 0 0 0', fontWeight: 700 }}>
                  SAMY STORE • {new Date().toLocaleDateString('es-CU')} • {activeShift ? `Vendedor: ${activeShift.sellerName} (@${activeShift.sellerUsername})` : 'Arqueo General'}
                </p>
                <div className="no-print" style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      borderRadius: '6px',
                      border: '1px solid #0F172A',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FileSpreadsheet size={13} />
                    <span>Imprimir Ticket IPV</span>
                  </button>
                </div>
              </div>

              {/* Tabla de Productos Compacta Estilo Ticket */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem', textAlign: 'left', fontFamily: 'monospace' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1.5px solid #0F172A' }}>
                      <th style={{ padding: '5px 4px', fontWeight: 900 }}>Producto</th>
                      <th style={{ padding: '5px 2px', fontWeight: 900, textAlign: 'center' }}>Ini</th>
                      <th style={{ padding: '5px 2px', fontWeight: 900, textAlign: 'center' }}>Alt</th>
                      <th style={{ padding: '5px 2px', fontWeight: 900, textAlign: 'center' }}>Resp</th>
                      <th style={{ padding: '5px 2px', fontWeight: 900, textAlign: 'center' }}>Vend</th>
                      <th style={{ padding: '5px 2px', fontWeight: 900, textAlign: 'center' }}>Saldo</th>
                      <th style={{ padding: '5px 4px', fontWeight: 900, textAlign: 'right' }}>Precio</th>
                      <th style={{ padding: '5px 4px', fontWeight: 900, textAlign: 'right' }}>Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const storeProds = getStoreProducts();
                      const snapshots = activeShift?.inventorySnapshots || [];

                      const rows = storeProds.map(prod => {
                        const snap = snapshots.find(s => s.productId === prod.id);
                        const initialStock = snap ? snap.initialStock : prod.stock;
                        const addedStock = snap ? snap.addedStock : 0;
                        const totalToRespond = initialStock + addedStock;
                        const sold = snap ? snap.soldByShiftUser : 0;
                        const finalStock = snap ? snap.expectedFinalStock : prod.stock;
                        const price = prod.price;
                        const totalImporte = sold * price;

                        return {
                          id: prod.id,
                          name: prod.name,
                          barcode: prod.barcode,
                          initialStock,
                          addedStock,
                          totalToRespond,
                          sold,
                          finalStock,
                          price,
                          totalImporte
                        };
                      });

                      const totalUnidadesVendidas = rows.reduce((acc, r) => acc + r.sold, 0);
                      const totalImporteGeneral = rows.reduce((acc, r) => acc + r.totalImporte, 0);

                      return (
                        <>
                          {rows.map((r, idx) => (
                            <tr key={r.id} style={{ borderBottom: '1px dashed #E2E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                              <td style={{ padding: '4px 4px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }} title={r.name}>
                                #{r.barcode} {r.name}
                              </td>
                              <td style={{ padding: '4px 2px', textAlign: 'center' }}>{r.initialStock}</td>
                              <td style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 700 }}>+{r.addedStock}</td>
                              <td style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 800 }}>{r.totalToRespond}</td>
                              <td style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 900, color: r.sold > 0 ? '#0F172A' : '#94A3B8' }}>{r.sold}</td>
                              <td style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 800 }}>{r.finalStock}</td>
                              <td style={{ padding: '4px 4px', textAlign: 'right' }}>${r.price}</td>
                              <td style={{ padding: '4px 4px', textAlign: 'right', fontWeight: 900 }}>
                                ${r.totalImporte.toLocaleString()}
                              </td>
                            </tr>
                          ))}

                          {/* Fila Totales Ticket */}
                          <tr style={{ backgroundColor: '#F1F5F9', borderTop: '2px solid #0F172A', borderBottom: '2px solid #0F172A', fontWeight: 900 }}>
                            <td colSpan={4} style={{ padding: '6px 4px', fontSize: '0.68rem', color: '#0F172A' }}>
                              TOTALES DEL INFORME (IPV)
                            </td>
                            <td style={{ padding: '6px 2px', textAlign: 'center', fontSize: '0.7rem', color: '#0F172A' }}>
                              {totalUnidadesVendidas}u
                            </td>
                            <td style={{ padding: '6px 2px' }}></td>
                            <td style={{ padding: '6px 2px' }}></td>
                            <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: '0.74rem', color: '#0F172A' }}>
                              ${totalImporteGeneral.toLocaleString()} {currency}
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Firmas Bilaterales Ticket Style */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '20px', paddingTop: '12px', borderTop: '1.5px dashed #0F172A' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '24px', borderBottom: '1px solid #0F172A', marginBottom: '4px' }} />
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>Firma Vendedor (Entregó)</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '24px', borderBottom: '1px solid #0F172A', marginBottom: '4px' }} />
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>Firma Admin (Recibió)</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
