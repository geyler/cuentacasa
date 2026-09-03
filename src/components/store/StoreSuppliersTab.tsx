'use client';

import React, { useState } from 'react';
import { SupplierAccount, StoreProduct, CurrencyType } from '@/types';
import { getStoreSales } from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { SupplierHistoryModal } from './SupplierHistoryModal';
import { Users, UserPlus, Trash2, DollarSign, Receipt, Coins, Eye } from 'lucide-react';

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
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [selectedHistorySupplier, setSelectedHistorySupplier] = useState<SupplierAccount | null>(null);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} color="var(--md-sys-color-primary)" />
            <span>Control Financiero de Proveedores (Consignación)</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
            Auditoría en tiempo real de mercancía en inventario, ventas por liquidar en CUP/USD, historial y liquidaciones.
          </p>
        </div>

        <button
          onClick={onOpenAddSupplierModal}
          className="md-btn md-btn-primary"
          style={{ padding: '9px 18px', fontSize: '0.85rem' }}
        >
          <UserPlus size={16} />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* Top Summary Metrics Bar (Dual Moneda) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        
        {/* Card 1: Stock en Consignación */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '16px',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
            📦 Mercancía Stock (Costo)
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
              ${totalUnsoldCUP.toLocaleString('es-ES')} CUP
            </strong>
            {totalUnsoldUSD > 0 && (
              <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F766E' }}>
                US$${totalUnsoldUSD.toLocaleString('es-ES')} USD
              </strong>
            )}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            {consignmentProds.reduce((s, p) => s + p.stock, 0)}u en inventario
          </span>
        </div>

        {/* Card 2: Deuda Retenida por Liquidar */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '16px',
          backgroundColor: 'var(--md-sys-color-expense-container)',
          border: '1px solid var(--md-sys-color-expense)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-expense)' }}>
            ⏳ Por Liquidar a Proveedores
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-expense)' }}>
              ${totalPendingDebtCUP.toLocaleString('es-ES')} CUP
            </strong>
            <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F766E' }}>
              US$${totalPendingDebtUSD.toLocaleString('es-ES')} USD
            </strong>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-expense)' }}>
            Ventas realizadas pendientes de pago
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
          gap: '4px',
          gridColumn: 'span 2'
        }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
            ✅ Total Ya Liquidado (Pagado a Proveedores)
          </span>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
              ${totalPaidCUP.toLocaleString('es-ES')} CUP
            </strong>
            <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F766E' }}>
              US$${totalPaidUSD.toLocaleString('es-ES')} USD
            </strong>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-income)' }}>
            Total acumulado entregado a proveedores en efectivo
          </span>
        </div>

      </div>

      {/* Supplier Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {suppliers.map(sup => {
          const supProds = products.filter(p => p.supplierType === 'proveedor' && p.supplierName?.toLowerCase() === sup.name.toLowerCase());
          const unsoldCUP = supProds.filter(p => p.currency !== 'USD').reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
          const unsoldUSD = supProds.filter(p => p.currency === 'USD').reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
          const totalStock = supProds.reduce((sum, p) => sum + p.stock, 0);

          const hasPendingDebt = sup.pendingPayout > 0 || (sup.pendingPayoutUSD || 0) > 0;

          // Historial de ventas de este proveedor
          const salesHistory = getStoreSales();
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

          salesHistory.forEach(sale => {
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

          const isExpanded = expandedSupplierId === sup.id;

          return (
            <div
              key={sup.id}
              style={{
                padding: '18px',
                borderRadius: '18px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {/* Card Title Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👤 {sup.name}</span>
                    <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                      {supProds.length} productos
                    </span>
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    ID Registro: #{sup.id.slice(-6)}
                  </span>
                </div>

                {!hasPendingDebt && (
                  <button
                    onClick={() => onDeleteSupplier(sup)}
                    title="Eliminar proveedor sin deuda"
                    style={{ border: 'none', background: 'none', color: 'var(--md-sys-color-expense)', cursor: 'pointer', padding: '6px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Financial Grid (4 Pills con soporte doble moneda) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                
                {/* Mercancía sin vender */}
                <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', fontWeight: 700 }}>
                    En Inventario (Sin Vender):
                  </span>
                  <strong style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', display: 'block' }}>
                    ${unsoldCUP.toLocaleString('es-ES')} CUP
                  </strong>
                  {unsoldUSD > 0 && (
                    <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F766E', display: 'block' }}>
                      US$${unsoldUSD.toLocaleString('es-ES')} USD
                    </strong>
                  )}
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
                    {totalStock} unidades en stock
                  </span>
                </div>

                {/* Por Liquidar */}
                <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-expense)', display: 'block', fontWeight: 700 }}>
                    Por Liquidar (Vendidas):
                  </span>
                  <strong style={{ fontSize: '1rem', fontWeight: 900, color: sup.pendingPayout > 0 ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                    ${sup.pendingPayout.toLocaleString('es-ES')} CUP
                  </strong>
                  <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: (sup.pendingPayoutUSD || 0) > 0 ? '#0F766E' : 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                    US$${(sup.pendingPayoutUSD || 0).toLocaleString('es-ES')} USD
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
                    Pendiente de entregar
                  </span>
                </div>

                {/* Ya Liquidado */}
                <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-income)', display: 'block', fontWeight: 700 }}>
                    Ya Liquidado (Pagado):
                  </span>
                  <strong style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--md-sys-color-income)', display: 'block' }}>
                    ${sup.totalPaid.toLocaleString('es-ES')} CUP
                  </strong>
                  <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F766E', display: 'block' }}>
                    US$${(sup.totalPaidUSD || 0).toLocaleString('es-ES')} USD
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
                    Pagos entregados
                  </span>
                </div>

                {/* Ganancia Tienda */}
                <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-primary)', display: 'block', fontWeight: 700 }}>
                    Ganancia para la Tienda:
                  </span>
                  <strong style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--md-sys-color-primary)', display: 'block' }}>
                    +${profitCUP.toLocaleString('es-ES')} CUP
                  </strong>
                  {profitUSD > 0 && (
                    <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F766E', display: 'block' }}>
                      +US$${profitUSD.toLocaleString('es-ES')} USD
                    </strong>
                  )}
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
                    Margen acumulado
                  </span>
                </div>

              </div>

              {/* Actions Bar: Liquidar Pago & Ver Movimientos Completo */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => onOpenPayoutModal(sup)}
                  disabled={!hasPendingDebt}
                  className="md-btn md-btn-primary"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    opacity: !hasPendingDebt ? 0.4 : 1,
                    cursor: !hasPendingDebt ? 'not-allowed' : 'pointer'
                  }}
                >
                  <DollarSign size={16} />
                  <span>
                    Liquidar Pago {!hasPendingDebt ? '(Sin deuda)' : `($${sup.pendingPayout} CUP / US$${sup.pendingPayoutUSD || 0} USD)`}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedHistorySupplier(sup)}
                  className="md-btn md-btn-secondary"
                  style={{
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    gap: '6px'
                  }}
                >
                  <Eye size={16} />
                  <span>Ver Movimientos ({supplierSalesItems.length})</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

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
