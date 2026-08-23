import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  label: string;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pages, total, label, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-[11px] font-mono text-on-surface-variant tracking-wider uppercase">
        {total.toLocaleString()} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider bg-surface-container border border-outline-variant/30 rounded-lg disabled:opacity-20 hover:bg-surface-container-high transition-all text-on-surface-variant disabled:pointer-events-none active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  "w-8 h-7 rounded-lg text-[11px] font-mono transition-all active:scale-95",
                  p === page
                    ? "bg-primary-container/10 text-primary border border-primary/20 font-bold"
                    : "text-on-surface-variant hover:bg-surface-container border border-transparent"
                )}
              >
                {p}
              </button>
            );
          })}
          {pages > 5 && (
            <>
              <span className="text-outline-variant px-1">...</span>
              <button
                onClick={() => onPageChange(pages)}
                className="w-8 h-7 rounded-lg text-[11px] font-mono text-on-surface-variant hover:bg-surface-container border border-transparent"
              >
                {pages}
              </button>
            </>
          )}
        </div>
        <button
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          disabled={page >= pages}
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider bg-surface-container border border-outline-variant/30 rounded-lg disabled:opacity-20 hover:bg-surface-container-high transition-all text-on-surface-variant disabled:pointer-events-none active:scale-95"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
