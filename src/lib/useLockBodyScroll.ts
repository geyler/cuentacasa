import { useEffect, useRef } from 'react';

interface ModalStackEntry {
  id: string;
  onClose: () => void;
}

const modalStack: ModalStackEntry[] = [];
let isPoppingFromUserBack = false;
let isPoppingFromProgrammaticBack = false;
let isListenerAttached = false;

function setupGlobalModalListeners() {
  if (isListenerAttached || typeof window === 'undefined') return;
  isListenerAttached = true;

  // Interceptar el botón "Atrás" físico / del navegador móvil
  window.addEventListener('popstate', () => {
    if (isPoppingFromProgrammaticBack) {
      isPoppingFromProgrammaticBack = false;
      return;
    }

    if (modalStack.length > 0) {
      const topModal = modalStack.pop();
      if (topModal) {
        isPoppingFromUserBack = true;
        try {
          topModal.onClose();
        } finally {
          isPoppingFromUserBack = false;
        }
      }
    }
  });

  // Interceptar tecla Escape en PC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalStack.length > 0) {
      const topModal = modalStack[modalStack.length - 1];
      if (topModal) {
        topModal.onClose();
      }
    }
  });
}

/**
 * Hook universal que bloquea el scroll de fondo y gestiona el botón "Atrás" del móvil
 * para que al pulsar Atrás simplemente cierre la modal activa en vez de navegar a otra página.
 */
export function useLockBodyScroll(isOpen: boolean, onClose?: () => void) {
  const modalIdRef = useRef<string>('');
  const onCloseRef = useRef<(() => void) | undefined>(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setupGlobalModalListeners();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      // 1. Bloquear scroll de fondo
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      // 2. Registrar en la pila de modales para captura del botón Atrás
      if (onCloseRef.current) {
        const id = 'modal_' + Math.random().toString(36).substring(2, 9);
        modalIdRef.current = id;
        modalStack.push({
          id,
          onClose: () => {
            if (onCloseRef.current) {
              onCloseRef.current();
            }
          }
        });

        // Insertar estado en el historial para que el botón "Atrás" sea capturado por popstate
        try {
          window.history.pushState(
            { ...(window.history.state || {}), cuentacasa_modal: id },
            '',
            window.location.href
          );
        } catch (err) {
          console.warn('No se pudo agregar estado de historial para la modal:', err);
        }
      }

      return () => {
        // Restaurar scroll de fondo
        document.body.style.overflow = '';
        document.body.style.touchAction = '';

        // Limpiar de la pila si se desmonta o cierra por UI
        if (modalIdRef.current) {
          const idx = modalStack.findIndex(m => m.id === modalIdRef.current);
          if (idx !== -1) {
            modalStack.splice(idx, 1);
            if (!isPoppingFromUserBack) {
              isPoppingFromProgrammaticBack = true;
              try {
                window.history.back();
              } catch (err) {}
            }
          }
          modalIdRef.current = '';
        }
      };
    } else {
      // Restaurar scroll si isOpen pasa a false
      document.body.style.overflow = '';
      document.body.style.touchAction = '';

      if (modalIdRef.current) {
        const idx = modalStack.findIndex(m => m.id === modalIdRef.current);
        if (idx !== -1) {
          modalStack.splice(idx, 1);
          if (!isPoppingFromUserBack) {
            isPoppingFromProgrammaticBack = true;
            try {
              window.history.back();
            } catch (err) {}
          }
        }
        modalIdRef.current = '';
      }
    }
  }, [isOpen]);
}
