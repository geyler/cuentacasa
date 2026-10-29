'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  autoCloseMs?: number;
}

interface ActiveToast extends ToastOptions {
  id: string;
}

interface ActionFeedbackContextType {
  showToast: (options: ToastOptions) => void;
  confirmAction: (options: ConfirmOptions) => void;
  showActionResult: (options: ActionResultOptions) => void;
}

const dummyFeedback: ActionFeedbackContextType = {
  showToast: () => {},
  confirmAction: (options) => { options.onConfirm?.(); },
  showActionResult: () => {}
};

const ActionFeedbackContext = createContext<ActionFeedbackContextType>(dummyFeedback);

export const useActionFeedback = () => {
  const context = useContext(ActionFeedbackContext);
  return context || dummyFeedback;
};

interface ActionFeedbackProviderProps {
  children: ReactNode;
}

export const ActionFeedbackProvider: React.FC<ActionFeedbackProviderProps> = ({ children }) => {
  // Confirmation Modal state (Blocking dialog)
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);
  const [isExecutingConfirm, setIsExecutingConfirm] = useState(false);

  // Action Result Modal state (Interactive dialog with action buttons/details)
  const [actionResult, setActionResult] = useState<ActionResultOptions | null>(null);

  // Toast Notification state (Non-blocking floating toast with timer)
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);
  const [isToastPaused, setIsToastPaused] = useState(false);

  // showToast: Dispatches non-blocking floating toast (Corner on PC, Floating card on Mobile)
  const showToast = useCallback(({ title, message, type = 'success', duration = 3800 }: ToastOptions) => {
    setActiveToast({
      id: `toast-${Date.now()}`,
      title,
      message,
      type,
      duration
    });
  }, []);

  // Auto-dismiss timer for floating toast
  useEffect(() => {
    if (!activeToast || isToastPaused) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, activeToast.duration || 3800);
    return () => clearTimeout(timer);
  }, [activeToast, isToastPaused]);

  // Auto-dismiss for actionResult if autoCloseMs is specified
  useEffect(() => {
    if (!actionResult || !actionResult.autoCloseMs) return;
    const timer = setTimeout(() => {
      setActionResult(null);
    }, actionResult.autoCloseMs);
    return () => clearTimeout(timer);
  }, [actionResult]);

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

  // Helper for rendering icon in rounded badge box
  const getIconBadge = (type: 'success' | 'error' | 'warning' | 'info' = 'success', customIcon?: ReactNode) => {
    if (customIcon) return customIcon;
    switch (type) {
      case 'success':
        return <CheckCircle2 size={22} color="#059669" />;
      case 'error':
        return <AlertOctagon size={22} color="#DC2626" />;
      case 'warning':
        return <AlertTriangle size={22} color="#D97706" />;
      case 'info':
      default:
        return <Info size={22} color="var(--md-sys-color-primary)" />;
    }
  };

  const getIconContainerStyle = (type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#E6F4EA', color: '#059669' };
      case 'error':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' };
      case 'warning':
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
      case 'info':
      default:
        return { backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-primary)' };
    }
  };

  return (
    <ActionFeedbackContext.Provider value={{ showToast, confirmAction, showActionResult }}>
      {children}

      {/* 1. NON-BLOCKING FLOATING TOAST (Desktop: Floating Bottom-Right Corner; Mobile: Floating Bottom Snack) */}
      {activeToast && (
        <div className="feedback-toast-container no-print">
          <div
            className="feedback-toast-card"
            onMouseEnter={() => setIsToastPaused(true)}
            onMouseLeave={() => setIsToastPaused(false)}
            role="status"
            aria-live="polite"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ...getIconContainerStyle(activeToast.type)
              }}>
                {getIconBadge(activeToast.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', margin: 0, lineHeight: 1.3 }}>
                  {activeToast.title}
                </h4>
                {activeToast.message && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0', lineHeight: 1.35 }}>
                    {activeToast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveToast(null)}
                title="Cerrar notificación"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Subtle Progress Bar */}
            <div style={{ width: '100%', height: '3px', backgroundColor: 'var(--md-sys-color-outline-variant)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: activeToast.type === 'success' ? '#059669' :
                                   activeToast.type === 'error' ? '#DC2626' :
                                   activeToast.type === 'warning' ? '#D97706' :
                                   'var(--md-sys-color-primary)',
                  animation: `toastProgress ${activeToast.duration || 3800}ms linear forwards`,
                  animationPlayState: isToastPaused ? 'paused' : 'running'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. CONFIRMATION MODAL (Desktop: Centered Elevated Dialog; Mobile: Bottom Sheet with Grab Handle) */}
      {confirmModal && (
        <div
          className="feedback-backdrop-responsive no-print"
          onClick={handleCancelConfirm}
        >
          <div
            className="feedback-dialog-responsive"
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              padding: '20px 24px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto'
            }}
          >
            {/* Grab Handle (Only visible on Mobile) */}
            <div className="mobile-only" style={{ justifyContent: 'center', marginBottom: '2px' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
            </div>

            {/* Header Layout */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: confirmModal.variant === 'danger' ? '#FEE2E2' :
                                 confirmModal.variant === 'warning' ? '#FEF3C7' :
                                 'var(--md-sys-color-primary-container)',
                color: confirmModal.variant === 'danger' ? '#DC2626' :
                       confirmModal.variant === 'warning' ? '#D97706' :
                       'var(--md-sys-color-primary)'
              }}>
                {confirmModal.icon || (
                  confirmModal.variant === 'danger' ? <Trash2 size={22} color="#DC2626" /> :
                  confirmModal.variant === 'warning' ? <ShieldAlert size={22} color="#D97706" /> :
                  <HelpCircle size={22} color="var(--md-sys-color-primary)" />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.25' }}>
                  {confirmModal.title}
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', lineHeight: '1.4' }}>
                  {confirmModal.message}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelConfirm}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Actions Buttons */}
            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={isExecutingConfirm}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {confirmModal.cancelText || 'Cancelar'}
              </button>

              <button
                type="button"
                onClick={handleExecuteConfirm}
                disabled={isExecutingConfirm}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: confirmModal.variant === 'danger' ? '#EF4444' :
                                   confirmModal.variant === 'warning' ? '#D97706' :
                                   'var(--md-sys-color-primary)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: confirmModal.variant === 'danger' ? '0 4px 14px rgba(239, 68, 68, 0.3)' : '0 4px 14px color-mix(in srgb, var(--brand-primary) 35%, transparent)'
                }}
              >
                {isExecutingConfirm ? 'Procesando...' : (confirmModal.confirmText || 'Confirmar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTION RESULT MODAL (Desktop: Centered Elevated Dialog; Mobile: Bottom Sheet with Grab Handle) */}
      {actionResult && (
        <div
          className="feedback-backdrop-responsive no-print"
          onClick={() => setActionResult(null)}
        >
          <div
            className="feedback-dialog-responsive"
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              padding: '20px 24px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto'
            }}
          >
            {/* Grab Handle (Only visible on Mobile) */}
            <div className="mobile-only" style={{ justifyContent: 'center', marginBottom: '2px' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
            </div>

            {/* Header Row: Icon + Title + Message + X Close Button */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ...getIconContainerStyle(actionResult.type)
              }}>
                {getIconBadge(actionResult.type, actionResult.icon)}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.25' }}>
                  {actionResult.title}
                </h3>
                {actionResult.message && (
                  <p style={{ fontSize: '0.86rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', lineHeight: '1.4' }}>
                    {actionResult.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActionResult(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--md-sys-color-on-surface-variant)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Optional Custom Details Block */}
            {actionResult.details && (
              <div style={{
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: 'var(--md-sys-color-surface)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                fontSize: '0.85rem'
              }}>
                {actionResult.details}
              </div>
            )}

            {/* Action Buttons Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              {actionResult.actions?.map((act, idx) => {
                const isSecondary = act.variant === 'secondary';
                const isExpense = act.variant === 'expense';

                const btnStyle: React.CSSProperties = {
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  border: isSecondary ? '1px solid var(--md-sys-color-outline-variant)' : 'none',
                  backgroundColor: isSecondary ? 'var(--md-sys-color-surface)' :
                                   isExpense ? 'var(--md-sys-color-expense)' :
                                   'var(--md-sys-color-primary)',
                  color: isSecondary ? 'var(--md-sys-color-on-surface)' : '#FFFFFF',
                  boxShadow: (!isSecondary && !isExpense) ? '0 4px 14px color-mix(in srgb, var(--brand-primary) 35%, transparent)' : undefined
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
                    style={btnStyle}
                  >
                    {act.icon}
                    <span>{act.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setActionResult(null)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  borderRadius: '14px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}
    </ActionFeedbackContext.Provider>
  );
};
