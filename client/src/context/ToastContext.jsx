import { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: '✓', ring: 'border-lime/40', text: 'text-lime' },
  error: { icon: '✕', ring: 'border-rose/40', text: 'text-rose-300' },
  info: { icon: 'i', ring: 'border-lavender/40', text: 'text-lavender' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const showToast = useCallback(
    (message, type = 'success') => push(type, message),
    [push]
  );
  const showError = useCallback(
    (message) => push('error', message),
    [push]
  );

  const value = useMemo(
    () => ({ showToast, showError, toast: showToast }),
    [showToast, showError]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = STYLES[t.type] || STYLES.info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                className={`card flex items-start gap-3 p-3.5 ${style.ring}`}
              >
                <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold ${style.ring} ${style.text}`}>
                  {style.icon}
                </span>
                <p className="text-sm text-ivory">{t.message}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}