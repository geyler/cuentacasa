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
  autoCloseMs?: number;
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
  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);
  const [isExecutingConfirm, setIsExecutingConfirm] = useState(false);

  // Persistent Action Result / Toast Bottom Sheet Modal state
  const [actionResult, setActionResult] = useState<ActionResultOptions | null>(null);

  // showToast opens a blocking bottom-sheet modal matching user's exact designs
  const showToast = useCallback(({ title, message, type = 'success', duration }: ToastOptions) => {
    setActionResult({
      title,
      message,
      type,
      autoCloseMs: duration
    });
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

  // Helper for rendering icon in rounded badge box
  const getIconBadge = (type: 'success' | 'error' | 'warning' | 'info' = 'success', customIcon?: ReactNode) => {
    if (customIcon) return customIcon;
    switch (type) {
      case 'success':
        return <CheckCircle2 size={24} color="#059669" />;
      case 'error':
        return <AlertOctagon size={24} color="#DC2626" />;
      case 'warning':
        return <AlertTriangle size={24} color="#D97706" />;
      case 'info':
      default:
        return <Info size={24} color="#EC4899" />;
    }
  };

  const getIconContainerStyle = (type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#E6F4EA', color: '#059669' }; // Exact light green from screenshot 1 & 2
      case 'error':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' };
      case 'warning':
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
      case 'info':
      default:
        return { backgroundColor: '#FCE7F3', color: '#EC4899' };
    }
  };

  return (
    <ActionFeedbackContext.Provider value={{ showToast, confirmAction, showActionResult }}>
      {children}

      {/* Modern Confirmation Bottom Sheet Modal */}
      {confirmModal && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 100000,
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
              backgroundColor: '#FFFFFF',
              color: '#111827',
              width: '100%',
              maxWidth: '480px',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              padding: '20px 24px 28px 24px',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Drag Handle Top Bar */}
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '9999px',
              backgroundColor: '#E5E7EB',
              margin: '0 auto 4px auto',
              opacity: 0.9
            }} />

            {/* Header Layout */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: confirmModal.variant === 'danger' ? '#FEE2E2' :
                                 confirmModal.variant === 'warning' ? '#FEF3C7' :
                                 '#FCE7F3',
                color: confirmModal.variant === 'danger' ? '#DC2626' :
                       confirmModal.variant === 'warning' ? '#D97706' :
                       '#EC4899'
              }}>
                {confirmModal.icon || (
                  confirmModal.variant === 'danger' ? <Trash2 size={24} color="#DC2626" /> :
                  confirmModal.variant === 'warning' ? <ShieldAlert size={24} color="#D97706" /> :
                  <HelpCircle size={24} color="#EC4899" />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', lineHeight: '1.25' }}>
                  {confirmModal.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#4B5563', marginTop: '4px', lineHeight: '1.4' }}>
                  {confirmModal.message}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelConfirm}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#9CA3AF' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Actions Buttons */}
            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={isExecutingConfirm}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                  color: '#374151',
                  fontSize: '0.92rem',
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
                  padding: '14px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: confirmModal.variant === 'danger' ? '#EF4444' :
                                   confirmModal.variant === 'warning' ? '#D97706' :
                                   '#EC4899',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: confirmModal.variant === 'danger' ? '0 4px 14px rgba(239, 68, 68, 0.3)' : '0 4px 14px rgba(236, 72, 153, 0.3)'
                }}
              >
                {isExecutingConfirm ? 'Procesando...' : (confirmModal.confirmText || 'Confirmar')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Blocking Bottom Sheet Modal for Toasts & Action Results (Matches Screenshot 1 & 2) */}
      {actionResult && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 100000,
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
              maxWidth: '480px',
              backgroundColor: '#FFFFFF',
              color: '#111827',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              padding: '20px 24px 28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Drag Handle Pill */}
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '9999px',
              backgroundColor: '#E5E7EB',
              margin: '0 auto 4px auto',
              opacity: 0.9
            }} />

            {/* Header Row: Icon + Title + Message + X Close Button */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ...getIconContainerStyle(actionResult.type)
              }}>
                {getIconBadge(actionResult.type, actionResult.icon)}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111827', lineHeight: '1.25' }}>
                  {actionResult.title}
                </h3>
                {actionResult.message && (
                  <p style={{ fontSize: '0.88rem', color: '#4B5563', marginTop: '4px', lineHeight: '1.4' }}>
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
                  color: '#9CA3AF'
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Optional Custom Details Block */}
            {actionResult.details && (
              <div style={{
                padding: '14px',
                borderRadius: '16px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #F3F4F6',
                fontSize: '0.85rem'
              }}>
                {actionResult.details}
              </div>
            )}

            {/* Action Buttons Stack (Styled Pink like Screenshot 2) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              {actionResult.actions?.map((act, idx) => {
                const isSecondary = act.variant === 'secondary';
                const isExpense = act.variant === 'expense';

                const btnStyle: React.CSSProperties = {
                  width: '100%',
                  padding: '14px',
                  fontSize: '0.94rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  border: isSecondary ? '1px solid #E5E7EB' : 'none',
                  backgroundColor: isSecondary ? '#F9FAFB' :
                                   isExpense ? '#EF4444' :
                                   '#EC4899', // Bright Pink from Screenshot 2
                  color: isSecondary ? '#111827' : '#FFFFFF',
                  boxShadow: (!isSecondary && !isExpense) ? '0 4px 14px rgba(236, 72, 153, 0.3)' : undefined
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

              {/* Default Close button matching Screenshot 1 & 2 */}
              <button
                type="button"
                onClick={() => setActionResult(null)}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '0.94rem',
                  fontWeight: 800,
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                  color: '#111827',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Slide Up Modal Animation */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </ActionFeedbackContext.Provider>
  );
};
