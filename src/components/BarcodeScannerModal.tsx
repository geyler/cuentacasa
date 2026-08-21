'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoreProduct, StoreSaleItem } from '@/types';
import { 
  getStoreProductByBarcode, 
  getStoreProducts, 
  registerStoreSale 
} from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
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
  Receipt,
  Upload,
  Volume2
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted?: () => void;
  currency?: string;
}

// Web Audio API Beep Generator (100% offline, zero network delay)
const playScanBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, ctx.currentTime); // High crisp scanner beep

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    }
  } catch (e) {
    // Ignore audio context autoplay restrictions if any
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSaleCompleted,
  currency = '$'
}) => {
  const { showToast, confirmAction, showActionResult } = useActionFeedback();
  const scannerContainerId = 'cuentacasa-html5-barcode-reader';
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Scanner state
  const [manualCode, setManualCode] = useState('');
  const [ticketItems, setTicketItems] = useState<StoreSaleItem[]>([]);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string>('Iniciando cámara...');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isScanningFile, setIsScanningFile] = useState(false);

  // Cooldown tracker to prevent duplicate scans in 1.8 seconds
  const lastScanTimeRef = useRef<number>(0);

  const handleDecodedBarcode = (decodedText: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 1800) return; // Cooldown 1.8s
    lastScanTimeRef.current = now;

    // Play physical scanner PIP sound!
    playScanBeep();

    // Extract digits or clean barcode
    const numericOnly = decodedText.replace(/\D/g, '');
    const cleanCode = (numericOnly.length > 0 ? numericOnly : decodedText).slice(-4).padStart(4, '0');

    setLastScanned(cleanCode);

    const product = getStoreProductByBarcode(cleanCode);
    if (product) {
      addItemToTicket(product);
    } else {
      triggerSuccessEffect(`Código #${cleanCode} escaneado (No encontrado)`);
    }
  };

  const addItemToTicket = (product: StoreProduct) => {
    playScanBeep();
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

    triggerSuccessEffect(`¡Agregado al Ticket: ${product.name}!`);
  };

  const updateItemQuantity = (productId: string, delta: number) => {
    playScanBeep();
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
    playScanBeep();
    setTicketItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Initialize Html5Qrcode Scanner Engine with exact 1:1 center alignment
  useEffect(() => {
    if (!isOpen) {
      stopScannerEngine();
      setTicketItems([]);
      return;
    }

    let isMounted = true;

    const initEngine = async () => {
      try {
        await stopScannerEngine();

        const html5Qrcode = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.ITF
          ],
          verbose: false
        });

        html5QrcodeRef.current = html5Qrcode;

        const config = {
          fps: 20,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            // Precise dynamic center box matching the 280x130 visual overlay
            return {
              width: Math.min(viewfinderWidth * 0.88, 280),
              height: Math.min(viewfinderHeight * 0.60, 130)
            };
          },
          aspectRatio: 1.777778
        };

        await html5Qrcode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (isMounted) handleDecodedBarcode(decodedText);
          },
          () => {
            // Ignore frame scan failures
          }
        );

        if (isMounted) setCameraStatus('Cámara lista para escanear.');
      } catch (err) {
        if (isMounted) {
          setCameraStatus('No se pudo acceder a la cámara trasera. Puedes seleccionar productos o ingresar código.');
        }
      }
    };

    const timer = setTimeout(initEngine, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScannerEngine();
    };
  }, [isOpen]);

  const stopScannerEngine = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
      } catch (e) {
        // Ignore stop errors
      }
      html5QrcodeRef.current = null;
    }
  };

  // Image / File Barcode Reader
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanningFile(true);
      const scanner = new Html5Qrcode('file-scanner-temp');
      const decodedText = await scanner.scanFile(file, true);
      scanner.clear();
      handleDecodedBarcode(decodedText);
    } catch (err) {
      showToast({
        title: 'Sin Resultados',
        message: 'No se detectó un código de barras legible en la imagen seleccionada.',
        type: 'error'
      });
    } finally {
      setIsScanningFile(false);
    }
  };

  if (!isOpen) return null;

  const triggerSuccessEffect = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessBadge(true);
    setTimeout(() => setShowSuccessBadge(false), 1600);
  };

  // Totals calculations
  const uniqueItemsCount = ticketItems.length;
  const totalUnitsCount = ticketItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalInvoicePrice = ticketItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalInvoiceCost = ticketItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
  const estimatedNetProfit = totalInvoicePrice - totalInvoiceCost;

  const handleConfirmSale = () => {
    if (ticketItems.length === 0) {
      showToast({
        title: 'Ticket Vacío',
        message: 'Agrega al menos un producto al ticket antes de confirmar la venta.',
        type: 'warning'
      });
      return;
    }

    confirmAction({
      title: '¿Confirmar y Registrar Venta?',
      message: `Se registrará la venta de ${totalUnitsCount} unidades por un total de ${formatCurrency(totalInvoicePrice, currency, true)}. La ganancia neta de +${formatCurrency(estimatedNetProfit, currency, true)} ingresará a CuentaCasa.`,
      variant: 'primary',
      confirmText: 'Confirmar y Cobrar',
      onConfirm: () => {
        const todayStr = new Date().toISOString().split('T')[0];

        registerStoreSale({
          date: todayStr,
          items: ticketItems,
          totalAmount: totalInvoicePrice,
          totalCost: totalInvoiceCost,
          netProfit: estimatedNetProfit
        });

        const saleTotalText = formatCurrency(totalInvoicePrice, currency, true);
        const profitText = formatCurrency(estimatedNetProfit, currency, true);
        const itemsListStr = ticketItems.map(i => `${i.name} (x${i.quantity})`).join(', ');

        setTicketItems([]);
        if (onSaleCompleted) onSaleCompleted();
        onClose();

        showActionResult({
          title: '¡Venta Registrada con Éxito!',
          message: `Cobro total: ${saleTotalText} • Ganancia a Casa: +${profitText}`,
          type: 'success',
          details: (
            <div>
              <strong>Detalle de artículos:</strong>
              <div style={{ marginTop: '4px', opacity: 0.9 }}>{itemsListStr}</div>
            </div>
          )
        });
      }
    });
  };

  const availableProducts = getStoreProducts();

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.90)',
      backdropFilter: 'blur(8px)',
      zIndex: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      overflowY: 'auto'
    }} className="no-print">

      <div id="file-scanner-temp" style={{ display: 'none' }} />

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
          <Scan size={20} color="#FF0033" />
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Escáner de Códigos de Barras</span>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Camera Viewfinder Box with High-Tech Laser Beam & Centered Frame */}
      <div style={{
        width: '100%',
        height: '240px',
        backgroundColor: '#050505',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '3px solid var(--md-sys-color-primary)'
      }}>
        
        {/* Html5Qrcode Reader Element */}
        <div id={scannerContainerId} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />

        {/* Viewfinder Target Box Overlay with Corner Brackets & Red Laser Beam */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '280px',
          height: '130px',
          border: showSuccessBadge ? '2px solid #00FF88' : '2px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '16px',
          boxShadow: showSuccessBadge ? '0 0 24px rgba(0, 255, 136, 0.8)' : '0 0 0 9999px rgba(0, 0, 0, 0.55)',
          pointerEvents: 'none',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>

          {/* Red Laser Scanning Beam (Up and Down Motion) */}
          {!showSuccessBadge && <div className="scanner-laser-line" />}

          {/* Corner Target Bracket Hints */}
          <div style={{ position: 'absolute', top: '8px', left: '8px', width: '16px', height: '16px', borderTop: '3px solid #FF0033', borderLeft: '3px solid #FF0033', borderRadius: '4px 0 0 0' }} />
          <div style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', borderTop: '3px solid #FF0033', borderRight: '3px solid #FF0033', borderRadius: '0 4px 0 0' }} />
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '16px', height: '16px', borderBottom: '3px solid #FF0033', borderLeft: '3px solid #FF0033', borderRadius: '0 0 0 4px' }} />
          <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '16px', height: '16px', borderBottom: '3px solid #FF0033', borderRight: '3px solid #FF0033', borderRadius: '0 0 4px 0' }} />
        </div>

        {/* Success Beep Badge */}
        {showSuccessBadge && (
          <div style={{
            position: 'absolute',
            top: '12px',
            backgroundColor: '#00875A',
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '0.88rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(0, 135, 90, 0.6)',
            zIndex: 10
          }}>
            <Volume2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Manual Code input, Image Upload & Quick Catalog Chips */}
      <div style={{
        padding: '10px 16px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Opciones de Escaneo Rápido:
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--md-sys-color-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Upload size={14} />
              <span>{isScanningFile ? 'Leyendo imagen...' : 'Escanear Foto'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            <button
              onClick={() => setIsManualInput(!isManualInput)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--md-sys-color-primary)',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Keyboard size={14} />
              <span>{isManualInput ? 'Cámara' : 'Código Manual'}</span>
            </button>
          </div>
        </div>

        {/* Catalog Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {availableProducts.map(prod => (
            <button
              key={prod.barcode}
              onClick={() => handleDecodedBarcode(prod.barcode)}
              style={{
                padding: '6px 12px',
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
      </div>

      {/* Manual Code Input Bar with Numeric Keypad trigger & Input Spotlight */}
      {isManualInput && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--md-sys-color-surface)',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Ingresar Código 4 dígitos:</span>
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
                handleDecodedBarcode(val);
                setManualCode('');
              }
            }}
            className="input-spotlight"
            style={{
              width: '110px',
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
            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>Centra el código de barras bajo la línea láser para sumar el producto al ticket.</p>
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
