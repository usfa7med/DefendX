import { cn } from "../lib/utils";

interface TableProps {
  headers: string[];
  colWidths?: string[];
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  colSpan?: number;
}

export default function Table({ headers, colWidths, children, loading, empty, emptyMessage = "No data", colSpan }: TableProps) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-default/40 bg-surface-0/30">
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "px-4 py-3.5 text-[9px] uppercase tracking-[0.14em] text-text-muted font-mono font-medium",
                    colWidths?.[i]
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan || headers.length} className="text-center py-16">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                    <span className="text-text-muted font-mono text-[11px] tracking-wider uppercase">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : empty ? (
              <tr>
                <td colSpan={colSpan || headers.length} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-text-dim">
                    <span className="w-8 h-8 rounded-full bg-surface-1 border border-border-default/50 flex items-center justify-center">
                      <span className="text-[16px] font-mono"></span>
                    </span>
                    <span className="text-[12px] font-mono tracking-wider uppercase">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
