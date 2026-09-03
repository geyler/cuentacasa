'use client';

import React, { useState, useMemo } from 'react';
import { StoreProduct } from '@/types';
import { getStoreProducts, saveStoreProduct } from '@/lib/storage';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { X, Search, FileText, Printer, AlertTriangle, CheckCircle, Clock, Calendar, Edit3 } from 'lucide-react';

interface ValuationBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProduct?: (product: StoreProduct) => void;
}

export const ValuationBookModal: React.FC<ValuationBookModalProps> = ({
  isOpen,
  onClose,
  onEditProduct
}) => {
  useLockBodyScroll(isOpen);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'expired' | 'warning' | 'valid' | 'nodate'>('all');
  const [editingDateProduct, setEditingDateProduct] = useState<StoreProduct | null>(null);
  const [quickMfgDate, setQuickMfgDate] = useState('');
  const [quickExpDate, setQuickExpDate] = useState('');

  const products = useMemo(() => {
    if (!isOpen) return [];
    return getStoreProducts();
  }, [isOpen, editingDateProduct]);

  // Calculate expiration status and days remaining
  const getItemStatus = (expDate?: string) => {
    if (!expDate) return { key: 'nodate', label: 'Sin Fecha', color: 'var(--md-sys-color-on-surface-variant)', bg: 'rgba(156,163,175,0.15)', daysLeft: null };
    
    const exp = new Date(expDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);
    
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { key: 'expired', label: `🔴 VENCIDO (${Math.abs(diffDays)}d)`, color: '#DC2626', bg: '#FEE2E2', daysLeft: diffDays };
    } else if (diffDays <= 30) {
      return { key: 'warning', label: `🟡 PRÓXIMO (${diffDays}d)`, color: '#D97706', bg: '#FEF3C7', daysLeft: diffDays };
    } else {
      return { key: 'valid', label: `🟢 VIGENTE (${diffDays}d)`, color: '#059669', bg: '#D1FAE5', daysLeft: diffDays };
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    let total = products.length;
    let expired = 0;
    let warning = 0;
    let valid = 0;
    let nodate = 0;

    products.forEach(p => {
      const st = getItemStatus(p.expDate);
      if (st.key === 'expired') expired++;
      else if (st.key === 'warning') warning++;
      else if (st.key === 'valid') valid++;
      else nodate++;
    });

    return { total, expired, warning, valid, nodate };
  }, [products]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm);
      const st = getItemStatus(p.expDate);
      const matchesStatus = filterStatus === 'all' || st.key === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, filterStatus]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveQuickDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDateProduct) return;

    saveStoreProduct({
      ...editingDateProduct,
      mfgDate: quickMfgDate.trim() || undefined,
      expDate: quickExpDate.trim() || undefined
    });

    setEditingDateProduct(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/R';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'var(--md-sys-color-surface)',
        zIndex: 2500,
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

        {/* Printable Only Official Header */}
        <div className="printable-only" style={{ display: 'none', padding: '20px', borderBottom: '2px solid #000' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase' }}>LIBRO OFICIAL DE TASACIONES Y VENCIMIENTOS</h1>
          <p style={{ fontSize: '0.85rem' }}>Establecimiento: Samy Store | Fecha de Registro: {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        {/* Modal Top Bar Header */}
        <div className="no-print" style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--md-sys-color-surface-container)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.2 }}>Libro de Tasaciones</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Control oficial de fechas de fabricación, caducidad e inspección sanitaria
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              className="md-btn md-btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: '12px' }}
              title="Imprimir Informe para Autoridades"
            >
              <Printer size={16} />
              <span className="hide-mobile">Imprimir Libro</span>
            </button>
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
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Status Metrics Cards Grid */}
          <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <div 
              onClick={() => setFilterStatus(filterStatus === 'expired' ? 'all' : 'expired')}
              style={{
                padding: '10px 8px',
                borderRadius: '14px',
                backgroundColor: filterStatus === 'expired' ? '#FEE2E2' : 'var(--md-sys-color-surface-container)',
                border: filterStatus === 'expired' ? '2px solid #DC2626' : '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#DC2626' }}>{metrics.expired}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#991B1B' }}>Vencidos</div>
            </div>

            <div 
              onClick={() => setFilterStatus(filterStatus === 'warning' ? 'all' : 'warning')}
              style={{
                padding: '10px 8px',
                borderRadius: '14px',
                backgroundColor: filterStatus === 'warning' ? '#FEF3C7' : 'var(--md-sys-color-surface-container)',
                border: filterStatus === 'warning' ? '2px solid #D97706' : '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#D97706' }}>{metrics.warning}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#92400E' }}>Próximos (30d)</div>
            </div>

            <div 
              onClick={() => setFilterStatus(filterStatus === 'valid' ? 'all' : 'valid')}
              style={{
                padding: '10px 8px',
                borderRadius: '14px',
                backgroundColor: filterStatus === 'valid' ? '#D1FAE5' : 'var(--md-sys-color-surface-container)',
                border: filterStatus === 'valid' ? '2px solid #059669' : '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>{metrics.valid}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#065F46' }}>Vigentes</div>
            </div>

            <div 
              onClick={() => setFilterStatus(filterStatus === 'nodate' ? 'all' : 'nodate')}
              style={{
                padding: '10px 8px',
                borderRadius: '14px',
                backgroundColor: filterStatus === 'nodate' ? 'var(--md-sys-color-surface-container-high)' : 'var(--md-sys-color-surface-container)',
                border: filterStatus === 'nodate' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>{metrics.nodate}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>Sin Fecha</div>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="no-print" style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-sys-color-on-surface-variant)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o código SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.88rem',
                fontWeight: 700,
                outline: 'none'
              }}
            />
          </div>

          {/* Main Table View */}
          <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--md-sys-color-outline-variant)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 800 }}>Producto</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800 }}>SKU</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800 }}>Stock</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800 }}>F. Fabricación</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800 }}>F. Vencimiento</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800 }}>Estado</th>
                  <th className="no-print" style={{ padding: '10px 12px', fontWeight: 800, textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      No se encontraron productos en el Libro de Tasaciones
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const st = getItemStatus(product.expDate);
                    return (
                      <tr key={product.id} style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800 }}>
                          {product.name}
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                            {product.category || 'Varios'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 800 }}>
                          {product.barcode}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 800 }}>
                          {product.stock} {product.unit || 'u'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: product.mfgDate ? 'inherit' : 'var(--md-sys-color-on-surface-variant)' }}>
                          {formatDate(product.mfgDate)}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: product.expDate ? 'inherit' : 'var(--md-sys-color-on-surface-variant)' }}>
                          {formatDate(product.expDate)}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '8px',
                            backgroundColor: st.bg,
                            color: st.color,
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            display: 'inline-block',
                            whiteSpace: 'nowrap'
                          }}>
                            {st.label}
                          </span>
                        </td>
                        <td className="no-print" style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setEditingDateProduct(product);
                              setQuickMfgDate(product.mfgDate || '');
                              setQuickExpDate(product.expDate || '');
                            }}
                            className="md-btn md-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', borderRadius: '8px' }}
                          >
                            <Edit3 size={14} />
                            <span>Fechas</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="no-print" style={{ 
          padding: '12px 20px', 
          borderTop: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--md-sys-color-surface-container)'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
            Total en reporte: {filteredProducts.length} productos
          </span>
          <button
            onClick={onClose}
            className="md-btn md-btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.85rem', borderRadius: '12px' }}
          >
            Cerrar
          </button>
        </div>

      </div>

      {/* Quick Edit Dates Overlay Sub-Modal */}
      {editingDateProduct && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 2600,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0'
          }}
          onClick={() => setEditingDateProduct(null)}
        >
          <form
            onSubmit={handleSaveQuickDate}
            onClick={e => e.stopPropagation()}
            className="bottom-sheet-modal"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              padding: '12px 20px 24px 20px',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--md-shadow-elevation-4)'
            }}
          >
            {/* Handle Drag Indicator */}
            <div style={{ width: '40px', height: '4px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 6px auto', opacity: 0.8 }} />

            <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>Actualizar Fechas del Producto</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '-8px' }}>
              {editingDateProduct.name} (SKU: {editingDateProduct.barcode})
            </p>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                Fecha de Fabricación
              </label>
              <input
                type="date"
                value={quickMfgDate}
                onChange={e => setQuickMfgDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 700
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={quickExpDate}
                onChange={e => setQuickExpDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 700
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setEditingDateProduct(null)}
                className="md-btn md-btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="md-btn md-btn-primary"
                style={{ flex: 1, padding: '10px' }}
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
