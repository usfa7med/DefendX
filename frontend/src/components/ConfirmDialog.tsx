import { HelpCircle, TriangleAlert } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "../lib/utils";

interface Props {
  open: boolean;
  title: string;
  message: string | ReactNode;
  note?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, note, confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "default", onConfirm, onCancel,
}: Props) {

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center md:items-start justify-center p-4 md:p-0 md:pt-12 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="animate-fade-in rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4"
        style={{ backgroundColor: '#1c1c1c' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            variant === "danger" ? "bg-error/10" : "bg-primary-container/10"
          )}>
            {variant === "danger" ? (
              <TriangleAlert className="w-5 h-5 text-error" />
            ) : (
              <HelpCircle className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-headline font-extrabold tracking-tight text-on-surface">{title}</h3>
            <p className="text-[12px] font-body text-on-surface-variant mt-0.5">{message}</p>
            {note && (
              <div className="mt-2.5 flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-tertiary/10 border border-tertiary/20 text-[11px] font-mono text-tertiary">
                <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{note}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-mono text-[11px] text-on-surface-variant bg-surface hover:bg-surface-container-high transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 rounded-lg font-mono text-[11px] font-bold transition-colors",
              variant === "danger"
                ? "bg-error text-on-error hover:bg-error/80"
                : "bg-primary-container text-on-primary hover:bg-primary"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
