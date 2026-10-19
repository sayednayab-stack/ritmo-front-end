import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}
interface ToastContextType {
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev.slice(-4), { ...t, id }]);
    if (t.duration !== 0) {
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), t.duration ?? 4500);
    }
  }, []);

  const removeToast = useCallback((id: string) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const cfg = {
    success: { icon: <CheckCircle2 className="h-4 w-4 text-success" />,     bar: 'bg-success',      ring: 'ring-success/15' },
    error:   { icon: <AlertCircle   className="h-4 w-4 text-danger" />,      bar: 'bg-danger',       ring: 'ring-danger/15' },
    warning: { icon: <AlertTriangle className="h-4 w-4 text-alert-amber" />, bar: 'bg-alert-amber',  ring: 'ring-alert-amber/15' },
    info:    { icon: <Info          className="h-4 w-4 text-brand-wine" />,   bar: 'bg-brand-wine',   ring: 'ring-brand-blue/15' },
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-full max-w-[340px] pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto relative flex items-start gap-3 px-4 py-3.5 rounded-xl',
            'bg-ops-card border border-border shadow-lift ring-4 overflow-hidden',
            cfg[t.type].ring,
            'animate-slide-up'
          )}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">{cfg[t.type].icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">{t.title}</p>
            {t.message && <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">{t.message}</p>}
          </div>
          <button
            onClick={() => onRemove(t.id)}
            className="flex-shrink-0 p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-ops-card2 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className={cn('absolute bottom-0 left-0 right-0 h-[2px]', cfg[t.type].bar, 'opacity-40')} />
        </div>
      ))}
    </div>
  );
}

export function toast() { return useToast(); }
