'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateSyncQRPayload, mergeSyncQRPayload, getLoggedInUser, getRawDatabase } from '@/lib/storage';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  QrCode, 
  Scan, 
  X, 
  CheckCircle2, 
  Share2, 
  ArrowDownLeft, 
  RefreshCw, 
  Layers, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface QRSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const QRSyncModal: React.FC<QRSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete
}) => {
  useLockBodyScroll(isOpen);
  const { showToast } = useActionFeedback();
  const currentUser = getLoggedInUser();

  const [activeMode, setActiveMode] = useState<'share' | 'scan'>('share');
  const [qrPayload, setQrPayload] = useState<string>('');
  const [qrImgUrl, setQrImgUrl] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastMergedResult, setLastMergedResult] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isOpen) {
      const payloadStr = generateSyncQRPayload();
      setQrPayload(payloadStr);
      // Use qrserver offline/online Data URL or SVG fallback
      const encoded = encodeURIComponent(payloadStr);
      setQrImgUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`);
      setLastMergedResult(null);
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const startScanner = async () => {
    setIsScanning(true);
    setLastMergedResult(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-sync-reader');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScannedData(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      setIsScanning(false);
      showToast({
        title: 'Error de Cámara',
        message: 'No se pudo activar la cámara para escanear el código QR.',
        type: 'error'
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsScanning(false);
  };

  const handleScannedData = async (data: string) => {
    await stopScanner();
    try {
      const result = mergeSyncQRPayload(data);
      setLastMergedResult(result.message);
      showToast({
        title: '¡Sincronización Exitosa!',
        message: result.message,
        type: 'success'
      });
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      showToast({
        title: 'Error al Sincronizar',
        message: err.message || 'El código QR no es válido o está incompleto.',
        type: 'error'
      });
    }
  };

  if (!isOpen) return null;

  const rawDb = getRawDatabase();
  const productsCount = rawDb.storeProducts?.length || 0;
  const salesCount = rawDb.storeSales?.length || 0;
  const shiftsCount = rawDb.shifts?.length || 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 2300,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0'
    }} className="no-print" onClick={onClose}>
      
      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '540px',
          padding: '20px 24px 28px 24px',
          borderRadius: '28px 28px 0 0',
          boxShadow: 'var(--md-shadow-elevation-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Drag Handle */}
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto' }} />

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Sincronización Local QR</h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Transferencia aditiva de datos 100% offline
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface)', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Navigation Mode Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', backgroundColor: 'var(--md-sys-color-surface)', padding: '4px', borderRadius: '12px' }}>
          <button
            type="button"
            onClick={() => { setActiveMode('share'); stopScanner(); }}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeMode === 'share' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeMode === 'share' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Share2 size={16} />
            <span>Compartir Mis Datos</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode('scan'); startScanner(); }}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeMode === 'scan' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeMode === 'scan' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Scan size={16} />
            <span>Escanear y Recibir</span>
          </button>
        </div>

        {/* MODE 1: SHARE LOCAL DATA VIA QR */}
        {activeMode === 'share' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '2px solid var(--md-sys-color-outline-variant)' }}>
              {qrImgUrl ? (
                <img src={qrImgUrl} alt="Código QR de Sincronización" style={{ width: '220px', height: '220px', display: 'block' }} />
              ) : (
                <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  Generando QR...
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', backgroundColor: 'var(--md-sys-color-surface)', padding: '10px 14px', borderRadius: '12px', width: '100%', border: '1px solid var(--md-sys-color-outline-variant)' }}>
              <div style={{ fontWeight: 800, color: 'var(--md-sys-color-on-surface)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="var(--md-sys-color-primary)" />
                <span>Empaquetado Aditivo por Huella Digital (ID)</span>
              </div>
              Contiene: <strong>{productsCount} productos</strong>, <strong>{salesCount} ventas</strong> y <strong>{shiftsCount} turnos</strong>. Pide al otro usuario que escanee este código.
            </div>
          </div>
        )}

        {/* MODE 2: SCAN & MERGE INCOMING DATA */}
        {activeMode === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div 
              id="qr-sync-reader" 
              style={{ 
                width: '100%', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                backgroundColor: '#000000',
                minHeight: '260px'
              }} 
            />

            {!isScanning && !lastMergedResult && (
              <button
                onClick={startScanner}
                className="md-btn md-btn-primary"
                style={{ width: '100%', padding: '12px', fontWeight: 800, fontSize: '0.9rem' }}
              >
                <RefreshCw size={18} />
                <span>Reactivar Cámara Escáner</span>
              </button>
            )}

            {lastMergedResult && (
              <div style={{ padding: '14px', borderRadius: '16px', backgroundColor: '#DCFCE7', border: '1.5px solid #16A34A', color: '#15803D' }}>
                <div style={{ fontWeight: 900, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={20} />
                  <span>¡Sincronización Aditiva Exitosa!</span>
                </div>
                <p style={{ fontSize: '0.82rem', marginTop: '4px', margin: 0, fontWeight: 700 }}>
                  {lastMergedResult}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
