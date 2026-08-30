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
            (decodedText) => {
              if (!isMounted) return;
              const code = decodedText.trim();
              if (!code) return;

              const now = Date.now();
              if (now - lastScanTimeRef.current < 800) return;
              lastScanTimeRef.current = now;

              playScanBeep();
              onScan(code);
            },
            () => {}
          );

          if (isMounted) setCameraStatus('Cámara activa. Apunta al código de barras.');
        } catch (err) {
          console.warn('Form camera scanner start error:', err);
          if (isMounted) setCameraStatus('No se pudo abrir la cámara. Ingresa el código manualmente.');
        }
      };

      const timer = setTimeout(startScanner, 200);
      return () => {
        isMounted = false;
        clearTimeout(timer);
        stopScannerEngine();
      };
    }, []);

    const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const clean = manualCode.trim();
      if (clean) {
        playScanBeep();
        onScan(clean);
      }
    };

    return (
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.90)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0'
        }}
        onClick={onClose}
      >
        <div
          className="bottom-sheet-modal full-height-sheet"
          style={{
            width: '100%',
            maxWidth: '540px',
            height: '100dvh',
            maxHeight: '100dvh',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            padding: '16px 20px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            textAlign: 'center',
            boxShadow: 'var(--md-shadow-elevation-4)',
            position: 'relative',
            borderRadius: '0px',
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
        </div>
      </div>
    );
  };
