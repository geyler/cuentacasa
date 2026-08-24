'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoreProduct, StoreSaleItem } from '@/types';
import { 
  getStoreProductByBarcode, 
  getStoreProducts, 
  registerStoreSale 
} from '@/lib/storage';
import { syncDatabaseWithCloud } from '@/lib/sync';
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
  Volume2
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted?: () => void;
  currency?: string;
  initialTicketItems?: StoreSaleItem[];
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
      osc.frequency.setValueAtTime(1050, ctx.currentTime);

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
  currency = '$',
  initialTicketItems = []
}) => {
  const { showToast, confirmAction, showActionResult } = useActionFeedback();
  const scannerContainerId = 'cuentacasa-html5-barcode-reader';
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Scanner state
  const [manualCode, setManualCode] = useState('');
  const [ticketItems, setTicketItems] = useState<StoreSaleItem[]>([]);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cameraStatus, setCameraStatus] = useState<string>('Iniciando cámara...');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Cooldown tracker to prevent duplicate scans in 1.8 seconds
  const lastScanTimeRef = useRef<number>(0);

  // Load initial ticket items if provided (e.g. from WhatsApp order deep-link)
  useEffect(() => {
    if (isOpen && initialTicketItems && initialTicketItems.length > 0) {
      setTicketItems(initialTicketItems);
    }
  }, [isOpen, initialTicketItems]);

  const handleDecodedBarcode = (decodedText: string) => {
    const rawStr = decodedText.trim();
    if (!rawStr) return;

    const numericOnly = rawStr.replace(/\D/g, '');
    let searchCode = rawStr;
    if (numericOnly.length > 0) {
      searchCode = numericOnly.slice(-4).padStart(4, '0');
    }

    const now = Date.now();
    if (now - lastScanTimeRef.current < 1800) return; // Cooldown 1.8s
    lastScanTimeRef.current = now;

    playScanBeep();

    const product = getStoreProductByBarcode(searchCode) || getStoreProductByBarcode(rawStr);

    if (product) {
      setLastScanned(product.barcode);
      addItemToTicket(product);
    } else {
      setLastScanned(searchCode);
      triggerSuccessEffect(`Código #${searchCode} escaneado (No encontrado)`);
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

    triggerSuccessEffect(`¡Agregado: ${product.name}!`);
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

  // Initialize Html5Qrcode Scanner Engine
  useEffect(() => {
    if (!isOpen) {
      stopScannerEngine();
      setTicketItems([]);
      return;
    }

    let isMounted = true;
    let ocrTimer: NodeJS.Timeout | null = null;

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
            return {
              width: Math.min(viewfinderWidth * 0.88, 260),
              height: Math.min(viewfinderHeight * 0.55, 110)
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
          () => {}
        );

        if (isMounted) setCameraStatus('Cámara lista para escanear.');
      } catch (err) {
        if (isMounted) {
          setCameraStatus('No se pudo acceder a la cámara trasera. Puedes ingresar código manual.');
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
      message: `Se registrará la venta de ${totalUnitsCount} ${totalUnitsCount === 1 ? 'artículo' : 'artículos'} por un total de ${formatCurrency(totalInvoicePrice, currency, true)}.`,
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

        // Trigger automatic sync with Hostinger DB
        syncDatabaseWithCloud(true).catch(err => console.warn('Sale sync warning:', err));

        const saleTotalText = formatCurrency(totalInvoicePrice, currency, true);
        const itemsListStr = ticketItems.map(i => `${i.name} (x${i.quantity})`).join(', ');

        setTicketItems([]);
        if (onSaleCompleted) onSaleCompleted();
        onClose();

        showActionResult({
          title: '¡Venta Registrada con Éxito!',
          message: `Cobro total: ${saleTotalText} (${totalUnitsCount} ${totalUnitsCount === 1 ? 'artículo' : 'artículos'})`,
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

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCode = manualCode.trim();
    if (rawCode) {
      const searchCode = rawCode.replace(/\D/g, '').length > 0 && rawCode.length <= 4 
        ? rawCode.padStart(4, '0') 
        : rawCode;
      
      const product = getStoreProductByBarcode(searchCode) || getStoreProductByBarcode(rawCode);

      if (product) {
        setLastScanned(product.barcode);
        addItemToTicket(product);
        setManualCode('');
      } else {
        showToast({
          title: 'Producto No Encontrado',
          message: `El producto con código "${rawCode}" no existe en el inventario.`,
          type: 'warning'
        });
        triggerSuccessEffect(`⚠️ Código #${rawCode} no existe`);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.93)',
      backdropFilter: 'blur(10px)',
      zIndex: 120,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }} className="no-print">

      {/* FIXED TOP HEADER */}
      <div style={{
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scan size={18} color="#FF0033" />
          <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Escáner de Códigos de Barras</span>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '4px' }}
        >
          <X size={22} />
        </button>
      </div>

      {/* FIXED CAMERA VIEWFINDER BOX - STABLE SIZE (NON-SQUISHING) */}
      <div style={{
        width: '100%',
        height: '180px',
        minHeight: '180px',
        maxHeight: '180px',
        backgroundColor: '#050505',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '2px solid var(--md-sys-color-primary)',
        flexShrink: 0
      }}>
        
        {/* Html5Qrcode Reader Element */}
        <div id={scannerContainerId} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />

        {/* Target Box Overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '240px',
          height: '110px',
          border: showSuccessBadge ? '2px solid #00FF88' : '2px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '14px',
          boxShadow: showSuccessBadge ? '0 0 24px rgba(0, 255, 136, 0.8)' : '0 0 0 9999px rgba(0, 0, 0, 0.55)',
          pointerEvents: 'none',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {!showSuccessBadge && <div className="scanner-laser-line" />}
          <div style={{ position: 'absolute', top: '6px', left: '6px', width: '14px', height: '14px', borderTop: '3px solid #FF0033', borderLeft: '3px solid #FF0033', borderRadius: '3px 0 0 0' }} />
          <div style={{ position: 'absolute', top: '6px', right: '6px', width: '14px', height: '14px', borderTop: '3px solid #FF0033', borderRight: '3px solid #FF0033', borderRadius: '0 3px 0 0' }} />
          <div style={{ position: 'absolute', bottom: '6px', left: '6px', width: '14px', height: '14px', borderBottom: '3px solid #FF0033', borderLeft: '3px solid #FF0033', borderRadius: '0 0 0 3px' }} />
          <div style={{ position: 'absolute', bottom: '6px', right: '6px', width: '14px', height: '14px', borderBottom: '3px solid #FF0033', borderRight: '3px solid #FF0033', borderRadius: '0 0 3px 0' }} />
        </div>

        {/* Success Beep Badge */}
        {showSuccessBadge && (
          <div style={{
            position: 'absolute',
            top: '10px',
            backgroundColor: '#00875A',
            color: '#FFFFFF',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 16px rgba(0, 135, 90, 0.6)',
            zIndex: 10
          }}>
            <Volume2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* FIXED TOOLBAR BAR: POWERFUL MANUAL CODE ENTRY */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0
      }}>
        <form onSubmit={handleManualFormSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', whiteSpace: 'nowrap' }}>
            Código Manual:
          </span>
          <input
            type="text"
            placeholder="Ej. 00968 o barcode"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onFocus={(e) => {
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 150);
            }}
            className="input-spotlight"
            style={{
              flex: 1,
              maxWidth: '160px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '2px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-surface)',
              color: 'var(--md-sys-color-on-surface)',
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: '0.95rem',
              textAlign: 'center'
            }}
          />
          <button
            type="submit"
            className="md-btn md-btn-primary"
            style={{
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 800,
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              boxShadow: '0 2px 8px rgba(0, 99, 155, 0.3)',
              flexShrink: 0
            }}
          >
            <Plus size={16} />
            <span>Sumar al Ticket</span>
          </button>
        </form>

        <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, flexShrink: 0 }}>
          📷 Escáner activo
        </span>
      </div>

      {/* MIDDLE SECTION: SCROLLABLE TICKET LIST (Independent scroll without pushing top/bottom) */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '10px 14px',
        backgroundColor: 'var(--md-sys-color-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        
        {/* Ticket Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Receipt size={16} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>Ticket de Venta (Editable)</h3>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
            {uniqueItemsCount} Ítems • {totalUnitsCount} Unidades
          </span>
        </div>

        {/* Ticket Items List */}
        {ticketItems.length === 0 ? (
          <div className="md-card" style={{ padding: '24px 14px', textAlign: 'center', opacity: 0.7, margin: 'auto 0' }}>
            <ShoppingBag size={30} style={{ color: 'var(--md-sys-color-outline)', marginBottom: '6px' }} />
            <p style={{ fontSize: '0.78rem', fontWeight: 700 }}>Centra el código de barras bajo la línea láser o ingresa el código manual para agregar al ticket.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ticketItems.map(item => (
              <div
                key={item.productId}
                className="md-card"
                style={{
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {/* Item Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 800, color: 'var(--md-sys-color-primary)', backgroundColor: 'var(--md-sys-color-primary-container)', padding: '1px 4px', borderRadius: '4px' }}>
                      #{item.barcode}
                    </span>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h4>
                    {item.supplierType === 'proveedor' && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--md-sys-color-expense)', backgroundColor: 'var(--md-sys-color-expense-container)', padding: '1px 4px', borderRadius: '3px' }}>
                        {item.supplierName || 'Proveedor'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => removeItemFromTicket(item.productId)}
                    style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-expense)', cursor: 'pointer', padding: '2px', marginLeft: '6px' }}
                    title="Eliminar ítem"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Editable Quantity, Unit Price and Subtotal Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: '6px', alignItems: 'center' }}>
                  
                  {/* Quantity Stepper */}
                  <div>
                    <label style={{ fontSize: '0.62rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                      Cant:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <button
                        onClick={() => updateItemQuantity(item.productId, -1)}
                        style={{ width: '22px', height: '22px', borderRadius: '5px', border: 'none', backgroundColor: 'var(--md-sys-color-surface-container-high)', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '0.8rem', minWidth: '16px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItemQuantity(item.productId, 1)}
                        style={{ width: '22px', height: '22px', borderRadius: '5px', border: 'none', backgroundColor: 'var(--md-sys-color-primary)', color: '#FFF', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Unit Price Editable */}
                  <div>
                    <label style={{ fontSize: '0.62rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                      Precio ({currency}):
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
                        padding: '3px 6px',
                        borderRadius: '6px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        fontWeight: 800,
                        fontSize: '0.78rem'
                      }}
                    />
                  </div>

                  {/* Subtotal Editable */}
                  <div>
                    <label style={{ fontSize: '0.62rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
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
                        padding: '3px 6px',
                        borderRadius: '6px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'var(--md-sys-color-income-container)',
                        color: 'var(--md-sys-color-income)',
                        fontWeight: 800,
                        fontSize: '0.78rem'
                      }}
                    />
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* FIXED BOTTOM SECTION: SUMMARY + CONFIRM ACTION BUTTON (LOCKED AT BOTTOM) */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderTop: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexShrink: 0
      }}>
        {/* Factura / Ticket Summary Box */}
        {ticketItems.length > 0 && (
          <div style={{
            backgroundColor: 'var(--md-sys-color-income-container)',
            color: 'var(--md-sys-color-on-income-container)',
            padding: '8px 12px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block' }}>TOTAL COBRADO</span>
              <span style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 700, display: 'block' }}>
                {totalUnitsCount} {totalUnitsCount === 1 ? 'artículo' : 'artículos'}
              </span>
            </div>

            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
              {formatCurrency(totalInvoicePrice, currency, true)}
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleConfirmSale}
            disabled={ticketItems.length === 0}
            className="md-btn md-btn-primary"
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '0.88rem',
              fontWeight: 800,
              opacity: ticketItems.length === 0 ? 0.5 : 1
            }}
          >
            <Check size={18} />
            <span>Confirmar Venta</span>
          </button>

          <button
            onClick={onClose}
            className="md-btn md-btn-secondary"
            style={{ padding: '10px 14px', fontSize: '0.82rem' }}
          >
            <span>Cerrar</span>
          </button>
        </div>
      </div>

    </div>
  );
};
