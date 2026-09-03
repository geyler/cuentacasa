'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/invoice';
import { Receipt, X, Package, Calendar, DollarSign, Tag, CheckCircle2 } from 'lucide-react';
import { getCurrencySettings } from '@/lib/storage';
import { ReceiptTicketView } from '@/components/common/ReceiptTicketView';

interface StoreSalesTabProps {
  salesRecords: any[];
  currency?: string;
}

export const StoreSalesTab: React.FC<StoreSalesTabProps> = ({
  salesRecords,
  currency = '$'
}) => {
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const { currencyMode } = getCurrencySettings();

  const filteredSales = salesRecords;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Receipt size={20} color="var(--md-sys-color-primary)" />
        <span>Historial de Ventas y Recibos</span>
      </h3>

      {filteredSales.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', padding: '20px' }}>
          Aún no hay ventas registradas. Escanea productos para realizar tu primera venta.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSales.map(sale => {
            const formattedNotes = sale.items
              ? `[TICKET_DE_VENTA] Comprobante de Venta #${sale.id.slice(-6)}\n` +
                sale.items.map((i: any) => `• ${i.quantity}x ${i.name} ($${i.unitPrice} c/u = $${i.subtotal || i.quantity * i.unitPrice})`).join('\n') +
                `\n------------\nTotal: $${sale.totalAmount} | Moneda: ${sale.currency || 'CUP'} | Vendedor: ${sale.seller || 'General'}`
              : sale.notes;

            return (
              <div key={sale.id} onClick={() => setSelectedSale(sale)} style={{ cursor: 'pointer' }}>
                <ReceiptTicketView
                  note={formattedNotes}
                  ticketId={sale.id.slice(-6)}
                  totalCUP={sale.totalAmountCUP || (sale.currency === 'USD' ? undefined : sale.totalAmount)}
                  totalUSD={sale.totalAmountUSD || (sale.currency === 'USD' ? sale.totalAmount : undefined)}
                  currency={sale.currency}
                  seller={sale.seller}
                  timestamp={sale.createdAt || Date.now()}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 2200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 0
          }}
          className="no-print"
          onClick={() => setSelectedSale(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bottom-sheet-modal"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              width: '100%',
              maxWidth: '768px',
              borderRadius: '28px 28px 0 0',
              padding: '20px 24px 28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--md-shadow-elevation-4)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={22} color="var(--md-sys-color-primary)" />
                  <span>Detalle de Venta #{selectedSale.id.slice(-6)}</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> {selectedSale.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                style={{
                  background: 'var(--md-sys-color-surface-container-high)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  borderRadius: '50%',
                  color: 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Total Highlight */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-income-container)',
              border: '1px solid var(--md-sys-color-income)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--md-sys-color-income)', textTransform: 'uppercase' }}>
                  Total Cobrado en Caja
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                  {formatCurrency(selectedSale.totalAmount, currency, true)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                  Ganancia Neta Tienda
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                  +${selectedSale.netProfit}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '8px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Productos Vendidos ({selectedSale.items.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedSale.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                        {item.name}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                        Cant: {item.quantity} × ${item.unitPrice} | SKU: #{item.barcode || 'N/A'}
                      </div>
                      {item.supplierName && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-primary)', fontWeight: 700 }}>
                          🤝 Consignación ({item.supplierName})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                      ${item.subtotal || item.quantity * item.unitPrice}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Distribution */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>Costo de Reposición Retenido:</span>
                <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>${selectedSale.totalCost}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>Ganancia Neta Retenida en Tienda:</span>
                <strong style={{ color: 'var(--md-sys-color-income)' }}>+${selectedSale.netProfit}</strong>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedSale(null)}
              className="md-btn md-btn-primary"
              style={{ padding: '12px', fontSize: '0.9rem', width: '100%', borderRadius: '14px' }}
            >
              Cerrar
            </button>

          </div>
        </div>
      )}
    </div>
  );
};
