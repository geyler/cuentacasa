'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Scan, X, Volume2, CheckCircle2, RotateCcw, Info } from 'lucide-react';

interface FormBarcodeScannerOverlayProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

interface ScannedCodeDetails {
  code: string;
  formatName: string;
  length: number;
  scannedAt: string;
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
    // Ignore audio context restrictions
  }
};

export const FormBarcodeScannerOverlay: React.FC<FormBarcodeScannerOverlayProps> = ({ onScan, onClose }) => {
  const containerId = 'form-barcode-scanner-box';
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraStatus, setCameraStatus] = useState<string>('Iniciando cámara...');
  const [pendingCodeDetails, setPendingCodeDetails] = useState<ScannedCodeDetails | null>(null);

  // Cooldown tracker to prevent duplicate fires
  const lastScanTimeRef = useRef<number>(0);

  const stopScannerEngine = async () => {
    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }
        html5QrRef.current.clear();
      } catch (e) {
        // Ignore stop errors
      }
      html5QrRef.current = null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        await stopScannerEngine();

        const scanner = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.MAXICODE,
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.RSS_14,
            Html5QrcodeSupportedFormats.RSS_EXPANDED,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR
          ],
          verbose: false
        });
        html5QrRef.current = scanner;

        const config = {
          fps: 20,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            return {
              width: Math.min(viewfinderWidth * 0.9, 280),
              height: Math.min(viewfinderHeight * 0.68, 140)
            };
          },
          aspectRatio: 1.777778
        };

        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText, result) => {
            if (!isMounted) return;
            const code = decodedText.trim();
            if (!code) return;

            const now = Date.now();
            if (now - lastScanTimeRef.current < 400) return; // Immediate responsive trigger
            lastScanTimeRef.current = now;

            playScanBeep();
            
            const formatName = result?.result?.format?.formatName || (code.length === 13 ? 'EAN_13' : code.length === 12 ? 'UPC_A' : 'Código de Barras');
            const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            setPendingCodeDetails({
              code,
              formatName,
              length: code.length,
              scannedAt: nowTime
            });
          },
          () => {}
        );

        if (isMounted) setCameraStatus('Cámara activa. Apunta al código de barras.');
      } catch (err) {
        console.warn('Form camera scanner start error:', err);
        if (isMounted) setCameraStatus('No se pudo abrir la cámara. Ingresa el código manualmente.');
      }
    };

    if (!pendingCodeDetails) {
      const timer = setTimeout(startScanner, 200);
      return () => {
        isMounted = false;
        clearTimeout(timer);
        stopScannerEngine();
      };
    } else {
      stopScannerEngine();
    }
  }, [pendingCodeDetails]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (clean) {
      playScanBeep();
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setPendingCodeDetails({
        code: clean,
        formatName: 'Ingreso Manual SKU',
        length: clean.length,
        scannedAt: nowTime
      });
    }
  };

  const handleConfirmCode = () => {
    if (pendingCodeDetails) {
      onScan(pendingCodeDetails.code);
    }
  };

  const handleRescan = () => {
    setPendingCodeDetails(null);
    setManualCode('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '12px 12px 0 12px'
      }}
      onClick={onClose}
    >
      <div
        className="bottom-sheet-modal"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          padding: '16px 20px 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          textAlign: 'center',
          boxShadow: 'var(--md-shadow-elevation-4)',
          position: 'relative',
          borderRadius: '24px',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Material Drag Handle */}
        <div style={{ width: '40px', height: '4px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto', opacity: 0.8 }} />
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scan size={22} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
              Escáner de Código / SKU
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: 'var(--md-sys-color-on-surface-variant)',
              borderRadius: '50%'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: CAMERA SCANNING VIEW */}
        {!pendingCodeDetails ? (
          <>
            <div
              style={{
                width: '100%',
                height: '240px',
                minHeight: '240px',
                maxHeight: '240px',
                backgroundColor: '#050505',
                borderRadius: '18px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--md-sys-color-primary)'
              }}
            >
              {/* Html5Qrcode Reader Element */}
              <div id={containerId} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />

              {/* Target Box Overlay with Laser Line */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '260px',
                  height: '140px',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: '14px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div className="scanner-laser-line" />
                <div style={{ position: 'absolute', top: '6px', left: '6px', width: '16px', height: '16px', borderTop: '3px solid #EC4899', borderLeft: '3px solid #EC4899', borderRadius: '3px 0 0 0' }} />
                <div style={{ position: 'absolute', top: '6px', right: '6px', width: '16px', height: '16px', borderTop: '3px solid #EC4899', borderRight: '3px solid #EC4899', borderRadius: '0 3px 0 0' }} />
                <div style={{ position: 'absolute', bottom: '6px', left: '6px', width: '16px', height: '16px', borderBottom: '3px solid #EC4899', borderLeft: '3px solid #EC4899', borderRadius: '0 0 0 3px' }} />
                <div style={{ position: 'absolute', bottom: '6px', right: '6px', width: '16px', height: '16px', borderBottom: '3px solid #EC4899', borderRight: '3px solid #EC4899', borderRadius: '0 0 3px 0' }} />
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, margin: 0 }}>
              {cameraStatus}
            </p>

            {/* Manual SKU Form Fallback */}
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
              <input
                type="text"
                placeholder="O escribe el SKU/Código..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  fontFamily: 'monospace'
                }}
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="md-btn md-btn-primary"
                style={{ padding: '10px 16px', fontSize: '0.84rem', fontWeight: 800, borderRadius: '12px', flexShrink: 0 }}
              >
                Usar
              </button>
            </form>

            <button
              type="button"
              onClick={onClose}
              className="md-btn md-btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '0.88rem', fontWeight: 700, borderRadius: '12px' }}
            >
              Cancelar
            </button>
          </>
        ) : (
          /* STEP 2: SCANNED CODE PREVIEW & CONFIRMATION MODAL CARD */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '6px 0' }}>
            <div style={{
              backgroundColor: '#ECFDF5',
              border: '2px solid #6EE7B7',
              borderRadius: '20px',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(5, 150, 105, 0.12)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <CheckCircle2 size={24} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ¡Código Leído con Éxito!
                </span>
                <div style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: '#064E3B',
                  margin: '6px 0',
                  letterSpacing: '0.05em',
                  wordBreak: 'break-all'
                }}>
                  #{pendingCodeDetails.code}
                </div>
              </div>

              {/* Code Technical Metadata Box */}
              <div style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #A7F3D0',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                textAlign: 'left',
                color: '#065F46'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, opacity: 0.8 }}>Estándar/Formato:</span>
                  <span style={{ fontWeight: 800 }}>{pendingCodeDetails.formatName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, opacity: 0.8 }}>Longitud:</span>
                  <span style={{ fontWeight: 800 }}>{pendingCodeDetails.length} caracteres</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, opacity: 0.8 }}>Hora de Lectura:</span>
                  <span style={{ fontWeight: 800 }}>{pendingCodeDetails.scannedAt}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleConfirmCode}
                className="md-btn md-btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 99, 155, 0.25)'
                }}
              >
                <CheckCircle2 size={18} />
                <span>Confirmar y Usar Código</span>
              </button>

              <button
                type="button"
                onClick={handleRescan}
                className="md-btn md-btn-secondary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={16} />
                <span>Volver a Escanear</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
