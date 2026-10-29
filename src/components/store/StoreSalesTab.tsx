'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/invoice';
import { Receipt, X, Package, Calendar, DollarSign, Tag, CheckCircle2, ChevronRight, User, ShoppingBag } from 'lucide-react';
import { getCurrencySettings } from '@/lib/storage';
import { ReceiptTicketView } from '@/components/common/ReceiptTicketView';
import { formatRecordDateTime } from '@/lib/dateUtils';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Receipt size={20} color="var(--md-sys-color-primary)" />
          <span>Historial de Ventas y Recibos</span>
        </h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
          {filteredSales.length} {filteredSales.length === 1 ? 'venta registrada' : 'ventas registradas'}
        </span>
      </div>

      {filteredSales.length === 0 ? (
        <div className="md-card" style={{ padding: '36px 16px', textAlign: 'center' }}>
          <ShoppingBag size={36} style={{ color: 'var(--md-sys-color-outline)', margin: '0 auto 8px auto' }} />
          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)', margin: '0 0 4px 0' }}>
            Aún no hay ventas registradas
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
            Usa el punto de venta (Escanear / POS) para realizar tu primera venta.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredSales.map(sale => {
            const saleItems = sale.items || [];
            const itemsTitle = saleItems.length > 0 
              ? saleItems.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')
              : `Venta POS #${sale.id.slice(-6)}`;
            
            const totalUnits = saleItems.reduce((acc: number, i: any) => acc + (Number(i.quantity) || 1), 0);
            const saleCurrency = sale.currency || 'CUP';

            return (
              <div
                key={sale.id}
                className="md-card"
                onClick={() => setSelectedSale(sale)}
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  borderRadius: '16px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Left Side: Icon & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  
                  {/* Pink / Brand Ticket Icon */}
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--brand-primary-light, #FCE7F3)',
                    color: 'var(--brand-primary, #EC4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Receipt size={20} />
                  </div>

                  {/* Concept & Metadata */}
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <h4 style={{
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: 'var(--md-sys-color-on-surface)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {itemsTitle}
                      </h4>

                      {/* Ticket Badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        backgroundColor: 'var(--brand-primary-light, #FCE7F3)',
                        color: 'var(--brand-primary, #EC4899)',
                        border: '1px solid var(--brand-primary-border, #FBCFE8)',
                        flexShrink: 0
                      }}>
                        🧾 Ticket #{sale.id.slice(-6)}
                      </span>

                      {/* Currency Badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        backgroundColor: saleCurrency === 'USD' ? '#ECFEFF' : '#E6F4EA',
                        color: saleCurrency === 'USD' ? '#0F766E' : '#137333',
                        border: saleCurrency === 'USD' ? '1px solid #99F6E4' : '1px solid #A8DADC',
                        flexShrink: 0
                      }}>
                        {saleCurrency}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '0.74rem',
                      color: 'var(--md-sys-color-on-surface-variant)',
                      fontWeight: 600,
                      marginTop: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <span>👤 {sale.sellerName || (sale.sellerUsername ? `@${sale.sellerUsername}` : (sale as any).seller || 'Administrador')}</span>
                      <span>•</span>
                      <span>📅 {formatRecordDateTime(sale.timestamp || sale.createdAt, sale.date) || 'Reciente'}</span>
                      <span>•</span>
                      <span>📦 {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount and Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: 'var(--md-sys-color-income)',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    +{formatCurrency(sale.totalAmount || 0, saleCurrency, true)}
                  </span>
                  <ChevronRight size={18} color="var(--md-sys-color-on-surface-variant)" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sale Detail Modal (Standard Tier 1 Compact 520px with Receipt Breakdown) */}
      {selectedSale && (() => {
        const saleCurrency = selectedSale.currency || 'CUP';
        const effectiveSeller = selectedSale.sellerName || (selectedSale.sellerUsername ? `@${selectedSale.sellerUsername}` : (selectedSale as any).seller || 'Administrador');
        const formattedNotes = selectedSale.items
          ? `[TICKET_DE_VENTA] Comprobante de Venta #${selectedSale.id.slice(-6)}\n` +
            selectedSale.items.map((i: any) => `• ${i.quantity}x ${i.name} ($${i.unitPrice} c/u = $${i.subtotal || i.quantity * i.unitPrice})`).join('\n') +
            `\n------------\nTotal: $${selectedSale.totalAmount} | Moneda: ${saleCurrency} | Vendedor: ${effectiveSeller}`
          : selectedSale.notes;

        return (
          <div
            className="modal-backdrop-responsive no-print"
            style={{ zIndex: 2500 }}
            onClick={() => setSelectedSale(null)}
          >
            <div
              className="bottom-sheet-modal"
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                color: 'var(--md-sys-color-on-surface)',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '92dvh',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                padding: '20px 24px 28px 24px',
                gap: '16px'
              }}
            >
              {/* Grab Handle (Only visible on Mobile) */}
              <div className="mobile-only" style={{ justifyContent: 'center', marginBottom: '2px' }}>
                <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
              </div>

              {/* Header Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--md-sys-color-outline-variant)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--brand-primary-light, #FCE7F3)',
                    color: 'var(--brand-primary, #EC4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Receipt size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                      Detalles de la Venta
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                      COMPROBANTE DE VENTA #{selectedSale.id.slice(-6)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
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
                  title="Cerrar detalle"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Total Banner Card */}
              <div style={{
                backgroundColor: 'var(--md-sys-color-income-container)',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-income-container)', fontWeight: 800, letterSpacing: '0.05em' }}>
                  TOTAL COBRADO EN CAJA
                </span>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--md-sys-color-income)', fontVariantNumeric: 'tabular-nums' }}>
                  +{formatCurrency(selectedSale.totalAmount || 0, saleCurrency, true)}
                </span>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    color: 'var(--md-sys-color-income)'
                  }}>
                    VENTA POS
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    color: 'var(--md-sys-color-on-surface-variant)'
                  }}>
                    {saleCurrency}
                  </span>
                </div>
              </div>

              {/* Info Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--md-sys-color-surface)'
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                    Vendedor a Cargo:
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                    👤 {selectedSale.seller || 'Administrador'}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--md-sys-color-surface)'
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                    Fecha y Hora:
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                    📅 {formatRecordDateTime(selectedSale.timestamp || selectedSale.createdAt, selectedSale.date) || 'Reciente'}
                  </span>
                </div>
              </div>

              {/* Ticket Breakdown Card (Exact format requested) */}
              <ReceiptTicketView
                note={formattedNotes}
                ticketId={selectedSale.id.slice(-6)}
                totalCUP={selectedSale.totalAmountCUP || (saleCurrency === 'USD' ? undefined : selectedSale.totalAmount)}
                totalUSD={selectedSale.totalAmountUSD || (saleCurrency === 'USD' ? selectedSale.totalAmount : undefined)}
                currency={saleCurrency}
                seller={selectedSale.sellerName || (selectedSale.sellerUsername ? `@${selectedSale.sellerUsername}` : (selectedSale.seller || 'Administrador'))}
                timestamp={selectedSale.timestamp || selectedSale.createdAt || Date.now()}
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="md-btn md-btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  borderRadius: '14px',
                  marginTop: '4px'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
