'use client';

import {
  createContext,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type ToastTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  pushToast: (message: string, tone?: ToastTone) => void;
};

const TOAST_STYLE: Record<ToastTone, CSSProperties> = {
  error: {
    borderColor: '#f87171',
    background: '#dc2626',
    color: '#ffffff',
    boxShadow: '0 10px 24px rgba(127, 29, 29, 0.35)',
  },
  success: {
    borderColor: '#6ee7b7',
    background: '#16a34a',
    color: '#ffffff',
    boxShadow: '0 10px 24px rgba(6, 78, 59, 0.35)',
  },
  info: {
    borderColor: '#7dd3fc',
    background: '#0369a1',
    color: '#ffffff',
    boxShadow: '0 10px 24px rgba(8, 47, 73, 0.35)',
  },
};

const TOAST_BASE_STYLE: CSSProperties = {
  animation: 'toast-slide-in 320ms cubic-bezier(0.22, 1, 0.36, 1)',
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [topOffset, setTopOffset] = useState(76);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const portalTarget = isClient ? document.body : null;

  useEffect(() => {
    if (!isClient) return;

    const updateTopOffset = () => {
      const topbar = document.querySelector('header.topbar');
      if (!topbar) {
        setTopOffset(16);
        return;
      }

      const rect = topbar.getBoundingClientRect();
      const safeTop = Math.max(16, Math.round(rect.bottom + 12));
      setTopOffset(safeTop);
    };

    updateTopOffset();
    window.addEventListener('resize', updateTopOffset);
    window.addEventListener('scroll', updateTopOffset, true);

    return () => {
      window.removeEventListener('resize', updateTopOffset);
      window.removeEventListener('scroll', updateTopOffset, true);
    };
  }, [isClient]);

  const pushToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, tone }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {portalTarget &&
        createPortal(
          <div
            className="pointer-events-none z-[90] flex flex-col gap-2"
            style={{
              position: 'fixed',
              top: `${topOffset}px`,
              right: '1rem',
              bottom: 'auto',
              left: 'auto',
              width: 'min(24rem, calc(100vw - 2rem))',
            }}
          >
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className="pointer-events-auto rounded-md border px-3 py-2 text-sm font-semibold"
                style={{ ...TOAST_BASE_STYLE, ...TOAST_STYLE[toast.tone] }}
              >
                {toast.message}
              </div>
            ))}
          </div>,
          portalTarget,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
