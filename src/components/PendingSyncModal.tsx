'use client';

import React, { useState, useEffect } from 'react';
import { 
  CloudUpload, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Layers, 
  Trash2, 
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { getPendingSyncDetails, PendingSyncDetailItem } from '@/lib/sync';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';

interface PendingSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: () => Promise<void> | void;
  isSyncing: boolean;
  isOnline: boolean;
}

export const PendingSyncModal: React.FC<PendingSyncModalProps> = ({
  isOpen,
  onClose,
  onSync,
  isSyncing,
  isOnline
}) => {
  useLockBodyScroll(isOpen);
  const { showToast } = useActionFeedback();
  const [details, setDetails] = useState<{ totalCount: number; items: PendingSyncDetailItem[] }>({
    totalCount: 0,
    items: []
  });

  useEffect(() => {
    if (isOpen) {
      setDetails(getPendingSyncDetails());
    }
  }, [isOpen, isSyncing]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    try {
      await onSync();
      setDetails(getPendingSyncDetails());
    } catch (e) {
      showToast({
        title: 'Error de Red',
        message: 'No se pudo completar la sincronización manual. Verifica la señal.',
        type: 'error'
      });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 2200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0
      }}
      className="no-print"
      onClick={onClose}
    >
      <div
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '768px',
          padding: '16px 20px 28px 20px',
          boxShadow: 'var(--md-shadow-elevation-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Drag Handle */}
        <div style={{
          width: '36px',
          height: '4px',
          borderRadius: '9999px',
          backgroundColor: 'var(--md-sys-color-outline-variant)',
          margin: '0 auto 4px auto',
          opacity: 0.8
        }} />

        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          paddingBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CloudUpload size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
                Acciones Pendientes por Subir
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                {details.totalCount} {details.totalCount === 1 ? 'operación local pendiente' : 'operaciones locales pendientes'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Network Status Info Badge */}
        <div style={{
          padding: '10px 14px',
          borderRadius: '14px',
          backgroundColor: isOnline ? 'rgba(5, 150, 105, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${isOnline ? '#059669' : '#EF4444'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline ? <Wifi size={18} color="#059669" /> : <WifiOff size={18} color="#EF4444" />}
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isOnline ? '#059669' : '#EF4444' }}>
              {isOnline ? 'Conexión Detectada (Reintentos con tiempo extendido)' : 'Modo Offline Activo'}
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Timeout: 30s
          </span>
        </div>

        {/* List of Pending Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}>
          {details.totalCount === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px 20px',
              backgroundColor: 'var(--md-sys-color-surface)',
              borderRadius: '16px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={40} color="#059669" />
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>¡Todo Sincronizado!</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '4px 0 0 0' }}>
                  No tienes movimientos ni cambios pendientes de subir a la nube.
                </p>
              </div>
            </div>
          ) : (
            details.items.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: item.badgeColor,
                      color: '#FFFFFF'
                    }}>
                      {item.badgeText}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, marginTop: '2px' }}>
                    {item.subtitle}
                  </div>
                </div>
                <div style={{ flexShrink: 0, opacity: 0.6 }}>
                  <ArrowUpRight size={18} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Button: Manual Sync */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="md-btn md-btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '0.92rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              borderRadius: '16px',
              boxShadow: '0 4px 14px rgba(0, 99, 155, 0.3)'
            }}
          >
            {isSyncing ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>Subiendo pendientes... (Por favor espera)</span>
              </>
            ) : (
              <>
                <CloudUpload size={20} />
                <span>Subir Pendientes Manualmente</span>
              </>
            )}
          </button>

          <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', fontWeight: 600 }}>
            💡 La subida manual fuerza un tiempo de espera de 30 segundos para redes lentas o inestables.
          </span>
        </div>

      </div>
    </div>
  );
};
