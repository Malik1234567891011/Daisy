"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "bg-white border-success/30 text-charcoal",
  error: "bg-white border-error/30 text-charcoal",
  info: "bg-white border-sage/30 text-charcoal",
};

const ICON_STYLES: Record<ToastVariant, string> = {
  success: "text-success",
  error: "text-error",
  info: "text-sage",
};

let toastCounter = 0;

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 md:left-auto md:right-6 md:translate-x-0 md:bottom-6"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const Icon = ICONS[t.variant];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(() => onDismiss(t.id), 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [t.id, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        "flex w-[calc(100vw-2rem)] max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ease-out md:w-auto",
        VARIANT_STYLES[t.variant],
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-3 opacity-0"
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", ICON_STYLES[t.variant])} aria-hidden="true" />
      <p className="flex-1 text-sm leading-relaxed">{t.message}</p>
      <button
        onClick={() => onDismiss(t.id)}
        className="shrink-0 rounded-lg p-1 text-text-tertiary hover:text-charcoal hover:bg-cream transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export { ToastProvider, useToast };
export type { ToastVariant, ToastMessage };
