'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoreProduct, StoreSaleItem } from '@/types';
import { 
  getStoreProductByBarcode, 
  getStoreProducts, 
  registerStoreSale 
} from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { 
  Scan, 
  X, 
  Plus, 
  Minus,
  Check, 
  Keyboard, 
  Camera, 
  ShoppingBag, 
  Trash2,
  Receipt
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted?: () => void;
  currency?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSaleCompleted,
  currency = '$'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Scanner state
  const [manualCode, setManualCode] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState<string>('0001');

  // Ticket / Carrito en vivo State
  const [ticketItems, setTicketItems] = useState<StoreSaleItem[]>([]);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Select / Scan Product & Add to Ticket
  const handleSelectBarcode = (code: string) => {
    const cleanCode = code.padStart(4, '0');
    setScannedBarcode(cleanCode);

    const product = getStoreProductByBarcode(cleanCode);
    if (product) {
      addItemToTicket(product);
    }
  };

  const addItemToTicket = (product: StoreProduct) => {
    setTicketItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id || item.barcode === product.barcode);
      if (existingIndex !== -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        const newQty = currentQty + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: newQty * updated[existingIndex].unitPrice
        };
        return updated;
      }

      return [
        ...prev,
        {
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          quantity: 1,
          costPrice: product.costPrice || Math.round(product.price * 0.7),
          unitPrice: product.price,
          subtotal: product.price,
          supplierType: product.supplierType || 'propia',
          supplierName: product.supplierName
        }
      ];
    });

    triggerSuccessEffect(`Agregado al Ticket: ${product.name}`);
  };

  const updateItemQuantity = (productId: string, delta: number) => {
    setTicketItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? {
          ...item,
          quantity: newQty,
          subtotal: newQty * item.unitPrice
        } : null;
      }
      return item;
    }).filter(Boolean) as StoreSaleItem[]);
  };

  const updateItemUnitPrice = (productId: string, newUnitPrice: number) => {
    setTicketItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const validPrice = Math.max(0, newUnitPrice);
        return {
          ...item,
          unitPrice: validPrice,
          subtotal: item.quantity * validPrice
        };
      }
      return item;
    }));
  };

  const updateItemSubtotal = (productId: string, newSubtotal: number) => {
    setTicketItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const validSubtotal = Math.max(0, newSubtotal);
        return {
          ...item,
          subtotal: validSubtotal,
          unitPrice: item.quantity > 0 ? Math.round(validSubtotal / item.quantity) : validSubtotal
        };
      }
      return item;
    }));
  };

  const removeItemFromTicket = (productId: string) => {
    setTicketItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Camera initialization
  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setTicketItems([]);
      return;
    }

    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        if ('mediaDevices' in navigator && navigator.mediaDevices.getUserMedia) {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 360 } }
          });
          activeStream = mediaStream;
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }

          if ('BarcodeDetector' in window) {
            const detector = new (window as any).BarcodeDetector({
              formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a']
            });

            const scanLoop = async () => {
              if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                  const barcodes = await detector.detect(videoRef.current);
                  if (barcodes.length > 0) {
                    const rawValue = barcodes[0].rawValue;
                    handleSelectBarcode(rawValue);
                  }
                } catch (e) {
                  // Ignore frame detection error
                }
              }
              if (isOpen) {
                requestAnimationFrame(scanLoop);
              }
            };
            requestAnimationFrame(scanLoop);
          }
        }
      } catch (err) {
        setCameraError('Cámara inactiva. Puedes seleccionar productos abajo o ingresar el código 4 dígitos.');
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerSuccessEffect = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessBadge(true);
    setTimeout(() => setShowSuccessBadge(false), 1400);
  };

  // Totals calculations
  const uniqueItemsCount = ticketItems.length;
  const totalUnitsCount = ticketItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalInvoicePrice = ticketItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalInvoiceCost = ticketItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
  const estimatedNetProfit = totalInvoicePrice - totalInvoiceCost;

  const handleConfirmSale = () => {
    if (ticketItems.length === 0) {
      alert('Agrega al menos un producto al ticket antes de confirmar la venta.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    registerStoreSale({
      date: todayStr,
      items: ticketItems,
      totalAmount: totalInvoicePrice,
      totalCost: totalInvoiceCost,
      netProfit: estimatedNetProfit
    });

    triggerSuccessEffect('¡Venta Registrada! Ganancia enviada a CuentaCasa.');
    setTicketItems([]);
    if (onSaleCompleted) onSaleCompleted();
    onClose();
  };

  const availableProducts = getStoreProducts();

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      overflowY: 'auto'
    }} className="no-print">

      {/* Top Header Bar */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scan size={20} color="var(--md-sys-color-primary)" />
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Escáner de Ventas en Vivo</span>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Camera Viewfinder Strip */}
      <div style={{
        width: '100%',
        height: '160px',
        backgroundColor: '#111',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '3px solid var(--md-sys-color-primary)'
      }}>
        {!cameraError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '20px', fontSize: '0.82rem' }}>
            <Camera size={26} style={{ marginBottom: '4px', opacity: 0.5 }} />
            <p>{cameraError}</p>
          </div>
        )}

        {/* Viewfinder rectangle */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '12%',
          right: '12%',
          transform: 'translateY(-50%)',
          height: '70px',
          border: showSuccessBadge ? '2px solid #00FF88' : '2px dashed rgba(255, 255, 255, 0.7)',
          borderRadius: '12px',
          boxShadow: showSuccessBadge ? '0 0 20px rgba(0, 255, 136, 0.6)' : '0 0 0 9999px rgba(0, 0, 0, 0.4)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: showSuccessBadge ? '#00FF88' : '#FF3B30',
            boxShadow: showSuccessBadge ? '0 0 10px #00FF88' : '0 0 10px #FF3B30'
          }} />
        </div>

        {/* Feedback Badge */}
        {showSuccessBadge && (
          <div style={{
            position: 'absolute',
            top: '10px',
            backgroundColor: '#00875A',
            color: '#FFFFFF',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
          }}>
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Manual Code input or Quick Catalog Chips */}
      <div style={{
        padding: '10px 16px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}>
            Tocar para Escanear:
          </span>

          {availableProducts.map(prod => (
            <button
              key={prod.barcode}
              onClick={() => handleSelectBarcode(prod.barcode)}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              #{prod.barcode} - {prod.name} (${prod.price})
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsManualInput(!isManualInput)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--md-sys-color-primary)',
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Keyboard size={14} />
          <span>{isManualInput ? 'Cámara' : 'Código Manual'}</span>
        </button>
      </div>

      {/* Manual Code Input Bar with Numeric Keypad trigger & Input Spotlight */}
      {isManualInput && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--md-sys-color-surface)',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Ingresar Código 4 dígitos:</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="0001"
            value={manualCode}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setManualCode(val);
              if (val.length === 4) {
                handleSelectBarcode(val);
              }
            }}
            className="input-spotlight"
            style={{
              width: '100px',
              padding: '8px 10px',
              borderRadius: '10px',
              border: '2px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: '1.1rem',
              textAlign: 'center'
            }}
          />
        </div>
      )}

      {/* Ticket / Factura de Venta Area */}
      <div style={{
        flex: 1,
        padding: '16px',
        backgroundColor: 'var(--md-sys-color-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        
        {/* Ticket Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Receipt size={18} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Ticket de Venta (Editable)</h3>
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
            {uniqueItemsCount} Ítems | {totalUnitsCount} Unidades
          </span>
        </div>

        {/* Ticket Items List */}
        {ticketItems.length === 0 ? (
          <div className="md-card" style={{ padding: '30px 16px', textAlign: 'center', opacity: 0.7 }}>
            <ShoppingBag size={36} style={{ color: 'var(--md-sys-color-outline)', marginBottom: '8px' }} />
            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>Escanea o presiona arriba sobre los productos para agregarlos al ticket.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
            {ticketItems.map(item => (
              <div
                key={item.productId}
                className="md-card"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Item Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
                      #{item.barcode}
                    </span>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800 }}>{item.name}</h4>
                    {item.supplierType === 'proveedor' && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--md-sys-color-expense)', backgroundColor: 'var(--md-sys-color-expense-container)', padding: '1px 6px', borderRadius: '4px' }}>
                        {item.supplierName || 'Proveedor'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => removeItemFromTicket(item.productId)}
                    style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-expense)', cursor: 'pointer', padding: '2px' }}
                    title="Eliminar ítem del ticket"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Editable Quantity, Unit Price and Subtotal Row (Numeric Keypad + Spotlight) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1.4fr', gap: '8px', alignItems: 'center' }}>
                  
                  {/* Quantity Stepper */}
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                      Cantidad:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => updateItemQuantity(item.productId, -1)}
                        style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--md-sys-color-surface-container-high)', fontWeight: 800, cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', minWidth: '18px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItemQuantity(item.productId, 1)}
                        style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--md-sys-color-primary)', color: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Unit Price Editable */}
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                      Precio Unit. ({currency}):
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={item.unitPrice}
                      onChange={e => updateItemUnitPrice(item.productId, parseFloat(e.target.value) || 0)}
                      className="input-spotlight"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  {/* Subtotal Editable */}
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                      Subtotal ({currency}):
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={item.subtotal}
                      onChange={e => updateItemSubtotal(item.productId, parseFloat(e.target.value) || 0)}
                      className="input-spotlight"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'var(--md-sys-color-income-container)',
                        color: 'var(--md-sys-color-income)',
                        fontWeight: 800,
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

        {/* Factura / Ticket Summary Box (Dual Distribution Breakdown) */}
        {ticketItems.length > 0 && (
          <div style={{
            backgroundColor: 'var(--md-sys-color-income-container)',
            color: 'var(--md-sys-color-on-income-container)',
            padding: '14px 16px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block' }}>TOTAL COBRADO AL CLIENTE</span>
                <span style={{ fontSize: '0.72rem', color: '#00875A', fontWeight: 800 }}>
                  A CuentaCasa (Ganancia Neta): +{formatCurrency(estimatedNetProfit, currency, true)}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
                  Fondo Tienda / Proveedores retenido: {formatCurrency(totalInvoiceCost, currency, true)}
                </span>
              </div>

              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                {formatCurrency(totalInvoicePrice, currency, true)}
              </div>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
          <button
            onClick={handleConfirmSale}
            disabled={ticketItems.length === 0}
            className="md-btn md-btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              opacity: ticketItems.length === 0 ? 0.5 : 1
            }}
          >
            <Check size={20} />
            <span>Confirmar y Registrar Venta</span>
          </button>

          <button
            onClick={onClose}
            className="md-btn md-btn-secondary"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
          >
            <span>Cerrar Escáner</span>
          </button>
        </div>

      </div>

    </div>
  );
};
