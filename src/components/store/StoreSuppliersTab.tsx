'use client';

import React, { useState, useMemo } from 'react';
import { SupplierAccount, StoreProduct, CurrencyType } from '@/types';
import { getStoreSales } from '@/lib/storage';
import { SupplierHistoryModal } from './SupplierHistoryModal';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  DollarSign, 
  Receipt, 
  Coins, 
  Eye, 
  Search, 
  Clock, 
  CheckCircle2, 
  Package, 
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';

interface StoreSuppliersTabProps {
  suppliers: SupplierAccount[];
  products: StoreProduct[];
  currency?: string;
  onOpenAddSupplierModal: () => void;
  onOpenPayoutModal: (supplier: SupplierAccount) => void;
  onDeleteSupplier: (supplier: SupplierAccount) => void;
}

export const StoreSuppliersTab: React.FC<StoreSuppliersTabProps> = ({
  suppliers,
  products,
  currency = '$',
  onOpenAddSupplierModal,
  onOpenPayoutModal,
  onDeleteSupplier
}) => {
  const [selectedHistorySupplier, setSelectedHistorySupplier] = useState<SupplierAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('all');

  const consignmentProds = products.filter(p => p.supplierType === 'proveedor');
  
  // Stock por moneda
  const totalUnsoldCUP = consignmentProds
    .filter(p => p.currency !== 'USD')
    .reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
  const totalUnsoldUSD = consignmentProds
    .filter(p => p.currency === 'USD')
    .reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);

  // Deuda pendiente acumulada por moneda
  const totalPendingDebtCUP = suppliers.reduce((sum, s) => sum + s.pendingPayout, 0);
  const totalPendingDebtUSD = suppliers.reduce((sum, s) => sum + (s.pendingPayoutUSD || 0), 0);

  // Total pagado acumulado por moneda
  const totalPaidCUP = suppliers.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalPaidUSD = suppliers.reduce((sum, s) => sum + (s.totalPaidUSD || 0), 0);

  // Conteo para los filtros
  const countWithDebt = suppliers.filter(s => s.pendingPayout > 0 || (s.pendingPayoutUSD || 0) > 0).length;
  const countSettled = suppliers.length - countWithDebt;

  // Formateadores seguros con agrupación de miles para millones de CUP
  const formatAmountCUP = (amount: number) => `$${new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(amount)} CUP`;
  const formatAmountUSD = (amount: number) => `US$ ${new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(amount)} USD`;

  // Reducción adaptativa de fuente para números grandes
  const getAdaptiveSize = (text: string, base: string = '1.05rem', small: string = '0.92rem', xsmall: string = '0.82rem') => {
    if (text.length > 18) return xsmall;
    if (text.length > 14) return small;
    return base;
  };

  // Filtrado de proveedores
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(sup => {
      const matchesSearch = sup.name.toLowerCase().includes(searchTerm.toLowerCase());
      const hasDebt = sup.pendingPayout > 0 || (sup.pendingPayoutUSD || 0) > 0;
      if (statusFilter === 'pending') return matchesSearch && hasDebt;
      if (statusFilter === 'settled') return matchesSearch && !hasDebt;
      return matchesSearch;
    });
  }, [suppliers, searchTerm, statusFilter]);

  // Pre-computar historial de ventas por proveedor para rendimiento
  const allSales = useMemo(() => getStoreSales(), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
            <Users size={22} color="var(--md-sys-color-primary)" />
            <span>Control Financiero de Proveedores (Consignación)</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '3px 0 0 0' }}>
            Control de mercancía en inventario, ventas por liquidar en CUP/USD y balance histórico.
          </p>
        </div>

        <button
          onClick={onOpenAddSupplierModal}
          className="md-btn md-btn-primary"
          style={{ padding: '9px 18px', fontSize: '0.85rem', fontWeight: 800 }}
        >
          <UserPlus size={16} />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* Top Summary Metrics Bar (Dual Moneda y soporte para cifras millonarias) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
        
        {/* Card 1: Stock en Consignación */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '16px',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
                📦 Mercancía Stock (Costo)
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
                {consignmentProds.reduce((s, p) => s + p.stock, 0)} u
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <strong 
                className="tabular-nums" 
                style={{ 
                  fontSize: getAdaptiveSize(formatAmountCUP(totalUnsoldCUP), '1.15rem', '1rem', '0.88rem'), 
                  fontWeight: 900, 
                  color: 'var(--md-sys-color-primary)',
                  letterSpacing: '-0.02em',
                  wordBreak: 'break-word'
                }}
              >
                {formatAmountCUP(totalUnsoldCUP)}
              </strong>
              {totalUnsoldUSD > 0 && (
                <strong 
                  className="tabular-nums" 
                  style={{ 
                    fontSize: getAdaptiveSize(formatAmountUSD(totalUnsoldUSD), '0.95rem', '0.85rem', '0.75rem'), 
                    fontWeight: 800, 
                    color: 'var(--brand-secondary-dark, #115E59)',
                    wordBreak: 'break-word'
                  }}
                >
                  {formatAmountUSD(totalUnsoldUSD)}
                </strong>
              )}
            </div>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
            Valor de reposición en inventario
          </span>
        </div>

        {/* Card 2: Deuda Retenida por Liquidar */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '16px',
          backgroundColor: totalPendingDebtCUP > 0 || totalPendingDebtUSD > 0 ? 'var(--md-sys-color-expense-container)' : 'var(--md-sys-color-surface-container)',
          border: totalPendingDebtCUP > 0 || totalPendingDebtUSD > 0 ? '1px solid var(--md-sys-color-expense)' : '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: totalPendingDebtCUP > 0 || totalPendingDebtUSD > 0 ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-on-surface-variant)' }}>
                ⏳ Por Liquidar (Vendido)
              </span>
              <Clock size={14} color={totalPendingDebtCUP > 0 || totalPendingDebtUSD > 0 ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-outline)'} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <strong 
                className="tabular-nums" 
                style={{ 
                  fontSize: getAdaptiveSize(formatAmountCUP(totalPendingDebtCUP), '1.15rem', '1rem', '0.88rem'), 
                  fontWeight: 900, 
                  color: totalPendingDebtCUP > 0 ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-on-surface-variant)',
                  letterSpacing: '-0.02em',
                  wordBreak: 'break-word'
                }}
              >
                {formatAmountCUP(totalPendingDebtCUP)}
              </strong>
              {totalPendingDebtUSD > 0 && (
                <strong 
                  className="tabular-nums" 
                  style={{ 
                    fontSize: getAdaptiveSize(formatAmountUSD(totalPendingDebtUSD), '0.95rem', '0.85rem', '0.75rem'), 
                    fontWeight: 800, 
                    color: 'var(--brand-secondary-dark, #115E59)',
                    wordBreak: 'break-word'
                  }}
                >
                  {formatAmountUSD(totalPendingDebtUSD)}
                </strong>
              )}
            </div>
          </div>
          <span style={{ fontSize: '0.68rem', color: totalPendingDebtCUP > 0 || totalPendingDebtUSD > 0 ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
            {countWithDebt} {countWithDebt === 1 ? 'proveedor con balance pendiente' : 'proveedores con balance pendiente'}
          </span>
        </div>

        {/* Card 3: Total Ya Liquidado */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '16px',
          backgroundColor: 'var(--md-sys-color-income-container)',
          border: '1px solid var(--md-sys-color-income)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                ✅ Total Ya Liquidado (Histórico)
              </span>
              <CheckCircle2 size={14} color="var(--md-sys-color-income)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <strong 
                className="tabular-nums" 
                style={{ 
                  fontSize: getAdaptiveSize(formatAmountCUP(totalPaidCUP), '1.15rem', '1rem', '0.88rem'), 
                  fontWeight: 900, 
                  color: 'var(--md-sys-color-income)',
                  letterSpacing: '-0.02em',
                  wordBreak: 'break-word'
                }}
              >
                {formatAmountCUP(totalPaidCUP)}
              </strong>
              {totalPaidUSD > 0 && (
                <strong 
                  className="tabular-nums" 
                  style={{ 
                    fontSize: getAdaptiveSize(formatAmountUSD(totalPaidUSD), '0.95rem', '0.85rem', '0.75rem'), 
                    fontWeight: 800, 
                    color: 'var(--brand-secondary-dark, #115E59)',
                    wordBreak: 'break-word'
                  }}
                >
                  {formatAmountUSD(totalPaidUSD)}
                </strong>
              )}
            </div>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-income)', marginTop: '4px' }}>
            Pagos acumulados entregados a proveedores
          </span>
        </div>

      </div>

      {/* Control Bar: Buscador Instantáneo y Filtros de Estado */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Input de Búsqueda */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-sys-color-on-surface-variant)' }} />
            <input
              type="text"
              placeholder="Buscar proveedor por nombre..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="app-input"
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            />
          </div>

          {/* Filtros por Píldoras */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: statusFilter === 'all' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
                color: statusFilter === 'all' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                fontSize: '0.74rem',
                fontWeight: statusFilter === 'all' ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Todos ({suppliers.length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: statusFilter === 'pending' ? 'var(--md-sys-color-expense-container)' : 'var(--md-sys-color-surface-container)',
                color: statusFilter === 'pending' ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-on-surface-variant)',
                fontSize: '0.74rem',
                fontWeight: statusFilter === 'pending' ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Con Deuda ({countWithDebt})
            </button>

            <button
              onClick={() => setStatusFilter('settled')}
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: statusFilter === 'settled' ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-surface-container)',
                color: statusFilter === 'settled' ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-on-surface-variant)',
                fontSize: '0.74rem',
                fontWeight: statusFilter === 'settled' ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Al Día ({countSettled})
            </button>
          </div>

        </div>
      </div>

      {/* Supplier Cards List */}
      {filteredSuppliers.length === 0 ? (
        <div className="md-card" style={{ padding: '36px 16px', textAlign: 'center', backgroundColor: 'var(--md-sys-color-surface-container)' }}>
          <Users size={36} style={{ color: 'var(--md-sys-color-outline)', margin: '0 auto 8px auto' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', margin: '0 0 4px 0' }}>
            {searchTerm || statusFilter !== 'all' ? 'No se encontraron proveedores con ese filtro' : 'No hay proveedores registrados'}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '0 0 12px 0' }}>
            {searchTerm || statusFilter !== 'all' 
              ? 'Prueba modificando el texto de búsqueda o el filtro seleccionado.' 
              : 'Agrega a tus proveedores para gestionar mercancía en consignación, deudas y liquidaciones.'}
          </p>
          {(searchTerm || statusFilter !== 'all') ? (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              className="md-btn md-btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.78rem', margin: '0 auto' }}
            >
              Limpiar Filtros
            </button>
          ) : (
            <button
              onClick={onOpenAddSupplierModal}
              className="md-btn md-btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', margin: '0 auto' }}
            >
              <UserPlus size={15} />
              <span>Registrar Primer Proveedor</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredSuppliers.map(sup => {
            const supProds = products.filter(p => p.supplierType === 'proveedor' && p.supplierName?.toLowerCase() === sup.name.toLowerCase());
            const unsoldCUP = supProds.filter(p => p.currency !== 'USD').reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
            const unsoldUSD = supProds.filter(p => p.currency === 'USD').reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
            const totalStock = supProds.reduce((sum, p) => sum + p.stock, 0);

            const hasPendingDebt = sup.pendingPayout > 0 || (sup.pendingPayoutUSD || 0) > 0;

            // Historial de ventas de este proveedor
            const supplierSalesItems: {
              saleId: string;
              timestamp: number;
              barcode: string;
              name: string;
              quantity: number;
              costPrice: number;
              price: number;
              totalCost: number;
              totalPrice: number;
              profit: number;
              currency: CurrencyType;
            }[] = [];

            allSales.forEach(sale => {
              sale.items.forEach(item => {
                if (item.supplierType === 'proveedor' && item.supplierName?.toLowerCase() === sup.name.toLowerCase()) {
                  const itemCurr: CurrencyType = item.currency || sale.currency || 'CUP';
                  const totalItemCost = item.costPrice * item.quantity;
                  const totalItemPrice = item.subtotal || (item.unitPrice * item.quantity);
                  supplierSalesItems.push({
                    saleId: sale.id,
                    timestamp: sale.timestamp,
                    barcode: item.barcode,
                    name: item.name,
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                    price: item.unitPrice,
                    totalCost: totalItemCost,
                    totalPrice: totalItemPrice,
                    profit: totalItemPrice - totalItemCost,
                    currency: itemCurr
                  });
                }
              });
            });

            const profitCUP = supplierSalesItems.filter(i => i.currency !== 'USD').reduce((s, i) => s + i.profit, 0);
            const profitUSD = supplierSalesItems.filter(i => i.currency === 'USD').reduce((s, i) => s + i.profit, 0);

            const formattedPendingCUP = formatAmountCUP(sup.pendingPayout);
            const formattedPendingUSD = sup.pendingPayoutUSD ? formatAmountUSD(sup.pendingPayoutUSD) : '';

            return (
              <div
                key={sup.id}
                style={{
                  padding: '16px',
                  borderRadius: '18px',
                  border: hasPendingDebt ? '1px solid var(--brand-primary-border, #BFDBFE)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: hasPendingDebt ? '0 2px 8px rgba(0,0,0,0.04)' : undefined
                }}
              >
                {/* Card Title Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '12px',
                      backgroundColor: hasPendingDebt ? 'var(--md-sys-color-expense-container)' : 'var(--md-sys-color-surface)',
                      color: hasPendingDebt ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      {sup.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{sup.name}</span>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          backgroundColor: 'var(--md-sys-color-surface)', 
                          color: 'var(--md-sys-color-on-surface-variant)', 
                          padding: '1px 8px', 
                          borderRadius: '8px', 
                          fontWeight: 800,
                          border: '1px solid var(--md-sys-color-outline-variant)'
                        }}>
                          {supProds.length} {supProds.length === 1 ? 'producto' : 'productos'}
                        </span>
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        ID #{sup.id.slice(-6)} • {totalStock} u en stock
                      </span>
                    </div>
                  </div>

                  {!hasPendingDebt && (
                    <button
                      onClick={() => onDeleteSupplier(sup)}
                      title="Eliminar proveedor sin deuda"
                      style={{ 
                        border: 'none', 
                        background: 'var(--md-sys-color-surface)', 
                        color: 'var(--md-sys-color-expense)', 
                        cursor: 'pointer', 
                        padding: '6px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Financial Grid (4 Pills con soporte doble moneda y ajuste adaptativo) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                  
                  {/* Mercancía sin vender */}
                  <div style={{ padding: '8px 10px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', minWidth: 0 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', fontWeight: 700 }}>
                      En Inventario:
                    </span>
                    <strong 
                      className="tabular-nums" 
                      style={{ 
                        fontSize: getAdaptiveSize(formatAmountCUP(unsoldCUP), '0.98rem', '0.88rem', '0.78rem'), 
                        fontWeight: 900, 
                        color: 'var(--md-sys-color-on-surface)', 
                        display: 'block',
                        wordBreak: 'break-word',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {formatAmountCUP(unsoldCUP)}
                    </strong>
                    {unsoldUSD > 0 && (
                      <strong 
                        className="tabular-nums" 
                        style={{ 
                          fontSize: getAdaptiveSize(formatAmountUSD(unsoldUSD), '0.86rem', '0.78rem', '0.7rem'), 
                          fontWeight: 800, 
                          color: 'var(--brand-secondary-dark, #115E59)', 
                          display: 'block',
                          wordBreak: 'break-word'
                        }}
                      >
                        {formatAmountUSD(unsoldUSD)}
                      </strong>
                    )}
                    <span style={{ fontSize: '0.66rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
                      {totalStock} u sin vender
                    </span>
                  </div>

                  {/* Por Liquidar */}
                  <div style={{ 
                    padding: '8px 10px', 
                    borderRadius: '12px', 
                    backgroundColor: hasPendingDebt ? 'rgba(220, 38, 38, 0.05)' : 'var(--md-sys-color-surface)', 
                    border: hasPendingDebt ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid var(--md-sys-color-outline-variant)', 
                    minWidth: 0 
                  }}>
                    <span style={{ fontSize: '0.68rem', color: sup.pendingPayout > 0 || (sup.pendingPayoutUSD || 0) > 0 ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-on-surface-variant)', display: 'block', fontWeight: 800 }}>
                      Por Liquidar:
                    </span>
                    <strong 
                      className="tabular-nums" 
                      style={{ 
                        fontSize: getAdaptiveSize(formattedPendingCUP, '0.98rem', '0.88rem', '0.78rem'), 
                        fontWeight: 900, 
                        color: sup.pendingPayout > 0 ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-on-surface-variant)', 
                        display: 'block',
                        wordBreak: 'break-word',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {formattedPendingCUP}
                    </strong>
                    {(sup.pendingPayoutUSD || 0) > 0 && (
                      <strong 
                        className="tabular-nums" 
                        style={{ 
                          fontSize: getAdaptiveSize(formattedPendingUSD, '0.86rem', '0.78rem', '0.7rem'), 
                          fontWeight: 800, 
                          color: 'var(--brand-secondary-dark, #115E59)', 
                          display: 'block',
                          wordBreak: 'break-word'
                        }}
                      >
                        {formattedPendingUSD}
                      </strong>
                    )}
                    <span style={{ fontSize: '0.66rem', color: hasPendingDebt ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
                      {hasPendingDebt ? 'Pendiente de entregar' : 'Al día'}
                    </span>
                  </div>

                  {/* Ya Liquidado */}
                  <div style={{ padding: '8px 10px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', minWidth: 0 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-income)', display: 'block', fontWeight: 700 }}>
                      Ya Liquidado:
                    </span>
                    <strong 
                      className="tabular-nums" 
                      style={{ 
                        fontSize: getAdaptiveSize(formatAmountCUP(sup.totalPaid), '0.98rem', '0.88rem', '0.78rem'), 
                        fontWeight: 900, 
                        color: 'var(--md-sys-color-income)', 
                        display: 'block',
                        wordBreak: 'break-word',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {formatAmountCUP(sup.totalPaid)}
                    </strong>
                    {(sup.totalPaidUSD || 0) > 0 && (
                      <strong 
                        className="tabular-nums" 
                        style={{ 
                          fontSize: getAdaptiveSize(formatAmountUSD(sup.totalPaidUSD || 0), '0.86rem', '0.78rem', '0.7rem'), 
                          fontWeight: 800, 
                          color: 'var(--brand-secondary-dark, #115E59)', 
                          display: 'block',
                          wordBreak: 'break-word'
                        }}
                      >
                        {formatAmountUSD(sup.totalPaidUSD || 0)}
                      </strong>
                    )}
                    <span style={{ fontSize: '0.66rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
                      Pagos efectuados
                    </span>
                  </div>

                  {/* Ganancia Tienda */}
                  <div style={{ padding: '8px 10px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', minWidth: 0 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-primary)', display: 'block', fontWeight: 700 }}>
                      Ganancia Tienda:
                    </span>
                    <strong 
                      className="tabular-nums" 
                      style={{ 
                        fontSize: getAdaptiveSize(formatAmountCUP(profitCUP), '0.98rem', '0.88rem', '0.78rem'), 
                        fontWeight: 900, 
                        color: 'var(--md-sys-color-primary)', 
                        display: 'block',
                        wordBreak: 'break-word',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      +{formatAmountCUP(profitCUP)}
                    </strong>
                    {profitUSD > 0 && (
                      <strong 
                        className="tabular-nums" 
                        style={{ 
                          fontSize: getAdaptiveSize(formatAmountUSD(profitUSD), '0.86rem', '0.78rem', '0.7rem'), 
                          fontWeight: 800, 
                          color: 'var(--brand-secondary-dark, #115E59)', 
                          display: 'block',
                          wordBreak: 'break-word'
                        }}
                      >
                        +{formatAmountUSD(profitUSD)}
                      </strong>
                    )}
                    <span style={{ fontSize: '0.66rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
                      Margen obtenido
                    </span>
                  </div>

                </div>

                {/* Actions Bar: Liquidar Pago & Ver Movimientos Completo */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                  <button
                    onClick={() => onOpenPayoutModal(sup)}
                    disabled={!hasPendingDebt}
                    className="md-btn md-btn-primary"
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      padding: '10px 14px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      opacity: !hasPendingDebt ? 0.45 : 1,
                      cursor: !hasPendingDebt ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <DollarSign size={16} />
                    <span>
                      Liquidar Pago {!hasPendingDebt ? '(Al Día)' : `(${formatAmountCUP(sup.pendingPayout)}${sup.pendingPayoutUSD ? ` / ${formatAmountUSD(sup.pendingPayoutUSD)}` : ''})`}
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedHistorySupplier(sup)}
                    className="md-btn md-btn-secondary"
                    style={{
                      padding: '10px 14px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Eye size={16} />
                    <span>Movimientos ({supplierSalesItems.length})</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Full-Screen Supplier History Modal */}
      <SupplierHistoryModal
        supplier={selectedHistorySupplier}
        products={products}
        currency={currency}
        onClose={() => setSelectedHistorySupplier(null)}
      />

    </div>
  );
};
