import { cn } from "../lib/utils";

const actionConfig: Record<string, { border: string; text: string; bg: string }> = {
  log:              { border: "border-text-dim/15",  text: "text-text-muted", bg: "bg-surface-1/40" },
  warning:          { border: "border-amber/15",     text: "text-amber",      bg: "bg-amber/5" },
  soft_rate_limit:  { border: "border-orange/15",    text: "text-orange",     bg: "bg-orange/5" },
  temporary_ban:    { border: "border-red/15",        text: "text-red",        bg: "bg-red/5" },
  permanent_ban:    { border: "border-dark-red/20",   text: "text-dark-red",   bg: "bg-dark-red/8" },
};

export default function ActionBadge({ action }: { action: string }) {
  const c = actionConfig[action] || actionConfig.log;
  const label = action?.replace(/_/g, " ");
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 border rounded-lg text-[11px] font-mono font-bold uppercase tracking-[0.08em]", c.border, c.text, c.bg)}>
      {label}
    </span>
  );
}
