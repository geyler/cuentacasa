'use client';

import React, { useState } from 'react';
import { SupplierAccount, StoreProduct } from '@/types';
import { getStoreSales } from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { Users, UserPlus, Trash2, DollarSign, Receipt } from 'lucide-react';

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

  const consignmentProds = products.filter(p => p.supplierType === 'proveedor');
  const totalUnsoldNet = consignmentProds.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
  const totalPendingDebt = suppliers.reduce((sum, s) => sum + s.pendingPayout, 0);
  const totalPaidAll = suppliers.reduce((sum, s) => sum + s.totalPaid, 0);

  return (
    <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} color="var(--md-sys-color-primary)" />
            <span>Control Financiero de Proveedores (Consignación)</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
            Auditoría en tiempo real de mercancía en inventario, ventas por liquidar, historial de pagos y liquidaciones a proveedores.
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

      {/* Top Summary Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
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
            📦 Mercancía Stock
          </span>
          <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
            {formatCurrency(totalUnsoldNet, currency, true)}
          </strong>
          <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            {consignmentProds.reduce((s, p) => s + p.stock, 0)}u en inventario
          </span>
        </div>

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
            ⏳ Por Liquidar
          </span>
          <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-expense)' }}>
            {formatCurrency(totalPendingDebt, currency, true)}
          </strong>
          <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-expense)' }}>
            Ventas pendientes
          </span>
        </div>

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
          <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
            {formatCurrency(totalPaidAll, currency, true)}
          </strong>
          <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-income)' }}>
            Entregado en efectivo a proveedores
          </span>
        </div>
      </div>

      {/* Supplier Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {suppliers.map(sup => {
          const supProds = products.filter(p => p.supplierType === 'proveedor' && p.supplierName?.toLowerCase() === sup.name.toLowerCase());
          const unsoldNet = supProds.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
          const totalStock = supProds.reduce((sum, p) => sum + p.stock, 0);

          // Gather sales history for this supplier
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
          }[] = [];

          salesHistory.forEach(sale => {
            sale.items.forEach(item => {
              if (item.supplierType === 'proveedor' && item.supplierName?.toLowerCase() === sup.name.toLowerCase()) {
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
                  profit: totalItemPrice - totalItemCost
                });
              }
            });
          });

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

                {sup.pendingPayout <= 0 && (
                  <button
                    onClick={() => onDeleteSupplier(sup)}
                    title="Eliminar proveedor sin deuda"
                    style={{ border: 'none', background: 'none', color: 'var(--md-sys-color-expense)', cursor: 'pointer', padding: '6px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Financial Grid (4 Pills in 2x2 Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                
                <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', fontWeight: 700 }}>
                    En Inventario (Sin Vender):
                  </span>
                  <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                    {formatCurrency(unsoldNet, currency, true)}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                    {totalStock} unidades en stock
                  </span>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-expense)', display: 'block', fontWeight: 700 }}>
                    Por Liquidar (Vendidas):
                  </span>
                  <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: sup.pendingPayout > 0 ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-income)' }}>
                    {formatCurrency(sup.pendingPayout, currency, true)}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                    Pendiente de pagar
                  </span>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-income)', display: 'block', fontWeight: 700 }}>
                    Ya Liquidado (Pagado):
                  </span>
                  <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                    {formatCurrency(sup.totalPaid, currency, true)}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                    Pagos realizados
                  </span>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-primary)', display: 'block', fontWeight: 700 }}>
                    Ganancia para la Tienda:
                  </span>
                  <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
                    {formatCurrency(supplierSalesItems.reduce((s, i) => s + i.profit, 0), currency, true)}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                    Margen acumulado
                  </span>
                </div>

              </div>

              {/* Actions Bar: Liquidar Pago & Ver Historial de Ventas */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => onOpenPayoutModal(sup)}
                  disabled={sup.pendingPayout <= 0}
                  className="md-btn md-btn-primary"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    opacity: sup.pendingPayout <= 0 ? 0.4 : 1,
                    cursor: sup.pendingPayout <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <DollarSign size={16} />
                  <span>Liquidar Pago (${sup.pendingPayout})</span>
                </button>

                <button
                  onClick={() => setExpandedSupplierId(isExpanded ? null : sup.id)}
                  className="md-btn md-btn-secondary"
                  style={{
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    gap: '6px'
                  }}
                >
                  <Receipt size={16} />
                  <span>{isExpanded ? 'Ocultar Historial' : `Historial Ventas (${supplierSalesItems.length})`}</span>
                </button>
              </div>

              {/* Expanded Sales History Table for this Supplier */}
              {isExpanded && (
                <div style={{
                  marginTop: '8px',
                  padding: '14px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Receipt size={16} color="var(--md-sys-color-primary)" />
                    <span>Historial Detallado de Ventas de {sup.name}</span>
                  </h5>

                  {supplierSalesItems.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', margin: 0 }}>
                      Aún no se han registrado ventas de productos pertenecientes a {sup.name}.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                      {supplierSalesItems.map((item, idx) => (
                        <div
                          key={`${item.saleId}-${idx}`}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--md-sys-color-surface-container)',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.8rem'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                              {item.name} <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)' }}>(#{item.barcode})</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {new Date(item.timestamp).toLocaleString('es-ES')} | Cantidad: <strong>{item.quantity}u</strong>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 800, color: 'var(--md-sys-color-expense)' }}>
                              A Proveedor: {formatCurrency(item.totalCost, currency, true)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-income)' }}>
                              Venta Total: {formatCurrency(item.totalPrice, currency, true)} (Ganancia: +${item.profit})
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
