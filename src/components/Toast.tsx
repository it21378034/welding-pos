import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Toast Types ────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ─── Hook ───────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Icon Map ───────────────────────────────────────────────────
const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
};

const styleMap: Record<ToastType, { bg: string; border: string; text: string; icon: string; shadow: string }> = {
  success: {
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-500/30',
    text: 'text-emerald-200',
    icon: 'text-emerald-400',
    shadow: 'shadow-emerald-500/10',
  },
  error: {
    bg: 'bg-rose-500/12',
    border: 'border-rose-500/30',
    text: 'text-rose-200',
    icon: 'text-rose-400',
    shadow: 'shadow-rose-500/10',
  },
  warning: {
    bg: 'bg-amber-500/12',
    border: 'border-amber-500/30',
    text: 'text-amber-200',
    icon: 'text-amber-400',
    shadow: 'shadow-amber-500/10',
  },
  info: {
    bg: 'bg-blue-500/12',
    border: 'border-blue-500/30',
    text: 'text-blue-200',
    icon: 'text-blue-400',
    shadow: 'shadow-blue-500/10',
  },
};

// ─── Single Toast Item ──────────────────────────────────────────
const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const s = styleMap[toast.type];

  useEffect(() => {
    const dur = toast.duration ?? 4000;
    const exitTimer = setTimeout(() => setIsExiting(true), dur - 300);
    const removeTimer = setTimeout(() => onDismiss(toast.id), dur);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl ${s.bg} border ${s.border} backdrop-blur-2xl shadow-2xl ${s.shadow} max-w-sm w-full transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-6 scale-95' : 'opacity-100 translate-x-0 scale-100'
      }`}
      style={{ animation: isExiting ? undefined : 'toast-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
    >
      <div className={`${s.icon} shrink-0 mt-0.5`}>{iconMap[toast.type]}</div>
      <p className={`text-xs font-semibold leading-relaxed flex-1 ${s.text}`}>{toast.message}</p>
      <button
        onClick={handleDismiss}
        className={`p-0.5 rounded-lg hover:bg-white/10 ${s.icon} transition shrink-0`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─── Confirmation Modal ─────────────────────────────────────────
const ConfirmModal: React.FC<{
  options: ConfirmOptions;
  onResolve: (confirmed: boolean) => void;
}> = ({ options, onResolve }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleResolve = (val: boolean) => {
    setIsClosing(true);
    setTimeout(() => onResolve(val), 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={() => handleResolve(false)}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-sm rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-2xl p-6 shadow-2xl shadow-slate-950/60 transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{ animation: isClosing ? undefined : 'modal-enter 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      >
        {/* Icon */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-xl ${options.danger ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>
            {options.danger ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <h3 className="text-sm font-bold text-slate-100">{options.title}</h3>
        </div>

        {options.message && (
          <p className="text-xs text-slate-400 leading-relaxed mb-5 pl-[52px]">{options.message}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 mt-2">
          <button
            onClick={() => handleResolve(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          >
            {options.cancelLabel || 'Cancel'}
          </button>
          <button
            onClick={() => handleResolve(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              options.danger
                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
            }`}
          >
            {options.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Provider ───────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (confirmed: boolean) => void;
  } | null>(null);

  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${++toastIdRef.current}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const handleConfirmResolve = useCallback((confirmed: boolean) => {
    if (confirmState) {
      confirmState.resolve(confirmed);
      setConfirmState(null);
    }
  }, [confirmState]);

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Stack */}
      <div className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2.5 pointer-events-auto">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmState && (
        <ConfirmModal options={confirmState.options} onResolve={handleConfirmResolve} />
      )}

      {/* Animation Keyframes */}
      <style>{`
        @keyframes toast-enter {
          from { opacity: 0; transform: translateX(40px) scale(0.92); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
