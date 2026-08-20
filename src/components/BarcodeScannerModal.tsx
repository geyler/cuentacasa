'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoreProduct } from '@/types';
import { getStoreProductByBarcode, getStoreProducts } from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { 
  Scan, 
  X, 
  Plus, 
  Check, 
  Keyboard, 
  Camera, 
  ShoppingBag, 
  Zap,
  ArrowRight
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: { concept: string; amount: number; category: string; type: 'gasto' | 'ingreso' }) => void;
  currency?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  currency = '$'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Scanner state
  const [manualCode, setManualCode] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState<string>('0001');
  const [scannedProduct, setScannedProduct] = useState<StoreProduct | null>(null);
  
  // Editable fields
  const [concept, setConcept] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [category, setCategory] = useState<string>('Viveres');
  const [txType, setTxType] = useState<'gasto' | 'ingreso'>('gasto');

  // Scanning mode feedback
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize Product selection when barcode changes
  const handleSelectBarcode = (code: string) => {
    const cleanCode = code.padStart(4, '0');
    setScannedBarcode(cleanCode);

    const product = getStoreProductByBarcode(cleanCode);
    if (product) {
      setScannedProduct(product);
      setConcept(product.name);
      setUnitPrice(product.price);
      setCategory(product.category || 'Viveres');
    } else {
      setScannedProduct(null);
      setConcept(`Producto Barcode #${cleanCode}`);
      setUnitPrice(100);
      setCategory('General');
    }
  };

  // Start Camera Feed in top rectangular strip
  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      return;
    }

    // Default select product 0001 on open
    handleSelectBarcode('0001');

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

          // Check Native BarcodeDetector API support
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
                    triggerSuccessEffect();
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
        console.warn('Camera access error:', err);
        setCameraError('Cámara no activa o sin permisos. Puedes seleccionar códigos manualmente.');
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

  const triggerSuccessEffect = () => {
    setShowSuccessBadge(true);
    setTimeout(() => setShowSuccessBadge(false), 1200);
  };

  const totalPrice = unitPrice * quantity;

  const handleAddAndContinue = () => {
    if (!concept.trim() || totalPrice <= 0) {
      alert('Ingresa un nombre y precio válido.');
      return;
    }

    onAddTransaction({
      concept: `${concept.trim()} (x${quantity})`,
      amount: totalPrice,
      category,
      type: txType
    });

    triggerSuccessEffect();

    // Reset quantity for next scan
    setQuantity(1);

    // Auto-advance to next barcode if manual list
    const currentNum = parseInt(scannedBarcode, 10);
    if (!isNaN(currentNum) && currentNum < 9999) {
      const nextCode = (currentNum + 1).toString().padStart(4, '0');
      handleSelectBarcode(nextCode);
    }
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
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>Escáner de Productos (4-Dígitos)</span>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Top Rectangular Strip Viewfinder Camera */}
      <div style={{
        width: '100%',
        height: '180px',
        backgroundColor: '#111',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '3px solid var(--md-sys-color-primary)'
      }}>
        {/* Camera stream video */}
        {!cameraError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '20px', fontSize: '0.82rem' }}>
            <Camera size={28} style={{ marginBottom: '6px', opacity: 0.5 }} />
            <p>{cameraError}</p>
          </div>
        )}

        {/* Viewfinder Strip Overlay & Animated Red/Green Laser Line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '10%',
          right: '10%',
          transform: 'translateY(-50%)',
          height: '80px',
          border: showSuccessBadge ? '2px solid #00FF88' : '2px dashed rgba(255, 255, 255, 0.7)',
          borderRadius: '12px',
          boxShadow: showSuccessBadge ? '0 0 20px rgba(0, 255, 136, 0.6)' : '0 0 0 9999px rgba(0, 0, 0, 0.4)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Laser scanning beam line */}
          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: showSuccessBadge ? '#00FF88' : '#FF3B30',
            boxShadow: showSuccessBadge ? '0 0 10px #00FF88' : '0 0 10px #FF3B30'
          }} />
        </div>

        {/* Scanned Badge Notification */}
        {showSuccessBadge && (
          <div style={{
            position: 'absolute',
            top: '12px',
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
            <span>¡Código #{scannedBarcode} Registrado!</span>
          </div>
        )}

        {/* Barcode Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '12px',
          backgroundColor: 'rgba(0,0,0,0.75)',
          color: '#00FF88',
          fontFamily: 'monospace',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontWeight: 800
        }}>
          BARCODE: #{scannedBarcode}
        </div>
      </div>

      {/* Quick Barcode Selector & 4-Digit Keypad Switcher */}
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
            Catálogo (0001-9999):
          </span>

          {availableProducts.map(prod => (
            <button
              key={prod.barcode}
              onClick={() => handleSelectBarcode(prod.barcode)}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: scannedBarcode === prod.barcode ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                color: scannedBarcode === prod.barcode ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              #{prod.barcode} - {prod.name.slice(0, 12)}...
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsManualInput(!isManualInput)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--md-sys-color-primary)',
            fontWeight: 700,
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

      {/* Manual 4-Digit Code Keypad Input Mode */}
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
            style={{
              width: '90px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '2px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: '1rem',
              textAlign: 'center'
            }}
          />
        </div>
      )}

      {/* Bottom Form Data Area for Scanned Product */}
      <div style={{
        flex: 1,
        padding: '16px',
        backgroundColor: 'var(--md-sys-color-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>

        {/* Type Switcher (Gasto / Ingreso) */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setTxType('gasto')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: txType === 'gasto' ? 'var(--md-sys-color-expense-container)' : 'var(--md-sys-color-surface-container-high)',
              color: txType === 'gasto' ? 'var(--md-sys-color-on-expense-container)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            - Registrar como Gasto
          </button>
          <button
            onClick={() => setTxType('ingreso')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: txType === 'ingreso' ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-surface-container-high)',
              color: txType === 'ingreso' ? 'var(--md-sys-color-on-income-container)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            + Registrar como Venta/Ingreso
          </button>
        </div>

        {/* Product Concept Name */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
            Concepto / Nombre del Producto:
          </label>
          <input
            type="text"
            value={concept}
            onChange={e => setConcept(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              fontSize: '0.95rem',
              fontWeight: 700
            }}
          />
        </div>

        {/* Price & Quantity Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          
          {/* Unit Price */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
              Precio Unitario ({currency}):
            </label>
            <input
              type="number"
              step="any"
              value={unitPrice || ''}
              onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '1rem',
                fontWeight: 800
              }}
            />
          </div>

          {/* Quantity Stepper */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
              Cantidad a Llevar:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                -
              </button>

              <input
                type="number"
                min={1}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  textAlign: 'center'
                }}
              />

              <button
                onClick={() => setQuantity(q => q + 1)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
          </div>

        </div>

        {/* Calculated Total Display */}
        <div style={{
          backgroundColor: txType === 'gasto' ? 'var(--md-sys-color-expense-container)' : 'var(--md-sys-color-income-container)',
          color: txType === 'gasto' ? 'var(--md-sys-color-on-expense-container)' : 'var(--md-sys-color-on-income-container)',
          padding: '12px 16px',
          borderRadius: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block' }}>Monto Total a Agregar</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>({quantity} u x {currency}{unitPrice})</span>
          </div>

          <div style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: txType === 'gasto' ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-income)'
          }}>
            {txType === 'gasto' ? '-' : '+'} {formatCurrency(totalPrice, currency, true)}
          </div>
        </div>

        {/* Main Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
          
          {/* Add & Scan Next */}
          <button
            onClick={handleAddAndContinue}
            className="md-btn md-btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', gap: '8px' }}
          >
            <Plus size={20} />
            <span>Agregar y Continuar Escaneando</span>
          </button>

          {/* Done & Close */}
          <button
            onClick={onClose}
            className="md-btn md-btn-secondary"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
          >
            <span>Finalizar Escáner</span>
          </button>

        </div>

      </div>

    </div>
  );
};
