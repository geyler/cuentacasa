'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  Trash2, 
  HelpCircle,
  AlertOctagon,
  ShieldAlert
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ModalVariant = 'danger' | 'warning' | 'primary' | 'info';

export interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  icon?: ReactNode;
  onConfirm: () => void | Promise<void>;
}

interface ActionFeedbackContextType {
  showToast: (options: ToastOptions) => void;
  confirmAction: (options: ConfirmOptions) => void;
}

const ActionFeedbackContext = createContext<ActionFeedbackContextType | undefined>(undefined);

export const useActionFeedback = () => {
  const context = useContext(ActionFeedbackContext);
  if (!context) {
    throw new Error('useActionFeedback must be used within an ActionFeedbackProvider');
  }
  return context;
};

interface ActionFeedbackProviderProps {
  children: ReactNode;
}

export const ActionFeedbackProvider: React.FC<ActionFeedbackProviderProps> = ({ children }) => {
  // Toast state
  const [toast, setToast] = useState<{
    id: number;
    title: string;
    message?: string;
    type: ToastType;
  } | null>(null);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);
  const [isExecutingConfirm, setIsExecutingConfirm] = useState(false);

  const showToast = useCallback(({ title, message, type = 'success', duration = 3200 }: ToastOptions) => {
    const id = Date.now();
    setToast({ id, title, message, type });

    const timer = setTimeout(() => {
      setToast(current => (current?.id === id ? null : current));
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const confirmAction = useCallback((options: ConfirmOptions) => {
    setConfirmModal(options);
  }, []);

  const handleExecuteConfirm = async () => {
    if (!confirmModal) return;
    try {
      setIsExecutingConfirm(true);
      await confirmModal.onConfirm();
    } catch (err) {
      console.error('Error executing confirmed action:', err);
    } finally {
      setIsExecutingConfirm(false);
      setConfirmModal(null);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmModal(null);
  };

  return (
    <ActionFeedbackContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* Floating Toast Notification Banner */}
      {toast && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: '90%',
            maxWidth: '440px',
            backgroundColor: toast.type === 'success' ? 'var(--md-sys-color-income-container)' :
                             toast.type === 'error' ? 'var(--md-sys-color-expense-container)' :
                             toast.type === 'warning' ? '#FFF8E1' :
                             'var(--md-sys-color-primary-container)',
            color: toast.type === 'success' ? 'var(--md-sys-color-on-income-container)' :
                   toast.type === 'error' ? 'var(--md-sys-color-on-expense-container)' :
                   toast.type === 'warning' ? '#5D4037' :
                   'var(--md-sys-color-on-primary-container)',
            border: `2px solid ${
              toast.type === 'success' ? 'var(--md-sys-color-income)' :
              toast.type === 'error' ? 'var(--md-sys-color-expense)' :
              toast.type === 'warning' ? '#FFA000' :
              'var(--md-sys-color-primary)'
            }`,
            borderRadius: '16px',
            padding: '12px 16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            animation: 'toastSlideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {/* Toast Icon */}
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            {toast.type === 'success' && <CheckCircle2 size={22} color="var(--md-sys-color-income)" />}
            {toast.type === 'error' && <AlertOctagon size={22} color="var(--md-sys-color-expense)" />}
            {toast.type === 'warning' && <AlertTriangle size={22} color="#FFA000" />}
            {toast.type === 'info' && <Info size={22} color="var(--md-sys-color-primary)" />}
          </div>

          {/* Toast Text */}
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, lineHeight: '1.2' }}>
              {toast.title}
            </h4>
            {toast.message && (
              <p style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '3px', lineHeight: '1.3' }}>
                {toast.message}
              </p>
            )}
          </div>

          {/* Close Toast button */}
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              opacity: 0.7,
              cursor: 'pointer',
              padding: '2px',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Modern Confirmation Modal Backdrop */}
      {confirmModal && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={handleCancelConfirm}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              borderRadius: '28px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: 'var(--md-shadow-elevation-3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
              border: '1px solid var(--md-sys-color-surface-variant)',
              animation: 'modalPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {/* Top Icon Badge */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: confirmModal.variant === 'danger' ? 'var(--md-sys-color-expense-container)' :
                               confirmModal.variant === 'warning' ? '#FFF3E0' :
                               'var(--md-sys-color-primary-container)',
              color: confirmModal.variant === 'danger' ? 'var(--md-sys-color-expense)' :
                     confirmModal.variant === 'warning' ? '#E65100' :
                     'var(--md-sys-color-primary)'
            }}>
              {confirmModal.icon || (
                confirmModal.variant === 'danger' ? <Trash2 size={28} /> :
                confirmModal.variant === 'warning' ? <ShieldAlert size={28} /> :
                <HelpCircle size={28} />
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                {confirmModal.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '8px', lineHeight: '1.4' }}>
                {confirmModal.message}
              </p>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={isExecutingConfirm}
                className="md-btn md-btn-secondary"
                style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}
              >
                {confirmModal.cancelText || 'Cancelar'}
              </button>

              <button
                type="button"
                onClick={handleExecuteConfirm}
                disabled={isExecutingConfirm}
                className={`md-btn ${
                  confirmModal.variant === 'danger' ? 'md-btn-expense' : 'md-btn-primary'
                }`}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '0.9rem',
                  backgroundColor: confirmModal.variant === 'warning' ? '#E65100' : undefined,
                  color: confirmModal.variant === 'warning' ? '#FFF' : undefined
                }}
              >
                {isExecutingConfirm ? 'Procesando...' : (confirmModal.confirmText || 'Confirmar')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes toastSlideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </ActionFeedbackContext.Provider>
  );
};
