import { cn } from "../lib/utils";

const sevConfig: Record<string, { border: string; text: string; dot: string; bg: string; label: string }> = {
  low:      { border: "border-emerald/15", text: "text-emerald", dot: "bg-emerald", bg: "bg-emerald/5", label: "Safe" },
  medium:   { border: "border-amber/15",   text: "text-amber",   dot: "bg-amber",   bg: "bg-amber/5",   label: "Med" },
  high:     { border: "border-red/15",     text: "text-red",     dot: "bg-red",     bg: "bg-red/5",     label: "High" },
  critical: { border: "border-dark-red/15",  text: "text-dark-red",  dot: "bg-dark-red",  bg: "bg-dark-red/5",  label: "Crit" },
};

export default function SeverityBadge({ severity }: { severity: string }) {
  const c = sevConfig[severity] || sevConfig.low;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-md text-[9.5px] font-mono font-semibold uppercase tracking-[0.12em]", c.border, c.text, c.bg)}>
      <span className={cn("w-1 h-1 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
