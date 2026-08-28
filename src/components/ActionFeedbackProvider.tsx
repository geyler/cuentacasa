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
  ShieldAlert,
  ArrowRight,
  Sparkles
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

export interface ActionResultAction {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'expense';
  icon?: ReactNode;
  href?: string;
  target?: string;
}

export interface ActionResultOptions {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  icon?: ReactNode;
  actions?: ActionResultAction[];
  details?: ReactNode;
}

interface ActionFeedbackContextType {
  showToast: (options: ToastOptions) => void;
  confirmAction: (options: ConfirmOptions) => void;
  showActionResult: (options: ActionResultOptions) => void;
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

  // Persistent Action Result Bottom Sheet state
  const [actionResult, setActionResult] = useState<ActionResultOptions | null>(null);

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

  const showActionResult = useCallback((options: ActionResultOptions) => {
    setActionResult(options);
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
    <ActionFeedbackContext.Provider value={{ showToast, confirmAction, showActionResult }}>
      {children}

      {/* Floating Bottom Toast Notification Banner */}
      {toast && (
        <div
          className="no-print bottom-sheet-modal"
          style={{
            position: 'fixed',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            width: '92%',
            maxWidth: '460px',
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
            borderRadius: '20px',
            padding: '14px 18px',
            boxShadow: 'var(--md-shadow-elevation-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideUp 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {/* Toast Icon */}
          <div style={{ flexShrink: 0 }}>
            {toast.type === 'success' && <CheckCircle2 size={24} color="var(--md-sys-color-income)" />}
            {toast.type === 'error' && <AlertOctagon size={24} color="var(--md-sys-color-expense)" />}
            {toast.type === 'warning' && <AlertTriangle size={24} color="#FFA000" />}
            {toast.type === 'info' && <Info size={24} color="var(--md-sys-color-primary)" />}
          </div>

          {/* Toast Text */}
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 800, lineHeight: '1.2' }}>
              {toast.title}
            </h4>
            {toast.message && (
              <p style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '2px', lineHeight: '1.3' }}>
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
              padding: '4px',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Modern Confirmation Bottom Sheet Modal */}
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
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 0
          }}
          onClick={handleCancelConfirm}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bottom-sheet-modal"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              width: '100%',
              maxWidth: '480px',
              padding: '20px 24px 28px 24px',
              boxShadow: 'var(--md-shadow-elevation-4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'slideUp 0.25s ease-out'
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

      {/* Persistent Post-Action Result Bottom Sheet Modal */}
      {actionResult && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 10050,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 0
          }}
          onClick={() => setActionResult(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bottom-sheet-modal"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: 'var(--md-sys-color-surface)',
              boxShadow: 'var(--md-shadow-elevation-3)',
              animation: 'slideUp 0.25s ease-out'
            }}
          >
            {/* Drag handle */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto' }} />

            {/* Header / Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: actionResult.type === 'error' ? 'var(--md-sys-color-expense-container)' :
                                 actionResult.type === 'warning' ? '#FFF3E0' :
                                 'var(--md-sys-color-income-container)',
                color: actionResult.type === 'error' ? 'var(--md-sys-color-expense)' :
                       actionResult.type === 'warning' ? '#E65100' :
                       'var(--md-sys-color-income)'
              }}>
                {actionResult.icon || (
                  actionResult.type === 'error' ? <AlertOctagon size={28} /> :
                  actionResult.type === 'warning' ? <AlertTriangle size={28} /> :
                  <CheckCircle2 size={28} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                  {actionResult.title}
                </h3>
                {actionResult.message && (
                  <p style={{ fontSize: '0.86rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                    {actionResult.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => setActionResult(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Custom Details Component (if any) */}
            {actionResult.details && (
              <div style={{
                padding: '12px',
                borderRadius: '14px',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                fontSize: '0.85rem'
              }}>
                {actionResult.details}
              </div>
            )}

            {/* Action Buttons Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {actionResult.actions?.map((act, idx) => {
                const btnStyle = {
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  textDecoration: 'none'
                };

                if (act.href) {
                  const isInternal = act.href.startsWith('/') || !act.href.startsWith('http');
                  const targetAttr = act.target || (isInternal ? '_self' : '_blank');
                  return (
                    <a
                      key={idx}
                      href={act.href}
                      target={targetAttr}
                      rel={isInternal ? undefined : "noopener noreferrer"}
                      className="md-btn md-btn-primary"
                      onClick={(e) => {
                        setActionResult(null);
                        if (isInternal) {
                          e.preventDefault();
                          window.location.href = act.href!;
                        }
                      }}
                      style={btnStyle}
                    >
                      {act.icon}
                      <span>{act.label}</span>
                    </a>
                  );
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActionResult(null);
                      if (act.onClick) act.onClick();
                    }}
                    className={`md-btn ${
                      act.variant === 'secondary' ? 'md-btn-secondary' :
                      act.variant === 'expense' ? 'md-btn-expense' :
                      'md-btn-primary'
                    }`}
                    style={btnStyle}
                  >
                    {act.icon}
                    <span>{act.label}</span>
                  </button>
                );
              })}

              {/* Default Close button */}
              <button
                type="button"
                onClick={() => setActionResult(null)}
                className="md-btn md-btn-secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
              >
                Cerrar
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
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </ActionFeedbackContext.Provider>
  );
};
