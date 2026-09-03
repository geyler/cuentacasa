'use client';

import React, { useState } from 'react';
import { SupplierAccount, StoreProduct } from '@/types';
import { getStoreSales, getRawDatabase } from '@/lib/storage';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { ReceiptTicketView } from '@/components/common/ReceiptTicketView';
import { X, Package, Receipt, DollarSign, Calendar, ArrowDownRight, Tag } from 'lucide-react';

interface SupplierHistoryModalProps {
  supplier: SupplierAccount | null;
  products: StoreProduct[];
  currency?: string;
  onClose: () => void;
}

export const SupplierHistoryModal: React.FC<SupplierHistoryModalProps> = ({
  supplier,
  products,
  currency = '$',
  onClose
}) => {
  useLockBodyScroll(!!supplier);
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'payouts'>('inventory');

  if (!supplier) return null;

  const rawDb = getRawDatabase();
  const salesRecords = getStoreSales();

  // Products belonging to this supplier
  const supplierProducts = products.filter(p => p.supplierName?.toLowerCase() === supplier.name.toLowerCase());

  // Sales containing products from this supplier
  const supplierSales: { sale: any; item: any }[] = [];
  salesRecords.forEach(sale => {
    sale.items?.forEach((item: any) => {
      if (item.supplierName?.toLowerCase() === supplier.name.toLowerCase()) {
        supplierSales.push({ sale, item });
      }
    });
  });

  // Payout transactions made to this supplier
  const payoutTransactions = (rawDb.transactions || []).filter(
    t => t.category === 'Tienda' && t.concept.toLowerCase().includes(`pago a proveedor: ${supplier.name.toLowerCase()}`)
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'var(--md-sys-color-surface)',
        zIndex: 2600,
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100%',
        maxWidth: '768px',
        margin: '0 auto',
        overflow: 'hidden'
      }}
      onClick={onClose}
      className="no-print"
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--md-sys-color-surface-container)'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--md-sys-color-primary)', textTransform: 'uppercase' }}>
              Historial Completo de Proveedor
            </span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
              🤝 {supplier.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--md-sys-color-surface-container-high)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              borderRadius: '50%',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Metrics Summary Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'var(--md-sys-color-surface)',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)'
        }}>
          <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: '#F0F9FF', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0369A1' }}>Stock Cargado</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0284C7' }}>
              {supplierProducts.reduce((acc, p) => acc + (p.stock || 0), 0)} u
            </div>
          </div>
          <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: '#FEF3C7', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#B45309' }}>Pendiente Pagar</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#D97706' }}>
              ${supplier.pendingPayout?.toLocaleString('es-ES') || 0}
            </div>
          </div>
          <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: '#DCFCE7', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#15803D' }}>Total Pagado</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#16A34A' }}>
              ${supplier.totalPaid?.toLocaleString('es-ES') || 0}
            </div>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '10px 16px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          backgroundColor: 'var(--md-sys-color-surface-container)'
        }}>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'inventory' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
              color: activeTab === 'inventory' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Package size={15} />
            <span>Mercancía ({supplierProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'sales' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
              color: activeTab === 'sales' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Receipt size={15} />
            <span>Ventas ({supplierSales.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'payouts' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
              color: activeTab === 'payouts' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <DollarSign size={15} />
            <span>Pagos ({payoutTransactions.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* 1. Inventory Products */}
          {activeTab === 'inventory' && (
            supplierProducts.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)', padding: '20px', fontSize: '0.85rem' }}>
                No hay productos asignados a este proveedor actualmente.
              </p>
            ) : (
              supplierProducts.map(prod => (
                <div
                  key={prod.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', margin: 0 }}>
                      {prod.name}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                      SKU: #{prod.barcode} • Costo Proveedor: ${prod.costPrice || 0}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
                      {prod.stock} {prod.unit || 'u'}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                      PVP: ${prod.price}
                    </span>
                  </div>
                </div>
              ))
            )
          )}

          {/* 2. Sales History */}
          {activeTab === 'sales' && (
            supplierSales.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)', padding: '20px', fontSize: '0.85rem' }}>
                Aún no se han registrado ventas de productos de este proveedor.
              </p>
            ) : (
              supplierSales.map(({ sale, item }, idx) => {
                const noteText = `[TICKET_DE_VENTA] Comprobante de Venta #${sale.id.slice(-6)}\n` +
                  `• ${item.quantity}x ${item.name} ($${item.unitPrice} c/u = $${item.subtotal || item.quantity * item.unitPrice})\n` +
                  `------------\nTotal: $${sale.totalAmount} | Moneda: ${sale.currency || 'CUP'} | Vendedor: ${sale.seller || 'General'}`;

                return (
                  <ReceiptTicketView
                    key={idx}
                    note={noteText}
                    ticketId={sale.id.slice(-6)}
                    totalCUP={item.subtotal || item.quantity * item.unitPrice}
                    currency={sale.currency}
                    seller={sale.seller}
                    timestamp={sale.createdAt || Date.now()}
                  />
                );
              })
            )
          )}

          {/* 3. Payout Transactions */}
          {activeTab === 'payouts' && (
            payoutTransactions.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)', padding: '20px', fontSize: '0.85rem' }}>
                Aún no hay liquidaciones registradas para este proveedor.
              </p>
            ) : (
              payoutTransactions.map(tx => (
                <div
                  key={tx.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      backgroundColor: '#DCFCE7',
                      color: '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', margin: 0 }}>
                        {tx.concept}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                        <Calendar size={11} style={{ display: 'inline', marginRight: '4px' }} />
                        {tx.date}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#16A34A' }}>
                    -${tx.amount.toLocaleString('es-ES')} {tx.currency || 'CUP'}
                  </div>
                </div>
              ))
            )
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--md-sys-color-outline-variant)',
          backgroundColor: 'var(--md-sys-color-surface-container)'
        }}>
          <button
            onClick={onClose}
            className="md-btn md-btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
