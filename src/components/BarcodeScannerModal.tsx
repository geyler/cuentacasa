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

// 100% Offline Canvas Frame Digit Matcher (Recognizes written/printed numbers like 0005, 0004, 0010 on paper tape)
const scanCanvasForPaperDigits = (videoEl: HTMLVideoElement): string | null => {
  try {
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    if (!vw || !vh) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const cropW = Math.min(300, Math.floor(vw * 0.8));
    const cropH = Math.min(130, Math.floor(vh * 0.5));
    const cropX = Math.floor((vw - cropW) / 2);
    const cropY = Math.floor((vh - cropH) / 2);

    canvas.width = cropW;
    canvas.height = cropH;
    ctx.drawImage(videoEl, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    const imgData = ctx.getImageData(0, 0, cropW, cropH);
    const pixels = imgData.data;

    let sumVal = 0;
    const gray = new Uint8Array(cropW * cropH);
    for (let i = 0; i < pixels.length; i += 4) {
      const g = (pixels[i] * 299 + pixels[i + 1] * 587 + pixels[i + 2] * 114) / 1000;
      gray[i / 4] = g;
      sumVal += g;
    }
    const avgThresh = (sumVal / gray.length) * 0.86;

    const binary = new Uint8Array(cropW * cropH);
    for (let i = 0; i < gray.length; i++) {
      binary[i] = gray[i] < avgThresh ? 1 : 0;
    }

    // Column projection to isolate text/digits
    const colCounts = new Int32Array(cropW);
    for (let x = 0; x < cropW; x++) {
      let c = 0;
      for (let y = 0; y < cropH; y++) {
        if (binary[y * cropW + x]) c++;
      }
      colCounts[x] = c;
    }

    const boundingBoxes: { x1: number; x2: number; width: number }[] = [];
    let inBox = false;
    let startX = 0;
    for (let x = 0; x < cropW; x++) {
      if (colCounts[x] > 2) {
        if (!inBox) { inBox = true; startX = x; }
      } else {
        if (inBox) {
          inBox = false;
          const w = x - startX;
          if (w >= 4 && w <= 65) {
            boundingBoxes.push({ x1: startX, x2: x, width: w });
          }
        }
      }
    }

    // Digit classifier helper for individual glyphs (0-9)
    const classifyGlyph = (x1: number, x2: number): string => {
      const w = x2 - x1;
      const aspect = w / cropH;
      if (aspect < 0.28) return '1';

      let topCount = 0, midCount = 0, botCount = 0;
      let leftCount = 0, rightCount = 0;
      const midY1 = Math.floor(cropH * 0.33);
      const midY2 = Math.floor(cropH * 0.66);
      const midX = x1 + Math.floor(w / 2);

      for (let x = x1; x < x2; x++) {
        for (let y = 0; y < cropH; y++) {
          if (binary[y * cropW + x]) {
            if (y < midY1) topCount++;
            else if (y < midY2) midCount++;
            else botCount++;

            if (x < midX) leftCount++;
            else rightCount++;
          }
        }
      }

      const total = topCount + midCount + botCount;
      if (total === 0) return '0';

      const topR = topCount / total;
      const midR = midCount / total;
      const botR = botCount / total;
      const rightR = rightCount / total;

      if (rightR > 0.60 && midR > 0.30 && topR > 0.22) return '4';
      if (topR > 0.33 && botR > 0.33 && leftCount > rightCount * 0.9) return '5';
      if (topR > 0.42 && botR < 0.24) return '7';
      if (topR > 0.30 && botR > 0.30 && midR < 0.26) return '0';
      if (rightR > 0.58 && midR > 0.28) return '3';
      if (topR > 0.26 && midR > 0.26 && botR > 0.26) return '8';
      if (topR > botR * 1.2) return '9';
      if (botR > topR * 1.2) return '6';
      if (botR > 0.36) return '2';

      return '0';
    };

    if (boundingBoxes.length >= 1 && boundingBoxes.length <= 4) {
      let codeStr = '';
      for (const box of boundingBoxes) {
        codeStr += classifyGlyph(box.x1, box.x2);
      }

      const candidatePadded = codeStr.padStart(4, '0');
      const foundProduct = getStoreProductByBarcode(codeStr) || getStoreProductByBarcode(candidatePadded);
      if (foundProduct) {
        return foundProduct.barcode;
      }
    }
  } catch (e) {
    // Silent fail
  }
  return null;
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
  const [cameraStatus, setCameraStatus] = useState<string>('Iniciando cámara...');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Cooldown tracker to prevent duplicate scans in 1.8 seconds
  const lastScanTimeRef = useRef<number>(0);

  const handleDecodedBarcode = (decodedText: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 1800) return; // Cooldown 1.8s
    lastScanTimeRef.current = now;

    playScanBeep();

    const rawStr = decodedText.trim();
    const product = getStoreProductByBarcode(rawStr);

    if (product) {
      setLastScanned(product.barcode);
      addItemToTicket(product);
    } else {
      const numericOnly = rawStr.replace(/\D/g, '');
      const displayCode = numericOnly.length > 0 ? numericOnly.padStart(4, '0') : rawStr;
      setLastScanned(displayCode);
      triggerSuccessEffect(`Código #${displayCode} escaneado (No encontrado)`);
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

        if (isMounted) setCameraStatus('Cámara lista (Escaneando Códigos y Números en Cinta).');

        // OCR Frame Scanner Loop for Handwritten / Printed 4-digit numbers (100% Offline)
        ocrTimer = setInterval(() => {
          if (!isMounted) return;
          const videoEl = document.querySelector(`#${scannerContainerId} video`) as HTMLVideoElement;
          if (videoEl && !videoEl.paused && videoEl.videoWidth > 0) {
            const detectedCode = scanCanvasForPaperDigits(videoEl);
            if (detectedCode) {
              handleDecodedBarcode(detectedCode);
            }
          }
        }, 400);

      } catch (err) {
        if (isMounted) {
          setCameraStatus('No se pudo acceder a la cámara trasera. Puedes ingresar código manual.');
        }
      }
    };

    const timer = setTimeout(initEngine, 200);

    return () => {
      isMounted = false;
      if (ocrTimer) clearInterval(ocrTimer);
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

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      const codeToScan = manualCode.trim().padStart(4, '0');
      handleDecodedBarcode(codeToScan);
      setManualCode('');
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

      {/* FIXED TOOLBAR BAR: ONLY MANUAL CODE ENTRY / CAMERA */}
      <div style={{
        padding: '8px 14px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0
      }}>
        <form onSubmit={handleManualFormSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap' }}>
            Código Manual:
          </span>
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
              width: '90px',
              padding: '5px 8px',
              borderRadius: '8px',
              border: '1.5px solid var(--md-sys-color-primary)',
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
            style={{ padding: '5px 10px', fontSize: '0.75rem', fontWeight: 800 }}
          >
            Sumar
          </button>
        </form>

        <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
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
              <span style={{ fontSize: '0.65rem', color: '#00875A', fontWeight: 800, display: 'block' }}>
                Ganancia Casa: +{formatCurrency(estimatedNetProfit, currency, true)}
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
